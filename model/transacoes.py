from decimal import Decimal, InvalidOperation

from database.conexao import Conexao


class Transacao:
<<<<<<< HEAD
	@staticmethod
	def criar_transacao(
		id_usuario: int,
		id_conta: int,
		id_categoria: int | None,
		descricao: str,
		valor,
		tipo: str,
	) -> tuple[bool, str]:
		conexao, cursor = Conexao.conectar()

		try:
			valor = Decimal(str(valor))
			if not valor.is_finite() or valor <= 0 or tipo not in {"Receita", "Despesa"}:
				return False, "dados_invalidos"
			if not descricao or len(descricao) > 100:
				return False, "dados_invalidos"

			cursor.execute(
				"""
				SELECT id_conta, saldo_atual
				FROM contas_bancarias
				WHERE id_conta = %s AND id_usuario = %s
				FOR UPDATE
				""",
				(id_conta, id_usuario),
			)
			conta = cursor.fetchone()
			if not conta:
				conexao.rollback()
				return False, "conta_invalida"
=======
	VALOR_MAXIMO = Decimal("99999999.99")

	@staticmethod
	def registrar(id_usuario, id_conta, id_categoria, descricao, valor, tipo):
		try:
			valor = Decimal(str(valor)).quantize(Decimal("0.01"))
		except (InvalidOperation, TypeError, ValueError):
			raise ValueError("Informe um valor válido.")

		if not valor.is_finite() or valor <= 0 or valor > Transacao.VALOR_MAXIMO:
			raise ValueError("O valor deve ser maior que zero e menor que R$ 100.000.000,00.")

		if tipo not in ("Receita", "Despesa"):
			raise ValueError("Tipo de lançamento inválido.")

		conexao, cursor = Conexao.conectar()
		try:
			cursor.execute(
				"SELECT saldo_atual FROM contas_bancarias WHERE id_conta = %s AND id_usuario = %s FOR UPDATE",
				(id_conta, id_usuario)
			)
			conta = cursor.fetchone()
			if not conta:
				raise ValueError("A conta selecionada não é válida.")
>>>>>>> 395814ecbaea09d69dd6c48ab1b6a5b908ea5edc

			if id_categoria is not None:
				cursor.execute(
					"""
<<<<<<< HEAD
					SELECT id_categoria
					FROM categorias
					WHERE id_categoria = %s
					  AND (id_usuario = %s OR id_usuario IS NULL)
					  AND tipo = %s
					LIMIT 1
					""",
					(id_categoria, id_usuario, tipo),
				)
				if not cursor.fetchone():
					conexao.rollback()
					return False, "categoria_invalida"

=======
					SELECT id_categoria FROM categorias
					WHERE id_categoria = %s
					  AND (id_usuario = %s OR id_usuario IS NULL)
					  AND LOWER(tipo) = LOWER(%s)
					""",
					(id_categoria, id_usuario, tipo)
				)
				if not cursor.fetchone():
					raise ValueError("A categoria não corresponde ao tipo do lançamento.")

			saldo_atual = Decimal(str(conta["saldo_atual"] or 0))
>>>>>>> 395814ecbaea09d69dd6c48ab1b6a5b908ea5edc
			if tipo == "Despesa":
				cursor.execute(
					"""
					SELECT COALESCE(SUM(rc.valor_alocado), 0) AS valor_alocado
					FROM reserva_contas rc
					INNER JOIN reserva_emergencia re ON re.id_reserva = rc.id_reserva
					WHERE rc.id_conta = %s AND re.id_usuario = %s
					""",
<<<<<<< HEAD
					(id_conta, id_usuario),
				)
				valor_alocado = Decimal(str(cursor.fetchone()["valor_alocado"] or 0))
				saldo_disponivel = Decimal(str(conta["saldo_atual"] or 0)) - valor_alocado
				if saldo_disponivel < valor:
					conexao.rollback()
					return False, "saldo_insuficiente"

				cursor.execute(
					"""
					UPDATE contas_bancarias
					SET saldo_atual = saldo_atual - %s
					WHERE id_conta = %s AND id_usuario = %s
					""",
					(valor, id_conta, id_usuario),
				)
			else:
				cursor.execute(
					"""
					UPDATE contas_bancarias
					SET saldo_atual = saldo_atual + %s
					WHERE id_conta = %s AND id_usuario = %s
					""",
					(valor, id_conta, id_usuario),
				)
=======
					(id_conta, id_usuario)
				)
				valor_alocado = Decimal(str(cursor.fetchone()["valor_alocado"] or 0))
				if saldo_atual - valor_alocado < valor:
					raise ValueError("Saldo disponível insuficiente para essa despesa.")
				novo_saldo = saldo_atual - valor
			else:
				novo_saldo = saldo_atual + valor
				if novo_saldo > Transacao.VALOR_MAXIMO:
					raise ValueError("O saldo da conta ultrapassaria o limite permitido.")
>>>>>>> 395814ecbaea09d69dd6c48ab1b6a5b908ea5edc

			cursor.execute(
				"""
				INSERT INTO transacoes
<<<<<<< HEAD
					(id_usuario, id_conta, id_categoria, descricao, valor, tipo)
				VALUES (%s, %s, %s, %s, %s, %s)
				""",
				(id_usuario, id_conta, id_categoria, descricao, valor, tipo),
			)
			conexao.commit()
			return True, "ok"
		except (InvalidOperation, TypeError, ValueError):
			conexao.rollback()
			return False, "dados_invalidos"
		except Exception as erro:
			print(f"Erro ao registrar transação: {erro}")
			conexao.rollback()
			return False, "erro_banco"
=======
					(id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao)
				VALUES (%s, %s, %s, %s, %s, %s, CURDATE())
				""",
				(id_usuario, id_conta, id_categoria, descricao, valor, tipo)
			)
			cursor.execute(
				"UPDATE contas_bancarias SET saldo_atual = %s WHERE id_conta = %s AND id_usuario = %s",
				(novo_saldo, id_conta, id_usuario)
			)
			conexao.commit()
			return True
		except Exception:
			conexao.rollback()
			raise
>>>>>>> 395814ecbaea09d69dd6c48ab1b6a5b908ea5edc
		finally:
			cursor.close()
			conexao.close()
