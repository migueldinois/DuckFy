from decimal import Decimal

from database.conexao import Conexao

class ContaBancaria:

    @staticmethod
    def buscar_todas_por_usuario(id_usuario):
        """Retorna todas as contas bancárias cadastradas para um determinado utilizador."""
        conexao, cursor = Conexao.conectar()
        try:
            sql = "SELECT * FROM contas_bancarias WHERE id_usuario = %s ORDER BY id_conta DESC"
            cursor.execute(sql, (id_usuario,))
            contas = cursor.fetchall()
            return contas
        except Exception as e:
            print(f"Erro ao buscar contas bancárias: {e}")
            return []
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def buscar_com_alocacao_reserva(id_usuario):
        """Retorna as contas do usuário com os valores alocados em reservas."""
        conexao, cursor = Conexao.conectar()
        try:
            sql = """
                SELECT cb.*, COALESCE(aloc.valor_alocado, 0) AS valor_alocado
                FROM contas_bancarias cb
                LEFT JOIN (
                    SELECT rc.id_conta, SUM(rc.valor_alocado) AS valor_alocado
                    FROM reserva_contas rc
                    INNER JOIN reserva_emergencia re
                        ON re.id_reserva = rc.id_reserva
                    WHERE re.id_usuario = %s
                    GROUP BY rc.id_conta
                ) aloc ON aloc.id_conta = cb.id_conta
                WHERE cb.id_usuario = %s
                ORDER BY cb.id_conta DESC
            """
            cursor.execute(sql, (id_usuario, id_usuario))
            return cursor.fetchall()
        except Exception as e:
            print(f"Erro ao buscar alocações da reserva por conta: {e}")
            return []
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def buscar_por_id(id_conta, id_usuario):
        """Busca uma conta bancária específica verificando se pertence ao utilizador."""
        conexao, cursor = Conexao.conectar()
        try:
            sql = "SELECT * FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s LIMIT 1"
            cursor.execute(sql, (id_conta, id_usuario))
            conta = cursor.fetchone()
            return conta
        except Exception as e:
            print(f"Erro ao buscar conta por ID: {e}")
            return None
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def criar_conta(id_usuario, nome_conta, tipo_conta, saldo_atual=0.0):
        """Cadastra uma nova conta bancária no banco de dados."""
        conexao, cursor = Conexao.conectar()
        try:
            saldo_atual = Decimal(str(saldo_atual))
            if not saldo_atual.is_finite() or saldo_atual < 0:
                return False

            sql = """
                INSERT INTO contas_bancarias (id_usuario, nome_conta, tipo_conta, saldo_atual) 
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (id_usuario, nome_conta, tipo_conta, saldo_atual))
            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao criar conta bancária: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def atualizar_conta(id_conta, id_usuario, nome_conta, tipo_conta, saldo_atual):
        """Atualiza os dados de uma conta bancária existente."""
        conexao, cursor = Conexao.conectar()
        try:
            saldo_atual = Decimal(str(saldo_atual))
            if not saldo_atual.is_finite() or saldo_atual < 0:
                return False

            cursor.execute(
                "SELECT id_conta FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s FOR UPDATE",
                (id_conta, id_usuario)
            )
            if not cursor.fetchone():
                conexao.rollback()
                return False

            cursor.execute(
                """
                SELECT COALESCE(SUM(rc.valor_alocado), 0) AS valor_alocado
                FROM reserva_contas rc
                INNER JOIN reserva_emergencia re ON re.id_reserva = rc.id_reserva
                WHERE rc.id_conta = %s AND re.id_usuario = %s
                """,
                (id_conta, id_usuario)
            )
            valor_alocado = Decimal(str(cursor.fetchone()["valor_alocado"] or 0))
            if saldo_atual < valor_alocado:
                conexao.rollback()
                return False

            sql = """
                UPDATE contas_bancarias 
                SET nome_conta = %s, tipo_conta = %s, saldo_atual = %s 
                WHERE id_conta = %s AND id_usuario = %s
            """
            cursor.execute(sql, (nome_conta, tipo_conta, saldo_atual, id_conta, id_usuario))
            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao atualizar conta bancária: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def deletar_conta(id_conta, id_usuario):
        """Apaga uma conta bancária e sincroniza o saldo da reserva."""
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                'SELECT id_conta FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s FOR UPDATE',
                (id_conta, id_usuario)
            )
            if not cursor.fetchone():
                conexao.rollback()
                return False

            cursor.execute(
                'DELETE FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s',
                (id_conta, id_usuario)
            )

            cursor.execute(
                '''
                UPDATE reserva_emergencia re
                LEFT JOIN (
                    SELECT id_reserva, SUM(valor_alocado) AS total_alocado
                    FROM reserva_contas
                    GROUP BY id_reserva
                ) aloc ON aloc.id_reserva = re.id_reserva
                SET re.valor_atual = COALESCE(aloc.total_alocado, 0)
                WHERE re.id_usuario = %s
                ''',
                (id_usuario,)
            )
            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao deletar conta bancária: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def calcular_patrimonio_total(id_usuario):
        """Calcula a soma dos saldos de todas as contas do utilizador."""
        conexao, cursor = Conexao.conectar()
        try:
            sql = "SELECT SUM(saldo_atual) as total FROM contas_bancarias WHERE id_usuario = %s"
            cursor.execute(sql, (id_usuario,))
            resultado = cursor.fetchone()
            if resultado and resultado['total'] is not None:
                return float(resultado['total'])
            return 0.0
        except Exception as e:
            print(f"Erro ao calcular património total: {e}")
            return 0.0
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def adicionar_dinheiro(id_conta, id_usuario, valor):
        """Adiciona dinheiro a uma conta pertencente ao utilizador."""
        conexao, cursor = Conexao.conectar()
        try:
            valor = Decimal(str(valor))
            if not valor.is_finite() or valor <= 0:
                return False

            cursor.execute(
                """
                UPDATE contas_bancarias
                SET saldo_atual = saldo_atual + %s
                WHERE id_conta = %s AND id_usuario = %s
                """,
                (valor, id_conta, id_usuario)
            )
            if cursor.rowcount != 1:
                conexao.rollback()
                return False
            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao adicionar dinheiro à conta: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def transferir_dinheiro(id_conta_origem, id_conta_destino, id_usuario, valor):
        """Transfere dinheiro entre duas contas do mesmo utilizador."""
        conexao, cursor = Conexao.conectar()
        try:
            valor = Decimal(str(valor))
            if not valor.is_finite() or valor <= 0 or id_conta_origem == id_conta_destino:
                return False

            conexao.autocommit = False
            cursor.execute(
                """
                SELECT id_conta, saldo_atual
                FROM contas_bancarias
                WHERE id_conta IN (%s, %s) AND id_usuario = %s
                ORDER BY id_conta
                FOR UPDATE
                """,
                (id_conta_origem, id_conta_destino, id_usuario)
            )
            contas = {conta["id_conta"]: conta for conta in cursor.fetchall()}
            if id_conta_origem not in contas or id_conta_destino not in contas:
                conexao.rollback()
                return False

            saldo_origem = Decimal(str(contas[id_conta_origem]["saldo_atual"] or 0))
            cursor.execute(
                """
                SELECT COALESCE(SUM(rc.valor_alocado), 0) AS valor_alocado
                FROM reserva_contas rc
                INNER JOIN reserva_emergencia re ON re.id_reserva = rc.id_reserva
                WHERE rc.id_conta = %s AND re.id_usuario = %s
                """,
                (id_conta_origem, id_usuario)
            )
            valor_alocado = Decimal(str(cursor.fetchone()["valor_alocado"] or 0))
            saldo_disponivel = saldo_origem - valor_alocado
            if saldo_disponivel < valor:
                conexao.rollback()
                return False

            cursor.execute(
                """
                UPDATE contas_bancarias
                SET saldo_atual = saldo_atual - %s
                WHERE id_conta = %s AND id_usuario = %s AND saldo_atual >= %s
                """,
                (valor, id_conta_origem, id_usuario, valor)
            )
            if cursor.rowcount != 1:
                conexao.rollback()
                return False

            cursor.execute(
                """
                UPDATE contas_bancarias
                SET saldo_atual = saldo_atual + %s
                WHERE id_conta = %s AND id_usuario = %s
                """,
                (valor, id_conta_destino, id_usuario)
            )
            if cursor.rowcount != 1:
                conexao.rollback()
                return False

            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao transferir dinheiro: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()