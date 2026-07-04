<?php
// ═══════════════════════════════════════════════════
//  config.php — إعدادات قاعدة البيانات
//  منصة مِقياس · جمعية الزاد 2026
// ═══════════════════════════════════════════════════

define('DB_HOST',    'localhost');
define('DB_NAME',    'miqyas_db');
define('DB_USER',    'root');
define('DB_PASS',    '123456');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'فشل الاتصال بقاعدة البيانات'], JSON_UNESCAPED_UNICODE));
        }
    }
    return $pdo;
}

function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getInput(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? $_POST;
}
