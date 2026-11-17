-- CyberShield – Firewall Engine & Network Threat Prevention
-- Import lewat phpMyAdmin atau: mysql -u root -p < cybershield.sql

CREATE DATABASE IF NOT EXISTS cybershield CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cybershield;

DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS security_logs;
DROP TABLE IF EXISTS blacklist_ips;
DROP TABLE IF EXISTS firewall_rules;

CREATE TABLE firewall_rules (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  ip_address  VARCHAR(50)  NOT NULL DEFAULT '*',   -- IP, CIDR (10.0.0.0/8), atau * (semua)
  port        VARCHAR(10)  NOT NULL DEFAULT '*',   -- 1-65535 atau * (semua)
  action      ENUM('ALLOW','BLOCK') NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE blacklist_ips (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip_address  VARCHAR(45)  NOT NULL UNIQUE,
  reason      VARCHAR(255) NOT NULL DEFAULT 'Manual',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE security_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  logged_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source_ip     VARCHAR(45)  NOT NULL,
  target_port   INT UNSIGNED NOT NULL,
  activity_type VARCHAR(150) NOT NULL,
  action_taken  ENUM('DIIZINKAN','DIBLOKIR') NOT NULL,
  INDEX idx_logged_at (logged_at),
  INDEX idx_source_ip (source_ip)
) ENGINE=InnoDB;

CREATE TABLE settings (
  skey    VARCHAR(30) PRIMARY KEY,   -- tot, al, blk, fw_on, ports
  svalue  TEXT NOT NULL
) ENGINE=InnoDB;

-- Data awal (sama dengan data simulasi di aplikasi)
INSERT INTO firewall_rules (name, ip_address, port, action, is_active) VALUES
 ('Web HTTPS',     '*',         '443', 'ALLOW', 1),
 ('Web HTTP',      '*',         '80',  'ALLOW', 1),
 ('DNS',           '*',         '53',  'ALLOW', 1),
 ('SSH Admin',     '10.0.0.0/8','22',  'ALLOW', 1),
 ('Blokir Telnet', '*',         '23',  'BLOCK', 1);

INSERT INTO blacklist_ips (ip_address, reason) VALUES
 ('185.220.101.4',   'Node Tor / brute-force'),
 ('45.155.205.233',  'Port scanning');

INSERT INTO security_logs (source_ip, target_port, activity_type, action_taken) VALUES
 ('192.168.1.20',   443,  'Koneksi sah – Web HTTPS',          'DIIZINKAN'),
 ('185.220.101.4',  22,   'IP Blacklist: Node Tor / brute-force', 'DIBLOKIR'),
 ('91.14.22.8',     3389, 'Serangan: RDP Scan',               'DIBLOKIR'),
 ('103.77.12.5',    23,   'Dilarang – Blokir Telnet',         'DIBLOKIR');

INSERT INTO settings (skey, svalue) VALUES
 ('tot','124580'), ('al','118920'), ('blk','5660'), ('fw_on','1'),
 ('ports','{"22":1830,"3389":1420,"23":980,"445":760,"1433":420}');
