
USE duckfy;

INSERT INTO usuarios
(nome, email, senha_hash, dias_ofensiva, pontos_xp, foto_perfil)
VALUES
('Ana Silva', 'ana.silva@email.com', 'hash_demo_ana', 12, 1250,
 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),
('Carlos Eduardo', 'carlos.eduardo@email.com', 'hash_demo_carlos', 5, 450,
 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'),
('Mariana Costa', 'mariana.costa@email.com', 'hash_demo_mariana', 30, 3200,
 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400');


INSERT INTO categorias
(id_usuario, nome, tipo, emoji, cor, id_categoria_0)
VALUES
(1, 'Alimentação', 'Despesa', '🍔', '#FF7043', NULL),
(1, 'Moradia', 'Despesa', '🏠', '#5C6BC0', NULL),
(1, 'Salário', 'Receita', '💰', '#2E7D32', NULL),
(1, 'Transporte', 'Despesa', '🚗', '#00897B', NULL),
(1, 'Supermercado', 'Despesa', '🛒', '#FFA726', 1),
(1, 'Restaurantes', 'Despesa', '🍕', '#EF5350', 1),
(1, 'Aluguel', 'Despesa', '🔑', '#7986CB', 2),
(2, 'Lazer', 'Despesa', '🎮', '#AB47BC', NULL),
(2, 'Salário', 'Receita', '💰', '#2E7D32', NULL),
(2, 'Transporte', 'Despesa', '🚌', '#00897B', NULL),
(3, 'Alimentação', 'Despesa', '🥗', '#FF7043', NULL),
(3, 'Salário', 'Receita', '💵', '#2E7D32', NULL),
(3, 'Moradia', 'Despesa', '🏡', '#5C6BC0', NULL);


INSERT INTO contas_bancarias
(id_usuario, nome_conta, tipo_conta, saldo_atual)
VALUES
(1, 'Nubank', 'Conta Corrente', 2400.00),
(1, 'Itaú Poupança', 'Poupança', 1600.00),
(2, 'Bradesco', 'Conta Corrente', 1350.00),
(2, 'Caixa Econômica', 'Poupança', 2200.00),
(3, 'Banco do Brasil', 'Conta Corrente', 4500.00),
(3, 'Inter Investimentos', 'Investimento', 5000.00);


INSERT INTO reserva_emergencia
(id_usuario, valor_atual, meta_valor)
VALUES
(1, 3000.00, 10000.00),
(2, 1500.00, 6000.00),
(3, 5000.00, 12000.00);


INSERT INTO reserva_contas
(id_reserva, id_conta, valor_alocado)
VALUES
(1, 1, 1800.00),
(1, 2, 1200.00),
(2, 3, 500.00),
(2, 4, 1000.00),
(3, 5, 2000.00),
(3, 6, 3000.00);


INSERT INTO conquistas_badges
(nome, descricao, icone)
VALUES
('Primeiros Passos', 'Guardou os primeiros R$ 100.', 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png'),
('Consistência', 'Completou 30 dias de ofensiva.', 'https://cdn-icons-png.flaticon.com/512/785/785116.png'),
('Organizador', 'Organizou suas finanças no aplicativo.', 'https://cdn-icons-png.flaticon.com/512/2620/2620611.png'),
('Reserva Completa', 'Atingiu a meta da reserva.', 'https://cdn-icons-png.flaticon.com/512/190/190411.png');


INSERT INTO usuarios_badges
(id_usuario, id_badge, data_conquista)
VALUES
(1, 1, '2026-09-10 14:30:00'),
(1, 3, '2026-09-25 10:15:00'),
(2, 1, '2026-10-02 09:00:00'),
(3, 1, '2026-08-01 09:00:00'),
(3, 2, '2026-10-01 18:00:00');


INSERT INTO transacoes
(id_usuario, id_conta, id_categoria, descricao, valor, tipo, data_transacao, id_reserva)
VALUES
(1, 1, 3, 'Salário mensal', 5000.00, 'Receita', '2026-10-01', NULL),
(1, 1, 5, 'Compras no supermercado', 350.50, 'Despesa', '2026-10-02', NULL),
(1, 1, 6, 'Jantar com amigos', 95.00, 'Despesa', '2026-10-03', NULL),
(1, 2, 7, 'Aluguel mensal', 1200.00, 'Despesa', '2026-10-05', NULL),
(1, 1, NULL, 'Aporte para reserva de emergência', 500.00, 'Transferência', '2026-10-06', 1),
(2, 3, 9, 'Salário mensal', 2800.00, 'Receita', '2026-10-01', NULL),
(2, 3, 8, 'Compra de jogo', 180.00, 'Despesa', '2026-10-04', NULL),
(2, 4, NULL, 'Aporte para reserva de emergência', 300.00, 'Transferência', '2026-10-07', 2),
(3, 5, 12, 'Salário mensal', 6500.00, 'Receita', '2026-10-01', NULL),
(3, 5, 11, 'Almoço', 75.00, 'Despesa', '2026-10-03', NULL),
(3, 6, NULL, 'Aporte para reserva de emergência', 1000.00, 'Transferência', '2026-10-08', 3);
