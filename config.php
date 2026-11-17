<?php
// Sesuaikan dengan MySQL Anda (XAMPP default: root tanpa password)
const DB_HOST = 'localhost';
const DB_NAME = 'cybershield';
const DB_USER = 'root';
const DB_PASS = '';

function db(): PDO {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");
    return $pdo;
}
