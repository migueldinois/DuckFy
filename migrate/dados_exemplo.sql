
USE duckfy;

-- Senha dos três usuários: DemoDuckfy2026!
-- Execute migrate/estrutura_banco.sql antes deste arquivo e rode este seed uma única vez.
-- Os e-mails demo não podem já existir na tabela usuarios.
INSERT INTO usuarios
	(nome, email, senha_hash, dias_ofensiva, pontos_xp, data_criacao, foto_perfil)
VALUES
	('Alex', 'novato@duckfy.demo',
	 '$2b$12$A5r7UYuXpUDDeL3EiSM2G.nzAOROBFXNKLEc.4NqAen7YB665ysri', 0, 0, NOW(),
	 'https://placehold.co/400x400?text=Alex'),
	('Ivo', 'mensal@duckfy.demo',
	 '$2b$12$A5r7UYuXpUDDeL3EiSM2G.nzAOROBFXNKLEc.4NqAen7YB665ysri', 30, 350,
	 DATE_SUB(NOW(), INTERVAL 29 DAY), 'https://placehold.co/400x400?text=Ivo'),
	('Barbosa', 'seis.meses@duckfy.demo',
	 '$2b$12$A5r7UYuXpUDDeL3EiSM2G.nzAOROBFXNKLEc.4NqAen7YB665ysri', 180, 5200,
	 DATE_SUB(NOW(), INTERVAL 179 DAY), 'https://placehold.co/400x400?text=Barbosa');

SET @id_novato = (SELECT id_usuario FROM usuarios WHERE email = 'novato@duckfy.demo');
SET @id_semanal = (SELECT id_usuario FROM usuarios WHERE email = 'mensal@duckfy.demo');
SET @id_investidora = (SELECT id_usuario FROM usuarios WHERE email = 'seis.meses@duckfy.demo');
SET @id_mensal = @id_semanal;
SET @id_veterano = @id_investidora;

-- O primeiro perfil não tem registros de uso: ainda não criou conta bancária,
-- categoria ou lançamento e não possui histórico de gamificação.

-- O segundo perfil tem um mês de uso; o terceiro mantém ofensiva de seis meses.
INSERT INTO usuarios_gamificacao
	(id_usuario, dias_atual, melhor_sequencia, ultima_atividade)
VALUES
	(@id_semanal, 30, 30, CURDATE()),
	(@id_investidora, 180, 180, CURDATE());

-- Histórico de acessos diários para representar as ofensivas.
INSERT INTO usuarios_eventos_xp (id_usuario, chave_evento, pontos, data_evento)
SELECT @id_semanal,
	   CONCAT('login:', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL dias.dia DAY), '%Y-%m-%d')),
	   5,
	   DATE_SUB(CURDATE(), INTERVAL dias.dia DAY)
FROM (
	SELECT unidades.n + dezenas.n * 10 AS dia
	FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
		  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
		  UNION ALL SELECT 8 UNION ALL SELECT 9) AS unidades
	CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2) AS dezenas
) AS dias;

INSERT INTO usuarios_eventos_xp (id_usuario, chave_evento, pontos, data_evento)
SELECT @id_investidora,
	   CONCAT('login:', DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL dias.dia DAY), '%Y-%m-%d')),
	   5,
	   DATE_SUB(CURDATE(), INTERVAL dias.dia DAY)
FROM (
	SELECT unidades.n + dezenas.n * 10 + centenas.n * 100 AS dia
	FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
		  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
		  UNION ALL SELECT 8 UNION ALL SELECT 9) AS unidades
	CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2
				UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
				UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
				UNION ALL SELECT 9) AS dezenas
	CROSS JOIN (SELECT 0 AS n UNION ALL SELECT 1) AS centenas
) AS dias
WHERE dias.dia < 180;

-- Dados do perfil que já experimentou categorias, contas, lançamentos e reserva.
INSERT INTO categorias (id_usuario, nome, tipo, emoji, cor)
VALUES
	(@id_semanal, 'Salário', 'Receita', '💰', '#2E7D32'),
	(@id_semanal, 'Moradia', 'Despesa', '🏠', '#5C6BC0'),
	(@id_mensal, 'Mercado', 'Despesa', '🛒', '#FFA726'),
	(@id_semanal, 'Lazer', 'Despesa', '🎮', '#AB47BC');

INSERT INTO contas_bancarias (id_usuario, nome_conta, tipo_conta, saldo_atual)
VALUES
	(@id_mensal, 'Nubank', 'Conta Corrente', 2800.00),
	(@id_mensal, 'Mercado Pago', 'Conta Corrente', 900.00);

SET @conta_semanal_nubank = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_mensal AND nome_conta = 'Nubank'
);
SET @conta_semanal_caixa = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_mensal AND nome_conta = 'Mercado Pago'
);
SET @categoria_semanal_salario = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_mensal AND nome = 'Salário'
);
SET @categoria_semanal_mercado = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_mensal AND nome = 'Mercado'
);
SET @categoria_semanal_lazer = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_mensal AND nome = 'Lazer'
);

INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor)
VALUES (@id_mensal, 300.00, 2000.00);
SET @reserva_semanal = LAST_INSERT_ID();

INSERT INTO reserva_contas (id_reserva, id_conta, valor_alocado)
VALUES
	(@reserva_semanal, @conta_semanal_nubank, 200.00),
	(@reserva_semanal, @conta_semanal_caixa, 100.00);

INSERT INTO transacoes
	(id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao, id_reserva)
VALUES
	(@id_mensal, @conta_semanal_nubank, @categoria_semanal_salario,
	 'Salário', 3200.00, 'Receita', DATE_SUB(CURDATE(), INTERVAL 5 DAY), NULL),
	(@id_mensal, @conta_semanal_nubank, @categoria_semanal_mercado,
	 'Compras da semana', 245.70, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 4 DAY), NULL),
	(@id_mensal, @conta_semanal_nubank, @categoria_semanal_lazer,
	 'Cinema', 68.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL),
	(@id_mensal, @conta_semanal_caixa, NULL,
	 'Aporte na reserva de emergência', 100.00, 'Transferência', CURDATE(), @reserva_semanal);

-- Dados do perfil veterano: contas bancárias comuns, categorias, movimentações
-- e uma reserva ainda em formação.
INSERT INTO categorias (id_usuario, nome, tipo, emoji, cor)
VALUES
	(@id_veterano, 'Salário', 'Receita', '💰', '#2E7D32'),
	(@id_veterano, 'Freelance', 'Receita', '💻', '#00897B'),
	(@id_veterano, 'Alimentação', 'Despesa', '🥗', '#FF7043'),
	(@id_veterano, 'Moradia', 'Despesa', '🏡', '#5C6BC0'),
	(@id_veterano, 'Transporte', 'Despesa', '🚌', '#00897B'),
	(@id_veterano, 'Lazer', 'Despesa', '🎭', '#AB47BC'),
	(@id_veterano, 'Saúde', 'Despesa', '❤️', '#E53935'),
	(@id_veterano, 'Educação', 'Despesa', '📚', '#3949AB'),
	(@id_veterano, 'Investimentos', 'Despesa', '📈', '#2E7D32'),
	(@id_veterano, 'Casa', 'Despesa', '🧹', '#8D6E63');

INSERT INTO contas_bancarias (id_usuario, nome_conta, tipo_conta, saldo_atual)
VALUES
	(@id_investidora, 'Nubank', 'Conta Corrente', 18000.00),
	(@id_investidora, 'Itaú', 'Poupança', 8500.00),
	(@id_investidora, 'Inter', 'Conta Corrente', 24500.00),
	(@id_investidora, 'Mercado Pago', 'Conta Corrente', 3200.00);

SET @conta_investidora_nubank = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_investidora AND nome_conta = 'Nubank'
);
SET @conta_investidora_itau = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_investidora AND nome_conta = 'Itaú'
);
SET @conta_investidora_corretora = (
	SELECT id_conta FROM contas_bancarias
	WHERE id_usuario = @id_investidora AND nome_conta = 'Inter'
);
SET @categoria_investidora_salario = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Salário'
);
SET @categoria_investidora_freelance = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Freelance'
);
SET @categoria_investidora_alimentacao = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Alimentação'
);
SET @categoria_investidora_moradia = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Moradia'
);
SET @categoria_investidora_transporte = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Transporte'
);
SET @categoria_investidora_lazer = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Lazer'
);
SET @categoria_investidora_saude = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Saúde'
);
SET @categoria_investidora_educacao = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Educação'
);
SET @categoria_investidora_investimentos = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Investimentos'
);
SET @categoria_investidora_casa = (
	SELECT id_categoria FROM categorias
	WHERE id_usuario = @id_investidora AND nome = 'Casa'
);

INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor)
VALUES (@id_investidora, 12000.00, 60000.00);
SET @reserva_investidora = LAST_INSERT_ID();

INSERT INTO reserva_contas (id_reserva, id_conta, valor_alocado)
VALUES
	(@reserva_investidora, @conta_investidora_nubank, 5000.00),
	(@reserva_investidora, @conta_investidora_itau, 4000.00),
	(@reserva_investidora, @conta_investidora_corretora, 3000.00);

INSERT INTO transacoes
	(id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao, id_reserva)
VALUES
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_salario,
	 'Salário mensal', 8500.00, 'Receita', DATE_SUB(CURDATE(), INTERVAL 25 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_freelance,
	 'Projeto freelance', 1800.00, 'Receita', DATE_SUB(CURDATE(), INTERVAL 18 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_moradia,
	 'Aluguel', 2200.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 16 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_alimentacao,
	 'Mercado e refeições', 740.50, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 12 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_transporte,
	 'Transporte mensal', 280.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_lazer,
	 'Passeio de fim de semana', 195.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 8 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_saude,
	 'Consulta médica', 230.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 6 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_educacao,
	 'Curso de investimentos', 390.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 4 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_investimentos,
	 'Aporte mensal na corretora', 1500.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL),
	(@id_investidora, @conta_investidora_corretora, @categoria_investidora_investimentos,
	 'Rendimento de investimentos', 185.00, 'Receita', DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL),
	(@id_investidora, @conta_investidora_nubank, @categoria_investidora_casa,
	 'Manutenção doméstica', 160.00, 'Despesa', DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL),
	(@id_investidora, @conta_investidora_itau, NULL,
	 'Aporte na reserva de emergência', 1000.00, 'Transferência', CURDATE(), @reserva_investidora);

-- Onze aportes anteriores de R$ 1.000, espaçados ao longo dos seis meses.
INSERT INTO transacoes
	(id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao, id_reserva)
SELECT
	@id_investidora,
	CASE
		WHEN aportes.numero <= 5 THEN @conta_investidora_nubank
		WHEN aportes.numero <= 8 THEN @conta_investidora_itau
		ELSE @conta_investidora_corretora
	END,
	NULL,
	'Aporte na reserva de emergência',
	1000.00,
	'Transferência',
	DATE_SUB(CURDATE(), INTERVAL (aportes.numero * 15) DAY),
	@reserva_investidora
FROM (
	SELECT 1 AS numero UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
	UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8
	UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
) AS aportes;

-- Garante os badges usados pelo exemplo sem duplicar os que já existem.
INSERT INTO conquistas_badges (nome, descricao, icone)
SELECT novos.nome, novos.descricao, novos.icone
FROM (
	SELECT 'Primeiros Passos' AS nome, 'Guardou os primeiros R$ 100.' AS descricao, 'bi-piggy-bank' AS icone
	UNION ALL SELECT 'Consistência', 'Completou 30 dias de ofensiva.', 'bi-calendar2-check'
	UNION ALL SELECT 'Organizador', 'Organizou suas finanças no aplicativo.', 'bi-tags'
	UNION ALL SELECT 'Reserva Completa', 'Atingiu a meta da reserva.', 'bi-trophy'
	UNION ALL SELECT 'Primeira Conta', 'Cadastre sua primeira conta.', 'bi-bank'
	UNION ALL SELECT 'Trio Bancário', 'Cadastre três contas bancárias.', 'bi-buildings'
	UNION ALL SELECT 'Primeira Categoria', 'Crie sua primeira categoria.', 'bi-tags'
	UNION ALL SELECT 'Semana Constante', 'Mantenha uma sequência de 7 dias.', 'bi-calendar-check'
	UNION ALL SELECT 'Mês Consistente', 'Mantenha uma sequência de 30 dias.', 'bi-calendar2-check'
	UNION ALL SELECT 'Lenda da Consistência', 'Mantenha uma sequência de 100 dias.', 'bi-stars'
	UNION ALL SELECT '100 XP', 'Acumule 100 pontos de experiência.', 'bi-lightning-charge'
	UNION ALL SELECT '500 XP', 'Acumule 500 pontos de experiência.', 'bi-lightning-charge-fill'
	UNION ALL SELECT 'Reserva de R$ 1.000', 'Guarde R$ 1.000 na reserva.', 'bi-piggy-bank'
	UNION ALL SELECT 'Três Dias em Movimento', 'Mantenha uma sequência de 3 dias.', 'bi-fire'
	UNION ALL SELECT 'Duas Semanas Firmes', 'Mantenha uma sequência de 14 dias.', 'bi-calendar-week'
	UNION ALL SELECT 'Cinco Contas', 'Cadastre cinco contas bancárias.', 'bi-bank2'
	UNION ALL SELECT 'Categorias para Tudo', 'Crie dez categorias financeiras.', 'bi-grid-3x3-gap'
	UNION ALL SELECT '1.000 XP', 'Acumule 1.000 pontos de experiência.', 'bi-lightning-charge'
	UNION ALL SELECT '2.500 XP', 'Acumule 2.500 pontos de experiência.', 'bi-lightning-charge-fill'
	UNION ALL SELECT 'Reserva de R$ 500', 'Guarde R$ 500 na reserva.', 'bi-piggy-bank'
	UNION ALL SELECT 'Reserva de R$ 5.000', 'Guarde R$ 5.000 na reserva.', 'bi-safe2'
	UNION ALL SELECT 'Reserva de R$ 10.000', 'Guarde R$ 10.000 na reserva.', 'bi-safe'
	UNION ALL SELECT 'Um Quarto do Caminho', 'Complete 25% da meta da reserva.', 'bi-pie-chart'
	UNION ALL SELECT 'Metade da Meta', 'Complete 50% da meta da reserva.', 'bi-bar-chart-steps'
) AS novos
WHERE NOT EXISTS (
	SELECT 1 FROM conquistas_badges existente WHERE existente.nome = novos.nome
);

-- Conquistas compatíveis com os números e as atividades de cada perfil.
INSERT INTO usuarios_badges (id_usuario, id_badge, data_conquista)
SELECT @id_semanal, badge.id_badge, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM conquistas_badges AS badge
WHERE badge.nome IN (
	'Primeiros Passos', 'Primeira Conta', 'Primeira Categoria', 'Semana Constante',
	'Mês Consistente', 'Consistência', 'Três Dias em Movimento', '100 XP'
);

INSERT INTO usuarios_badges (id_usuario, id_badge, data_conquista)
SELECT @id_investidora, badge.id_badge, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM conquistas_badges AS badge
WHERE badge.nome IN (
	'Primeiros Passos', 'Consistência', 'Organizador',
	'Primeira Conta', 'Trio Bancário', 'Primeira Categoria', 'Semana Constante',
	'Mês Consistente', '100 XP', '500 XP', 'Reserva de R$ 1.000',
	'Três Dias em Movimento', 'Duas Semanas Firmes', 'Lenda da Consistência',
	'Categorias para Tudo', '1.000 XP', '2.500 XP', 'Reserva de R$ 500',
	'Reserva de R$ 5.000', 'Reserva de R$ 10.000'
);
