-- Script para crear la tabla de usuarios
-- Este script debe ejecutarse en tu base de datos MySQL

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'fraterno') NOT NULL DEFAULT 'fraterno',
  fraterno_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (fraterno_id) REFERENCES fraternos(id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto
-- Usuario: admin, Contraseña: admin123 (cambiar en producción)
INSERT INTO usuarios (username, password_hash, role) VALUES 
('admin', '$2a$10$rQZ9vXqK5xK5xK5xK5xK5.K5xK5xK5xK5xK5xK5xK5xK5xK5xK5xK', 'admin');

-- Nota: El hash de arriba es un ejemplo. Debes generar el hash real usando bcrypt
-- Puedes usar este código Node.js para generar el hash:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('admin123', 10);
-- console.log(hash);
