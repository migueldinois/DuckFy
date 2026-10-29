from decimal import Decimal

from database.conexao import Conexao

class Reserva:

    @staticmethod
    def obter_reserva(id_usuario: int):
        '''Busca o valor atual e a meta da reserva do usuário'''
        conexao, cursor = Conexao.conectar()

        cursor.execute(
            'SELECT valor_atual, meta_valor FROM reserva_emergencia WHERE id_usuario = %s',
            [id_usuario]
        )
        reserva = cursor.fetchone()

        cursor.close()
        conexao.close()

        return reserva

    @staticmethod
    def obter_id_por_email(email: str):
        '''Busca o id_usuario a partir do email salvo na sessão'''
        conexao, cursor = Conexao.conectar()
        cursor.execute('SELECT id_usuario FROM usuarios WHERE email = %s', [email])
        resultado = cursor.fetchone()
        cursor.close()
        conexao.close()
        
        if resultado:
            return resultado['id_usuario']
        return None

    @staticmethod
    def obter_historico(id_usuario: int, limite: int = 5):
        '''Busca no extrato as transações vinculadas à reserva do usuário'''
        conexao, cursor = Conexao.conectar()

        try:
            cursor.execute(
                '''
                SELECT
                    t.valor,
                    CASE
                        WHEN LOWER(t.tipo) IN ('crédito', 'credito', 'receita', 'entrada', 'transferência', 'transferencia')
                            THEN 'Crédito'
                        ELSE 'Débito'
                    END AS tipo,
                    DATE_FORMAT(t.data_transacao, '%d/%m/%Y') AS horario
                FROM reserva_emergencia r
                INNER JOIN transacoes t
                    ON t.id_reserva = r.id_reserva
                    AND t.id_usuario = r.id_usuario
                WHERE r.id_usuario = %s
                ORDER BY t.data_transacao DESC, t.id_transacao DESC
                LIMIT %s
                ''',
                [id_usuario, limite]
            )
            movimentacoes = cursor.fetchall()

            for movimentacao in movimentacoes:
                movimentacao['valor'] = float(movimentacao['valor'])

            return movimentacoes
        except Exception as erro:
            print(f"Erro ao buscar histórico da reserva: {erro}")
            return []
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def obter_contas_usuario(id_usuario: int):
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                '''
                SELECT cb.id_conta, cb.nome_conta, cb.saldo_atual,
                       COALESCE(aloc.valor_alocado, 0) AS valor_alocado
                FROM contas_bancarias cb
                LEFT JOIN (
                    SELECT rc.id_conta, SUM(rc.valor_alocado) AS valor_alocado
                    FROM reserva_contas rc
                    INNER JOIN reserva_emergencia re ON re.id_reserva = rc.id_reserva
                    WHERE re.id_usuario = %s
                    GROUP BY rc.id_conta
                ) aloc ON aloc.id_conta = cb.id_conta
                WHERE cb.id_usuario = %s
                ORDER BY cb.nome_conta
                ''',
                [id_usuario, id_usuario]
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def guardar_dinheiro(id_usuario: int, id_conta: int, valor_guardar):
        '''Aloca parte do saldo da conta na reserva e registra no extrato'''
        conexao, cursor = Conexao.conectar()

        try:
            valor_guardar = Decimal(str(valor_guardar))
            if not valor_guardar.is_finite() or valor_guardar <= 0:
                conexao.rollback()
                return False

            cursor.execute(
                'SELECT id_conta, saldo_atual FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s FOR UPDATE',
                [id_conta, id_usuario]
            )
            conta = cursor.fetchone()
            if not conta:
                conexao.rollback()
                return False

            cursor.execute(
                '''
                SELECT COALESCE(SUM(rc.valor_alocado), 0) AS valor_alocado
                FROM reserva_contas rc
                INNER JOIN reserva_emergencia re ON re.id_reserva = rc.id_reserva
                WHERE rc.id_conta = %s AND re.id_usuario = %s
                ''',
                [id_conta, id_usuario]
            )
            alocacao_atual = Decimal(str(cursor.fetchone()['valor_alocado'] or 0))
            saldo_disponivel = Decimal(str(conta['saldo_atual'] or 0)) - alocacao_atual
            if saldo_disponivel < valor_guardar:
                conexao.rollback()
                return False

            cursor.execute(
                'SELECT id_reserva FROM reserva_emergencia WHERE id_usuario = %s LIMIT 1 FOR UPDATE',
                [id_usuario]
            )
            reserva = cursor.fetchone()

            if reserva:
                id_reserva = reserva['id_reserva']
                cursor.execute(
                    'UPDATE reserva_emergencia SET valor_atual = valor_atual + %s WHERE id_reserva = %s',
                    [valor_guardar, id_reserva]
                )
            else:
                cursor.execute(
                    'INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor) VALUES (%s, %s, %s)',
                    [id_usuario, valor_guardar, 3000.00]
                )
                id_reserva = cursor.lastrowid

            cursor.execute(
                '''
                INSERT INTO reserva_contas (id_reserva, id_conta, valor_alocado)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE valor_alocado = valor_alocado + %s
                ''',
                [id_reserva, id_conta, valor_guardar, valor_guardar]
            )
            cursor.execute(
                '''
                INSERT INTO transacoes
                    (id_usuario, id_conta, valor, tipo, data_transacao, id_reserva)
                VALUES (%s, %s, %s, 'Crédito', CURDATE(), %s)
                ''',
                [id_usuario, id_conta, valor_guardar, id_reserva]
            )

            conexao.commit()
            return True
        except Exception:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def retirar_dinheiro(id_usuario: int, id_conta: int, valor_retirar):
        '''Libera uma alocação da reserva e registra a movimentação no extrato'''
        conexao, cursor = Conexao.conectar()

        try:
            valor_retirar = Decimal(str(valor_retirar))
            if not valor_retirar.is_finite() or valor_retirar <= 0:
                conexao.rollback()
                return False

            cursor.execute(
                'SELECT id_conta FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s FOR UPDATE',
                [id_conta, id_usuario]
            )
            conta = cursor.fetchone()
            if not conta:
                conexao.rollback()
                return False

            cursor.execute(
                'SELECT id_reserva, valor_atual FROM reserva_emergencia WHERE id_usuario = %s LIMIT 1 FOR UPDATE',
                [id_usuario]
            )
            reserva = cursor.fetchone()
            if not reserva or Decimal(str(reserva['valor_atual'])) < valor_retirar:
                conexao.rollback()
                return False

            id_reserva = reserva['id_reserva']
            cursor.execute(
                '''
                SELECT
                    COALESCE(SUM(CASE WHEN id_conta = %s THEN valor_alocado ELSE 0 END), 0) AS alocado_conta,
                    COALESCE(SUM(valor_alocado), 0) AS alocado_total
                FROM reserva_contas rc
                WHERE rc.id_reserva = %s
                ''',
                [id_conta, id_reserva]
            )
            alocacao = cursor.fetchone()
            valor_alocado_conta = Decimal(str(alocacao['alocado_conta'] or 0))
            if valor_alocado_conta < valor_retirar:
                conexao.rollback()
                return False

            cursor.execute(
                'UPDATE reserva_emergencia SET valor_atual = valor_atual - %s WHERE id_reserva = %s',
                [valor_retirar, id_reserva]
            )

            cursor.execute(
                'UPDATE reserva_contas SET valor_alocado = valor_alocado - %s WHERE id_reserva = %s AND id_conta = %s AND valor_alocado >= %s',
                [valor_retirar, id_reserva, id_conta, valor_retirar]
            )
            if cursor.rowcount != 1:
                conexao.rollback()
                return False
            cursor.execute(
                '''
                INSERT INTO transacoes
                    (id_usuario, id_conta, valor, tipo, data_transacao, id_reserva)
                VALUES (%s, %s, %s, 'Débito', CURDATE(), %s)
                ''',
                [id_usuario, id_conta, valor_retirar, id_reserva]
            )

            conexao.commit()
            return True
        except Exception:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def atualizar_meta(id_usuario: int, nova_meta):
        '''Atualiza a meta da reserva ou cria uma reserva para o usuário'''
        conexao, cursor = Conexao.conectar()

        cursor.execute(
            'SELECT id_reserva FROM reserva_emergencia WHERE id_usuario = %s LIMIT 1',
            [id_usuario]
        )
        reserva = cursor.fetchone()

        if reserva:
            cursor.execute(
                'UPDATE reserva_emergencia SET meta_valor = %s WHERE id_usuario = %s',
                [nova_meta, id_usuario]
            )
        else:
            cursor.execute(
                'INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor) VALUES (%s, %s, %s)',
                [id_usuario, 0, nova_meta]
            )

        conexao.commit()
        cursor.close()
        conexao.close()

        return True