USE duckfy;

-- Completa os aportes históricos do Barbosa sem duplicar lançamentos existentes.
SET @id_barbosa = (
	SELECT id_usuario FROM usuarios WHERE email = 'seis.meses@duckfy.demo'
);
SET @id_reserva_barbosa = (
	SELECT id_reserva
	FROM reserva_emergencia
	WHERE id_usuario = @id_barbosa
	ORDER BY id_reserva DESC
	LIMIT 1
);
SET @conta_barbosa_nubank = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_barbosa AND nome_conta = 'Nubank'
	ORDER BY id_conta DESC
	LIMIT 1
);
SET @conta_barbosa_itau = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_barbosa AND nome_conta = 'Itaú'
	ORDER BY id_conta DESC
	LIMIT 1
);
SET @conta_barbosa_inter = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_barbosa AND nome_conta = 'Inter'
	ORDER BY id_conta DESC
	LIMIT 1
);

INSERT INTO transacoes
	(id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao, id_reserva)
SELECT
	@id_barbosa,
	CASE
		WHEN aportes.numero <= 5 THEN @conta_barbosa_nubank
		WHEN aportes.numero <= 8 THEN @conta_barbosa_itau
		ELSE @conta_barbosa_inter
	END,
	NULL,
	'Aporte na reserva de emergência',
	1000.00,
	'Transferência',
	DATE_SUB(CURDATE(), INTERVAL (aportes.numero * 15) DAY),
	@id_reserva_barbosa
FROM (
	SELECT 1 AS numero UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
	UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
	UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
) AS aportes
WHERE @id_barbosa IS NOT NULL
	AND @id_reserva_barbosa IS NOT NULL
	AND @conta_barbosa_nubank IS NOT NULL
	AND @conta_barbosa_itau IS NOT NULL
	AND @conta_barbosa_inter IS NOT NULL
	AND NOT EXISTS (
		SELECT 1
		FROM transacoes existente
		WHERE existente.id_usuario = @id_barbosa
			AND existente.id_reserva = @id_reserva_barbosa
			AND existente.tipo = 'Transferência'
			AND existente.descricao = 'Aporte na reserva de emergência'
			AND existente.data_transacao = DATE_SUB(CURDATE(), INTERVAL (aportes.numero * 15) DAY)
	);