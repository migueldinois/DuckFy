CREATE DATABASE IF NOT EXISTS duckfy;
USE duckfy;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    dias_ofensiva INT DEFAULT 0,
    pontos_xp INT DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    foto_perfil VARCHAR(255)
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nome VARCHAR(50) NOT NULL,
    tipo VARCHAR(10),
    emoji VARCHAR(20),
    cor VARCHAR(7),
    id_categoria_0 INT,
    CONSTRAINT fk_categorias_usuarios
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_categorias_pai
        FOREIGN KEY (id_categoria_0) REFERENCES categorias(id_categoria)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE contas_bancarias (
    id_conta INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nome_conta VARCHAR(50) NOT NULL,
    tipo_conta VARCHAR(40),
    saldo_atual DECIMAL(10, 2) DEFAULT 0.00,
    CONSTRAINT fk_contas_usuarios
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reserva_emergencia (
    id_reserva INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    valor_atual DECIMAL(10, 2) DEFAULT 0.00,
    meta_valor DECIMAL(10, 2) DEFAULT 0.00,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_usuarios
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE reserva_contas (
    id_reserva_conta INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NOT NULL,
    id_conta INT NOT NULL,
    valor_alocado DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_rc_reserva
        FOREIGN KEY (id_reserva) REFERENCES reserva_emergencia(id_reserva)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_rc_conta
        FOREIGN KEY (id_conta) REFERENCES contas_bancarias(id_conta)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uk_reserva_conta
        UNIQUE (id_reserva, id_conta),
    CONSTRAINT chk_valor_alocado
        CHECK (valor_alocado >= 0)
);

CREATE TABLE conquistas_badges (
    id_badge INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(50),
    icone VARCHAR(255)
);

CREATE TABLE usuarios_badges (
    id_usuario_badge INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_badge INT NOT NULL,
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ub_usuarios
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ub_badges
        FOREIGN KEY (id_badge) REFERENCES conquistas_badges(id_badge)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE transacoes (
    id_transacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_conta INT NOT NULL,
    id_categoria INT,
    descricao VARCHAR(100),
    valor DECIMAL(10, 2) NOT NULL,
    tipo VARCHAR(40),
    data_transacao DATE NOT NULL,
    id_reserva INT,
    CONSTRAINT fk_transacoes_usuarios
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_transacoes_contas
        FOREIGN KEY (id_conta) REFERENCES contas_bancarias(id_conta)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_transacoes_categorias
        FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_transacoes_reserva
        FOREIGN KEY (id_reserva) REFERENCES reserva_emergencia(id_reserva)
        ON DELETE SET NULL ON UPDATE CASCADE
);