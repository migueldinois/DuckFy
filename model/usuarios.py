import bcrypt
from database.conexao import Conexao

class Usuario():
    @staticmethod
    def validar_usuario(email_input: str, senha_input: str):
        '''Função para verificar se o usuario existe e retorna um bool'''
        
        # Caso os campos venham vazios
        if not email_input or not senha_input:
            return False

        conexao = None
        cursor = None

        try:
            conexao, cursor = Conexao.conectar()

            # Buscando a senha hash filtrando o email
            cursor.execute('SELECT senha_hash FROM usuarios WHERE email = %s', [email_input])
            resultado_senha = cursor.fetchone() 

            # Se o email nao existir no banco retorna falso
            if resultado_senha is None:
                return False

            # CORREÇÃO 1: Acessa por índice numérico (0) para pegar o primeiro campo da tupla
            # (Ou pega pelo nome caso seu cursor seja do tipo DictCursor)
            senha_hash = resultado_senha[0] if isinstance(resultado_senha, tuple) else resultado_senha['senha_hash']

            # Garantindo conversão para bytes
            senha_bytes = senha_input.encode('utf-8')
            
            if isinstance(senha_hash, str):
                hash_bytes = senha_hash.encode('utf-8')
            else:
                hash_bytes = senha_hash

            # Compara a senha digitada com o hash salvo
            return bcrypt.checkpw(senha_bytes, hash_bytes)

        except Exception as erro:
            print(f"Erro na validação de login: {erro}")
            return False

        finally:
            # CORREÇÃO 2: Fecha os recursos no finally
            if cursor:
                cursor.close()
            if conexao:
                conexao.close()