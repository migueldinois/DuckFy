from decimal import Decimal

from database.conexao import Conexao


class Progresso:
    # O limite diário evita que uma única rotina gere XP ilimitado.
    XP_DIARIO_MAXIMO = 100
    BONUS_ATIVIDADE_DIARIA = 5
    XP_INICIAL_POR_NIVEL = 100
    XP_ADICIONAL_POR_NIVEL = 50
    XP_RECOMPENSAS_CONQUISTAS = {
        "Primeira Conta": 10,
        "Primeira Categoria": 10,
        "Primeiros Passos": 20,
        "Três Dias em Movimento": 15,
        "100 XP": 15,
        "Reserva de R$ 500": 20,
        "Semana Constante": 25,
        "Um Quarto do Caminho": 25,
        "Organizador": 30,
        "Trio Bancário": 30,
        "Reserva de R$ 1.000": 35,
        "Duas Semanas Firmes": 40,
        "500 XP": 40,
        "Metade da Meta": 45,
        "Mês Consistente": 50,
        "Cinco Contas": 55,
        "Categorias para Tudo": 60,
        "Reserva Completa": 60,
        "1.000 XP": 70,
        "Reserva de R$ 5.000": 80,
        "Consistência": 90,
        "2.500 XP": 100,
        "Reserva de R$ 10.000": 120,
        "Lenda da Consistência": 150,
        "Primeiro Dia": 10,
        "Dois Dias Seguidos": 12,
        "Ritmo de Cinco Dias": 15,
        "Dez Dias Firmes": 20,
        "Três Semanas Constantes": 25,
        "60 Dias Constantes": 45,
        "Um Ano de Disciplina": 200,
        "50 XP": 10,
        "250 XP": 20,
        "1.500 XP": 50,
        "5.000 XP": 100,
        "10.000 XP": 200,
        "Duas Contas": 10,
        "Quatro Contas": 20,
        "Dez Contas": 50,
        "Três Categorias": 10,
        "Sete Categorias": 20,
        "Quinze Categorias": 50,
        "Reserva de R$ 50": 10,
        "Reserva de R$ 250": 15,
        "Reserva de R$ 750": 25,
        "Reserva de R$ 2.000": 40,
        "Reserva de R$ 7.500": 80,
        "Reserva de R$ 25.000": 200,
        "Meta Iniciada": 12,
        "Quase na Meta": 60,
    }

    CONQUISTAS_ADICIONAIS = (
        ("Primeiro Dia", "Mantenha 1 dia de ofensiva.", "bi-calendar-day"),
        ("Dois Dias Seguidos", "Mantenha 2 dias de ofensiva.", "bi-calendar2"),
        ("Ritmo de Cinco Dias", "Mantenha 5 dias de ofensiva.", "bi-calendar-check"),
        ("Dez Dias Firmes", "Mantenha 10 dias seguidos.", "bi-calendar2-week"),
        ("Três Semanas Constantes", "Mantenha 21 dias seguidos.", "bi-calendar3-week"),
        ("60 Dias Constantes", "Mantenha 60 dias seguidos.", "bi-calendar2-check"),
        ("Um Ano de Disciplina", "Mantenha 365 dias seguidos.", "bi-trophy-fill"),
        ("50 XP", "Acumule 50 pontos de experiência.", "bi-lightning-charge-fill"),
        ("250 XP", "Acumule 250 pontos de XP.", "bi-lightning-charge"),
        ("1.500 XP", "Acumule 1.500 pontos de XP.", "bi-stars"),
        ("5.000 XP", "Acumule 5.000 pontos de XP.", "bi-stars"),
        ("10.000 XP", "Acumule 10.000 pontos de XP.", "bi-trophy-fill"),
        ("Duas Contas", "Cadastre 2 contas bancárias.", "bi-bank"),
        ("Quatro Contas", "Cadastre 4 contas bancárias.", "bi-buildings"),
        ("Dez Contas", "Cadastre 10 contas bancárias.", "bi-bank2"),
        ("Três Categorias", "Crie 3 categorias financeiras.", "bi-tags"),
        ("Sete Categorias", "Crie 7 categorias financeiras.", "bi-grid-3x3-gap"),
        ("Quinze Categorias", "Crie 15 categorias financeiras.", "bi-grid-fill"),
        ("Reserva de R$ 50", "Guarde R$ 50 na reserva.", "bi-piggy-bank"),
        ("Reserva de R$ 250", "Guarde R$ 250 na reserva.", "bi-piggy-bank-fill"),
        ("Reserva de R$ 750", "Guarde R$ 750 na reserva.", "bi-safe2"),
        ("Reserva de R$ 2.000", "Guarde R$ 2.000 na reserva.", "bi-safe"),
        ("Reserva de R$ 7.500", "Guarde R$ 7.500 na reserva.", "bi-shield-check"),
        ("Reserva de R$ 25.000", "Guarde R$ 25.000 na reserva.", "bi-trophy"),
        ("Meta Iniciada", "Complete 10% da meta da reserva.", "bi-bullseye"),
        ("Quase na Meta", "Complete 90% da meta da reserva.", "bi-flag-fill"),
    )

    @staticmethod
    def calcular_nivel(pontos_xp):
        xp_restante = max(0, int(pontos_xp or 0))
        nivel = 1
        xp_necessario = Progresso.XP_INICIAL_POR_NIVEL

        while xp_restante >= xp_necessario:
            xp_restante -= xp_necessario
            nivel += 1
            xp_necessario += Progresso.XP_ADICIONAL_POR_NIVEL

        percentual = round(xp_restante / xp_necessario * 100)
        return nivel, xp_restante, xp_necessario, percentual

    @staticmethod
    def registrar_login_diario(id_usuario):
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute("SELECT CURDATE() AS hoje")
            hoje = cursor.fetchone()["hoje"]
            xp_concedido = Progresso.conceder_xp(
                cursor,
                id_usuario,
                f"login:{hoje}",
                0,
            )
            conexao.commit()
            return xp_concedido
        except Exception:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()

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
                AND chave_evento NOT LIKE 'conquista:%%'
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
    def sincronizar_xp_conquista(cursor, id_usuario, chave_evento, xp_recompensa):
        cursor.execute(
            "SELECT id_usuario FROM usuarios WHERE id_usuario = %s FOR UPDATE",
            [id_usuario],
        )
        if not cursor.fetchone():
            return 0

        cursor.execute(
            "SELECT id_evento, pontos FROM usuarios_eventos_xp WHERE id_usuario = %s AND chave_evento = %s FOR UPDATE",
            [id_usuario, chave_evento],
        )
        evento = cursor.fetchone()
        cursor.execute("SELECT CURDATE() AS hoje")
        hoje = cursor.fetchone()["hoje"]

        if evento:
            diferenca = int(xp_recompensa) - int(evento["pontos"] or 0)
            cursor.execute(
                "UPDATE usuarios_eventos_xp SET pontos = %s WHERE id_evento = %s",
                [xp_recompensa, evento["id_evento"]],
            )
        else:
            diferenca = int(xp_recompensa)
            cursor.execute(
                """
                INSERT INTO usuarios_eventos_xp
                    (id_usuario, chave_evento, pontos, data_evento)
                VALUES (%s, %s, %s, %s)
                """,
                [id_usuario, chave_evento, xp_recompensa, hoje],
            )

        if diferenca:
            cursor.execute(
                "UPDATE usuarios SET pontos_xp = COALESCE(pontos_xp, 0) + %s WHERE id_usuario = %s",
                [diferenca, id_usuario],
            )
        return diferenca

    @staticmethod
    def sincronizar_conquistas(id_usuario):
        conexao, cursor = Conexao.conectar()
        try:
            selects = ["SELECT %s AS nome, %s AS descricao, %s AS icone"]
            selects.extend(
                "SELECT %s, %s, %s"
                for _ in Progresso.CONQUISTAS_ADICIONAIS[1:]
            )
            valores_catalogo = tuple(
                valor
                for conquista in Progresso.CONQUISTAS_ADICIONAIS
                for valor in conquista
            )
            cursor.execute(
                f"""
                INSERT INTO conquistas_badges (nome, descricao, icone)
                SELECT novas.nome, novas.descricao, novas.icone
                FROM ({' UNION ALL '.join(selects)}) AS novas
                WHERE NOT EXISTS (
                    SELECT 1 FROM conquistas_badges existente
                    WHERE existente.nome = novas.nome
                )
                """,
                valores_catalogo,
            )
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
                "Primeiro Dia": resumo["melhor_sequencia"] >= 1,
                "Dois Dias Seguidos": resumo["melhor_sequencia"] >= 2,
                "Ritmo de Cinco Dias": resumo["melhor_sequencia"] >= 5,
                "Dez Dias Firmes": resumo["melhor_sequencia"] >= 10,
                "Três Semanas Constantes": resumo["melhor_sequencia"] >= 21,
                "45 Dias de Ritmo": resumo["melhor_sequencia"] >= 45,
                "60 Dias Constantes": resumo["melhor_sequencia"] >= 60,
                "90 Dias de Foco": resumo["melhor_sequencia"] >= 90,
                "Meio Ano em Movimento": resumo["melhor_sequencia"] >= 180,
                "Um Ano de Disciplina": resumo["melhor_sequencia"] >= 365,
                "25 XP": resumo["pontos_xp"] >= 25,
                "50 XP": resumo["pontos_xp"] >= 50,
                "250 XP": resumo["pontos_xp"] >= 250,
                "750 XP": resumo["pontos_xp"] >= 750,
                "1.500 XP": resumo["pontos_xp"] >= 1500,
                "5.000 XP": resumo["pontos_xp"] >= 5000,
                "10.000 XP": resumo["pontos_xp"] >= 10000,
                "Duas Contas": resumo["contas"] >= 2,
                "Quatro Contas": resumo["contas"] >= 4,
                "Dez Contas": resumo["contas"] >= 10,
                "Quinze Contas": resumo["contas"] >= 15,
                "Três Categorias": resumo["categorias"] >= 3,
                "Sete Categorias": resumo["categorias"] >= 7,
                "Quinze Categorias": resumo["categorias"] >= 15,
                "Vinte Categorias": resumo["categorias"] >= 20,
                "Reserva de R$ 50": resumo["reserva"] >= 50,
                "Reserva de R$ 250": resumo["reserva"] >= 250,
                "Reserva de R$ 750": resumo["reserva"] >= 750,
                "Reserva de R$ 2.000": resumo["reserva"] >= 2000,
                "Reserva de R$ 3.000": resumo["reserva"] >= 3000,
                "Reserva de R$ 7.500": resumo["reserva"] >= 7500,
                "Reserva de R$ 15.000": resumo["reserva"] >= 15000,
                "Reserva de R$ 25.000": resumo["reserva"] >= 25000,
                "Meta Iniciada": (
                    resumo["meta_reserva"] > 0
                    and resumo["reserva"] >= resumo["meta_reserva"] * Decimal("0.1")
                ),
                "Reta Final": (
                    resumo["meta_reserva"] > 0
                    and resumo["reserva"] >= resumo["meta_reserva"] * Decimal("0.75")
                ),
                "Quase na Meta": (
                    resumo["meta_reserva"] > 0
                    and resumo["reserva"] >= resumo["meta_reserva"] * Decimal("0.9")
                ),
                "Primeira Reserva": resumo["reserva"] >= 1,
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

                xp_recompensa = Progresso.XP_RECOMPENSAS_CONQUISTAS.get(badge["nome"], 0)
                if xp_recompensa:
                    Progresso.sincronizar_xp_conquista(
                        cursor,
                        id_usuario,
                        f"conquista:{badge['id_badge']}",
                        xp_recompensa,
                    )

            marcos_xp = {
                "25 XP": 25,
                "50 XP": 50,
                "100 XP": 100,
                "250 XP": 250,
                "500 XP": 500,
                "750 XP": 750,
                "1.000 XP": 1000,
                "1.500 XP": 1500,
                "2.500 XP": 2500,
                "5.000 XP": 5000,
                "10.000 XP": 10000,
            }
            marcos_processados = {
                badge["id_badge"]
                for badge in badges
                if badge["nome"] in marcos_xp and regras.get(badge["nome"], False)
            }
            while True:
                cursor.execute(
                    "SELECT pontos_xp FROM usuarios WHERE id_usuario = %s",
                    [id_usuario],
                )
                pontos_xp_atual = int(cursor.fetchone()["pontos_xp"] or 0)
                novos_marcos = [
                    badge
                    for badge in badges
                    if badge["id_badge"] not in marcos_processados
                    and badge["nome"] in marcos_xp
                    and pontos_xp_atual >= marcos_xp[badge["nome"]]
                ]
                if not novos_marcos:
                    break

                for badge in novos_marcos:
                    marcos_processados.add(badge["id_badge"])
                    cursor.execute(
                        "SELECT id_usuario_badge FROM usuarios_badges WHERE id_usuario = %s AND id_badge = %s LIMIT 1",
                        [id_usuario, badge["id_badge"]],
                    )
                    if not cursor.fetchone():
                        cursor.execute(
                            "INSERT INTO usuarios_badges (id_usuario, id_badge) VALUES (%s, %s)",
                            [id_usuario, badge["id_badge"]],
                        )
                    Progresso.sincronizar_xp_conquista(
                        cursor,
                        id_usuario,
                        f"conquista:{badge['id_badge']}",
                        Progresso.XP_RECOMPENSAS_CONQUISTAS[badge["nome"]],
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
            conquistas_usuario = cursor.fetchall()
            for conquista in conquistas_usuario:
                conquista["xp_recompensa"] = Progresso.XP_RECOMPENSAS_CONQUISTAS.get(
                    conquista["nome"], 0
                )
            return conquistas_usuario
        finally:
            cursor.close()
            conexao.close()