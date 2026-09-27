<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/config.php';
$action = $_GET['action'] ?? 'status';
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    $pdo = getPdo();
    if ($action === 'status') {
        echo json_encode(['status' => 'ok', 'server' => 'PS.kz PHP 8 + MySQL Connected']);
    } else {
        echo json_encode(['status' => 'ok']);
    }
} catch (Throwable $e) {
    echo json_encode(['status' => 'offline_fallback', 'message' => $e->getMessage()]);
}
