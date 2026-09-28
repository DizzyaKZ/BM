<?php
// Шлюз отправки TSPL пакетов на сетевой термопринтер TSC TE310 по TCP/IP сокету
require_once __DIR__ . '/config.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty($data['tspl'])) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка: Отсутствует тело команды TSPL'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$printerIp = !empty($data['ip']) ? $data['ip'] : PRINTER_IP;
$printerPort = !empty($data['port']) ? (int)$data['port'] : PRINTER_PORT;
$tsplCommands = $data['tspl'];

// Конвертация в кодировку CP1251 для кириллицы в TSC TE310
if (function_exists('mb_convert_encoding')) {
    $tsplPayload = mb_convert_encoding($tsplCommands, 'Windows-1251', 'UTF-8');
} elseif (function_exists('iconv')) {
    $tsplPayload = iconv('UTF-8', 'WINDOWS-1251//IGNORE', $tsplCommands);
} else {
    $tsplPayload = $tsplCommands;
}

// Открытие прямого сокета TCP на порт 9100 (RAW Port принтера)
$socket = @fsockopen($printerIp, $printerPort, $errno, $errstr, PRINTER_TIMEOUT_SEC);

if (!$socket) {
    // В случае отсутствия физического принтера в локальной сети отдаем понятный статус
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'mock' => true,
        'error_code' => $errno,
        'message' => "Не удалось установить TCP-соединение с принтером {$printerIp}:{$printerPort} ({$errstr}). Убедитесь, что принтер TSC TE310 включен и доступен в локальной сети подсети 192.168.1.0/24."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Передача байтов на печать
fwrite($socket, $tsplPayload);
fflush($socket);
fclose($socket);

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'bytes_sent' => strlen($tsplPayload),
    'printer' => "{$printerIp}:{$printerPort}",
    'message' => "✓ Задание печати успешно передано на принтер TSC TE310 ({$printerIp}:{$printerPort})"
], JSON_UNESCAPED_UNICODE);
