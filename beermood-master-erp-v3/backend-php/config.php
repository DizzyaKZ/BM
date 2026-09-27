<?php
define('DB_HOST', getenv('PSKZ_DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('PSKZ_DB_NAME') ?: 'beermood_erp');
define('DB_USER', getenv('PSKZ_DB_USER') ?: 'beermood_user');
define('DB_PASS', getenv('PSKZ_DB_PASS') ?: 'CHANGE_IN_PLESK');
define('TSC_IP', '192.168.1.17');
define('TSC_PORT', 9100);

function getPdo(): PDO {
    return new PDO('mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
}
