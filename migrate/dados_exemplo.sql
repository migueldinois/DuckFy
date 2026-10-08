USE duckfy;

-- 1. Inserir Usuários
INSERT INTO usuarios (nome, email, senha_hash, dias_ofensiva, pontos_xp, foto_perfil) 
VALUES 
('Ana Silva', 'ana.silva@email.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/S8f.Y9oK0jI9dZ3Y0Z1', 12, 1250, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),
('Carlos Eduardo', 'carlos.eduardo@email.com', '$2a$12$K89s7dF9sDF7s89f7sDF8uN8s9F7s89F7s89f7s', 5, 450, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'),
('Mariana Costa', 'mariana.costa@email.com', '$2a$12$P0o9i8u7y6t5r4e3w2q1uN8s9F7s89F7s89f7s', 30, 3200, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400');

-- 2. Inserir Categorias
INSERT INTO categorias (id_usuario, nome, tipo, emoji, cor, id_categoria_0) 
VALUES 
(1, 'Alimentação', 'Despesa', '🍔', '#FF5733', NULL),
(1, 'Moradia', 'Despesa', '🏠', '#3357FF', NULL),
(1, 'Rendimento', 'Receita', '💰', '#28A745', NULL),
(2, 'Lazer', 'Despesa', '🎮', '#9B59B6', NULL),
(1, 'Supermercado', 'Despesa', '🛒', '#FF8D33', 1),
(1, 'Restaurantes', 'Despesa', '🍕', '#FF3333', 1),
(1, 'Aluguel', 'Despesa', '🔑', '#3380FF', 2);

-- 3. Inserir Contas Bancárias
INSERT INTO contas_bancarias (id_usuario, nome_conta, tipo_conta, saldo_atual) 
VALUES 
(1, 'Nubank Principal', 'Conta Corrente', 3500.50),
(1, 'Itaú Poupança', 'Poupança', 1200.00),
(2, 'Bradesco', 'Conta Corrente', 850.75),
(3, 'Banco do Brasil', 'Conta Corrente', 5400.00);

-- 4. Inserir Reservas de Emergência
INSERT INTO reserva_emergencia (id_usuario, valor_atual, meta_valor) 
VALUES 
(1, 5000.00, 15000.00),
(2, 500.00, 6000.00),
(3, 12000.00, 12000.00);

-- 5. Inserir Conquistas / Badges
INSERT INTO conquistas_badges (nome, descricao, icone) 
VALUES 
('Poupador Iniciante', 'Guardou os primeiros R$ 100 na reserva.', 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png'),
('Mestre do Foco', 'Manteve 30 dias seguidos de ofensiva no app.', 'https://cdn-icons-png.flaticon.com/512/785/785116.png'),
('Organizado', 'Cadastrou mais de 10 transações em um mês.', 'https://cdn-icons-png.flaticon.com/512/2620/2620611.png');

-- 6. Atribuir Badges aos Usuários
INSERT INTO usuarios_badges (id_usuario, id_badge, data_conquista) 
VALUES 
(1, 1, '2026-09-10 14:30:00'),
(1, 3, '2026-09-25 10:15:00'),
(3, 1, '2026-08-01 09:00:00'),
(3, 2, '2026-10-01 18:00:00');

-- 7. Inserir Transações
INSERT INTO transacoes (id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao, id_reserva) 
VALUES 
(1, 1, 3, 'Salário Mensal', 5000.00, 'Receita', '2026-10-01', NULL),
(1, 1, 5, 'Compras do Mês - Carrefour', 650.30, 'Despesa', '2026-10-02', NULL),
(1, 1, 6, 'Jantar de Sexta', 120.00, 'Despesa', '2026-10-03', NULL),
(1, 1, NULL, 'Aporte para Emergência', 500.00, 'Transferência', '2026-10-05', 1),
(2, 3, 4, 'Jogo de Videogame', 250.00, 'Despesa', '2026-10-04', NULL);