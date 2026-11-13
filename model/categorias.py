import bcrypt
from database.conexao import Conexao
from model.progresso import Progresso

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
    def criar_categoria(id_usuario, nome, tipo, emoji, cor, retornar_id=False):
        """Função para criar uma nova categoria"""
        conexao, cursor = Conexao.conectar()

        sql = """
            INSERT INTO categorias (id_usuario, nome, tipo, emoji, cor) 
            VALUES (%s, %s, %s, %s, %s)
        """
        
        try:
            cursor.execute(sql, (id_usuario, nome, tipo, emoji, cor))
            id_categoria_criada = cursor.lastrowid
            # Concede XP só depois de inserir a categoria, na mesma transação.
            Progresso.conceder_xp(cursor, id_usuario, f"categoria:{id_categoria_criada}", 10)
            conexao.commit()
            return id_categoria_criada if retornar_id else True
        except Exception as erro:
            print(f"Erro ao criar categoria: {erro}")
            conexao.rollback()
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

    def calcular_receitas_por_categoria():
        """Função para calcular o total de receitas por categoria"""
        conexao, cursor = Conexao.conectar()

        sql = """
            SELECT c.nome AS categoria, SUM(t.valor) AS total
            FROM transacoes t
            JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.tipo = 'Receita'
            GROUP BY c.nome
        """
        
        try:
            cursor.execute(sql)
            resultados = cursor.fetchall()
            return resultados
        except Exception as erro:
            print(f"Erro ao calcular receitas por categoria: {erro}")
            return []
        finally:
            cursor.close()
            conexao.close()

    def calcular_despesas_por_categoria(id_usuario):
        """Função para calcular o total de despesas por categoria"""
        conexao, cursor = Conexao.conectar()

        sql = """
            SELECT c.nome AS categoria, SUM(t.valor) AS total
            FROM transacoes t
            JOIN categorias c ON t.id_categoria = c.id_categoria
            WHERE t.tipo = 'Despesa'
            GROUP BY c.nome
        """
        
        try:
            cursor.execute(sql)
            resultados = cursor.fetchall()
            return resultados
        except Exception as erro:
            print(f"Erro ao calcular despesas por categoria: {erro}")
            return []
        finally:
            cursor.close()
            conexao.close()