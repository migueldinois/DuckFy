from database.conexao import Conexao

class Extrato:
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
                    CASE
                        WHEN t.id_reserva IS NOT NULL
                            AND LOWER(t.tipo) IN ('crédito', 'credito', 'receita', 'entrada')
                            THEN 'Aporte na Reserva de Emergência'
                        WHEN t.id_reserva IS NOT NULL
                            AND LOWER(t.tipo) IN ('débito', 'debito', 'despesa', 'saida', 'saída')
                            THEN 'Retirada da Reserva de Emergência'
                        ELSE COALESCE(t.descricao, 'Movimentação sem descrição')
                    END AS descricao,
                    t.valor,
                    CASE
                        WHEN t.id_reserva IS NOT NULL
                            AND LOWER(t.tipo) IN ('crédito', 'credito', 'receita', 'entrada')
                            THEN 'entrada'
                        WHEN t.id_reserva IS NOT NULL
                            AND LOWER(t.tipo) IN ('débito', 'debito', 'despesa', 'saida', 'saída')
                            THEN 'saida'
                        ELSE t.tipo
                    END AS tipo,
                    DATE_FORMAT(t.data_transacao, '%d/%m/%Y') AS data_transacao,
                    cb.nome_conta,
                    CASE
                        WHEN t.id_reserva IS NOT NULL THEN 'Reserva de Emergência'
                        ELSE COALESCE(cat.nome, 'Sem Categoria')
                    END AS nome_categoria,
                    COALESCE(cat.emoji, '💸') AS emoji,
                    COALESCE(cat.cor, '#CCCCCC') AS cor
                FROM transacoes t
                LEFT JOIN contas_bancarias cb ON t.id_conta = cb.id_conta
                LEFT JOIN categorias cat ON t.id_categoria = cat.id_categoria
                WHERE t.id_usuario = %s
            """
            params = [id_usuario]

            if tipo == 'entrada':
<<<<<<< HEAD
                query += " AND (LOWER(t.tipo) IN ('receita', 'entrada') OR (t.id_reserva IS NOT NULL AND LOWER(t.tipo) IN ('crédito', 'credito')))"
            elif tipo == 'saida':
                query += " AND (LOWER(t.tipo) IN ('despesa', 'saida', 'saída') OR (t.id_reserva IS NOT NULL AND LOWER(t.tipo) IN ('débito', 'debito')))"
=======
                query += " AND LOWER(t.tipo) IN ('receita', 'entrada', 'entradas', 'retirada')"
            elif tipo == 'saida':
                query += " AND LOWER(t.tipo) IN ('despesa', 'saida', 'saída', 'transferência', 'transferencia')"
>>>>>>> ad5fe6106928845d9f8d9258f124061fad1fadbe

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