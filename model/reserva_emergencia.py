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
        '''Retorna lista vazia até que você crie a tabela de lançamentos'''
        return []

    @staticmethod
    def guardar_dinheiro(id_usuario: int, valor_guardar: float, descricao: str):
        '''Soma o valor guardado na reserva'''
        conexao, cursor = Conexao.conectar()

        cursor.execute(
            'SELECT valor_atual FROM reserva_emergencia WHERE id_usuario = %s',
            [id_usuario]
        )
        reserva = cursor.fetchone()

        if reserva:
            novo_saldo = float(reserva['valor_atual']) + valor_guardar
            cursor.execute(
                'UPDATE reserva_emergencia SET valor_atual = %s WHERE id_usuario = %s',
                [novo_saldo, id_usuario]
            )
        else:
            meta_padrao = 3000.00
            cursor.execute(
                'INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor) VALUES (%s, %s, %s)',
                [id_usuario, valor_guardar, meta_padrao]
            )

        conexao.commit()
        cursor.close()
        conexao.close()

        return True

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