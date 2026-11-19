USE duckfy;

-- Guarda a sequência atual e a maior sequência já alcançada por cada usuário.
CREATE TABLE IF NOT EXISTS usuarios_gamificacao (
    id_usuario INT PRIMARY KEY,
    dias_atual INT NOT NULL DEFAULT 0,
    melhor_sequencia INT NOT NULL DEFAULT 0,
    ultima_atividade DATE NULL,
    CONSTRAINT fk_gamificacao_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Registra cada recompensa de XP para evitar duplicidade e calcular o limite diário.
CREATE TABLE IF NOT EXISTS usuarios_eventos_xp (
    id_evento BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    chave_evento VARCHAR(120) NOT NULL,
    pontos INT NOT NULL DEFAULT 0,
    data_evento DATE NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eventos_xp_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uk_evento_xp_usuario UNIQUE (id_usuario, chave_evento),
    INDEX idx_eventos_xp_data (id_usuario, data_evento)
);

-- Insere apenas badges ainda não cadastrados, permitindo reaplicar esta migração.
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
    UNION ALL SELECT '100 XP', 'Acumule 100 pontos de experiência.', 'bi-lightning-charge'
    UNION ALL SELECT '500 XP', 'Acumule 500 pontos de experiência.', 'bi-lightning-charge-fill'
    UNION ALL SELECT 'Reserva de R$ 1.000', 'Guarde R$ 1.000 na reserva.', 'bi-piggy-bank'
    UNION ALL SELECT 'Três Dias em Movimento', 'Mantenha uma sequência de 3 dias.', 'bi-fire'
    UNION ALL SELECT 'Duas Semanas Firmes', 'Mantenha uma sequência de 14 dias.', 'bi-calendar-week'
    UNION ALL SELECT 'Lenda da Consistência', 'Mantenha uma sequência de 100 dias.', 'bi-stars'
    UNION ALL SELECT 'Cinco Contas', 'Cadastre cinco contas bancárias.', 'bi-bank2'
    UNION ALL SELECT 'Categorias para Tudo', 'Crie dez categorias financeiras.', 'bi-grid-3x3-gap'
    UNION ALL SELECT '1.000 XP', 'Acumule 1.000 pontos de experiência.', 'bi-lightning-charge'
    UNION ALL SELECT '2.500 XP', 'Acumule 2.500 pontos de experiência.', 'bi-lightning-charge-fill'
    UNION ALL SELECT 'Reserva de R$ 500', 'Guarde R$ 500 na reserva.', 'bi-piggy-bank'
    UNION ALL SELECT 'Reserva de R$ 5.000', 'Guarde R$ 5.000 na reserva.', 'bi-safe2'
    UNION ALL SELECT 'Reserva de R$ 10.000', 'Guarde R$ 10.000 na reserva.', 'bi-safe'
    UNION ALL SELECT 'Um Quarto do Caminho', 'Complete 25% da meta da reserva.', 'bi-pie-chart'
    UNION ALL SELECT 'Metade da Meta', 'Complete 50% da meta da reserva.', 'bi-bar-chart-steps'
    UNION ALL SELECT 'Primeiro Dia', 'Mantenha 1 dia de ofensiva.', 'bi-calendar-day'
    UNION ALL SELECT 'Dois Dias Seguidos', 'Mantenha 2 dias de ofensiva.', 'bi-calendar2'
    UNION ALL SELECT 'Ritmo de Cinco Dias', 'Mantenha 5 dias de ofensiva.', 'bi-calendar-check'
    UNION ALL SELECT 'Dez Dias Firmes', 'Mantenha 10 dias seguidos.', 'bi-calendar2-week'
    UNION ALL SELECT 'Três Semanas Constantes', 'Mantenha 21 dias seguidos.', 'bi-calendar3-week'
    UNION ALL SELECT '60 Dias Constantes', 'Mantenha 60 dias seguidos.', 'bi-calendar2-check'
    UNION ALL SELECT 'Um Ano de Disciplina', 'Mantenha 365 dias seguidos.', 'bi-trophy-fill'
    UNION ALL SELECT '50 XP', 'Acumule 50 pontos de experiência.', 'bi-lightning-charge-fill'
    UNION ALL SELECT '250 XP', 'Acumule 250 pontos de XP.', 'bi-lightning-charge'
    UNION ALL SELECT '1.500 XP', 'Acumule 1.500 pontos de XP.', 'bi-stars'
    UNION ALL SELECT '5.000 XP', 'Acumule 5.000 pontos de XP.', 'bi-stars'
    UNION ALL SELECT '10.000 XP', 'Acumule 10.000 pontos de XP.', 'bi-trophy-fill'
    UNION ALL SELECT 'Duas Contas', 'Cadastre 2 contas bancárias.', 'bi-bank'
    UNION ALL SELECT 'Quatro Contas', 'Cadastre 4 contas bancárias.', 'bi-buildings'
    UNION ALL SELECT 'Dez Contas', 'Cadastre 10 contas bancárias.', 'bi-bank2'
    UNION ALL SELECT 'Três Categorias', 'Crie 3 categorias financeiras.', 'bi-tags'
    UNION ALL SELECT 'Sete Categorias', 'Crie 7 categorias financeiras.', 'bi-grid-3x3-gap'
    UNION ALL SELECT 'Quinze Categorias', 'Crie 15 categorias financeiras.', 'bi-grid-fill'
    UNION ALL SELECT 'Reserva de R$ 50', 'Guarde R$ 50 na reserva.', 'bi-piggy-bank'
    UNION ALL SELECT 'Reserva de R$ 250', 'Guarde R$ 250 na reserva.', 'bi-piggy-bank-fill'
    UNION ALL SELECT 'Reserva de R$ 750', 'Guarde R$ 750 na reserva.', 'bi-safe2'
    UNION ALL SELECT 'Reserva de R$ 2.000', 'Guarde R$ 2.000 na reserva.', 'bi-safe'
    UNION ALL SELECT 'Reserva de R$ 7.500', 'Guarde R$ 7.500 na reserva.', 'bi-shield-check'
    UNION ALL SELECT 'Reserva de R$ 25.000', 'Guarde R$ 25.000 na reserva.', 'bi-trophy'
    UNION ALL SELECT 'Meta Iniciada', 'Complete 10% da meta da reserva.', 'bi-bullseye'
    UNION ALL SELECT 'Quase na Meta', 'Complete 90% da meta da reserva.', 'bi-flag-fill'
) AS novos
WHERE NOT EXISTS (
    SELECT 1 FROM conquistas_badges existente WHERE existente.nome = novos.nome
);