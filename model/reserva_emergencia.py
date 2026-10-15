from database.conexao import Conexao

class ReservaEmergencia:

    @staticmethod
    def buscar_por_usuario(id_usuario):
        """Retorna o registo de reserva de emergência do utilizador logado"""
        conexao, cursor = Conexao.conectar()
        try:
            sql = "SELECT * FROM reserva_emergencia WHERE id_usuario = %s LIMIT 1"
            cursor.execute(sql, (id_usuario,))
            reserva = cursor.fetchone()
            return reserva
        except Exception as e:
            print(f"Erro ao buscar reserva de emergência: {e}")
            return None
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def criar_ou_atualizar_meta(id_usuario, meta_valor):
        """Define ou atualiza a meta financeira da reserva de emergência"""
        conexao, cursor = Conexao.conectar()
        try:
            # Verifica se já existe um registo para o utilizador
            reserva_existente = ReservaEmergencia.buscar_por_usuario(id_usuario)

            if reserva_existente:
                sql = "UPDATE reserva_emergencia SET meta_valor = %s WHERE id_usuario = %s"
                cursor.execute(sql, (meta_valor, id_usuario))
            else:
                sql = "INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor) VALUES (%s, 0.00, %s)"
                cursor.execute(sql, (id_usuario, meta_valor))

            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao atualizar meta da reserva: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def realizar_aporte(id_usuario, valor_aporte):
        """Adiciona um valor ao saldo atual da reserva de emergência"""
        conexao, cursor = Conexao.conectar()
        try:
            reserva_existente = ReservaEmergencia.buscar_por_usuario(id_usuario)

            if reserva_existente:
                sql = "UPDATE reserva_emergencia SET valor_atual = valor_atual + %s WHERE id_usuario = %s"
                cursor.execute(sql, (valor_aporte, id_usuario))
            else:
                sql = "INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor) VALUES (%s, %s, 0.00)"
                cursor.execute(sql, (id_usuario, valor_aporte))

            conexao.commit()
            return True
        except Exception as e:
            print(f"Erro ao realizar aporte na reserva: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def realizar_resgate(id_usuario, valor_resgate):
        """Retira um valor da reserva de emergência (se houver saldo suficiente)"""
        conexao, cursor = Conexao.conectar()
        try:
            reserva = ReservaEmergencia.buscar_por_usuario(id_usuario)

            if reserva and float(reserva['valor_atual']) >= float(valor_resgate):
                sql = "UPDATE reserva_emergencia SET valor_atual = valor_atual - %s WHERE id_usuario = %s"
                cursor.execute(sql, (valor_resgate, id_usuario))
                conexao.commit()
                return True
            else:
                print("Saldo insuficiente na reserva para resgate.")
                return False
        except Exception as e:
            print(f"Erro ao realizar resgate da reserva: {e}")
            conexao.rollback()
            return False
        finally:
            cursor.close()
            conexao.close()