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
    def criar_categoria(id_usuario, nome, tipo, emoji, cor):
        """Função para criar uma nova categoria"""
        conexao, cursor = Conexao.conectar()

        sql = """
            INSERT INTO categorias (id_usuario, nome, tipo, emoji, cor) 
            VALUES (%s, %s, %s, %s, %s)
        """
        
        try:
            cursor.execute(sql, (id_usuario, nome, tipo, emoji, cor))
            conexao.commit()
            return True
        except Exception as erro:
            print(f"Erro ao criar categoria: {erro}")
            return False
        finally:
            cursor.close()
            conexao.close()
    def deletar_categoria(id_categoria):
        """Função para deletar uma categoria"""
        conexao, cursor = Conexao.conectar()

        sql = "DELETE FROM categorias WHERE id_categoria = %s"
        
        try:
            cursor.execute(sql, (id_categoria,))
            conexao.commit()
            return True
        except Exception as erro:
            print(f"Erro ao deletar categoria: {erro}")
            return False
        finally:
            cursor.close()
            conexao.close()

    def atualizar_categoria(id_categoria, nome, tipo, emoji, cor):
        """Função para atualizar uma categoria existente"""
        conexao, cursor = Conexao.conectar()

        sql = """
            UPDATE categorias 
            SET nome = %s, tipo = %s, emoji = %s, cor = %s 
            WHERE id_categoria = %s
        """
        
        try:
            cursor.execute(sql, (nome, tipo, emoji, cor, id_categoria))
            conexao.commit()
            return True
        except Exception as erro:
            print(f"Erro ao atualizar categoria: {erro}")
            return False
        finally:
            cursor.close()
            conexao.close()