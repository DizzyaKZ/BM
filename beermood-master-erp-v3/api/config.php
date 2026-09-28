<?php
// Конфигурация бэкенда BEERMOOD Master ERP v3
declare(strict_types=1);

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'beermood_erp');
define('DB_USER', 'root');
define('DB_PASS', '');

// Параметры сетевого принтера TSC TE310
define('PRINTER_IP', '192.168.1.17');
define('PRINTER_PORT', 9100);
define('PRINTER_TIMEOUT_SEC', 4);

// CORS заголовки
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
