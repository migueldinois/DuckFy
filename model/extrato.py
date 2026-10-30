from database.conexao import Conexao

class Extrato:
    @staticmethod
    def obter_resumo_periodo(id_usuario: int, data_inicio, data_fim):
        conexao, cursor = Conexao.conectar()

        try:
            query = """
                SELECT
                    COALESCE(SUM(CASE
                        WHEN LOWER(tipo) IN ('receita', 'entrada', 'entradas', 'retirada')
                        THEN valor ELSE 0
                    END), 0) AS entradas,
                    COALESCE(SUM(CASE
                        WHEN LOWER(tipo) IN ('despesa', 'saida', 'saída')
                        THEN valor ELSE 0
                    END), 0) AS saidas
                FROM transacoes
                WHERE id_usuario = %s
                  AND data_transacao BETWEEN %s AND %s
            """
            cursor.execute(query, (id_usuario, data_inicio, data_fim))
            linha = cursor.fetchone()

            if isinstance(linha, dict):
                resumo = linha
            else:
                colunas = [coluna[0] for coluna in cursor.description]
                resumo = dict(zip(colunas, linha))

            return {
                'entradas': float(resumo['entradas'] or 0),
                'saidas': float(resumo['saidas'] or 0)
            }

        except Exception as erro:
            print(f"Erro ao buscar resumo do extrato: {erro}")
            return {'entradas': 0.0, 'saidas': 0.0}

        finally:
            cursor.close()
            conexao.close()

    @staticmethod
    def obter_extrato(id_usuario: int, tipo: str = 'tudo', id_conta: int = None, data_inicio: str = None, data_fim: str = None):
        """
        Busca o extrato de transações de um usuário no banco de dados.
        """
        conexao, cursor = Conexao.conectar()

        try:
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

            if tipo == 'entrada':
                query += " AND LOWER(t.tipo) IN ('receita', 'entrada', 'entradas', 'retirada')"
            elif tipo == 'saida':
                query += " AND LOWER(t.tipo) IN ('despesa', 'saida', 'saída', 'transferência', 'transferencia')"

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

            for linha in resultados:
                if isinstance(linha, dict):
                    item = linha
                else:
                    colunas = [col[0] for col in cursor.description]
                    item = dict(zip(colunas, linha))

                try:
                    item['valor'] = float(item['valor'])
                except (ValueError, TypeError):
                    item['valor'] = 0.0

                transacoes.append(item)

            return transacoes

        except Exception as erro:
            print(f"Erro ao buscar extrato: {erro}")
            return []

        finally:
            cursor.close()
            conexao.close()