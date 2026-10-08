from database.conexao import Conexao
from flask import Flask, render_template, request, redirect, session
import bcrypt

from database.conexao import Conexao

class Extrato:
    @staticmethod
    def obter_extrato(id_usuario: int, id_conta: int = None, data_inicio: str = None, data_fim: str = None):
        """
        Busca o extrato de transações de um usuário no banco de dados.
        """
        conexao, cursor = Conexao.conectar()

        try:
            # Query ajustada de acordo com as colunas reais da imagem:
            # t.id_transacao, cb.id_conta, cat.id_categoria
            query = """
                SELECT 
                    t.id_transacao,
                    t.descricao,
                    t.valor,
                    t.tipo,
                    DATE_FORMAT(t.data_transacao, '%d/%m/%Y') AS data_transacao,
                    cb.nome_conta,
                    COALESCE(cat.nome, 'Sem Categoria') AS nome_categoria,
                    COALESCE(cat.emoji, '💸') AS emoji,
                    COALESCE(cat.cor, '#CCCCCC') AS cor
                FROM transacoes t
                LEFT JOIN contas_bancarias cb ON t.id_conta = cb.id_conta
                LEFT JOIN categorias cat ON t.id_categoria = cat.id_categoria
                WHERE t.id_usuario = %s
            """
            params = [id_usuario]

            # Filtro opcional por conta bancária
            if id_conta:
                query += " AND t.id_conta = %s"
                params.append(id_conta)

            if data_inicio and data_fim:
                query += " AND t.data_transacao BETWEEN %s AND %s"
                params.extend([data_inicio, data_fim])

            query += " ORDER BY t.data_transacao DESC, t.id_transacao DESC;"

            cursor.execute(query, params)
            resultados = cursor.fetchall()
            transacoes = []
            if cursor.description:
                colunas = [col[0] for col in cursor.description]
                for linha in resultados:
                    transacoes.append(dict(zip(colunas, linha)))
            else:
                transacoes = resultados

            return transacoes

        except Exception as erro:
            print(f"Erro ao buscar extrato: {erro}")
            return []

        finally:
            cursor.close()
            conexao.close()
                