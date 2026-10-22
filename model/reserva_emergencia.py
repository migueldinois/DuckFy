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
                    t.descricao,
                    t.valor,
                    CASE
                        WHEN LOWER(t.tipo) IN ('receita', 'entrada', 'transferência', 'transferencia')
                            THEN 'Entrada'
                        ELSE 'Saída'
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
                'SELECT id_conta, nome_conta, saldo_atual FROM contas_bancarias WHERE id_usuario = %s ORDER BY nome_conta',
                [id_usuario]
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def guardar_dinheiro(id_usuario: int, id_conta: int, valor_guardar, descricao: str):
        '''Transfere um valor da conta para a reserva e registra no extrato'''
        conexao, cursor = Conexao.conectar()

        try:
            cursor.execute(
                'SELECT id_conta, saldo_atual FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s FOR UPDATE',
                [id_conta, id_usuario]
            )
            conta = cursor.fetchone()
            if not conta or float(conta['saldo_atual']) < float(valor_guardar):
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
                'UPDATE contas_bancarias SET saldo_atual = saldo_atual - %s WHERE id_conta = %s AND id_usuario = %s',
                [valor_guardar, id_conta, id_usuario]
            )
            cursor.execute(
                '''
                INSERT INTO transacoes
                    (id_usuario, id_conta, descricao, valor, tipo, data_transacao, id_reserva)
                VALUES (%s, %s, %s, %s, 'Transferência', CURDATE(), %s)
                ''',
                [id_usuario, id_conta, descricao, valor_guardar, id_reserva]
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