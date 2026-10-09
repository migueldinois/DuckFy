import bcrypt
from database.conexao import Conexao

class Categoria():
    @staticmethod
    def recuperar_categorias_por_tipo(id_usuario, tipo):
        conexao, cursor = Conexao.conectar()
        
        cursor = conexao.cursor(dictionary=True)

        sql = """
            SELECT id_categoria, id_usuario, nome, tipo, emoji, cor, id_categoria_0 
            FROM categorias 
            WHERE (id_usuario = %s OR id_usuario IS NULL) 
            AND tipo = %s
        """
        
        cursor.execute(sql, (id_usuario, tipo))
        dados_categorias = cursor.fetchall() 
        
        cursor.close()
        conexao.close()

        return dados_categorias