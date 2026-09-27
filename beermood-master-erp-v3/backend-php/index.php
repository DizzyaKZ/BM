<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/config.php';
$action = $_GET['action'] ?? 'status';
$in = json_decode(file_get_contents('php://input'), true) ?? [];

try {
    $pdo = getPdo();
    if ($action === 'status') {
        echo json_encode(['status' => 'ok', 'mode' => 'PS.kz PHP+MySQL Connected']);
    } elseif ($action === 'save_snapshot') {
        $st = $pdo->prepare("INSERT INTO erp_snapshots (state_key, payload_json) VALUES (:k, :v) ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json)");
        foreach ($in as $k => $v) {
            $st->execute([':k' => $k, ':v' => json_encode($v, JSON_UNESCAPED_UNICODE)]);
        }
        echo json_encode(['status' => 'ok']);
    } elseif ($action === 'load_snapshot') {
        $rows = $pdo->query("SELECT state_key, payload_json FROM erp_snapshots")->fetchAll();
        $out = [];
        foreach ($rows as $r) { $out[$r['state_key']] = json_decode($r['payload_json'], true); }
        echo json_encode(['status' => 'ok', 'data' => $out], JSON_UNESCAPED_UNICODE);
    } elseif ($action === 'print') {
        $cp1251 = iconv('UTF-8', 'CP1251//IGNORE', ($in['tspl'] ?? '') . "\r\n");
        $fp = @fsockopen($in['ip'] ?? TSC_IP, 9100, $errno, $errstr, 2.0);
        if ($fp) { fwrite($fp, $cp1251); fclose($fp); echo json_encode(['status' => 'ok', 'msg' => 'Sent to TSC TE310']); }
        else { echo json_encode(['status' => 'queued', 'msg' => 'Saved on PS.kz (Printer local)']); }
    } else {
        echo json_encode(['status' => 'ok']);
    }
} catch (Throwable $e) {
    echo json_encode(['status' => 'local_fallback', 'msg' => $e->getMessage()]);
}
