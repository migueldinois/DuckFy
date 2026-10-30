from decimal import Decimal

from database.conexao import Conexao


class Progresso:
    # O limite diário evita que uma única rotina gere XP ilimitado.
    XP_DIARIO_MAXIMO = 100
    BONUS_ATIVIDADE_DIARIA = 5

    @staticmethod
    def conceder_xp(cursor, id_usuario, chave_evento, xp_base):
        # A mesma conexão da ação principal mantém o XP dentro da transação do cadastro.
        cursor.execute(
            "SELECT pontos_xp, dias_ofensiva FROM usuarios WHERE id_usuario = %s FOR UPDATE",
            [id_usuario],
        )
        usuario = cursor.fetchone()
        if not usuario:
            return 0

        cursor.execute(
            "SELECT id_evento FROM usuarios_eventos_xp WHERE id_usuario = %s AND chave_evento = %s",
            [id_usuario, chave_evento],
        )
        if cursor.fetchone():
            return 0

        # A data vem do MySQL para usar o mesmo fuso da persistência do banco.
        cursor.execute("SELECT CURDATE() AS hoje, DATE_SUB(CURDATE(), INTERVAL 1 DAY) AS ontem")
        datas = cursor.fetchone()
        hoje = datas["hoje"]
        ontem = datas["ontem"]

        cursor.execute(
            """
            SELECT dias_atual, melhor_sequencia, ultima_atividade
            FROM usuarios_gamificacao
            WHERE id_usuario = %s
            FOR UPDATE
            """,
            [id_usuario],
        )
        progresso = cursor.fetchone()
        if progresso:
            dias_atual = int(progresso["dias_atual"] or 0)
            melhor_sequencia = int(progresso["melhor_sequencia"] or 0)
            ultima_atividade = progresso["ultima_atividade"]
        else:
            # Migra a ofensiva antiga na primeira atividade sem zerar o histórico do usuário.
            sequencia_legada = int(usuario["dias_ofensiva"] or 0)
            dias_atual = max(0, sequencia_legada - 1)
            melhor_sequencia = sequencia_legada
            ultima_atividade = ontem
            cursor.execute(
                """
                INSERT INTO usuarios_gamificacao
                    (id_usuario, dias_atual, melhor_sequencia, ultima_atividade)
                VALUES (%s, %s, %s, %s)
                """,
                [id_usuario, dias_atual, melhor_sequencia, ultima_atividade],
            )

        nova_atividade = ultima_atividade != hoje

        if nova_atividade:
            # Atividade em dias seguidos aumenta a sequência; após uma pausa, ela recomeça.
            dias_atual = dias_atual + 1 if ultima_atividade == ontem else 1
            melhor_sequencia = max(melhor_sequencia, dias_atual)
            cursor.execute(
                """
                UPDATE usuarios_gamificacao
                SET dias_atual = %s, melhor_sequencia = %s, ultima_atividade = %s
                WHERE id_usuario = %s
                """,
                [dias_atual, melhor_sequencia, hoje, id_usuario],
            )

        cursor.execute(
            """
            SELECT COALESCE(SUM(pontos), 0) AS xp_hoje
            FROM usuarios_eventos_xp
            WHERE id_usuario = %s AND data_evento = %s
            """,
            [id_usuario, hoje],
        )
        xp_hoje = int(cursor.fetchone()["xp_hoje"] or 0)
        bonus = Progresso.BONUS_ATIVIDADE_DIARIA if nova_atividade else 0
        xp_concedido = min(
            int(xp_base) + bonus,
            max(0, Progresso.XP_DIARIO_MAXIMO - xp_hoje),
        )

        # A chave única do evento impede conceder XP duas vezes pela mesma ação.
        cursor.execute(
            """
            INSERT INTO usuarios_eventos_xp
                (id_usuario, chave_evento, pontos, data_evento)
            VALUES (%s, %s, %s, %s)
            """,
            [id_usuario, chave_evento, xp_concedido, hoje],
        )
        cursor.execute(
            "UPDATE usuarios SET pontos_xp = COALESCE(pontos_xp, 0) + %s, dias_ofensiva = %s WHERE id_usuario = %s",
            [xp_concedido, dias_atual, id_usuario],
        )
        return xp_concedido

    @staticmethod
    def sincronizar_conquistas(id_usuario):
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                """
                SELECT
                    (SELECT COUNT(*) FROM contas_bancarias WHERE id_usuario = %s) AS contas,
                    (SELECT COUNT(*) FROM categorias WHERE id_usuario = %s) AS categorias,
                    COALESCE(reserva.valor_atual, 0) AS reserva,
                    COALESCE(reserva.meta_valor, 0) AS meta_reserva,
                    usuario.pontos_xp,
                    COALESCE(gamificacao.melhor_sequencia, usuario.dias_ofensiva, 0) AS melhor_sequencia
                FROM usuarios AS usuario
                LEFT JOIN reserva_emergencia AS reserva ON reserva.id_usuario = usuario.id_usuario
                LEFT JOIN usuarios_gamificacao AS gamificacao ON gamificacao.id_usuario = usuario.id_usuario
                WHERE usuario.id_usuario = %s
                LIMIT 1
                """,
                [id_usuario, id_usuario, id_usuario],
            )
            resumo = cursor.fetchone()
            if not resumo:
                return []

            cursor.execute(
                "SELECT id_badge, nome, descricao, icone FROM conquistas_badges ORDER BY id_badge"
            )
            badges = cursor.fetchall()
            # Cada nome deve corresponder a uma regra; as metas são calculadas com dados reais.
            regras = {
                "Primeiros Passos": resumo["reserva"] >= 100,
                "Consistência": resumo["melhor_sequencia"] >= 30,
                "Organizador": resumo["categorias"] >= 5,
                "Reserva Completa": (
                    resumo["meta_reserva"] > 0
                    and resumo["reserva"] >= resumo["meta_reserva"]
                ),
                "Primeira Conta": resumo["contas"] >= 1,
                "Trio Bancário": resumo["contas"] >= 3,
                "Primeira Categoria": resumo["categorias"] >= 1,
                "Semana Constante": resumo["melhor_sequencia"] >= 7,
                "Mês Consistente": resumo["melhor_sequencia"] >= 30,
                "100 XP": resumo["pontos_xp"] >= 100,
                "500 XP": resumo["pontos_xp"] >= 500,
                "Reserva de R$ 1.000": resumo["reserva"] >= 1000,
                "Três Dias em Movimento": resumo["melhor_sequencia"] >= 3,
                "Duas Semanas Firmes": resumo["melhor_sequencia"] >= 14,
                "Lenda da Consistência": resumo["melhor_sequencia"] >= 100,
                "Cinco Contas": resumo["contas"] >= 5,
                "Categorias para Tudo": resumo["categorias"] >= 10,
                "1.000 XP": resumo["pontos_xp"] >= 1000,
                "2.500 XP": resumo["pontos_xp"] >= 2500,
                "Reserva de R$ 500": resumo["reserva"] >= 500,
                "Reserva de R$ 5.000": resumo["reserva"] >= 5000,
                "Reserva de R$ 10.000": resumo["reserva"] >= 10000,
                "Um Quarto do Caminho": (
                    resumo["meta_reserva"] > 0
                    and resumo["reserva"] >= resumo["meta_reserva"] * Decimal("0.25")
                ),
                "Metade da Meta": (
                    resumo["meta_reserva"] > 0
                    and resumo["reserva"] >= resumo["meta_reserva"] * Decimal("0.5")
                ),
            }

            for badge in badges:
                if not regras.get(badge["nome"], False):
                    continue
                cursor.execute(
                    "SELECT id_usuario_badge FROM usuarios_badges WHERE id_usuario = %s AND id_badge = %s LIMIT 1",
                    [id_usuario, badge["id_badge"]],
                )
                if not cursor.fetchone():
                    # Grava o desbloqueio uma única vez para preservar a data original.
                    cursor.execute(
                        "INSERT INTO usuarios_badges (id_usuario, id_badge) VALUES (%s, %s)",
                        [id_usuario, badge["id_badge"]],
                    )

            conexao.commit()
            cursor.execute(
                """
                SELECT badge.id_badge, badge.nome, badge.descricao, badge.icone,
                    usuario_badge.data_conquista
                FROM conquistas_badges AS badge
                LEFT JOIN usuarios_badges AS usuario_badge
                    ON usuario_badge.id_badge = badge.id_badge
                    AND usuario_badge.id_usuario = %s
                ORDER BY badge.id_badge
                """,
                [id_usuario],
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()