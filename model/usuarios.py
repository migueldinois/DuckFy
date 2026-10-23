import bcrypt
from database.conexao import Conexao

class Usuario():
    @staticmethod
    def validar_usuario(email_input: str, senha_input: str):
        '''Função para verificar se o usuario existe e retorna um bool'''
        
        #  caso os campos venham vazios
        if not email_input or not senha_input:
            return False

        conexao, cursor = Conexao.conectar()

        # Buscando a senha hash filtrando o email
        cursor.execute('SELECT senha_hash FROM usuarios WHERE email = %s', [email_input])
        resultado_senha = cursor.fetchone() 
        
        conexao.close()
        cursor.close()

        # Se o email nao existir no banco retorna falso
        if resultado_senha is None:
            return False

        senha_hash = resultado_senha['senha_hash']
        
        try:
            # O bcrypt precisa que os valores estejam em formato de bytes (.encode('utf-8'))
            senha_bytes = senha_input.encode('utf-8')
            hash_bytes = senha_hash.encode('utf-8')

            # compara a senha digitada com o hash salvo
            if bcrypt.checkpw(senha_bytes, hash_bytes):
                return True
            else:
                return False
                
        except Exception as erro:
            print(f"Erro no Bcrypt: {erro}")
            return False


    def buscar_id_por_email(email: str):
        """Função para buscar o ID do usuário pelo email"""
        conexao, cursor = Conexao.conectar()

        cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s", [email])
        resultado = cursor.fetchone() 
        
        conexao.close()
        cursor.close()

        if resultado:
            return resultado['id_usuario']
        else:
            return None
    def criar_usuario(nome: str, email: str, senha_input: str, foto_perfil: str = "https://placehold.co/400x400"):
        """Função para cadastrar um novo usuário gerando o hash da senha"""
        conexao, cursor = Conexao.conectar()

        try:
            # gerar o hash da senha de forma segura usando bcrypt
            senha_bytes = senha_input.encode('utf-8')
            salt = bcrypt.gensalt()
            senha_hash_bytes = bcrypt.hashpw(senha_bytes, salt)
            
            # converter o hash de bytes para string antes de salvar no banco
            senha_hash_str = senha_hash_bytes.decode('utf-8')

            # valores zerados para novos usuários
            dias_ofensiva = 0
            pontos_xp = 0

            # executar o comando SQL utilizando placeholders (%s) contra SQL Injection
            comando_sql = """
                INSERT INTO usuarios (nome, email, senha_hash, dias_ofensiva, pontos_xp, foto_perfil)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            valores = [nome, email, senha_hash_str, dias_ofensiva, pontos_xp, foto_perfil]
            
            cursor.execute(comando_sql, valores)
            
            # commit para ser alterado no banco de dados
            conexao.commit()
            return True

        except Exception as erro:
            print(f"Erro ao criar usuário: {erro}")
            # cancela a operação caso ocorra algum problema de conexão ou duplicidade
            conexao.rollback() 
            return False
            
        finally:
            # garante que a conexão será fechada mesmo se houver erro
            cursor.close()
            conexao.close()

    def recuperar_dados_usuario(email):
        conexao, cursor = Conexao.conectar()

        cursor.execute("SELECT nome, email, dias_ofensiva, pontos_xp, foto_perfil FROM usuarios WHERE email = %s", [email])
        dados_usuario = cursor.fetchone() 
        
        conexao.close()
        cursor.close()

        return dados_usuario