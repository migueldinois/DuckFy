import re

from database.conexao import Conexao


class Subcategoria:
    @staticmethod
    def listar_categorias_pai(id_usuario):
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                """
                SELECT id_categoria AS id, nome, tipo
                FROM categorias
                WHERE (id_usuario = %s OR id_usuario IS NULL)
                  AND id_categoria_0 IS NULL
                  AND tipo IN ('Despesa', 'Receita')
                ORDER BY FIELD(tipo, 'Despesa', 'Receita'), nome
                """,
                (id_usuario,)
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def listar(id_usuario):
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                """
                SELECT
                    sub.id_categoria AS id,
                    sub.id_usuario,
                    sub.nome,
                    sub.emoji,
                    sub.cor,
                    sub.id_categoria_0 AS categoria_id,
                    pai.nome AS categoria_nome,
                    pai.tipo AS categoria_tipo
                FROM categorias sub
                INNER JOIN categorias pai
                    ON pai.id_categoria = sub.id_categoria_0
                   AND (pai.id_usuario = %s OR pai.id_usuario IS NULL)
                WHERE (sub.id_usuario = %s OR sub.id_usuario IS NULL)
                ORDER BY pai.nome, sub.nome
                """,
                (id_usuario, id_usuario)
            )
            subcategorias = cursor.fetchall()
            for subcategoria in subcategorias:
                subcategoria["pode_editar"] = subcategoria["id_usuario"] == id_usuario
            return subcategorias
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def salvar(id_usuario, nome, id_categoria, emoji, cor, id_subcategoria=None):
        nome = (nome or "").strip()
        emoji = (emoji or "").strip()
        cor = (cor or "").strip()

        if not nome or len(nome) > 50:
            raise ValueError("Informe um nome com até 50 caracteres.")
        if not emoji or len(emoji) > 20:
            raise ValueError("Selecione um emoji válido.")
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", cor):
            raise ValueError("Selecione uma cor válida.")

        try:
            id_categoria = int(id_categoria)
            id_subcategoria = int(id_subcategoria) if id_subcategoria is not None else None
        except (TypeError, ValueError):
            raise ValueError("Selecione uma categoria válida.") from None

        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                """
                SELECT id_categoria, nome, tipo
                FROM categorias
                WHERE id_categoria = %s
                  AND (id_usuario = %s OR id_usuario IS NULL)
                  AND id_categoria_0 IS NULL
                  AND tipo IN ('Despesa', 'Receita')
                """,
                (id_categoria, id_usuario)
            )
            categoria = cursor.fetchone()
            if not categoria:
                raise ValueError("A categoria selecionada não está disponível.")

            if id_subcategoria is not None:
                cursor.execute(
                    """
                    SELECT id_categoria
                    FROM categorias
                    WHERE id_categoria = %s
                      AND id_usuario = %s
                      AND id_categoria_0 IS NOT NULL
                    """,
                    (id_subcategoria, id_usuario)
                )
                if not cursor.fetchone():
                    raise ValueError("A subcategoria não está disponível para edição.")

            cursor.execute(
                """
                SELECT id_categoria
                FROM categorias
                WHERE id_usuario = %s
                  AND id_categoria_0 = %s
                  AND LOWER(nome) = LOWER(%s)
                  AND (%s IS NULL OR id_categoria <> %s)
                """,
                (id_usuario, id_categoria, nome, id_subcategoria, id_subcategoria)
            )
            if cursor.fetchone():
                raise ValueError("Já existe uma subcategoria com esse nome nessa categoria.")

            if id_subcategoria is None:
                cursor.execute(
                    """
                    INSERT INTO categorias
                        (id_usuario, nome, tipo, emoji, cor, id_categoria_0)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (id_usuario, nome, categoria["tipo"], emoji, cor.upper(), id_categoria)
                )
                id_subcategoria = cursor.lastrowid
            else:
                cursor.execute(
                    """
                    UPDATE categorias
                    SET nome = %s, tipo = %s, emoji = %s, cor = %s, id_categoria_0 = %s
                    WHERE id_categoria = %s AND id_usuario = %s
                    """,
                    (nome, categoria["tipo"], emoji, cor.upper(), id_categoria, id_subcategoria, id_usuario)
                )

            conexao.commit()
            return {
                "id": id_subcategoria,
                "nome": nome,
                "categoria_id": id_categoria,
                "categoria_nome": categoria["nome"],
                "categoria_tipo": categoria["tipo"],
                "emoji": emoji,
                "cor": cor.upper(),
                "pode_editar": True,
            }
        except Exception:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def deletar(id_usuario, id_subcategoria):
        conexao, cursor = Conexao.conectar()
        try:
            cursor.execute(
                """
                DELETE FROM categorias
                WHERE id_categoria = %s
                  AND id_usuario = %s
                  AND id_categoria_0 IS NOT NULL
                """,
                (id_subcategoria, id_usuario)
            )
            excluida = cursor.rowcount > 0
            if excluida:
                conexao.commit()
            else:
                conexao.rollback()
            return excluida
        except Exception:
            conexao.rollback()
            raise
        finally:
            cursor.close()
            conexao.close()