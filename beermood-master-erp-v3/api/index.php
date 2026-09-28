<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$endpoint = trim(str_replace('/api', '', $path), '/');

$pdo = getDbConnection();

switch ($endpoint) {
    case 'status':
        sendJsonResponse([
            'status' => 'online',
            'system' => 'BEERMOOD Master ERP v3 API',
            'printer' => PRINTER_IP . ':' . PRINTER_PORT,
            'db_connected' => ($pdo !== null),
            'server_time' => date('Y-m-d H:i:s')
        ]);
        break;

    case 'standards':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM meat_standards");
            sendJsonResponse($stmt->fetchAll());
        } else {
            sendJsonResponse(['notice' => 'Mock mode active, DB offline']);
        }
        break;

    case 'market-prices':
        if ($method === 'GET') {
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM raw_material_prices ORDER BY category ASC");
                sendJsonResponse($stmt->fetchAll());
            } else {
                sendJsonResponse(['notice' => 'Mock mode active']);
            }
        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            sendJsonResponse(['success' => true, 'updated' => $input]);
        }
        break;

    case 'benchmarks':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM competitor_benchmarks");
            sendJsonResponse($stmt->fetchAll());
        } else {
            sendJsonResponse(['notice' => 'Mock mode active']);
        }
        break;

    case 'forecasts':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM financial_forecasts ORDER BY id ASC");
            sendJsonResponse($stmt->fetchAll());
        } else {
            sendJsonResponse(['notice' => 'Mock mode active']);
        }
        break;

    case 'recommendations':
        if ($method === 'GET') {
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM pricing_recommendations ORDER BY is_applied ASC, priority DESC");
                sendJsonResponse($stmt->fetchAll());
            } else {
                sendJsonResponse(['notice' => 'Mock mode active']);
            }
        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            sendJsonResponse(['success' => true, 'applied' => $input]);
        }
        break;

    case 'orders':
        if ($method === 'GET') {
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM arai_orders ORDER BY created_at DESC");
                sendJsonResponse($stmt->fetchAll());
            } else {
                sendJsonResponse([]);
            }
        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            sendJsonResponse(['success' => true, 'order' => $input]);
        }
        break;

    case 'meat-lab':
        if ($method === 'GET') {
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM meat_lab_records ORDER BY sample_time DESC");
                sendJsonResponse($stmt->fetchAll());
            } else {
                sendJsonResponse([]);
            }
        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            sendJsonResponse(['success' => true, 'record' => $input]);
        }
        break;

    case 'milk-lab':
        if ($method === 'GET') {
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM milk_lab_records ORDER BY sample_time DESC");
                sendJsonResponse($stmt->fetchAll());
            } else {
                sendJsonResponse([]);
            }
        } elseif ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            sendJsonResponse(['success' => true, 'record' => $input]);
        }
        break;

    case 'cron-scan':
    case 'run-intelligence-scan':
        require_once __DIR__ . '/../scripts/cron_market_intelligence.php';
        $scanResults = runMarketIntelligenceScan($pdo);
        sendJsonResponse($scanResults);
        break;

    default:
        sendJsonResponse(['error' => 'Endpoint not found: ' . $endpoint], 404);
}
