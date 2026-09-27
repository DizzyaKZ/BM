/**
 * Генератор проекта MOOD GROUP PRO MANUFACTURING ERP v3.2 (для репозитория DizzyaKZ/BM)
 * Стек: Angular 18 (Standalone + Reusable Components + Signals) + PHP 8 PDO + MySQL 8.0 (PS.kz)
 * Запуск в терминале VS Code: node create-beermood-master-v3.js
 */
const fs = require('fs');
const path = require('path');

// Если скрипт запущен внутри клонированного репозитория BM, создаем файлы в подпапке beermood-master-erp-v3
const projectRoot = path.join(process.cwd(), 'beermood-master-erp-v3');

const files = {
  // =========================================================================
  // 1. НАСТРОЙКИ VISUAL STUDIO CODE (.vscode)
  // =========================================================================
  '.vscode/extensions.json': JSON.stringify({
    recommendations: [
      "Angular.ng-template",
      "bmewburn.vscode-intelephense-client",
      "mtxr.sqltools",
      "mtxr.sqltools-driver-mysql"
    ]
  }, null, 2),

  '.vscode/launch.json': JSON.stringify({
    version: "0.2.0",
    configurations: [
      {
        name: "Debug MOOD GROUP PRO ERP (Chrome)",
        type: "chrome",
        request: "launch",
        preLaunchTask: "npm: start",
        url: "http://localhost:4200/",
        webRoot: "${workspaceFolder}"
      }
    ]
  }, null, 2),

  '.vscode/tasks.json': JSON.stringify({
    version: "2.0.0",
    tasks: [
      { type: "npm", script: "start", isBackground: true, problemMatcher: "$tsc-watch", label: "npm: start" },
      { type: "npm", script: "bridge", isBackground: true, label: "Start Local TSC TE310 Bridge (192.168.1.17)" },
      { type: "npm", script: "build:pskz", problemMatcher: ["$tsc"], label: "Build Production for PS.kz" }
    ]
  }, null, 2),

  // =========================================================================
  // 2. СХЕМА БАЗЫ ДАННЫХ MYSQL ДЛЯ ХОСТИНГА PS.KZ (database/beermood_pro_pskz.sql)
  // =========================================================================
  'database/beermood_pro_pskz.sql': `SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS erp_snapshots (
  state_key VARCHAR(64) PRIMARY KEY,
  payload_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS raw_batches_qc (
  batch_id VARCHAR(64) PRIMARY KEY,
  supplier VARCHAR(120) NOT NULL,
  category VARCHAR(32) NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  fat_pct DECIMAL(5,2) DEFAULT 0,
  prot_pct DECIMAL(5,2) DEFAULT 0,
  ph_val DECIMAL(4,2) DEFAULT 6.70,
  water_pct DECIMAL(5,2) DEFAULT 0,
  verdict VARCHAR(20) DEFAULT 'PASSED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  batch_code VARCHAR(64) NOT NULL,
  plu VARCHAR(20) NOT NULL,
  from_loc VARCHAR(60) NOT NULL,
  to_loc VARCHAR(60) NOT NULL,
  qty DECIMAL(10,2) NOT NULL,
  moved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer_orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(32) NOT NULL,
  apt VARCHAR(32) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  slot VARCHAR(32) NOT NULL,
  total_kzt INT NOT NULL,
  items_json TEXT NOT NULL,
  status VARCHAR(24) DEFAULT 'NEW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`,

  // =========================================================================
  // 3. PHP 8 PDO REST API ДЛЯ ХОСТИНГА PS.KZ (backend-php/)
  // =========================================================================
  'backend-php/.htaccess': `RewriteEngine On
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
`,

  'backend-php/config.php': `<?php
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
`,

  'backend-php/index.php': `<?php
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
        $cp1251 = iconv('UTF-8', 'CP1251//IGNORE', ($in['tspl'] ?? '') . "\\r\\n");
        $fp = @fsockopen($in['ip'] ?? TSC_IP, 9100, $errno, $errstr, 2.0);
        if ($fp) { fwrite($fp, $cp1251); fclose($fp); echo json_encode(['status' => 'ok', 'msg' => 'Sent to TSC TE310']); }
        else { echo json_encode(['status' => 'queued', 'msg' => 'Saved on PS.kz (Printer local)']); }
    } else {
        echo json_encode(['status' => 'ok']);
    }
} catch (Throwable $e) {
    echo json_encode(['status' => 'local_fallback', 'msg' => $e->getMessage()]);
}
`,

  'public/.htaccess': `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api/ - [L]
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`,

  // =========================================================================
  // 4. ЛОКАЛЬНЫЙ МОСТ ПЕЧАТИ НА TSC TE310 (192.168.1.17:9100) ДЛЯ VS CODE
  // =========================================================================
  'local-bridge.js': `const http = require('http');
const net = require('net');

function toCP1251(s) {
  const b = [];
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 128) b.push(c);
    else if (c >= 0x0410 && c <= 0x044F) b.push(c - 0x0410 + 192);
    else if (c === 0x0401) b.push(168);
    else if (c === 0x0451) b.push(184);
    else if (c === 0x2116) b.push(185);
    else b.push(32);
  }
  return Buffer.from(b);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  let body = '';
  req.on('data', ch => body += ch);
  req.on('end', () => {
    if (req.url.includes('print') && req.method === 'POST') {
      const d = JSON.parse(body || '{}');
      const ip = d.ip || '192.168.1.17';
      const sock = new net.Socket();
      sock.setTimeout(2500);
      sock.connect(9100, ip, () => {
        sock.write(toCP1251((d.tspl || '') + '\\r\\n'), () => {
          sock.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', msg: 'Напечатано на ' + ip + ':9100 (CP1251)' }));
        });
      });
      sock.on('error', e => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'sim', msg: 'Принтер ' + ip + ' вне сети (' + e.message + ')' }));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', mode: 'Local VS Code Bridge :3001' }));
  });
}).listen(3001, () => console.log('🟢 Local TSC TE310 Bridge on http://localhost:3001'));
`,

  // =========================================================================
  // 5. КОНФИГУРАЦИЯ ПРОЕКТА ANGULAR 18
  // =========================================================================
  'package.json': JSON.stringify({
    name: "beermood-master-erp-v3",
    version: "3.2.0",
    scripts: {
      "ng": "ng",
      "start": "ng serve --open",
      "bridge": "node local-bridge.js",
      "build:pskz": "ng build --configuration production"
    },
    private: true,
    dependencies: {
      "@angular/animations": "^18.2.0",
      "@angular/common": "^18.2.0",
      "@angular/compiler": "^18.2.0",
      "@angular/core": "^18.2.0",
      "@angular/forms": "^18.2.0",
      "@angular/platform-browser": "^18.2.0",
      "@angular/platform-browser-dynamic": "^18.2.0",
      "@angular/router": "^18.2.0",
      "rxjs": "~7.8.0",
      "tslib": "^2.3.0",
      "zone.js": "~0.14.10"
    },
    devDependencies: {
      "@angular-devkit/build-angular": "^18.2.0",
      "@angular/cli": "^18.2.0",
      "@angular/compiler-cli": "^18.2.0",
      "typescript": "~5.5.2"
    }
  }, null, 2),

  'angular.json': JSON.stringify({
    "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
    "version": 1,
    "newProjectRoot": "projects",
    "projects": {
      "beermood-master-erp-v3": {
        "projectType": "application",
        "root": "",
        "sourceRoot": "src",
        "prefix": "app",
        "architect": {
          "build": {
            "builder": "@angular-devkit/build-angular:application",
            "options": {
              "outputPath": "dist/beermood-master-erp-v3",
              "index": "src/index.html",
              "browser": "src/main.ts",
              "polyfills": ["zone.js"],
              "tsConfig": "tsconfig.app.json",
              "assets": [{ "glob": "**/*", "input": "public" }],
              "styles": ["src/styles.css"]
            },
            "configurations": {
              "production": {
                "fileReplacements": [{ "replace": "src/environments/environment.ts", "with": "src/environments/environment.prod.ts" }],
                "outputHashing": "all"
              }
            }
          },
          "serve": {
            "builder": "@angular-devkit/build-angular:dev-server",
            "options": { "buildTarget": "beermood-master-erp-v3:build" }
          }
        }
      }
    }
  }, null, 2),

  'tsconfig.json': JSON.stringify({
    "compileOnSave": false,
    "compilerOptions": {
      "outDir": "./dist/out-tsc",
      "strict": true,
      "skipLibCheck": true,
      "esModuleInterop": true,
      "sourceMap": true,
      "experimentalDecorators": true,
      "moduleResolution": "bundler",
      "target": "ES2022",
      "module": "ES2022",
      "lib": ["ES2022", "dom"]
    }
  }, null, 2),

  'tsconfig.app.json': JSON.stringify({
    "extends": "./tsconfig.json",
    "compilerOptions": { "outDir": "./out-tsc/app", "types": [] },
    "files": ["src/main.ts"]
  }, null, 2),

  'src/environments/environment.ts': `export const environment = { production: false, apiUrl: 'http://localhost:3001' };`,
  'src/environments/environment.prod.ts': `export const environment = { production: true, apiUrl: '/api/index.php' };`,

  'src/index.html': `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>MOOD GROUP // PRO MANUFACTURING ERP v3.2</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body><app-root></app-root></body>
</html>`,

  'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent, appConfig).catch(e => console.error(e));
`,

  'src/app/app.config.ts': `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideHttpClient()]
};
`,

  // =========================================================================
  // 6. ГЛОБАЛЬНЫЕ СТИЛИ И МОДЕЛИ ДАННЫХ ERP
  // =========================================================================
  'src/styles.css': `:root {
  --bg:#0b0f14; --panel:#151b23; --panel-alt:#1c2430; --border:#2d3846;
  --text:#e6edf3; --muted:#8b949e; --amber:#f0883e; --blue:#388bfd;
  --green:#2ea043; --warn:#d29922; --red:#f85149; --purple:#a371f7; --cheese:#f59e0b;
}
* { box-sizing: border-box; }
body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:var(--bg); color:var(--text); font-size:13px; line-height:1.45; }
.top-bar { background:#090d12; border-bottom:1px solid var(--border); padding:11px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; position:sticky; top:0; z-index:100; }
.nav-tabs { display:flex; background:var(--panel); border-bottom:1px solid var(--border); padding:0 16px; gap:4px; overflow-x:auto; }
.nav-tab { padding:11px 14px; cursor:pointer; font-weight:700; font-size:12.5px; color:var(--muted); border:none; background:transparent; border-bottom:3px solid transparent; white-space:nowrap; }
.nav-tab.active { color:var(--amber); border-bottom-color:var(--amber); background:rgba(240,136,62,0.08); }
.workspace { max-width:1660px; margin:0 auto; padding:16px 20px 60px; }
.kpi-strip { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px; margin-bottom:16px; }
.card { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-bottom:16px; }
.card h3 { margin:0 0 10px 0; font-size:14px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:8px; }
.btn { background:var(--amber); color:#000; border:none; padding:7px 12px; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px; }
.btn-outline { background:var(--panel-alt); color:var(--text); border:1px solid var(--border); }
.btn-outline.active { background:var(--amber); color:#000; border-color:var(--amber); }
.btn-purple { background:rgba(163,113,247,0.18); color:#d2a8ff; border:1px solid var(--purple); }
.btn-purple.active { background:var(--purple); color:#000; }
.btn-green { background:var(--green); color:#fff; }
.btn-sm { padding:3px 8px; font-size:11px; }
input, select { background:var(--panel-alt); color:var(--text); border:1px solid var(--border); padding:5px 8px; border-radius:6px; font-size:12px; }
.plu-tag { background:#263342; color:#79c0ff; padding:2px 6px; border-radius:4px; font-family:monospace; font-size:10.5px; font-weight:700; }
.pill { display:inline-block; padding:2px 7px; border-radius:4px; font-size:10.5px; font-weight:700; }
.pill-ok { background:rgba(46,160,67,0.2); color:#7ee787; }
.pill-warn { background:rgba(210,153,34,0.25); color:#e3b341; }
.pill-crit { background:rgba(248,81,73,0.25); color:#ffa198; }
.pill-pivot { background:rgba(163,113,247,0.25); color:#d2a8ff; }
.giant-wrap { overflow-x:auto; max-height:490px; overflow-y:auto; border:1px solid var(--border); border-radius:8px; margin-bottom:16px; }
table.giant-table { width:100%; border-collapse:collapse; table-layout:fixed; min-width:1380px; }
.giant-table th, .giant-table td { border:1px solid #232d38; text-align:center; height:30px; padding:0; font-size:11px; }
.giant-table thead th { position:sticky; top:0; background:#17212c; z-index:10; color:var(--muted); }
.col-prod { width:260px; text-align:left !important; padding:3px 10px !important; position:sticky; left:0; background:#141c25; z-index:5; cursor:pointer; }
.col-meta { width:82px; background:#131b23; }
.col-stat { width:130px; background:#131b23; }
.d-cell { width:28px; cursor:pointer; font-weight:700; font-size:10px; user-select:none; }
.d-head-cur { background:var(--amber) !important; color:#000 !important; }
.d-col-cur { box-shadow:inset 0 0 0 1.5px var(--amber); }
.c-sup { background:rgba(56,139,253,0.35); color:#79c0ff; }
.c-prd { background:var(--amber); color:#000; font-weight:800; }
.c-sp { background:linear-gradient(135deg,#388bfd 45%,#f0883e 55%); color:#000; font-weight:800; }
.c-ok { background:rgba(46,160,67,0.26); color:#7ee787; }
.c-wrn { background:rgba(210,153,34,0.35); color:#e3b341; }
.c-crt { background:rgba(248,81,73,0.45); color:#ffa198; }
.c-pvt { background:rgba(163,113,247,0.42); color:#e2c5ff; }
.grid-3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:16px; }
.grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(450px,1fr)); gap:16px; }
.cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(440px,1fr)); gap:16px; }
.tech-card { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:15px; display:flex; flex-direction:column; justify-content:space-between; }
.mini-table { width:100%; border-collapse:collapse; font-size:12px; margin-top:5px; }
.mini-table th, .mini-table td { padding:5px 6px; border-bottom:1px solid #242f3c; text-align:left; }
.mini-table td:last-child { text-align:right; font-weight:700; color:var(--amber); }
.tspl-pre { background:#080b0f; color:#7ee787; padding:11px; border-radius:8px; font-family:monospace; font-size:11px; white-space:pre-wrap; border:1px solid #26303c; overflow-x:auto; }
`,

  'src/app/models/erp.models.ts': `export type ErpTabId = 'giant' | 'qc_warehouse' | 'orders_demand' | 'koch' | 'dairy_bread' | 'spicelab' | 'tspl';

export interface HaccpStep {
  id: number;
  title: string;
  desc: string;
  ccp?: string;
  tempTime?: string;
  done: boolean;
}

export interface GiantLine {
  plu: string;
  eanPrefix: string;
  brand: string;
  dept: string;
  kzTitle: string;
  subTitle: string;
  name: string;
  monthlyKg: number;
  monthlyUnits: number;
  packG: number;
  priceKg: number;
  costKg: number;
  yieldPct: number;
  prot: number;
  fat: number;
  carb: number;
  shelfDays: number;
  temp: string;
  supplyDays: number[];
  prodDays: number[];
  cycleDays: number;
  shortRisk: boolean;
  pivotRatio?: number;
  isBuffer?: boolean;
  bonusKg?: number;
  pivotAction: string;
  kzPair: string;
  ruPair: string;
  comp: string;
  shelfStockUnits: number;
  equipment: string;
  rawNorms: { name: string; qty: string }[];
  steps: HaccpStep[];
}

export interface RawBatchQc {
  batchId: string;
  supplier: string;
  category: 'Молоко сырое' | 'Мясные отруба' | 'Мука и солод' | 'Специи и тара';
  qty: number;
  unit: string;
  fatPct: number;
  protPct: number;
  phVal: number;
  waterAddedPct: number;
  verdict: 'PASSED' | 'REJECTED';
  receivedAt: string;
}

export interface StockMovement {
  id: number;
  batchCode: string;
  plu: string;
  productName: string;
  fromLoc: string;
  toLoc: string;
  qtyUnits: number;
  movedAt: string;
}

export interface CustomerOrder {
  orderId: number;
  source: 'Telegram ЖК Арай' | 'Зал BEERMOOD.PUB' | 'Витрина Take-away';
  apt: string;
  phone: string;
  slot: 'MORNING_0730' | 'EVENING_1830';
  isPrepaidKaspi: boolean;
  status: 'NEW' | 'PACKED' | 'DELIVERED';
  items: { plu: string; name: string; qty: number; pricePackKzt: number }[];
}

export interface SpiceStock {
  code: string;
  name: string;
  grind: string;
  stock: number;
  min: number;
  roast: boolean;
}
`,

  // =========================================================================
  // 7. ПЕРЕИСПОЛЬЗУЕМЫЕ КОМПОНЕНТЫ (REUSABLE UI COMPONENTS)
  // =========================================================================
  'src/app/components/kpi-badge.component.ts': `import { Component, input } from '@angular/core';
@Component({
  selector: 'app-kpi-badge',
  standalone: true,
  template: \`
    <div class="kpi-box">
      <div class="k-title">{{ title() }}</div>
      <div class="k-val" [style.color]="valColor()">{{ value() }}</div>
      <div class="k-sub">{{ subtitle() }}</div>
    </div>
  \`,
  styles: [\`
    .kpi-box { background:var(--panel); border:1px solid var(--border); padding:11px 14px; border-radius:8px; }
    .k-title { color:var(--muted); font-size:11px; text-transform:uppercase; }
    .k-val { font-size:16.5px; font-weight:800; margin-top:4px; color:#fff; }
    .k-sub { font-size:11px; color:#58a6ff; margin-top:2px; }
  \`]
})
export class KpiBadgeComponent {
  title = input.required<string>();
  value = input.required<string>();
  subtitle = input<string>('');
  valColor = input<string>('#ffffff');
}
`,

  'src/app/components/pack-econ.component.ts': `import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GiantLine } from '../models/erp.models';

@Component({
  selector: 'app-pack-econ',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="econ-wrap">
      <div class="econ-top">
        <strong style="color:#7ee787; font-size:12px;">
          💰 Экономика упаковки ({{ totalPacks() }} уп. • FC: {{ foodCostPct() }}%)
        </strong>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-outline btn-sm" (click)="adjustPriceKg(-500)">-500 ₸</button>
          <button class="btn btn-outline btn-sm" (click)="adjustPriceKg(500)">+500 ₸</button>
          <button class="btn btn-sm" (click)="openSteps.emit(line().plu)">📋 Техкарта ХАССП</button>
        </div>
      </div>

      <div class="econ-grid">
        <label>Вес 1 уп. (г):
          <input type="number" [ngModel]="line().packG" (ngModelChange)="onPackGChange(+$event)" step="10">
        </label>
        <label>Цена за 1 кг (₸):
          <input type="number" [ngModel]="line().priceKg" (ngModelChange)="onPriceKgChange(+$event)" step="100" style="color:var(--amber);">
        </label>
        <label>Цена за 1 уп. (₸):
          <input type="number" [ngModel]="packPriceKzt()" (ngModelChange)="onPackPriceChange(+$event)" step="50" style="color:#7ee787;">
        </label>
      </div>

      <div class="econ-foot">
        <span>Себест. 1 уп.: <strong style="color:#fff;">{{ costPerPackKzt() }} ₸</strong></span>
        <span>MOOD Club -10%: <strong style="color:#79c0ff;">{{ clubPriceKzt() }} ₸</strong></span>
        <span>Прибыль партии: <strong style="color:#7ee787;">+{{ batchProfitKzt() | number }} ₸</strong></span>
      </div>

      <button class="btn btn-outline btn-sm" style="width:100%; margin-top:7px;" (click)="openTspl.emit(line().plu)">
        🖨️ Маркировка {{ line().plu }} на принтере TSC TE310 →
      </button>
    </div>
  \`,
  styles: [\`
    .econ-wrap { background:#10161d; border:1px solid #283442; border-radius:8px; padding:10px 12px; margin-top:10px; }
    .econ-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px; }
    .econ-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:8px; font-size:11px; color:var(--muted); }
    .econ-grid input { width:100%; margin-top:2px; font-weight:700; }
    .econ-foot { display:flex; justify-content:space-between; font-size:11.5px; color:var(--muted); border-top:1px solid #26303c; padding-top:6px; }
  \`]
})
export class PackEconComponent {
  line = input.required<GiantLine>();
  batchInputKg = input<number>(20);
  changed = output<void>();
  openSteps = output<string>();
  openTspl = output<string>();

  totalPacks(): number {
    const outKg = this.batchInputKg() * (this.line().yieldPct / 100);
    return Math.max(1, Math.floor((outKg * 1000) / this.line().packG));
  }
  packPriceKzt(): number {
    return Math.round((this.line().priceKg / 1000) * this.line().packG);
  }
  clubPriceKzt(): number {
    return Math.round(this.packPriceKzt() * 0.90);
  }
  costPerPackKzt(): number {
    return Math.round((this.line().costKg / 1000) * this.line().packG) + 40;
  }
  foodCostPct(): string {
    return ((this.costPerPackKzt() / Math.max(1, this.packPriceKzt())) * 100).toFixed(1);
  }
  batchProfitKzt(): number {
    return this.totalPacks() * (this.packPriceKzt() - this.costPerPackKzt());
  }
  adjustPriceKg(delta: number): void {
    this.line().priceKg = Math.max(300, this.line().priceKg + delta);
    this.changed.emit();
  }
  onPackGChange(val: number): void {
    this.line().packG = Math.max(20, val || 100);
    this.changed.emit();
  }
  onPriceKgChange(val: number): void {
    this.line().priceKg = Math.max(300, val || 1000);
    this.changed.emit();
  }
  onPackPriceChange(packPrice: number): void {
    this.line().priceKg = Math.max(300, Math.round(((packPrice || 500) / this.line().packG) * 1000));
    this.changed.emit();
  }
}
`,

  'src/app/components/haccp-drawer.component.ts': `import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiantLine } from '../models/erp.models';

@Component({
  selector: 'app-haccp-drawer',
  standalone: true,
  imports: [CommonModule],
  template: \`
    @if (isOpen() && line(); as c) {
      <div class="drawer-backdrop" (click)="closed.emit()"></div>
      <aside class="drawer-box">
        <header class="drawer-head">
          <div>
            <span class="plu-tag">{{ c.plu }} • {{ c.brand }}</span>
            <h2 style="margin:4px 0 0 0; font-size:16px; color:#fff;">{{ c.name }}</h2>
            <div style="font-size:11.5px; color:var(--muted);">Оборудование: {{ c.equipment }}</div>
          </div>
          <button class="btn btn-outline btn-sm" (click)="closed.emit()">✕ Закрыть</button>
        </header>

        <div class="drawer-content">
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <strong>Треккинг выполнения технологической карты ХАССП:</strong>
            <span style="font-weight:800; color:var(--amber);">{{ progressPct() }}%</span>
          </div>
          <div class="prog-bg"><div class="prog-fill" [style.width.%]="progressPct()"></div></div>

          <div class="card" style="padding:10px 12px; font-size:11.5px;">
            <div><strong>📦 Фасовка и хранение:</strong> {{ c.packG }} г | Режим: {{ c.temp }} | Срок: {{ c.shelfDays }} суток</div>
            <div style="margin-top:4px; color:#d2a8ff;"><strong>🔄 Защита от затоваривания:</strong> {{ c.pivotAction }}</div>
          </div>

          <h4 style="margin:12px 0 6px 0; color:var(--amber);">🥩 Норма закладки сырья на партию:</h4>
          <table class="mini-table" style="margin-bottom:14px;">
            <thead><tr><th>Сырье / Ингредиент</th><th>Норма на замес</th></tr></thead>
            <tbody>
              @for (r of c.rawNorms; track r.name) {
                <tr><td><strong>{{ r.name }}</strong></td><td>{{ r.qty }}</td></tr>
              }
            </tbody>
          </table>

          <h4 style="margin:12px 0 8px 0; color:#7ee787;">📋 Пошаговый операционный контроль (ККТ ХАССП):</h4>
          @for (st of c.steps; track st.id) {
            <div class="step-card" [class.done]="st.done" (click)="toggleStep(st.id)">
              <div style="display:flex; align-items:center; gap:8px; font-weight:700;">
                <input type="checkbox" [checked]="st.done" (click)="$event.stopPropagation()" (change)="toggleStep(st.id)">
                <span [style.textDecoration]="st.done ? 'line-through' : 'none'">Шаг {{ st.id }}. {{ st.title }}</span>
              </div>
              <div style="font-size:11.5px; color:var(--muted); margin:4px 0 0 24px;">{{ st.desc }}</div>
              <div style="margin:5px 0 0 24px; display:flex; gap:6px; flex-wrap:wrap;">
                @if (st.ccp) { <span class="pill pill-crit">🛡️ {{ st.ccp }}</span> }
                @if (st.tempTime) { <span class="pill pill-ok">⏱️ {{ st.tempTime }}</span> }
              </div>
            </div>
          }
        </div>

        <footer class="drawer-foot">
          <button class="btn btn-green" style="width:100%;" (click)="goToPrint.emit(c.plu)">
            🖨️ Партия выполнена: Перейти к печати этикетки Вариант №2 (TSC TE310) →
          </button>
        </footer>
      </aside>
    }
  \`,
  styles: [\`
    .drawer-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:999; }
    .drawer-box { position:fixed; top:0; right:0; width:560px; max-width:92vw; height:100vh; background:#121820; border-left:1px solid var(--border); z-index:1000; display:flex; flex-direction:column; box-shadow:-8px 0 30px rgba(0,0,0,0.7); }
    .drawer-head, .drawer-foot { padding:14px 18px; background:#0b0f14; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
    .drawer-foot { border-top:1px solid var(--border); border-bottom:none; }
    .drawer-content { padding:16px 18px; overflow-y:auto; flex:1; }
    .prog-bg { width:100%; height:8px; background:#1c2430; border-radius:4px; overflow:hidden; margin:6px 0 14px 0; }
    .prog-fill { height:100%; background:linear-gradient(90deg,#f0883e,#2ea043); transition:width 0.25s; }
    .step-card { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:10px 12px; margin-bottom:8px; cursor:pointer; }
    .step-card.done { border-color:var(--green); background:rgba(46,160,67,0.08); }
  \`]
})
export class HaccpDrawerComponent {
  isOpen = input.required<boolean>();
  line = input<GiantLine>();
  closed = output<void>();
  stepChanged = output<void>();
  goToPrint = output<string>();

  progressPct(): number {
    const l = this.line();
    if (!l || !l.steps.length) return 0;
    return Math.round((l.steps.filter(s => s.done).length / l.steps.length) * 100);
  }
  toggleStep(id: number): void {
    const l = this.line();
    const s = l?.steps.find(x => x.id === id);
    if (s) { s.done = !s.done; this.stepChanged.emit(); }
  }
}
`,

  'src/app/components/order-intake.component.ts': `import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerOrder, GiantLine } from '../models/erp.models';

@Component({
  selector: 'app-order-intake',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="grid-2">
      <!-- ФОРМА ПРИЕМА НОВОГО ЗАКАЗА (TELEGRAM ЖК АРАЙ / ПАБ) -->
      <div class="card">
        <h3><span>➕ Прием нового заказа (Telegram ЖК «Арай» 09:00–19:00 / Касса)</span><span class="pill pill-ok">Kaspi QR Prepay</span></h3>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
          <label>Квартира / Стол:
            <input type="text" [(ngModel)]="newApt" style="width:100%; margin-top:3px;">
          </label>
          <label>Телефон клиента:
            <input type="text" [(ngModel)]="newPhone" style="width:100%; margin-top:3px;">
          </label>
          <label>Слот доставки:
            <select [(ngModel)]="newSlot" style="width:100%; margin-top:3px;">
              <option value="MORNING_0730">🌅 Утро 07:30–09:00 (Завтрак)</option>
              <option value="EVENING_1830">🌙 Вечер 18:30–20:00 (Ужин)</option>
            </select>
          </label>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <select [(ngModel)]="selectedPluToAdd" style="flex:1;">
            @for (p of lines(); track p.plu) {
              <option [ngValue]="p.plu">{{ p.plu }} — {{ p.name }} ({{ p.packG }} г)</option>
            }
          </select>
          <input type="number" [(ngModel)]="qtyToAdd" min="1" max="20" style="width:70px;">
          <button class="btn btn-green" (click)="submitQuickOrder()">+ Создать заказ в листе сборки</button>
        </div>

        <!-- ЛИСТ СБОРКИ И ДОСТАВКИ КУРЬЕРАМИ-ПОДРОСТКАМИ -->
        <h4 style="margin:12px 0 8px 0; color:var(--amber);">📋 Активные маршрутные листы сборки и доставки:</h4>
        @for (o of orders(); track o.orderId) {
          <div style="background:var(--panel-alt); border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>Заказ #{{ o.orderId }} • 🚪 {{ o.apt }} ({{ o.slot === 'MORNING_0730' ? 'Утро 07:30' : 'Вечер 18:30' }})</strong>
              <span class="pill" [ngClass]="o.status === 'PACKED' ? 'pill-ok' : 'pill-warn'">{{ o.status }}</span>
            </div>
            <div style="font-size:11.5px; color:var(--muted); margin:4px 0;">
              @for (it of o.items; track it.plu) {
                <span>[{{ it.plu }} {{ it.name }} × {{ it.qty }} уп.] </span>
              }
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <strong style="color:#7ee787;">Итого (MOOD Club -10%): {{ getOrderTotal(o) | number }} ₸</strong>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-outline" (click)="packOrder.emit(o.orderId)">✓ Собрать и списать с полки</button>
                <button class="btn btn-sm" (click)="printOrderLabel.emit(o)">🖨️ Этикетка доставки</button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- МОНИТОРИНГ ПОТРЕБНОСТИ В ГОТОВОЙ ПРОДУКЦИИ И ЗАЩИТА ОТ ЗАТОВАРИВАНИЯ -->
      <div class="card">
        <h3><span>📊 Мониторинг потребности полки Take-away и рисков затоваривания</span><span class="pill pill-pivot">Real-Time Баланс</span></h3>
        <table class="mini-table">
          <thead>
            <tr><th>PLU / Продукт</th><th>На полке</th><th>В заказах</th><th>Баланс</th><th>Рекомендация ERP</th></tr>
          </thead>
          <tbody>
            @for (p of lines().slice(0, 14); track p.plu) {
              <tr>
                <td><strong>{{ p.plu }} {{ p.name }}</strong></td>
                <td>{{ p.shelfStockUnits }} уп.</td>
                <td>{{ getOrderedUnits(p.plu) }} уп.</td>
                <td [style.color]="p.shelfStockUnits - getOrderedUnits(p.plu) < 0 ? '#f85149' : '#7ee787'">
                  {{ p.shelfStockUnits - getOrderedUnits(p.plu) }} уп.
                </td>
                <td>
                  @if (p.shelfStockUnits - getOrderedUnits(p.plu) < 0) {
                    <span class="pill pill-crit">🔥 ДОВЫПУСК В СМЕНУ</span>
                  } @else if (p.shelfStockUnits > 25 && p.shelfDays <= 10) {
                    <span class="pill pill-pivot">⇄ МАНЕВР (АНТИ-ЗАТОВАРИВАНИЕ)</span>
                  } @else {
                    <span class="pill pill-ok">ОПТИМАЛЬНО</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  \`
})
export class OrderIntakeComponent {
  orders = input.required<CustomerOrder[]>();
  lines = input.required<GiantLine[]>();
  createOrder = output<CustomerOrder>();
  packOrder = output<number>();
  printOrderLabel = output<CustomerOrder>();

  newApt = 'Кв. 215 (Блок Г3)';
  newPhone = '+7 701 888-99-00';
  newSlot: 'MORNING_0730' | 'EVENING_1830' = 'MORNING_0730';
  selectedPluToAdd = 'PLU-02';
  qtyToAdd = 2;

  getOrderTotal(o: CustomerOrder): number {
    return o.items.reduce((s, x) => s + x.qty * x.pricePackKzt, 0);
  }
  getOrderedUnits(plu: string): number {
    let sum = 0;
    for (const o of this.orders()) {
      if (o.status !== 'DELIVERED') {
        for (const it of o.items) { if (it.plu === plu) sum += it.qty; }
      }
    }
    return sum;
  }
  submitQuickOrder(): void {
    const line = this.lines().find(x => x.plu === this.selectedPluToAdd) || this.lines()[0];
    const packPrice = Math.round(((line.priceKg / 1000) * line.packG) * 0.90);
    this.createOrder.emit({
      orderId: Math.floor(Math.random() * 900 + 110),
      source: 'Telegram ЖК Арай',
      apt: this.newApt,
      phone: this.newPhone,
      slot: this.newSlot,
      isPrepaidKaspi: true,
      status: 'NEW',
      items: [{ plu: line.plu, name: line.name, qty: this.qtyToAdd, pricePackKzt: packPrice }]
    });
  }
}
`,

  // =========================================================================
  // 8. ЕДИНЫЙ СЕРВИС ДАННЫХ ANGULAR SIGNALS (src/app/services/erp-store.service.ts)
  // =========================================================================
  'src/app/services/erp-store.service.ts': `import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { ErpTabId, GiantLine, RawBatchQc, StockMovement, CustomerOrder, SpiceStock } from '../models/erp.models';

const LS_KEY = 'mood_pro_erp_v32_state';

@Injectable({ providedIn: 'root' })
export class ErpStoreService {
  private http = inject(HttpClient);

  activeTab = signal<ErpTabId>('giant');
  syncBanner = signal<string>('🟢 Локальный стенд VS Code (LocalStorage + PS.kz Ready)');
  drawerOpen = signal<boolean>(false);
  selectedPlu = signal<string>('PLU-02');

  giantDept = signal<string>('ALL');
  giantDay = signal<number>(12);
  giantPivot = signal<boolean>(false);

  kochBatchKg = signal<number>(20);
  brineBe = signal<number>(10);
  dairyBatchLiters = signal<number>(100);
  breadBatchLoaves = signal<number>(30);

  printerIp = signal<string>('192.168.1.17');
  tsplMode = signal<'PRODUCT' | 'MILK_OK' | 'MILK_BAD'>('PRODUCT');
  tsplBatch = signal<string>('Т-01-330-453');
  lastPrintStatus = signal<string>('Готов к прямой отправке в сокет 192.168.1.17:9100');

  readonly dowList = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  private defaultSteps(equip: string): any[] {
    return [
      { id: 1, title: 'Входной биоконтроль и подготовка сырья', desc: 'Проверка паспорта партии («Эксперт Профи» / pH-метр Hanna Foodcare) и отвешивание на весах Масса-К.', ccp: 'ККТ-1 (Входной биоконтроль)', tempTime: '+2...+4 °C', done: true },
      { id: 2, title: 'Основной технологический цикл (' + equip + ')', desc: 'Выполнение температурно-временного регламента согласно технологической карте цеха.', ccp: 'ККТ-2 (Термообработка / pH)', tempTime: 'Контроль ядра', done: false },
      { id: 3, title: 'Охлаждение, фасовка и маркировка TSC TE310', desc: 'Вакуумирование или запайка, печать двуязычной этикетки Варианта №2 (ТермоТОП 58×60 мм).', ccp: 'ККТ-3 (Маркировка партии)', tempTime: '(4±2) °C', done: false }
    ];
  }

  lines = signal<GiantLine[]>([
    { plu:'PLU-01', eanPrefix:'220001', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'ФЕРМЕРЛІК ҚАЙМАҚ / СМЕТАНА 20%', subTitle:'[ ТЕРМОСТАТТЫ / ТЕРМОСТАТНАЯ ]', name:'Сметана фермерская 20%', monthlyKg:140, monthlyUnits:400, packG:350, priceKg:3400, costKg:1350, yieldPct:14, prot:2.8, fat:20.0, carb:3.2, shelfDays:14, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[1,4,8,11,15,18,22,25,29], cycleDays:2, shortRisk:true, pivotRatio:0.35, pivotAction:'Перевод 35% сливок (49 кг) на базу Крафтового Пломбира (PLU-07, 60 сут.)', kzPair:'Ұсыныс: BEERMOOD үй борщы мен сүзбе құймақтарына', ruPair:'Пара: к свежим сырникам и горячему борщу Суп-Кит BEERMOOD', comp:'нормализ. кілегей/сливки, тірі сүт қышқылды ұйытқысы.', shelfStockUnits:28, equipment:'Сепаратор + Casaro 100 л + Термостат', rawNorms:[{name:'Сливки 20%',qty:'14 кг'},{name:'Закваска Danisco',qty:'3.5 г'}], steps:this.defaultSteps('Casaro 85°C') },
    { plu:'PLU-02', eanPrefix:'220002', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'ФЕРМЕРЛІК СҮЗБЕ / ТВОРОГ 9%', subTitle:'[ ҚАТПАРЛЫ / ПЛАСТОВОЙ ]', name:'Творог пластовой 9%', monthlyKg:140, monthlyUnits:400, packG:385, priceKg:3200, costKg:1280, yieldPct:15.5, prot:16.6, fat:9.1, carb:2.8, shelfDays:7, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[1,4,8,11,15,18,22,25,29], cycleDays:2, shortRisk:true, pivotRatio:0.40, pivotAction:'Снятие 40% калье (56 кг) -> формовка шариков Белпер Кнолле (PLU-06, 60 сут.)', kzPair:'Ұсыныс: MEAT & BREAD тартинімен бал қосылған таңғы асқа', ruPair:'Пара: к завтраку с медом на подовом тартине MEAT & BREAD', comp:'нормализ. сүт/молоко, тірі сүт қышқылды ұйытқысы.', shelfStockUnits:32, equipment:'Сыроварня Casaro 100 л + Лавсановые мешки', rawNorms:[{name:'Молоко 1 сорт',qty:'100 л'},{name:'Закваска мезофильная',qty:'4.0 г'},{name:'CaCl2 10%',qty:'200 мл'}], steps:this.defaultSteps('Casaro 72°C -> 28°C') },
    { plu:'PLU-03', eanPrefix:'220003', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'АДЫГЕЙ ІРІМШІГІ / СЫР АДЫГЕЙСКИЙ', subTitle:'[ ЖҰМСАҚ / ТЕРМОКИСЛОТНЫЙ ]', name:'Сыр Адыгейский термокислотный', monthlyKg:45, monthlyUnits:150, packG:300, priceKg:4800, costKg:1850, yieldPct:13, prot:19.8, fat:19.5, carb:1.5, shelfDays:30, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[2,5,9,12,16,19,23,26,30], cycleDays:1, shortRisk:false, pivotRatio:0.25, pivotAction:'Копчение головок ольхой в Ижица Varmen Mini и гриль-меню паба', kzPair:'Ұсыныс: сары майға қуырып, MEAT & BREAD тартинімен', ruPair:'Пара: обжарить на сливочном масле к свежему тартину', comp:'пастерленген сүт/молоко, ашыған сарысу, теңіз тұзы.', shelfStockUnits:14, equipment:'Сыроварня Casaro (93–95 °C) + Формы', rawNorms:[{name:'Молоко цельное',qty:'100 л'},{name:'Кислая сыворотка (85 °Т)',qty:'9 л'}], steps:this.defaultSteps('Термокоагуляция 94°C') },
    { plu:'PLU-04', eanPrefix:'220004', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'СУЛУГУНИ ІРІМШІГІ / СЫР СУЛУГУНИ', subTitle:'[ PASTA FILATA / ВЫТЯЖНОЙ ]', name:'Сыр Сулугуни Pasta Filata и Страчателла', monthlyKg:80, monthlyUnits:200, packG:350, priceKg:5400, costKg:2100, yieldPct:10.5, prot:20.5, fat:22.0, carb:0.8, shelfDays:45, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[2,4,9,11,16,18,23,25,30], cycleDays:2, shortRisk:false, pivotRatio:0.30, pivotAction:'Вакуумирование Сулугуни (45 сут.) и жарка в пабе с соусом Пири-Пири', kzPair:'Ұсыныс: MEAT & BREAD тартині мен мортаделла тосттарына', ruPair:'Пара: к горячим тостам на тартине и мортаделле MEAT & BREAD', comp:'табиғи сүт/молоко, термофильді ұйытқы, фермент, тұз.', shelfStockUnits:18, equipment:'Casaro 100 л + Плавитель Pasta Filata + Hanna pH', rawNorms:[{name:'Молоко пастериз.',qty:'100 л'},{name:'Термофильная культура',qty:'5.0 г'},{name:'Химозин',qty:'2.5 г'}], steps:this.defaultSteps('Чеддеризация pH 5.20 -> Плавка 78°C') },
    { plu:'PLU-05', eanPrefix:'220005', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'ТАБИҒИ ЙОГУРТ / ЙОГУРТ ГУСТОЙ', subTitle:'[ ТЕРМОСТАТТЫ / ЖИВАЯ КУЛЬТУРА ]', name:'Йогурт натуральный термостатный', monthlyKg:60, monthlyUnits:200, packG:300, priceKg:2800, costKg:950, yieldPct:96, prot:5.2, fat:4.5, carb:4.8, shelfDays:10, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[1,4,8,11,15,18,22,25,29], cycleDays:2, shortRisk:true, pivotRatio:0.40, pivotAction:'Взбивание в дневные детские милкшейки и отцеживание на Шанклиш', kzPair:'Ұсыныс: таңғы гранолаға немесе SPICE LAB зира тұздығына', ruPair:'Пара: легкий завтрак и основа для соуса с восточной зирой', comp:'пастерленген сүт/молоко, болгар таяқшасы.', shelfStockUnits:22, equipment:'Casaro (88 °C) + Термостатная камера (41 °C)', rawNorms:[{name:'Молоко отборное',qty:'100 л'},{name:'Культура Болгарская палочка',qty:'4.5 г'}], steps:this.defaultSteps('Термостат 41°C, 5 ч') },
    { plu:'PLU-06', eanPrefix:'220006', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'БЕЛПЕР КНОЛЛЕ / СЫР В ПЕРЦЕ', subTitle:'[ ШВЕЙЦАР ӘДІСІ / ВЫДЕРЖАННЫЙ ]', name:'Сыр Белпер Кнолле в черном перце', monthlyKg:30, monthlyUnits:100, packG:160, priceKg:9500, costKg:2600, yieldPct:11, prot:25.0, fat:26.0, carb:0.5, shelfDays:60, temp:'(10±2)°C', supplyDays:[1,8,15,22], prodDays:[3,10,17,24], cycleDays:21, shortRisk:false, isBuffer:true, bonusKg:56, pivotAction:'БУФЕР-АККУМУЛЯТОР: принимает +56 кг творожного калье с PLU-02 на 60 суток', kzPair:'Ұсыныс: ыстық пастаға, стейкке және MEAT & BREAD билтонгына', ruPair:'Пара: натереть стружкой на пасту, стейк или к билтонгу', comp:'сүт/молоко, ұйытқы, балғын сарымсақ, қара бұрыш, гималай тұзы.', shelfStockUnits:15, equipment:'Климат-камера (+10...+12 °C, 75% влажн.)', rawNorms:[{name:'Плотный сгусток калье',qty:'13.5 кг'},{name:'Чеснок свежий паста',qty:'250 г'},{name:'Черный перец крупка 1.5 мм',qty:'450 г'}], steps:this.defaultSteps('Созревание 21–60 сут.') },
    { plu:'PLU-07', eanPrefix:'220007', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'НАҒЫЗ ПЛОМБИР / МОРОЖЕНОЕ КРАФТ', subTitle:'[ КІЛЕГЕЙЛІ 15% / НА СЛИВКАХ ]', name:'Крафтовый Пломбир и Милкшейки', monthlyKg:40, monthlyUnits:200, packG:200, priceKg:5500, costKg:1450, yieldPct:95, prot:4.2, fat:15.5, carb:21.0, shelfDays:60, temp:'-18°C', supplyDays:[1,4,8,11,15,18,22,25], prodDays:[3,6,10,13,17,20,24,27], cycleDays:2, shortRisk:false, isBuffer:true, bonusKg:49, pivotAction:'БУФЕР-АККУМУЛЯТОР: поглощает +49 кг сливок с PLU-01 в морозильный резерв (-18 °C)', kzPair:'Ұсыныс: отбасылық десерт және жылы чиабаттамен', ruPair:'Пара: семейный десерт из фермерских сливок в дневном кафе', comp:'кілегей 33%, сүт, сарыуыз, қант, ваниль.', shelfStockUnits:25, equipment:'Батч-фризер + Морозильный шкаф -18 °C', rawNorms:[{name:'Сливки 33%',qty:'45 кг'},{name:'Молоко 4%',qty:'37 кг'},{name:'Сахар + желток + ваниль',qty:'18 кг'}], steps:this.defaultSteps('Фризерование 20 мин -> -18°C') },

    { plu:'PLU-10', eanPrefix:'220010', brand:'MEAT & BREAD MOOD', dept:'Пекарня MEAT&BREAD', kzTitle:'БИДАЙ ТАРТИН НАНЫ / ТАРТИН ПОДОВЫЙ', subTitle:'[ ТІРІ АШЫТҚЫ / ЖИВАЯ ЗАКВАСКА ]', name:'Тартин подовый на живой закваске', monthlyKg:520, monthlyUnits:800, packG:650, priceKg:925, costKg:255, yieldPct:88, prot:8.5, fat:1.2, carb:49.0, shelfDays:3, temp:'(18±3)°C', supplyDays:[1,15], prodDays:Array.from({length:30},(_,i)=>i+1), cycleDays:2, shortRisk:true, pivotRatio:0.15, pivotAction:'Выпечка строго по предоплате Telegram до 19:00; остаток старше 36 ч -> брускетты бара', kzPair:'Ұсыныс: CHEESY MOOD Страчателласы мен мортаделламен', ruPair:'Пара: со сливочным маслом, Страчателлой и мортаделлой', comp:'бидай ұны в/с, табиғи ашытқы Levain, ірімшік сарысуы, теңіз тұзы.', shelfStockUnits:18, equipment:'Спиральный тестомес + Холодная расстойка (+4 °C) + Печь Unox', rawNorms:[{name:'Мука пшеничная в/с + ц/з (100%)',qty:'14.8 кг'},{name:'Сыворотка CHEESY MOOD + Вода (75%)',qty:'11.1 л'},{name:'Закваска Levain (20%) + Соль (2.2%)',qty:'3.3 кг'}], steps:this.defaultSteps('Расстойка 16 ч (+4°C) -> Unox 250°C с паром') },
    { plu:'PLU-11', eanPrefix:'220011', brand:'MEAT & BREAD MOOD', dept:'Пекарня MEAT&BREAD', kzTitle:'ҚАРА БИДАЙ НАНЫ / РЖАНО-ПШЕНИЧНЫЙ', subTitle:'[ УЫТТЫ ЗАВАРКА / СОЛОДОВЫЙ ]', name:'Хлеб ржано-пшеничный и Бородинский', monthlyKg:325, monthlyUnits:500, packG:650, priceKg:925, costKg:270, yieldPct:89, prot:7.8, fat:1.4, carb:46.5, shelfDays:4, temp:'(18±3)°C', supplyDays:[1,15], prodDays:Array.from({length:30},(_,i)=>i+1), cycleDays:2, shortRisk:true, pivotRatio:0.20, pivotAction:'100% нереализованных буханок на 3-и сутки обжариваются в чесночные гренки к пиву', kzPair:'Ұсыныс: ысталған бекон, қаймақ және үй борщымен', ruPair:'Пара: к копченому бекону, сметане 20% и горячему Борщу', comp:'қара бидай ұны, ферменттелген уыт/солод, ашытқы, кориандр.', shelfStockUnits:14, equipment:'Заварной бак (65 °C) + Печь Unox', rawNorms:[{name:'Мука ржаная обдирная (65%) + пшеничная (35%)',qty:'14.0 кг'},{name:'Солод красный ферментированный (7%)',qty:'1.0 кг'},{name:'Кориандр обжаренный (SPICE LAB)',qty:'120 г'}], steps:this.defaultSteps('Заварка солода 65°C -> Unox 240°C/200°C') },
    { plu:'PLU-12', eanPrefix:'220012', brand:'MEAT & BREAD MOOD', dept:'Пекарня MEAT&BREAD', kzTitle:'ИТАЛЬЯН ЧИАБАТТАСЫ / ЧИАБАТТА', subTitle:'[ САРЫСУДАҒЫ ҚАМЫР / НА СЫВОРОТКЕ ]', name:'Чиабатта и Чесночные гренки', monthlyKg:120, monthlyUnits:300, packG:400, priceKg:1125, costKg:320, yieldPct:87, prot:8.9, fat:3.5, carb:48.0, shelfDays:2, temp:'(18±3)°C', supplyDays:[1,15], prodDays:[2,4,5,6,9,11,12,13,16,18,19,20,23,25,26,27,30], cycleDays:1, shortRisk:true, isBuffer:true, bonusKg:65, pivotAction:'Горячие гриль-сэндвичи кухни и вакуумирование чесночных гренок (30 сут.)', kzPair:'Ұсыныс: CHEESY MOOD Сулугуни ірімшігі мен ветчина сэндвичіне', ruPair:'Пара: для горячих панини с ветчиной и сыром Сулугуни', comp:'бидай ұны W320, CHEESY MOOD сүт сарысуы, зәйтүн майы.', shelfStockUnits:12, equipment:'Тестомес 2 скор. + Печь Unox (235 °C)', rawNorms:[{name:'Сильная мука W320 (100%)',qty:'10.0 кг'},{name:'Подсырная сыворотка Сулугуни (80%)',qty:'8.0 л'},{name:'Оливковое масло Extra Virgin (4.5%)',qty:'450 мл'}], steps:this.defaultSteps('Двойная гидратация 80% -> Unox 235°C') },

    { plu:'PLU-20', eanPrefix:'220020', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'ВЕНА ШҰЖЫҚШАСЫ / СОСИСКИ ВЕНСКИЕ', subTitle:'[ ТАБИҒИ ҚАБЫҚША / БУКОВЫЙ ДЫМ ]', name:'Сосиски Венские в/к (Кох 3-135)', monthlyKg:80, monthlyUnits:210, packG:380, priceKg:5800, costKg:2720, yieldPct:90, prot:13.5, fat:22.0, carb:1.2, shelfDays:20, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[2,9,16,23,30], cycleDays:2, shortRisk:false, pivotRatio:0.25, pivotAction:'Отдача в горячие пивные сковородки паба и мясной сет суп-кита Солянка', kzPair:'Ұсыныс: балды қыша мен жылы MEAT & BREAD чиабаттасымен', ruPair:'Пара: с медово-зернистой горчицей и теплой чиабаттой', comp:'сиыр еті R1, шошқа еті S4b, нитритті тұз, паприка, мускат.', shelfStockUnits:16, equipment:'Куттер + Шприц 5 кг + 2× Ижица Varmen Mini', rawNorms:[{name:'Говядина R1 (40%) + Свинина S4b (60%)',qty:'20.0 кг'},{name:'Лед чешуйчатый (20%)',qty:'4.0 кг'},{name:'Нитритная соль + паприка + мускат',qty:'450 г'}], steps:this.defaultSteps('Копчение 65°C -> Варка 76°C до 72°C в ядре') },
    { plu:'PLU-21', eanPrefix:'220021', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'АҢШЫ ШҰЖЫҚШАСЫ / ОХОТНИЧЬИ И ПИВЧИКИ', subTitle:'[ ОЛЬХА ТҮТІНІ / КОПЧЕНО-ВАРЕНЫЕ ]', name:'Колбаски Охотничьи и Пивчики (Кох 3-066)', monthlyKg:110, monthlyUnits:850, packG:120, priceKg:8500, costKg:3850, yieldPct:74, prot:18.0, fat:28.0, carb:0.8, shelfDays:30, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[3,10,17,24], cycleDays:3, shortRisk:false, isBuffer:true, bonusKg:20, pivotAction:'БУФЕР-АККУМУЛЯТОР: принимает +20 кг сырья с Мортаделлы; усушка и вендинг 24/7', kzPair:'Ұсыныс: қуырылған CHEESY MOOD Сулугуниі және Пири-Пиримен', ruPair:'Пара: к жареному Сулугуни CHEESY MOOD и соусу Пири-Пири', comp:'сиыр еті R1, шошқа төсі S4b, сарымсақ, қара бұрыш, нитритті тұз.', shelfStockUnits:45, equipment:'Шприц (цевка 12 мм) + Ижица Varmen Mini + Климат-камера', rawNorms:[{name:'Говядина R1 (40%) + Грудинка S4b (60%)',qty:'20.0 кг'},{name:'Нитритная соль + Перец + Чеснок 10-081',qty:'520 г'}], steps:this.defaultSteps('Копчение 70°C -> Варка 75°C -> Сушка 74%') },
    { plu:'PLU-22', eanPrefix:'220022', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'СЕРВЕЛАТ ГОЛШТИНСКИЙ / СЕРВЕЛАТ В/К', subTitle:'[ НЕМІС РЕЦЕПТІ КОХ 2-008 ]', name:'Сервелат варено-копченый (Кох 2-008)', monthlyKg:80, monthlyUnits:240, packG:330, priceKg:7400, costKg:3210, yieldPct:84, prot:16.5, fat:29.0, carb:0.5, shelfDays:30, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[2,9,16,23,30], cycleDays:4, shortRisk:false, isBuffer:true, bonusKg:20, pivotAction:'БУФЕР-АККУМУЛЯТОР: принимает +20 кг свинины со снятой Мортаделлы (30 сут.)', kzPair:'Ұсыныс: CHEESY MOOD Адыгей және Сулугуни ірімшік табағына', ruPair:'Пара: к сырной тарелке Сулугуни и Адыгейского сыра', comp:'сиыр еті R1, шошқа сан еті S1, қатты шпик S8, кардамон.', shelfStockUnits:20, equipment:'Волчок (решетка 5 мм) + Ижица Varmen Mini', rawNorms:[{name:'Говядина R1 (35%) + Свинина S1 (35%) + Шпик S8 (30%)',qty:'20.0 кг'},{name:'Нитритная соль + Белый перец + Кардамон',qty:'540 г'}], steps:this.defaultSteps('Осадка 12 ч -> Копчение 68°C -> Варка 75°C') },
    { plu:'PLU-23', eanPrefix:'220023', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'МОРТАДЕЛЛА ФИСТАШКАМЕН / В/К', subTitle:'[ ИТАЛЬЯН ТӘСІЛІ / ЭМУЛЬСИЯ ]', name:'Мортаделла с фисташкой (Кох 3-030)', monthlyKg:80, monthlyUnits:360, packG:220, priceKg:7200, costKg:3150, yieldPct:92, prot:14.0, fat:28.0, carb:1.0, shelfDays:15, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[2,9,16,23,30], cycleDays:2, shortRisk:true, pivotRatio:0.50, pivotAction:'Снижение выпуска на 50% (-40 кг) с переводом сырья на Сервелат и Пивчики (30 сут.)', kzPair:'Ұсыныс: CHEESY MOOD Страчателласымен сэндвичке тамаша', ruPair:'Пара: идеально к сэндвичам со Страчателлой на тартине', comp:'шошқа еті S1, шпик S8 кубик, бүтін фисташка, ақ бұрыш, мацис.', shelfStockUnits:29, equipment:'Куттер (t <= +11 °C) + Ижица Varmen Mini + Слайсер', rawNorms:[{name:'Свинина S1 (75%) + Шпик S8 кубик (20%)',qty:'19.0 кг'},{name:'Фисташка цельная бланшированная (5%)',qty:'1.0 кг'},{name:'Лед чешуйчатый (20%)',qty:'4.0 кг'}], steps:this.defaultSteps('Куттер <=11°C -> Варка 80°C до 72°C в ядре') },
    { plu:'PLU-24', eanPrefix:'220024', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'АҒЫЛШЫН БЕКОНЫ / ГРУДИНКА Г/К', subTitle:'[ 12°Be ТҰЗДЫҚ / КОПЧЕНИЕ БУК ]', name:'Бекон свиной г/к (Кох 1-031 / 1-032)', monthlyKg:80, monthlyUnits:290, packG:280, priceKg:6800, costKg:3010, yieldPct:88, prot:13.0, fat:38.0, carb:0.5, shelfDays:25, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[4,11,18,25], cycleDays:4, shortRisk:false, pivotRatio:0.20, pivotAction:'Слайсерная нарезка в бургеры паба и укладка в суп-киты Солянка Сборная', kzPair:'Ұсыныс: таңғы жұмыртқа, қара нан және CHEESY MOOD сүзбесімен', ruPair:'Пара: к утренней глазунье, ржаному хлебу и творогу', comp:'шошқа төсі S4, 12°Be тұздық, сарымсақ, кориандр, нитритті тұз.', shelfStockUnits:19, equipment:'Вакуум-массажер + Ижица Varmen Mini', rawNorms:[{name:'Свиная грудинка S4 без подгрудка',qty:'20.0 кг'},{name:'Инъекционный рассол 12°Be (20%)',qty:'4.0 л (520 г нитритной соли)'}], steps:this.defaultSteps('Шприцевание 20% (12°Be) -> Копчение 68°C') },
    { plu:'PLU-25', eanPrefix:'220025', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'ЫСТАЛҒАН ҚАБЫРҒА / РЕБРА СВИНЫЕ К/В', subTitle:'[ SMOKED BBQ RUB / ГОРЯЧЕЕ КОПЧЕНИЕ ]', name:'Ребра свиные к/в к пиву (Кох 1-002)', monthlyKg:130, monthlyUnits:290, packG:300, priceKg:6500, costKg:3350, yieldPct:82, prot:16.0, fat:24.0, carb:2.0, shelfDays:20, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[4,5,11,12,18,19,25,26], cycleDays:4, shortRisk:false, pivotRatio:0.25, pivotAction:'Глазирование соусом Пири-Пири / BBQ и отдача на гриле в пятницу и субботу', kzPair:'Ұсыныс: грильде жылытып, Пири-Пири тұздығымен ұсыныңыз', ruPair:'Пара: разогреть на гриле с фирменным соусом Пири-Пири (PLU-32)', comp:'шошқа қабырғасы, нитритті тұз, Smoked BBQ Rub (паприка, тимьян).', shelfStockUnits:15, equipment:'Вакуум-массажер + Ижица Varmen Mini', rawNorms:[{name:'Свиные ребра лентами (Лойн)',qty:'20.0 кг'},{name:'Рассол 10°Be + Натирка Smoked BBQ Rub',qty:'3.0 л + 360 г'}], steps:this.defaultSteps('Посол 10°Be -> Копчение 70°C -> Варка 80°C') },
    { plu:'PLU-26', eanPrefix:'220026', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'МӘРМӘР ВЕТЧИНА / ВЕТЧИНА И КАРБОНАД', subTitle:'[ ТҰТАС БҰЛШЫҚ ЕТ / ЦЕЛЬНОМЫШЕЧНАЯ ]', name:'Ветчина Мраморная и Карбонад (Кох 3-050)', monthlyKg:120, monthlyUnits:340, packG:350, priceKg:6900, costKg:3020, yieldPct:86, prot:19.0, fat:12.0, carb:0.8, shelfDays:20, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[5,6,12,13,19,20,26,27], cycleDays:5, shortRisk:false, pivotRatio:0.25, pivotAction:'Перевод 30 кг постного сырья на сыровяленый Билтонг (60 сут.) + промо MOOD Club -10%', kzPair:'Ұсыныс: балқитын CHEESY MOOD Сулугуни ірімшігімен ыстық тостқа', ruPair:'Пара: для горячих сэндвичей с плавящимся Сулугуни', comp:'шошқа сан еті S1/S2, нитритті тұз, декстроза, хош иісті бұрыш.', shelfStockUnits:21, equipment:'Вакуум-массажер (6 ч) + Ижица Varmen Mini', rawNorms:[{name:'Свиной окорок S1/S2 кусковой',qty:'20.0 кг'},{name:'Рассол 12°Be в массажер (18%)',qty:'3.6 л'}], steps:this.defaultSteps('Вакуум-массажер 6 ч -> Варка 78°C до 71°C') },
    { plu:'PLU-27', eanPrefix:'220027', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'СИЫР БИЛТОНГЫ / БИЛТОНГ ГОВЯДИНА С/В', subTitle:'[ ОҢТҮСТІК АФРИКА ӘДІСІ / ВЯЛЕНЫЙ ]', name:'Билтонг из говядины с/в (70% квоты)', monthlyKg:84, monthlyUnits:560, packG:50, priceKg:16000, costKg:9600, yieldPct:50, prot:42.0, fat:6.5, carb:1.5, shelfDays:60, temp:'(10±2)°C', supplyDays:[1,8,15,22,29], prodDays:[1,8,15,22,29], cycleDays:8, shortRisk:false, isBuffer:true, bonusKg:20, pivotAction:'БУФЕР-СТАБИЛИЗАТОР (60 сут., наценка >300%): поглощает излишки постной говядины R1', kzPair:'Ұсыныс: CHEESY MOOD Белпер Кнолле ірімшігімен тамаша үйлесім', ruPair:'Пара: к выдержанному сыру Белпер Кнолле CHEESY MOOD', comp:'сиыр еті R1, алма сірке суы, қуырылған кориандр, қара бұрыш, тұз.', shelfStockUnits:64, equipment:'Климат-камера вяления (+10...+12 °C, 75% влажн.)', rawNorms:[{name:'Говядина тазобедренная R1',qty:'20.0 кг'},{name:'Яблочный уксус 6% + Biltong Spice (кориандр 1.5 мм)',qty:'700 мл + 840 г'}], steps:this.defaultSteps('Уксусный маринад 6 ч -> Вяление +12°C (7 сут.)') },
    { plu:'PLU-28', eanPrefix:'220028', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'ЖАЯ БИЛТОНГЫ / БИЛТОНГ КОНИНА С/В', subTitle:'[ ПРЕМИУМ ДЕЛИКАТЕС / НАЦИОНАЛЬНЫЙ КРАФТ ]', name:'Билтонг из конины Жая с/в (30% квоты)', monthlyKg:36, monthlyUnits:240, packG:50, priceKg:18000, costKg:10380, yieldPct:52, prot:40.0, fat:9.0, carb:1.2, shelfDays:60, temp:'(10±2)°C', supplyDays:[1,8,15,22,29], prodDays:[1,8,15,22,29], cycleDays:8, shortRisk:false, isBuffer:true, bonusKg:10, pivotAction:'БУФЕР-СТАБИЛИЗАТОР (60 сут.): премиальный резерв конины для бара и вендинга', kzPair:'Ұсыныс: ысталған Сулугуни және Белпер Кнолле ірімшігімен', ruPair:'Пара: флагманский деликатес к выдержанным сырам CHEESY MOOD', comp:'жылқы еті Жая, алма сірке суы, кориандр, зира, қара бұрыш, тұз.', shelfStockUnits:38, equipment:'Климат-камера вяления (+10...+12 °C)', rawNorms:[{name:'Конина деликатесная Жая',qty:'20.0 кг'},{name:'Уксус 6% + Кориандр + Зира',qty:'600 мл + 860 г'}], steps:this.defaultSteps('Маринад с зирой -> Вяление +12°C (7 сут.)') },

    { plu:'PLU-32', eanPrefix:'220032', brand:'SPICY MOOD LAB', dept:'BEERMOOD & SPICE LAB', kzTitle:'ПИРИ-ПИРИ ТҰЗДЫҒЫ / СОУС ПИРИ-ПИРИ', subTitle:'[ АШЫ АШЫТУ / КРАФТОВАЯ ФЕРМЕНТАЦИЯ ]', name:'Соусы: Пири-Пири, Шрирача, Табаско', monthlyKg:60, monthlyUnits:480, packG:125, priceKg:7200, costKg:1800, yieldPct:92, prot:1.5, fat:8.0, carb:9.5, shelfDays:60, temp:'(4±2)°C', supplyDays:[2,9,16,23], prodDays:[2,4,9,11,16,18,23,25], cycleDays:14, shortRisk:false, isBuffer:true, bonusKg:0, pivotAction:'Фасовка в дип-соусники по 50 мл (100 шт.) к горячим сковородкам и ребрам', kzPair:'Ұсыныс: MEAT & BREAD ысталған қабырғасы мен шұжықшаларына', ruPair:'Пара: к копченым ребрам, колбаскам и жареному Сулугуни', comp:'қызыл чили, сарымсақ, лимон шырыны, зәйтүн майы, теңіз тұзы.', shelfStockUnits:55, equipment:'Гидрозатворы + Печь Unox + Дозатор PPF-500', rawNorms:[{name:'Перец чили / халапеньо + сладкий перец',qty:'12.0 кг'},{name:'Чеснок + Лимонный сок + Оливковое масло',qty:'3.0 кг'}], steps:this.defaultSteps('Ферментация pH <=3.6 -> Розлив PPF-500') },
    { plu:'PLU-35', eanPrefix:'220035', brand:'MEAT & BREAD MOOD', dept:'BEERMOOD & SPICE LAB', kzTitle:'ЕТТІ РАЦИОН / ПРИКОРМ ДЛЯ ПИТОМЦЕВ', subTitle:'[ ZERO-WASTE / БЕЗ СОЛИ И СПЕЦИЙ ]', name:'Прикорм мясной Zero-Waste для питомцев', monthlyKg:28, monthlyUnits:55, packG:500, priceKg:1600, costKg:180, yieldPct:100, prot:18.0, fat:12.0, carb:0.0, shelfDays:60, temp:'-18°C', supplyDays:[1,8,15,22,29], prodDays:[2,9,16,23,30], cycleDays:2, shortRisk:false, isBuffer:true, bonusKg:12, pivotAction:'100% монетизация зачисток жиловки R7/S14 без соли и специй (Food Cost 5.5%)', kzPair:'Арай ТК үй жануарларына арналған табиғи ет кесінділері', ruPair:'Натуральный мясной рацион для питомцев резидентов ЖК «Арай»', comp:'сиыр және шошқа сіңірлері мен ет кесінділері R7/S14 (тұзсыз).', shelfStockUnits:14, equipment:'Волчок (крупная решетка) + Вакуум + Морозильник -18 °C', rawNorms:[{name:'Коллагеновые зачистки жиловки R7/S14',qty:'10.0 кг'}], steps:this.defaultSteps('Крупная рубка без соли -> Шок-мороз -18°C') },
    { plu:'PLU-40/41', eanPrefix:'220040', brand:'MEAT & BREAD MOOD', dept:'BEERMOOD & SPICE LAB', kzTitle:'ҮЙ БОРЩЫ МЕН СОЛЯНКА / СУП-КИТ НАБОР', subTitle:'[ 15 МИНУТТА ДАЙЫН / ГАСТРО-НАБОР ]', name:'Суп-киты: Борщ Домашний и Солянка', monthlyKg:140, monthlyUnits:140, packG:950, priceKg:3400, costKg:980, yieldPct:95, prot:9.5, fat:8.5, carb:7.2, shelfDays:14, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[1,4,8,11,15,18,22,25,29], cycleDays:2, shortRisk:true, pivotRatio:0.30, pivotAction:'Шоковая заморозка бульона в дой-паках (-18 °C до 30 сут.) и подача супом дня в обед', kzPair:'Ұсыныс: CHEESY MOOD 20% қаймағы және қара бидай нанымен', ruPair:'Пара: подавать со сметаной 20% CHEESY MOOD и бородинским хлебом', comp:'қою ет сорпасы, ысталған ет жиынтығы, көкөніс зажаркасы.', shelfStockUnits:16, equipment:'Котел бульонный + Запайщик дой-паков + Вакуум', rawNorms:[{name:'Концентрированный костный бульон (дой-пак)',qty:'500 мл'},{name:'Нарезка копченостей (Солянка) / Говядина + Зажарка',qty:'450 г'}], steps:this.defaultSteps('Томление бульона 6 ч -> Сборка 3 пакетов') },
    { plu:'SPICE-01', eanPrefix:'220050', brand:'SPICY MOOD LAB', dept:'BEERMOOD & SPICE LAB', kzTitle:'АВТОРЛЫҚ ДӘМДЕУІШ / СМЕСЬ СПЕЦИЙ КРАФТ', subTitle:'[ СВЕЖИЙ ПОМОЛ ПО А. КРАМЕРУ ]', name:'Смеси специй Крамера (BBQ Rub, Garam Masala)', monthlyKg:16, monthlyUnits:200, packG:80, priceKg:15000, costKg:3600, yieldPct:99, prot:10.0, fat:8.0, carb:42.0, shelfDays:365, temp:'(18±4)°C', supplyDays:[1], prodDays:[3,10,17,24], cycleDays:1, shortRisk:false, isBuffer:true, bonusKg:0, pivotAction:'Нулевой риск списаний (12 мес.): возврат в технологический посол мясного цеха', kzPair:'Ұсыныс: үй асханасында ет пен құс етін маринадтауға арналған', ruPair:'Пара: готовый маринад для запекания мяса, ребер и сыра дома', comp:'ысталған паприка, қуырылған кориандр, қара бұрыш, сарымсақ, тимьян.', shelfStockUnits:42, equipment:'Сухая сковорода прогрева + Дробилка + ПЭТ-банки 80 г', rawNorms:[{name:'Кориандр, зира, паприка копченая, черный перец',qty:'1.2 кг (15 баночек)'}], steps:this.defaultSteps('Раздельный прогрев зерен -> Крупка 1.5 мм') },
    { plu:'BEER-01', eanPrefix:'220090', brand:'MOOD GROUP CRAFT', dept:'BEERMOOD & SPICE LAB', kzTitle:'КОЛДРУМ СУСЫНДАРЫ / ЛИНИЯ РОЗЛИВА', subTitle:'[ ХОЛОДНАЯ КАМЕРА +2...+4 °C ]', name:'Крафтовая линия розлива в кегах (Колдрум)', monthlyKg:2385, monthlyUnits:4770, packG:500, priceKg:2400, costKg:820, yieldPct:98, prot:0.5, fat:0.0, carb:4.5, shelfDays:30, temp:'(3±1)°C', supplyDays:[4,11,18,25], prodDays:[4,5,6,11,12,13,18,19,20,25,26,27], cycleDays:5, shortRisk:false, pivotRatio:0.10, pivotAction:'Акция «Крафтовая среда» и варка медово-зернистой горчицы (Кох 8-037)', kzPair:'Ұсыныс: MEAT & BREAD билтонгы мен пивчик шұжықшаларына', ruPair:'Пара: к южноафриканскому билтонгу, пивчикам и жареному сулугуни', comp:'су, арпа уыты/солод, құлмақ, ашытқы.', shelfStockUnits:320, equipment:'Колдрум (+2...+4 °C) + Прямая линия кранов бара', rawNorms:[{name:'Кеги крафтового лагера/эля/стаута по 30 л',qty:'4 кеги (120 л)'}], steps:this.defaultSteps('Охлаждение в колдруме +3°C -> Пролив') }
  ]);

  rawBatches = signal<RawBatchQc[]>([
    { batchId:'Т-01-330-453', supplier:'КХ Береке (Илийский р-н)', category:'Молоко сырое', qty:210, unit:'л', fatPct:4.53, protPct:3.30, phVal:6.70, waterAddedPct:0.00, verdict:'PASSED', receivedAt:'27.09 06:20' },
    { batchId:'М-01-P21-F18', supplier:'Опт Алматы (Калиброванные отруба)', category:'Мясные отруба', qty:192, unit:'кг', fatPct:18.0, protPct:21.0, phVal:5.80, waterAddedPct:0.00, verdict:'PASSED', receivedAt:'27.09 07:10' },
    { batchId:'Т-02-ФАЛЬС', supplier:'ИП Тест (Отбраковка на входе)', category:'Молоко сырое', qty:100, unit:'л', fatPct:2.85, protPct:2.45, phVal:6.45, waterAddedPct:8.50, verdict:'REJECTED', receivedAt:'27.09 07:40' }
  ]);

  movements = signal<StockMovement[]>([
    { id:1, batchCode:'Т-01-330-453', plu:'PLU-02', productName:'Творог пластовой 9%', fromLoc:'Сыроварня -7.800', toLoc:'Участок доставки ЖК Арай', qtyUnits:18, movedAt:'27.09 07:15' },
    { id:2, batchCode:'М-01-P21-F18', plu:'PLU-23', productName:'Мортаделла с фисташкой', fromLoc:'Мясной цех -7.800', toLoc:'Витрина Take-away -4.200', qtyUnits:24, movedAt:'27.09 08:00' },
    { id:3, batchCode:'М-01-P21-F18', plu:'PLU-21', productName:'Колбаски Охотничьи и Пивчики', fromLoc:'Мясной цех -7.800', toLoc:'Вендинг 24/7 (Тамбур)', qtyUnits:30, movedAt:'27.09 08:20' }
  ]);

  orders = signal<CustomerOrder[]>([
    {
      orderId:101, source:'Telegram ЖК Арай', apt:'Кв. 142 (Блок Г3)', phone:'+7 777 234-56-78', slot:'MORNING_0730', isPrepaidKaspi:true, status:'NEW',
      items:[
        { plu:'PLU-10', name:'Тартин подовый на закваске', qty:2, pricePackKzt:540 },
        { plu:'PLU-02', name:'Творог пластовой 9%', qty:2, pricePackKzt:1108 },
        { plu:'PLU-23', name:'Мортаделла с фисташкой', qty:1, pricePackKzt:1425 }
      ]
    },
    {
      orderId:102, source:'Telegram ЖК Арай', apt:'Кв. 88 (Блок Г1)', phone:'+7 701 555-12-34', slot:'EVENING_1830', isPrepaidKaspi:true, status:'NEW',
      items:[
        { plu:'PLU-25', name:'Ребра свиные к/в к пиву', qty:3, pricePackKzt:1755 },
        { plu:'PLU-04', name:'Сыр Сулугуни Pasta Filata', qty:2, pricePackKzt:1701 },
        { plu:'PLU-32', name:'Соус Пири-Пири (125 мл)', qty:2, pricePackKzt:810 }
      ]
    }
  ]);

  spices = signal<SpiceStock[]>([
    { code:'coriander', name:'Кориандр зерно (обжаренный)', grind:'Крупка 1.5 мм', stock:3800, min:3000, roast:true },
    { code:'black_pepper', name:'Черный перец горошек', grind:'Дробленый 1.5–2 мм', stock:2900, min:2500, roast:true },
    { code:'cumin', name:'Зира (кумин) семя', grind:'Цельная / ступка', stock:1450, min:1000, roast:true },
    { code:'smoked_paprika', name:'Паприка копченая испанская', grind:'Пудра', stock:2100, min:2000, roast:false },
    { code:'sweet_paprika', name:'Паприка красная сладкая', grind:'Молотая', stock:1600, min:1500, roast:false },
    { code:'garlic', name:'Чеснок гранулированный / свежий', grind:'Гранулы / паста', stock:1900, min:1500, roast:false },
    { code:'thyme', name:'Тимьян и Розмарин сушеные', grind:'Лист / иголочки', stock:420, min:500, roast:false },
    { code:'nitrite_salt', name:'Соль нитритная (0.6% NaNO2) и морская', grind:'Посол', stock:14000, min:12000, roast:false }
  ]);

  constructor() {
    this.loadLocal();
    effect(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          lines: this.lines(),
          orders: this.orders(),
          spices: this.spices(),
          movements: this.movements()
        }));
      } catch {}
    });
  }

  private loadLocal(): void {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.lines?.length) this.lines.set(d.lines);
        if (d.orders?.length) this.orders.set(d.orders);
        if (d.spices?.length) this.spices.set(d.spices);
        if (d.movements?.length) this.movements.set(d.movements);
      }
    } catch {}
  }

  resetAll(): void {
    localStorage.removeItem(LS_KEY);
    location.reload();
  }

  async syncWithServer(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(\`\${environment.apiUrl}?action=save_snapshot\`, {
        lines: this.lines(),
        orders: this.orders(),
        spices: this.spices()
      }));
      this.syncBanner.set('🟢 Синхронизировано с сервером (Local Bridge / PS.kz)');
    } catch {
      this.syncBanner.set('💻 Автономный режим VS Code (Сохранено в браузере)');
    }
  }

  async printTspl(tspl: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.post<any>(\`\${environment.apiUrl}/print?action=print\`, {
        ip: this.printerIp(),
        tspl
      }));
      this.lastPrintStatus.set(res?.msg || 'Отправлено на печать');
    } catch {
      this.lastPrintStatus.set('Мост не запущен (выполните npm run bridge или скопируйте однострочник Терминала)');
    }
  }
}
`,

  // =========================================================================
  // 9. ОТДЕЛЬНЫЙ HTML-ШАБЛОН ГЛАВНОГО КОМПОНЕНТА (БЕЗ ОШИБКИ TS-991010)
  // =========================================================================
  'src/app/app.component.html': `<header class="top-bar">
  <div style="font-size:15.5px; font-weight:800; display:flex; align-items:center; gap:10px;">
    <span>🏭 MOOD GROUP // PRO MANUFACTURING ERP v3.2</span>
    <span style="background:var(--amber); color:#000; padding:2px 8px; border-radius:4px; font-size:11px;">ЖК «Арай» • VS Code + PS.kz PHP/MySQL</span>
  </div>
  <div style="display:flex; align-items:center; gap:12px;">
    <span style="font-size:12px; color:#7ee787; font-weight:700;">{{ store.syncBanner() }}</span>
    <button class="btn btn-outline btn-sm" (click)="openDrawer(store.selectedPlu())">📋 Открыть техкарту ХАССП ({{ store.selectedPlu() }})</button>
    <button class="btn btn-outline btn-sm" style="color:#ffa198; border-color:#f85149;" (click)="store.resetAll()">↻ Сброс БД</button>
  </div>
</header>

<nav class="nav-tabs">
  <button class="nav-tab" [class.active]="store.activeTab() === 'giant'" (click)="store.activeTab.set('giant')">
    1. 📅 30-дневный GIANT-план (24 линии + Анти-затоваривание)
  </button>
  <button class="nav-tab" [class.active]="store.activeTab() === 'qc_warehouse'" (click)="store.activeTab.set('qc_warehouse')">
    2. 🔬 Приемка сырья, Лаборатория (Эксперт Профи) и Перемещения
  </button>
  <button class="nav-tab" [class.active]="store.activeTab() === 'orders_demand'" (click)="store.activeTab.set('orders_demand')">
    3. 📦 Прием заказов (Telegram ЖК Арай), Продажи и Потребность
  </button>
  <button class="nav-tab" [class.active]="store.activeTab() === 'koch'" (click)="store.activeTab.set('koch')">
    4. 🥩 Технолог мясного цеха Г. Коха + Рассолы (°Be)
  </button>
  <button class="nav-tab" [class.active]="store.activeTab() === 'dairy_bread'" (click)="store.activeTab.set('dairy_bread')">
    5. 🧀🥖 Техкарты Сыроварни (Casaro) и Пекарни (Unox)
  </button>
  <button class="nav-tab" [class.active]="store.activeTab() === 'spicelab'" (click)="store.activeTab.set('spicelab')">
    6. 🌶️ SPICE LAB Алекса Крамера и Соусы
  </button>
  <button class="nav-tab" [class.active]="store.activeTab() === 'tspl'" (click)="store.activeTab.set('tspl')">
    7. 🖨️ Центр маркировки TSC TE310 (SVG Вариант №2)
  </button>
</nav>

<main class="workspace">
  <!-- ПЕРЕИСПОЛЬЗУЕМАЯ ПАНЕЛЬ KPI В ВЕРХНЕЙ ЧАСТИ -->
  <div class="kpi-strip">
    <app-kpi-badge title="Месячный выпуск (4 цеха)" value="800 кг мяса • 1 900 л молока" subtitle="1 600 буханок • 60 кг соусов • 140 суп-китов"></app-kpi-badge>
    <app-kpi-badge title="Оборотный капитал сырья" value="&#36;1,620 (810 000 ₸)" subtitle="Цикл оборота: 4,0 дня (7,5 обор./мес)"></app-kpi-badge>
    <app-kpi-badge title="Заказы в доставке ЖК Арай" [value]="store.orders().length + ' активных заказа'" subtitle="Утро 07:30–09:00 / Вечер 18:30–20:00" valColor="#79c0ff"></app-kpi-badge>
    <app-kpi-badge title="Защита от затоваривания" [value]="store.giantPivot() ? 'Спасено: 319 кг в буфер' : 'Штатный баланс (0% потерь)'" [valColor]="store.giantPivot() ? '#d2a8ff' : '#7ee787'" subtitle="Перевод в Белпер Кнолле, Пломбир и Билтонг"></app-kpi-badge>
    <app-kpi-badge title="Чистая прибыль (Net Profit)" [value]="store.giantPivot() ? '&#36;19,840 / мес.' : '&#36;20,570 / мес.'" valColor="#7ee787" subtitle="40% дивиденды / 60% реинвест"></app-kpi-badge>
  </div>

  <!-- ==================== ВКЛАДКА 1: 30-ДНЕВНЫЙ GIANT-ЧАРТ ==================== -->
  @if (store.activeTab() === 'giant') {
    <div class="card" style="padding:10px 14px;">
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px;">
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          @for (d of depts; track d.id) {
            <button class="btn btn-outline btn-sm" [class.active]="store.giantDept() === d.id" (click)="store.giantDept.set(d.id)">{{ d.label }}</button>
          }
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span>📅 День месяца: <strong style="color:var(--amber);">{{ store.giantDay() }} / 30</strong> ({{ getDow(store.giantDay()) }})
            <input type="range" min="1" max="30" [ngModel]="store.giantDay()" (ngModelChange)="store.giantDay.set(+$event)" style="vertical-align:middle; width:130px;">
          </span>
          <button class="btn btn-purple btn-sm" [class.active]="store.giantPivot()" (click)="store.giantPivot.set(!store.giantPivot())">
            {{ store.giantPivot() ? '🛡️ Защита от затоваривания АКТИВНА (-25% спрос)' : '⚡ Включить защиту от затоваривания' }}
          </button>
        </div>
      </div>
    </div>

    <div class="giant-wrap">
      <table class="giant-table">
        <thead>
          <tr>
            <th class="col-prod">PLU и Продукт (Клик — Техкарта ХАССП)</th>
            <th class="col-meta">План/мес</th>
            <th class="col-meta">Срок годн.</th>
            <th class="col-stat">День {{ store.giantDay() }}</th>
            @for (d of days30; track d) {
              <th class="d-cell" [class.d-head-cur]="d === store.giantDay()" (click)="store.giantDay.set(d)">
                <div>{{ d }}</div><div style="font-size:8.5px; font-weight:400;">{{ getDow(d) }}</div>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (p of filteredLines(); track p.plu) {
            <tr>
              <td class="col-prod" [style.borderLeft]="p.plu === store.selectedPlu() ? '4px solid var(--amber)' : ''" (click)="openDrawer(p.plu)">
                <span class="plu-tag">{{ p.plu }}</span> <strong>{{ p.name }}</strong>
              </td>
              <td class="col-meta"><strong>{{ getAdjustedKg(p) }} кг</strong><div style="font-size:9.5px; color:var(--muted);">{{ p.monthlyUnits }} уп.</div></td>
              <td class="col-meta"><strong>{{ p.shelfDays }} сут.</strong><div style="font-size:9.5px; color:var(--muted);">{{ p.temp }}</div></td>
              <td class="col-stat"><span class="pill" [ngClass]="getCell(p, store.giantDay()).pill">{{ getCell(p, store.giantDay()).label }}</span></td>
              @for (d of days30; track d) {
                <td class="d-cell" [ngClass]="getCell(p, d).cls" [class.d-col-cur]="d === store.giantDay()" (click)="selectPluAndDay(p.plu, d)">
                  {{ getCell(p, d).sym }}
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  <!-- ==================== ВКЛАДКА 2: ПРИЕМКА, ЛАБОРАТОРИЯ И СКЛАД ==================== -->
  @if (store.activeTab() === 'qc_warehouse') {
    <div class="grid-2">
      <div class="card">
        <h3>
          <span>🔬 Приемка сырья и Лаборатория качества («Эксперт Профи» + Hanna pH)</span>
          <button class="btn btn-green btn-sm" (click)="acceptNewMilkBatch()">+ Принять партию молока (210 л)</button>
        </h3>
        <table class="mini-table">
          <thead><tr><th>Партия</th><th>Поставщик</th><th>Объем</th><th>Жир/Белок</th><th>pH</th><th>Вода</th><th>Вердикт</th></tr></thead>
          <tbody>
            @for (b of store.rawBatches(); track b.batchId) {
              <tr>
                <td><strong>{{ b.batchId }}</strong></td>
                <td>{{ b.supplier }}</td>
                <td>{{ b.qty }} {{ b.unit }}</td>
                <td>{{ b.fatPct }}% / {{ b.protPct }}%</td>
                <td>{{ b.phVal }}</td>
                <td [style.color]="b.waterAddedPct > 0 ? '#f85149' : '#7ee787'">{{ b.waterAddedPct }}%</td>
                <td>
                  <span class="pill" [ngClass]="b.verdict === 'PASSED' ? 'pill-ok' : 'pill-crit'">
                    {{ b.verdict === 'PASSED' ? 'ГОДНО 1 СОРТ' : 'БРАК (ВОДА)' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3>
          <span>🚚 Журнал перемещения товара (Цех -7.800 ⇄ Паб / Витрина / Вендинг)</span>
          <button class="btn btn-outline btn-sm" (click)="recordQuickMovement()">+ Переместить партию на витрину</button>
        </h3>
        <table class="mini-table">
          <thead><tr><th>Время</th><th>Партия</th><th>Продукт</th><th>Откуда -> Куда</th><th>Кол-во</th></tr></thead>
          <tbody>
            @for (m of store.movements(); track m.id) {
              <tr>
                <td>{{ m.movedAt }}</td>
                <td><span class="plu-tag">{{ m.batchCode }}</span></td>
                <td><strong>{{ m.productName }}</strong></td>
                <td>{{ m.fromLoc }} → {{ m.toLoc }}</td>
                <td>{{ m.qtyUnits }} уп.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

  <!-- ==================== ВКЛАДКА 3: ЗАКАЗЫ, ПРОДАЖИ И ПОТРЕБНОСТЬ ==================== -->
  @if (store.activeTab() === 'orders_demand') {
    <app-order-intake
      [orders]="store.orders()"
      [lines]="store.lines()"
      (createOrder)="addCustomerOrder($event)"
      (packOrder)="packCustomerOrder($event)"
      (printOrderLabel)="printCustomerOrder($event)">
    </app-order-intake>
  }

  <!-- ==================== ВКЛАДКА 4: МЯСНОЙ ЦЕХ Г. КОХА + РАССОЛЫ ==================== -->
  @if (store.activeTab() === 'koch') {
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <strong>🥩 Загрузка мясного сырья на партию (кг): </strong>
          <input type="number" [ngModel]="store.kochBatchKg()" (ngModelChange)="store.kochBatchKg.set(+$event)" style="width:75px;">
          <button class="btn btn-outline btn-sm" style="margin-left:6px;" (click)="store.kochBatchKg.set(20)">20 кг (Varmen Mini)</button>
          <button class="btn btn-outline btn-sm" style="margin-left:4px;" (click)="store.kochBatchKg.set(100)">100 кг (Эталон Коха)</button>
        </div>
        <div>
          <strong>🧪 Конвертер рассолов Боме (°Be): </strong>
          <select [ngModel]="store.brineBe()" (ngModelChange)="store.brineBe.set(+$event)">
            <option [ngValue]="10">10°Be (10,8% соли — грудинка и ребра)</option>
            <option [ngValue]="12">12°Be (13,0% соли — английский бекон и окорока)</option>
            <option [ngValue]="14">14°Be (15,2% соли — ускоренный посол)</option>
          </select>
          <span style="margin-left:8px; color:#79c0ff;">
            Шприцевание 20%: <strong>{{ (store.kochBatchKg() * 0.2) | number:'1.1-1' }} л льда/воды + {{ getBrineSaltGrams() }} г нитритной соли</strong>
          </span>
        </div>
      </div>
    </div>

    <div class="cards-grid">
      @for (line of getLinesByDept('Мясной цех MEAT&BREAD'); track line.plu) {
        <div class="tech-card">
          <div>
            <div style="display:flex; justify-content:space-between;">
              <span class="plu-tag">{{ line.plu }}</span>
              <span class="pill pill-ok">Выход {{ line.yieldPct }}% • На полке: {{ line.shelfStockUnits }} уп.</span>
            </div>
            <h3 style="margin:6px 0;">{{ line.name }}</h3>
            <div style="font-size:11.5px; color:#79c0ff;">{{ line.equipment }}</div>
            <table class="mini-table">
              @for (r of line.rawNorms; track r.name) {
                <tr><td>{{ r.name }}</td><td>{{ r.qty }}</td></tr>
              }
            </table>
          </div>
          <app-pack-econ
            [line]="line"
            [batchInputKg]="store.kochBatchKg()"
            (changed)="store.syncWithServer()"
            (openSteps)="openDrawer($event)"
            (openTspl)="openInTspl($event)">
          </app-pack-econ>
        </div>
      }
    </div>
  }

  <!-- ==================== ВКЛАДКА 5: СЫРОВАРНЯ CASARO И ПЕКАРНЯ UNOX ==================== -->
  @if (store.activeTab() === 'dairy_bread') {
    <h3 style="color:var(--cheese); margin:4px 0 10px 0;">🧀 Технологические карты сыроварни CHEESY MOOD (2× Casaro 100 л)</h3>
    <div class="cards-grid">
      @for (line of getLinesByDept('CHEESY MOOD'); track line.plu) {
        <div class="tech-card">
          <div>
            <div style="display:flex; justify-content:space-between;">
              <span class="plu-tag" style="color:var(--cheese);">{{ line.plu }}</span>
              <span class="pill pill-ok">Срок: {{ line.shelfDays }} сут. ({{ line.temp }})</span>
            </div>
            <h3 style="margin:6px 0;">{{ line.name }}</h3>
            <table class="mini-table">
              @for (r of line.rawNorms; track r.name) {
                <tr><td>{{ r.name }}</td><td>{{ r.qty }}</td></tr>
              }
            </table>
          </div>
          <app-pack-econ
            [line]="line"
            [batchInputKg]="store.dairyBatchLiters()"
            (changed)="store.syncWithServer()"
            (openSteps)="openDrawer($event)"
            (openTspl)="openInTspl($event)">
          </app-pack-econ>
        </div>
      }
    </div>

    <h3 style="color:var(--amber); margin:22px 0 10px 0;">🥖 Технологические карты ремесленной пекарни MEAT&amp;BREAD (Пароконвектомат Unox)</h3>
    <div class="cards-grid">
      @for (line of getLinesByDept('Пекарня MEAT&BREAD'); track line.plu) {
        <div class="tech-card">
          <div>
            <div style="display:flex; justify-content:space-between;">
              <span class="plu-tag">{{ line.plu }}</span>
              <span class="pill pill-warn">Zero-Waste синергия сыворотки</span>
            </div>
            <h3 style="margin:6px 0;">{{ line.name }}</h3>
            <table class="mini-table">
              @for (r of line.rawNorms; track r.name) {
                <tr><td>{{ r.name }}</td><td>{{ r.qty }}</td></tr>
              }
            </table>
          </div>
          <app-pack-econ
            [line]="line"
            [batchInputKg]="22"
            (changed)="store.syncWithServer()"
            (openSteps)="openDrawer($event)"
            (openTspl)="openInTspl($event)">
          </app-pack-econ>
        </div>
      }
    </div>
  }

  <!-- ==================== ВКЛАДКА 6: SPICE LAB КРАМЕРА И ЛИСТ ЗАКАЗА СЫРЬЯ ==================== -->
  @if (store.activeTab() === 'spicelab') {
    <div class="grid-2">
      <div class="card">
        <h3><span>🌶️ Склад специй Алекса Крамера и Авто-формирование листа заказа поставщикам</span></h3>
        <table class="mini-table">
          <thead><tr><th>Пряность</th><th>Помол</th><th>Мин. норма</th><th>Остаток (г)</th><th>К заказу</th></tr></thead>
          <tbody>
            @for (sp of store.spices(); track sp.code) {
              <tr>
                <td><strong>{{ sp.name }}</strong></td>
                <td>{{ sp.grind }} {{ sp.roast ? '🔥' : '' }}</td>
                <td>{{ sp.min }} г</td>
                <td><input type="number" [(ngModel)]="sp.stock" step="50" style="width:85px;"></td>
                <td>
                  @if (sp.stock < sp.min) {
                    <span class="pill pill-crit">ЗАКАЗАТЬ {{ sp.min - sp.stock + 500 }} г</span>
                  } @else {
                    <span class="pill pill-ok">В НОРМЕ</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3><span>🥫 Ферментированные соусы, Суп-киты и Zero-Waste позиции</span></h3>
        @for (line of getLinesByDept('BEERMOOD & SPICE LAB'); track line.plu) {
          <div style="background:var(--panel-alt); padding:9px 12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="plu-tag">{{ line.plu }}</span> <strong> {{ line.name }}</strong>
              <div style="font-size:11px; color:var(--muted);">{{ line.pivotAction }}</div>
            </div>
            <button class="btn btn-sm" (click)="openDrawer(line.plu)">📋 Техкарта</button>
          </div>
        }
      </div>
    </div>
  }

  <!-- ==================== ВКЛАДКА 7: ЦЕНТР МАРКИРОВКИ TSC TE310 ==================== -->
  @if (store.activeTab() === 'tspl') {
    <div class="grid-2">
      <div class="card">
        <h3>
          <span>🏷️ Живой SVG-макет этикетки ТермоТОП 58×60 мм (Вариант №2, 300 dpi)</span>
          <span class="pill pill-ok">IP: {{ store.printerIp() }}:9100</span>
        </h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
          <label>Продукт (24 PLU):
            <select [ngModel]="store.selectedPlu()" (ngModelChange)="store.selectedPlu.set($event)" style="width:100%; margin-top:3px;">
              @for (p of store.lines(); track p.plu) {
                <option [ngValue]="p.plu">{{ p.plu }} — {{ p.name }}</option>
              }
            </select>
          </label>
          <label>Код сквозной партии сырья:
            <input type="text" [ngModel]="store.tsplBatch()" (ngModelChange)="store.tsplBatch.set($event)" style="width:100%; margin-top:3px; font-family:monospace;">
          </label>
        </div>

        @if (currentLine(); as p) {
          <div style="max-width:390px; margin:0 auto;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 690 715" width="100%" style="background:#fff; border-radius:8px; font-family:Arial,sans-serif;">
              <rect x="10" y="10" width="670" height="695" rx="4" fill="none" stroke="#111827" stroke-width="3.5"/>
              <text x="30" y="36" font-size="18" font-weight="900" fill="#111827">{{ p.brand }} * MOOD GROUP</text>
              <text x="535" y="35" font-size="13" font-weight="800" fill="#111827">СТ РК / ГОСТ</text>
              <line x1="10" y1="50" x2="680" y2="50" stroke="#111827" stroke-width="3"/>
              <text x="345" y="78" font-size="20" font-weight="900" text-anchor="middle" fill="#111827">{{ p.kzTitle }}</text>
              <rect x="185" y="88" width="320" height="21" rx="3" fill="#111827"/>
              <text x="345" y="103" font-size="11.5" font-weight="800" text-anchor="middle" fill="#FFFFFF">{{ p.subTitle }}</text>
              <line x1="10" y1="117" x2="680" y2="117" stroke="#111827" stroke-width="3"/>
              <text x="22" y="134" font-size="11" font-weight="700" fill="#111827">Құрамы / Состав: {{ p.comp }}</text>
              <text x="22" y="151" font-size="11" font-weight="700" fill="#111827">100 г: Б — {{ p.prot }} г, Ж — {{ p.fat }} г, У — {{ p.carb }} г. {{ getKcal(p) }} ккал.</text>
              <rect x="20" y="158" width="650" height="32" fill="#FEF3C7" rx="3"/>
              <text x="26" y="172" font-size="10" font-weight="800" fill="#92400E">{{ p.kzPair }}</text>
              <text x="26" y="185" font-size="10" font-weight="700" fill="#78350F">{{ p.ruPair }}</text>
              <line x1="10" y1="198" x2="680" y2="198" stroke="#111827" stroke-width="1.5"/>
              <text x="22" y="217" font-size="12" font-weight="800" fill="#111827">Дайындалған: 27.09.2026 | Партия: {{ store.tsplBatch() }}</text>
              <text x="22" y="241" font-size="14" font-weight="900" fill="#991B1B">ЖАРАМДЫ / ГОДЕН: {{ p.shelfDays }} тәул./суток ({{ p.temp }})</text>
              <line x1="10" y1="254" x2="680" y2="254" stroke="#111827" stroke-width="3"/>
              <rect x="35" y="272" width="155" height="155" fill="none" stroke="#111827" stroke-width="3"/>
              <text x="112" y="355" font-size="12" font-weight="900" text-anchor="middle" fill="#111827">[QR EAN+BATCH]</text>
              <text x="112" y="452" font-size="14" font-weight="900" text-anchor="middle" fill="#111827">{{ getEan12(p) }}</text>
              <line x1="228" y1="254" x2="228" y2="475" stroke="#111827" stroke-width="2.5"/>
              <text x="246" y="280" font-size="13" font-weight="800" fill="#111827">Бағасы / Цена кг: {{ p.priceKg | number }} ₸</text>
              <text x="246" y="312" font-size="15" font-weight="900" fill="#111827">САЛМАҒЫ / МАССА: {{ (p.packG / 1000) | number:'1.3-3' }} кг</text>
              <text x="246" y="344" font-size="14" font-weight="900" fill="#991B1B">Клуб / MOOD Club: -10%</text>
              <text x="246" y="392" font-size="22" font-weight="900" fill="#111827">ИТОГО: {{ getClubPackPrice(p) | number }} ₸</text>
              <text x="246" y="445" font-size="12" font-weight="800" fill="#111827">Шебер / Мастер: ____________</text>
              <line x1="10" y1="475" x2="680" y2="475" stroke="#111827" stroke-width="3"/>
              <text x="24" y="500" font-size="11" font-weight="700" fill="#111827">Ремесленная мастерская «MOOD GROUP»: г. Алматы, ЖК Арай, блок Г3</text>
            </svg>
          </div>
          <button class="btn btn-green" style="width:100%; margin-top:10px;" (click)="store.printTspl(buildTsplCode())">
            🖨️ Печать этикетки на TSC TE310 ({{ store.printerIp() }}:9100)
          </button>
          <div style="font-size:11.5px; color:#79c0ff; margin-top:6px;">{{ store.lastPrintStatus() }}</div>
        }
      </div>

      <div class="card">
        <h3>🖨️ Готовый пакет команд TSPL (Вариант №2 и Акты приемки молока)</h3>
        <div style="display:flex; gap:6px; margin-bottom:10px;">
          <button class="btn btn-outline btn-sm" [class.active]="store.tsplMode() === 'PRODUCT'" (click)="store.tsplMode.set('PRODUCT')">Этикетка товара</button>
          <button class="btn btn-outline btn-sm" [class.active]="store.tsplMode() === 'MILK_OK'" (click)="store.tsplMode.set('MILK_OK')">Акт молока: ГОДНО</button>
          <button class="btn btn-outline btn-sm" [class.active]="store.tsplMode() === 'MILK_BAD'" (click)="store.tsplMode.set('MILK_BAD')">Акт молока: БРАК</button>
        </div>
        <pre class="tspl-pre">{{ buildTsplCode() }}</pre>
      </div>
    </div>
  }
</main>

<!-- ПРАВАЯ ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ ПОШАГОВОЙ ТЕХКАРТЫ И ТРЕКИНГА ХАССП -->
<app-haccp-drawer
  [isOpen]="store.drawerOpen()"
  [line]="currentLine()"
  (closed)="store.drawerOpen.set(false)"
  (stepChanged)="store.syncWithServer()"
  (goToPrint)="openInTspl($event)">
</app-haccp-drawer>
`,

  // =========================================================================
  // 10. КОРНЕВОЙ КОМПОНЕНТ ANGULAR 18 (src/app/app.component.ts)
  // =========================================================================
  'src/app/app.component.ts': `import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpStoreService } from './services/erp-store.service';
import { KpiBadgeComponent } from './components/kpi-badge.component';
import { PackEconComponent } from './components/pack-econ.component';
import { HaccpDrawerComponent } from './components/haccp-drawer.component';
import { OrderIntakeComponent } from './components/order-intake.component';
import { GiantLine, CustomerOrder } from './models/erp.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiBadgeComponent, PackEconComponent, HaccpDrawerComponent, OrderIntakeComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  store = inject(ErpStoreService);
  readonly days30 = Array.from({ length: 30 }, (_, i) => i + 1);
  readonly depts = [
    { id: 'ALL', label: 'Все цеха (24)' },
    { id: 'CHEESY MOOD', label: '🧀 CHEESY MOOD (7)' },
    { id: 'Пекарня MEAT&BREAD', label: '🥖 Пекарня Unox (3)' },
    { id: 'Мясной цех MEAT&BREAD', label: '🥩 Мясной цех Ижица (9)' },
    { id: 'BEERMOOD & SPICE LAB', label: '🌶️ Соусы, Суп-киты, Специи, Пиво (5)' }
  ];

  getDow(day: number): string {
    return this.store.dowList[(day - 1) % 7];
  }
  filteredLines(): GiantLine[] {
    const d = this.store.giantDept();
    return d === 'ALL' ? this.store.lines() : this.store.lines().filter(x => x.dept === d);
  }
  getLinesByDept(dept: string): GiantLine[] {
    return this.store.lines().filter(x => x.dept === dept);
  }
  currentLine(): GiantLine | undefined {
    return this.store.lines().find(x => x.plu === this.store.selectedPlu());
  }
  openDrawer(plu: string): void {
    this.store.selectedPlu.set(plu);
    this.store.drawerOpen.set(true);
  }
  openInTspl(plu: string): void {
    this.store.selectedPlu.set(plu);
    this.store.drawerOpen.set(false);
    this.store.activeTab.set('tspl');
  }
  selectPluAndDay(plu: string, day: number): void {
    this.store.selectedPlu.set(plu);
    this.store.giantDay.set(day);
  }
  getAdjustedKg(p: GiantLine): number {
    if (!this.store.giantPivot()) return p.monthlyKg;
    if (p.shortRisk && p.pivotRatio) return p.monthlyKg - Math.round(p.monthlyKg * p.pivotRatio);
    if (p.isBuffer && p.bonusKg) return p.monthlyKg + p.bonusKg;
    return p.monthlyKg;
  }
  getCell(p: GiantLine, day: number) {
    const isSup = p.supplyDays.includes(day);
    const isProd = p.prodDays.includes(day);
    let lastProd: number | null = null;
    for (const d of p.prodDays) { if (d <= day) lastProd = d; }
    const rem = lastProd !== null ? (p.shelfDays - (day - lastProd)) : null;

    if (isSup && isProd) return { cls: 'c-sp', sym: 'S+P', label: 'Поставка+Варка', pill: 'pill-ok' };
    if (isProd) return { cls: 'c-prd', sym: 'P', label: 'Выработка', pill: 'pill-ok' };
    if (isSup) return { cls: 'c-sup', sym: 'S', label: 'Поставка сырья', pill: 'pill-ok' };
    if (this.store.giantPivot() && p.shortRisk && day % 3 === 0) return { cls: 'c-pvt', sym: '⇄', label: 'Маневр линии', pill: 'pill-pivot' };
    if (rem !== null && rem > 0) {
      if (rem <= 2) return { cls: 'c-crt', sym: rem + 'д!', label: 'КРИТИЧНО (' + rem + 'д)', pill: 'pill-crit' };
      if (rem / p.shelfDays <= 0.35) return { cls: 'c-wrn', sym: rem + 'д', label: 'Промо -10%', pill: 'pill-warn' };
      return { cls: 'c-ok', sym: rem + 'д', label: 'Свежий (' + rem + 'д)', pill: 'pill-ok' };
    }
    return { cls: '', sym: '', label: 'Ожидание', pill: 'pill-ok' };
  }
  getBrineSaltGrams(): number {
    const map: Record<number, number> = { 10: 10.8, 12: 13.0, 14: 15.2 };
    return Math.round((this.store.kochBatchKg() * 0.20 * 1000) * ((map[this.store.brineBe()] || 10.8) / 100));
  }
  acceptNewMilkBatch(): void {
    this.store.rawBatches.set([
      { batchId: 'Т-03-' + Math.floor(Math.random() * 899 + 100), supplier: 'КХ Береке (1 сорт)', category: 'Молоко сырое', qty: 210, unit: 'л', fatPct: 4.48, protPct: 3.32, phVal: 6.69, waterAddedPct: 0.00, verdict: 'PASSED', receivedAt: 'Сегодня' },
      ...this.store.rawBatches()
    ]);
  }
  recordQuickMovement(): void {
    const p = this.currentLine() || this.store.lines()[0];
    this.store.movements.set([
      { id: Date.now(), batchCode: this.store.tsplBatch(), plu: p.plu, productName: p.name, fromLoc: 'Цех -7.800', toLoc: 'Витрина Take-away -4.200', qtyUnits: 15, movedAt: 'Сейчас' },
      ...this.store.movements()
    ]);
  }
  addCustomerOrder(o: CustomerOrder): void {
    this.store.orders.set([o, ...this.store.orders()]);
  }
  packCustomerOrder(orderId: number): void {
    const ord = this.store.orders().find(x => x.orderId === orderId);
    if (ord && ord.status !== 'PACKED') {
      ord.status = 'PACKED';
      for (const it of ord.items) {
        const line = this.store.lines().find(l => l.plu === it.plu);
        if (line) line.shelfStockUnits = Math.max(0, line.shelfStockUnits - it.qty);
      }
      this.store.orders.set([...this.store.orders()]);
      this.store.lines.set([...this.store.lines()]);
    }
  }
  printCustomerOrder(o: CustomerOrder): void {
    const tspl = \`SIZE 58 mm, 60 mm\\r\\nCLS\\r\\nTEXT 25,25,"3",0,1,1,"ДОСТАВКА ЖК АРАЙ #"\${o.orderId}\\r\\nTEXT 25,65,"2",0,1,1,"\${o.apt}"\\r\\nPRINT 1,1\`;
    this.store.printTspl(tspl);
  }
  getKcal(p: GiantLine): number {
    return Math.round(p.prot * 4 + p.fat * 9 + p.carb * 4);
  }
  getEan12(p: GiantLine): string {
    return p.eanPrefix + String(p.packG).padStart(6, '0');
  }
  getClubPackPrice(p: GiantLine): number {
    return Math.round(((p.priceKg / 1000) * p.packG) * 0.90);
  }
  buildTsplCode(): string {
    if (this.store.tsplMode() === 'MILK_OK') {
      return \`SIZE 58 mm, 60 mm\\nGAP 2 mm, 0 mm\\nCODEPAGE 1251\\nCLS\\nBOX 15,15,680,705,3\\nTEXT 180,25,"3",0,1,1,"АКТ ПРИЕМКИ МОЛОКА"\\nTEXT 25,70,"2",0,1,1,"Поставщик: КХ Береке | Жир: 4.53% | Белок: 3.30%"\\nTEXT 25,110,"2",0,1,1,"Вода доб.: 0.00% (ЧИСТО) | pH: 6.70"\\nTEXT 65,200,"3",0,1,1,"ВЕРДИКТ: [ СЫРЬЕ ГОДНО / 1 СОРТ ]"\\nPRINT 1, 1\`;
    }
    if (this.store.tsplMode() === 'MILK_BAD') {
      return \`SIZE 58 mm, 60 mm\\nGAP 2 mm, 0 mm\\nCODEPAGE 1251\\nCLS\\nBOX 15,15,680,705,3\\nTEXT 180,25,"3",0,1,1,"АКТ ПРИЕМКИ МОЛОКА"\\nTEXT 25,70,"2",0,1,1,"Поставщик: Тест | Вода доб.: 8.50%"\\nTEXT 40,160,"3",0,1,1,"ВЕРДИКТ: [ БРАК / ОБНАРУЖЕНА ВОДА ]"\\nPRINT 1, 1\`;
    }
    const p = this.currentLine() || this.store.lines()[1];
    return \`SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
CODEPAGE 1251
CLS
BOX 10, 10, 680, 705, 3
TEXT 20, 20, "2", 0, 1, 1, "\${p.brand} * MOOD GROUP"
TEXT 30, 56, "3", 0, 1, 1, "\${p.kzTitle}"
TEXT 20, 124, "1", 0, 1, 1, "Курамы/Состав: \${p.comp}"
TEXT 20, 142, "1", 0, 1, 1, "100г: Б-\${p.prot}г, Ж-\${p.fat}г. \${this.getKcal(p)} ккал. \${p.temp}"
TEXT 20, 160, "1", 0, 1, 1, "\${p.kzPair}"
TEXT 20, 178, "1", 0, 1, 1, "\${p.ruPair}"
TEXT 20, 208, "1", 0, 1, 1, "Партия: \${this.store.tsplBatch()} | Годен: \${p.shelfDays} сут."
QRCODE 25, 266, M, 5, A, 0, "\${this.getEan12(p)};\${this.store.tsplBatch()}"
TEXT 245, 288, "2", 0, 1, 1, "МАССА: \${(p.packG / 1000).toFixed(3)} кг"
TEXT 245, 316, "2", 0, 1, 1, "Клуб / MOOD Club: -10%"
TEXT 245, 352, "3", 0, 1, 1, "ИТОГО: \${this.getClubPackPrice(p)} T"
TEXT 20, 485, "1", 0, 1, 1, "Мастерская «MOOD GROUP»: г. Алматы, ЖК Арай, блок Г3"
PRINT 1, 1\`;
  }
}
`
};

for (const [rel, content] of Object.entries(files)) {
  const full = path.join(projectRoot, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

console.log('✅ Промышленная сборка MOOD GROUP PRO ERP v3.2 успешно сгенерирована: ' + projectRoot);
console.log('👉 Запуск в VS Code: cd beermood-master-erp-v3 && npm install && npm start');