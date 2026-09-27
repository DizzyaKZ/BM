/**
 * MOOD GROUP MASTER ERP & TECHNOLOGIST SUITE v3.1 (Angular 18 + PHP/MySQL PS.kz)
 * С правой выезжающей панелью (Offcanvas Drawer) пошаговых техкарт и трекинга ХАССП
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(process.cwd(), 'beermood-master-erp-v3');

const files = {
  // =========================================================================
  // 1. НАСТРОЙКИ VS CODE
  // =========================================================================
  '.vscode/launch.json': JSON.stringify({
    version: "0.2.0",
    configurations: [
      {
        name: "🚀 Debug MOOD GROUP ERP v3.1 (Chrome)",
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
      {
        type: "npm",
        script: "start",
        isBackground: true,
        problemMatcher: "$tsc-watch",
        label: "npm: start"
      },
      {
        type: "npm",
        script: "bridge",
        isBackground: true,
        label: "Start Local TSC TE310 Bridge"
      },
      {
        type: "npm",
        script: "build:pskz",
        problemMatcher: ["$tsc"],
        label: "Build Production Bundle for PS.kz"
      }
    ]
  }, null, 2),

  // =========================================================================
  // 2. СЕРВЕРНЫЙ PHP БЭКЕНД И БАЗА MYSQL ДЛЯ PS.KZ
  // =========================================================================
  'backend-php/.htaccess': `RewriteEngine On
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php?route=$1 [QSA,L]
`,

  'backend-php/config.php': `<?php
define('DB_HOST', getenv('PSKZ_DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('PSKZ_DB_NAME') ?: 'beermood_erp');
define('DB_USER', getenv('PSKZ_DB_USER') ?: 'beermood_user');
define('DB_PASS', getenv('PSKZ_DB_PASS') ?: 'CHANGE_PASSWORD_IN_PLESK');
define('TSC_PRINTER_IP', '192.168.1.17');
define('TSC_PRINTER_PORT', 9100);

function getPdo(): PDO {
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    return new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
}
`,

  'backend-php/index.php': `<?php
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

  'local-bridge.js': `const http = require('http');
const net  = require('net');
const PORT = 3001;

function encodeCP1251(str) {
  const buf = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 128) buf.push(c);
    else if (c >= 0x0410 && c <= 0x044F) buf.push(c - 0x0410 + 192);
    else if (c === 0x0401) buf.push(168);
    else if (c === 0x0451) buf.push(184);
    else if (c === 0x2116) buf.push(185);
    else buf.push(32);
  }
  return Buffer.from(buf);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    if (req.url.includes('status')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ status: 'ok', server: 'Local Node Bridge (Port 3001)' }));
    }
    if (req.url.includes('print') && req.method === 'POST') {
      const data = JSON.parse(body || '{}');
      const ip = data.ip || '192.168.1.17';
      const port = data.port || 9100;
      const payload = encodeCP1251((data.tspl || '') + '\\r\\n');

      const sock = new net.Socket();
      sock.setTimeout(2500);
      sock.connect(port, ip, () => {
        sock.write(payload, () => {
          sock.destroy();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ status: 'ok', message: 'Напечатано на ' + ip + ':' + port + ' (CP1251)' }));
        });
      });
      sock.on('error', (e) => {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'sim', message: 'Принтер ' + ip + ' вне сети (' + e.message + ')' }));
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  });
}).listen(PORT, () => console.log('🟢 Local TSC TE310 Bridge on http://localhost:' + PORT));
`,

  // =========================================================================
  // 3. КОНФИГУРАЦИЯ ANGULAR 18 И МОДЕЛИ ДАННЫХ
  // =========================================================================
  'package.json': JSON.stringify({
    name: "beermood-master-erp-v3",
    version: "3.1.0",
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
              "assets": [
                { "glob": "**/*", "input": "public" }
              ],
              "styles": ["src/styles.css"],
              "scripts": []
            },
            "configurations": {
              "production": {
                "fileReplacements": [
                  {
                    "replace": "src/environments/environment.ts",
                    "with": "src/environments/environment.prod.ts"
                  }
                ],
                "outputHashing": "all"
              }
            }
          },
          "serve": {
            "builder": "@angular-devkit/build-angular:dev-server",
            "options": {
              "buildTarget": "beermood-master-erp-v3:build"
            }
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
    "compilerOptions": {
      "outDir": "./out-tsc/app",
      "types": []
    },
    "files": ["src/main.ts"]
  }, null, 2),

  'src/environments/environment.ts': `export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001'
};
`,

  'src/environments/environment.prod.ts': `export const environment = {
  production: true,
  apiUrl: '/api/index.php'
};
`,

  'src/index.html': `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>MOOD GROUP // MASTER ERP & TECHNOLOGIST SUITE v3.1</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>`,

  'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
`,

  'src/app/app.config.ts': `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient()
  ]
};
`,

  // =========================================================================
  // 4. СТРОГИЕ МОДЕЛИ TYPESCRIPT (С ПОДДЕРЖКОЙ ТРЕКИНГА ЭТАПОВ ТЕХКАРТЫ)
  // =========================================================================
  'src/app/models/master-erp.model.ts': `export type ActiveTabId = 'giant' | 'koch' | 'dairy-bread' | 'spicelab' | 'tspl';
export type TsplPrintMode = 'PRODUCT' | 'MILK_OK' | 'MILK_BAD';

export interface TechStep {
  id: number;
  title: string;
  desc: string;
  ccpHaccp?: string; // Критическая контрольная точка ХАССП
  tempTime?: string; // Температура и время выдержки
  done: boolean;
}

export interface DetailedTechCard {
  plu: string;
  name: string;
  brand: string;
  dept: string;
  outputNorm: string;
  equipment: string;
  rawMaterials: { name: string; amount: string; note?: string }[];
  steps: TechStep[];
  packagingRule: string;
  storageNorm: string;
}

export interface GiantLineItem {
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
}

export interface KochCardItem {
  plu: string;
  code: string;
  title: string;
  strategy: 'FAST_TURN' | 'HIGH_MARGIN' | 'LONG_BUFFER';
  packGrams: number;
  defaultPriceKg: number;
  retailPricePerKgKzt: number;
  rawCostPerKgKzt: number;
  yieldPct: number;
  meats: { name: string; pct: number }[];
  spices: { name: string; gPerKg: number }[];
  brineDegBe: number;
  injectPct: number;
  coverPct: number;
  techSteps: string;
}

export interface DairyCardItem {
  plu: string;
  title: string;
  equip: string;
  yieldKgPer100L: number;
  packGrams: number;
  defaultPriceKg: number;
  retailPricePerKgKzt: number;
  costPerKgKzt: number;
  milkReq: string;
  ingredientsPer100L: { name: string; amount: string }[];
  regimes: string;
}

export interface BreadCardItem {
  plu: string;
  title: string;
  equip: string;
  rawLoafWeightG: number;
  bakedLoafWeightG: number;
  defaultPriceKg: number;
  retailPricePerKgKzt: number;
  costPerLoafKzt: number;
  bakersFormula: { name: string; bPct: number; note: string }[];
  regimes: string;
}

export interface SpiceStockItem {
  code: string;
  name: string;
  cat: string;
  grind: string;
  stock: number;
  min: number;
  roast: boolean;
}

export interface KramerRecipeItem {
  id: number;
  plu: string;
  title: string;
  region: string;
  prep: string;
  items: { code: string; pct: number }[];
}
`,

  // =========================================================================
  // 5. РЕАКТИВНЫЙ СЕРВИС С ПОЛНЫМИ ПОШАГОВЫМИ КАРТАМИ ТРЕКИНГА
  // =========================================================================
  'src/app/services/master-erp.service.ts': `import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ActiveTabId,
  TsplPrintMode,
  GiantLineItem,
  KochCardItem,
  DairyCardItem,
  BreadCardItem,
  SpiceStockItem,
  KramerRecipeItem,
  DetailedTechCard
} from '../models/master-erp.model';

const LS_KEY_STEPS = 'mood_v3_steps_tracking';

@Injectable({ providedIn: 'root' })
export class MasterErpService {
  private http = inject(HttpClient);

  syncStatus = signal<string>('Локальная БД VS Code (Готов к деплою на PS.kz)');
  activeTab = signal<ActiveTabId>('giant');

  // Флаг и выбранная карта для правой выезжающей панели
  drawerOpen = signal<boolean>(false);
  activeTechCardPlu = signal<string>('PLU-02');

  // Модуль 1 (GIANT)
  giantDept = signal<string>('ALL');
  giantDay = signal<number>(12);
  giantPivot = signal<boolean>(false);
  selectedPlu = signal<string>('PLU-02');

  // Модуль 2 (Кох)
  kochBatchKg = signal<number>(20);
  kochProfitFilter = signal<string>('ALL');
  brineType = signal<string>('be10');
  brineMeatMass = signal<number>(20);
  brineInjectPct = signal<number>(20);

  // Модуль 3 (Сыры + Хлеб)
  dairyBatchLiters = signal<number>(100);
  breadBatchLoaves = signal<number>(30);

  // Модуль 4 (Крамер)
  selectedKramerId = signal<number>(50);
  kramerWeightG = signal<number>(1000);

  // Модуль 5 (TSC TE310)
  tsplMode = signal<TsplPrintMode>('PRODUCT');
  printerIp = signal<string>('192.168.1.17');
  tsplBatchInput = signal<string>('Т-01-330-453');
  tsplMassKg = signal<number>(0.385);
  tsplPriceKg = signal<number>(3200);
  tsplProtVal = signal<number>(16.6);
  tsplFatVal = signal<number>(9.1);
  lastPrintMsg = signal<string>('Готов к отправке на 192.168.1.17:9100');

  readonly dowList = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  readonly supplyLog: Record<number, string[]> = {
    1: ['🥩 Калиброванные мясные отруба Недели 1: 192 кг (окорок S1/S2, грудинка S4, ребра, шпик S8, говядина R1, конина Жая)', '🥛 Сырое фермерское молоко (Партия №1): 210 л -> контроль «Эксперт Профи» + Hanna pH (6.65–6.75)', '🌶️ Месячный буфер специй: 48,3 кг', '📦 Месячный запас упаковки ($780 / 14 рулонов ТермоТОП)', '🌾 Мука пшеничная в/с, ржаная и солод: 500 кг'],
    2: ['🌶️ Свежие перцы чили, халапеньо и чеснок: 25 кг под закладку на ферментацию Шрирачи и Табаско'],
    4: ['🥛 Сырое молоко №2: 210 л в ванны Casaro', '🍺 Загрузка Колдрума (+2...+4 °C): свежие кеги к уикенду'],
    8: ['🥩 Калиброванные мясные отруба Недели 2: 192 кг', '🥛 Сырое молоко №3: 210 л + чеснок и овощи'],
    11: ['🥛 Сырое молоко №4: 210 л', '🍺 Пополнение Колдрума кегами к пятничному пику'],
    15: ['🥩 Калиброванные мясные отруба Недели 3: 192 кг', '🥛 Сырое молоко №5: 210 л + мука 500 кг'],
    18: ['🥛 Сырое молоко №6: 210 л + кеги крафтового пива'],
    22: ['🥩 Калиброванные мясные отруба Недели 4: 192 кг', '🥛 Сырое молоко №7: 210 л'],
    25: ['🥛 Сырое молоко №8: 210 л + кеги пива'],
    29: ['🥩 Финальная поставка мяса: 192 кг (закрытие месячной квоты 960 кг)', '🥛 Сырое молоко №9: 220 л (закрытие 1 900 л)']
  };

  // База 24 линий GIANT
  readonly giantLines = signal<GiantLineItem[]>([
    { plu:'PLU-01', eanPrefix:'220001', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'ФЕРМЕРЛІК ҚАЙМАҚ / СМЕТАНА 20%', subTitle:'[ ТЕРМОСТАТТЫ / ТЕРМОСТАТНАЯ ]', name:'Сметана фермерская 20%', monthlyKg:140, monthlyUnits:400, packG:350, priceKg:3400, prot:2.8, fat:20.0, carb:3.2, shelfDays:14, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[1,4,8,11,15,18,22,25,29], cycleDays:2, shortRisk:true, pivotRatio:0.35, pivotAction:'Перевод 35% сливок на Пломбир (PLU-07, 60 сут.)', kzPair:'Ұсыныс: BEERMOOD үй борщы мен сүзбе құймақтарына тамаша', ruPair:'Пара: к свежим сырникам и горячему борщу Суп-Кит BEERMOOD', comp:'нормализ. кілегей/сливки, тірі сүт қышқылды ұйытқысы/закваска.' },
    { plu:'PLU-02', eanPrefix:'220002', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'ФЕРМЕРЛІК СҮЗБЕ / ТВОРОГ 9%', subTitle:'[ ҚАТПАРЛЫ / ПЛАСТОВОЙ ]', name:'Творог пластовой 9%', monthlyKg:140, monthlyUnits:400, packG:385, priceKg:3200, prot:16.6, fat:9.1, carb:2.8, shelfDays:7, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[1,4,8,11,15,18,22,25,29], cycleDays:2, shortRisk:true, pivotRatio:0.40, pivotAction:'Снятие 40% калье -> формовка шариков Белпер Кнолле (PLU-06, 60 сут.)', kzPair:'Ұсыныс: MEAT & BREAD MOOD тартинімен бал қосылған таңғы асқа', ruPair:'Пара: к завтраку с медом на подовом тартине MEAT & BREAD', comp:'нормализ. сүт/молоко, тірі сүт қышқылды ұйытқысы/закваска.' },
    { plu:'PLU-03', eanPrefix:'220003', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'АДЫГЕЙ ІРІМШІГІ / СЫР АДЫГЕЙСКИЙ', subTitle:'[ ЖҰМСАҚ / ТЕРМОКИСЛОТНЫЙ ]', name:'Сыр Адыгейский термокислотный', monthlyKg:45, monthlyUnits:150, packG:300, priceKg:4800, prot:19.8, fat:19.5, carb:1.5, shelfDays:30, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[2,5,9,12,16,19,23,26,30], cycleDays:1, shortRisk:false, pivotRatio:0.25, pivotAction:'Копчение головок ольхой в Ижица Varmen Mini и отдача на гриль кухни паба', kzPair:'Ұсыныс: сары майға қуырып, MEAT & BREAD тартинімен ұсыныңыз', ruPair:'Пара: обжарить на сливочном масле к свежему тартину MEAT & BREAD', comp:'пастерленген сүт/молоко, ашыған сарысу/сыворотка, теңіз тұзы.' },
    { plu:'PLU-04', eanPrefix:'220004', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'СУЛУГУНИ ІРІМШІГІ / СЫР СУЛУГУНИ', subTitle:'[ PASTA FILATA / ВЫТЯЖНОЙ ]', name:'Сыр Сулугуни Pasta Filata и Страчателла', monthlyKg:80, monthlyUnits:200, packG:350, priceKg:5400, prot:20.5, fat:22.0, carb:0.8, shelfDays:45, temp:'(4±2)°C', supplyDays:[1,4,8,11,15,18,22,25,29], prodDays:[2,4,9,11,16,18,23,25,30], cycleDays:2, shortRisk:false, pivotRatio:0.30, pivotAction:'Сокращение Страчателлы в пользу вакуумного Сулугуни (45 сут.) и жарки в пабе', kzPair:'Ұсыныс: MEAT & BREAD MOOD тартині мен мортаделла тосттарына', ruPair:'Пара: к горячим тостам на тартине и мортаделле MEAT & BREAD', comp:'табиғи сүт/молоко, термофильді ұйытқы, фермент, тұз.' },
    { plu:'PLU-06', eanPrefix:'220006', brand:'CHEESY MOOD', dept:'CHEESY MOOD', kzTitle:'БЕЛПЕР КНОЛЛЕ / СЫР В ПЕРЦЕ', subTitle:'[ ШВЕЙЦАР ӘДІСІ / ВЫДЕРЖАННЫЙ ]', name:'Сыр Белпер Кнолле в черном перце', monthlyKg:30, monthlyUnits:100, packG:160, priceKg:9500, prot:25.0, fat:26.0, carb:0.5, shelfDays:60, temp:'(10±2)°C', supplyDays:[1,8,15,22], prodDays:[3,10,17,24], cycleDays:21, shortRisk:false, isBuffer:true, bonusKg:56, pivotAction:'БУФЕР-АККУМУЛЯТОР: принимает +56 кг творожного калье с PLU-02 на 60 суток', kzPair:'Ұсыныс: ыстық пастаға, стейкке және MEAT & BREAD билтонгына', ruPair:'Пара: натереть стружкой на пасту, стейк или к билтонгу MEAT & BREAD', comp:'сүт/молоко, ұйытқы, балғын сарымсақ/чеснок, қара бұрыш, гималай тұзы.' },
    { plu:'PLU-10', eanPrefix:'220010', brand:'MEAT & BREAD MOOD', dept:'Пекарня MEAT&BREAD', kzTitle:'БИДАЙ ТАРТИН НАНЫ / ТАРТИН ПОДОВЫЙ', subTitle:'[ ТІРІ АШЫТҚЫ / ЖИВАЯ ЗАКВАСКА ]', name:'Тартин подовый на живой закваске', monthlyKg:520, monthlyUnits:800, packG:650, priceKg:925, prot:8.5, fat:1.2, carb:49.0, shelfDays:3, temp:'(18±3)°C', supplyDays:[1,15], prodDays:Array.from({length:30},(_,i)=>i+1), cycleDays:2, shortRisk:true, pivotRatio:0.15, pivotAction:'Выпечка строго по предоплате Telegram до 19:00', kzPair:'Ұсыныс: CHEESY MOOD Страчателласы мен фисташкалы мортаделламен', ruPair:'Пара: со сливочным маслом, Страчателлой CHEESY MOOD и мортаделлой', comp:'бидай ұны т/с, табиғи ашытқы Levain, ірімшік сарысуы, теңіз тұзы.' },
    { plu:'PLU-20', eanPrefix:'220020', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'ВЕНА ШҰЖЫҚШАСЫ / СОСИСКИ ВЕНСКИЕ', subTitle:'[ ТАБИҒИ ҚАБЫҚША / БУКОВЫЙ ДЫМ ]', name:'Сосиски Венские в/к (Кох 3-135)', monthlyKg:80, monthlyUnits:210, packG:380, priceKg:5800, prot:13.5, fat:22.0, carb:1.2, shelfDays:20, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[2,9,16,23,30], cycleDays:2, shortRisk:false, pivotRatio:0.25, pivotAction:'Отдача в горячие пивные сковородки паба и Солянку', kzPair:'Ұсыныс: балды қыша мен жылы MEAT & BREAD чиабаттасымен', ruPair:'Пара: с медово-зернистой горчицей и теплой чиабаттой MEAT & BREAD', comp:'сиыр еті R1, шошқа еті S2, кілегей, нитритті тұз, мускат жаңғағы.' },
    { plu:'PLU-23', eanPrefix:'220023', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'МОРТАДЕЛЛА ФИСТАШКАМЕН / В/К', subTitle:'[ ИТАЛЬЯН ТАСIЛI / ЭМУЛЬСИЯ ]', name:'Мортаделла с фисташкой (Кох 3-030)', monthlyKg:80, monthlyUnits:360, packG:220, priceKg:7200, prot:14.0, fat:28.0, carb:1.0, shelfDays:15, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[2,9,16,23,30], cycleDays:2, shortRisk:true, pivotRatio:0.50, pivotAction:'Снижение выпуска на 50% в пользу Сервелата и Пивчиков (30 сут.)', kzPair:'Ұсыныс: CHEESY MOOD Страчателласымен сэндвичке тамаша', ruPair:'Пара: идеально к сэндвичам со Страчателлой CHEESY MOOD на тартине', comp:'шошқа еті S1, шпик S8 кубик, бүтін фисташка, ақ бұрыш, мацис.' },
    { plu:'PLU-25', eanPrefix:'220025', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'ЫСТАЛҒАН ҚАБЫРҒА / РЕБРА СВИНЫЕ К/В', subTitle:'[ SMOKED BBQ RUB / ГОРЯЧЕЕ КОПЧЕНИЕ ]', name:'Ребра свиные к/в к пиву (Кох 1-002)', monthlyKg:130, monthlyUnits:290, packG:300, priceKg:6500, prot:16.0, fat:24.0, carb:2.0, shelfDays:20, temp:'(4±2)°C', supplyDays:[1,8,15,22,29], prodDays:[4,5,11,12,18,19,25,26], cycleDays:4, shortRisk:false, pivotRatio:0.25, pivotAction:'Глазирование соусом Пири-Пири / BBQ под пятничный гриль в зале', kzPair:'Ұсыныс: грильде жылытып, Пири-Пири тұздығымен ұсыныңыз', ruPair:'Пара: разогреть на гриле с фирменным соусом Пири-Пири (PLU-32)', comp:'шошқа қабырғасы, нитритті тұз, Smoked BBQ Rub (паприка, тимьян).' },
    { plu:'PLU-27', eanPrefix:'220027', brand:'MEAT & BREAD MOOD', dept:'Мясной цех MEAT&BREAD', kzTitle:'СИЫР БИЛТОНГЫ / БИЛТОНГ ГОВЯДИНА С/В', subTitle:'[ ОҢТҮСТІК АФРИКА ӘДІСІ / ВЯЛЕНЫЙ ]', name:'Билтонг из говядины с/в (70% квоты)', monthlyKg:84, monthlyUnits:560, packG:50, priceKg:16000, prot:42.0, fat:6.5, carb:1.5, shelfDays:60, temp:'(10±2)°C', supplyDays:[1,8,15,22,29], prodDays:[1,8,15,22,29], cycleDays:8, shortRisk:false, isBuffer:true, bonusKg:20, pivotAction:'БУФЕР-СТАБИЛИЗАТОР (60 сут.): поглощает излишки постной говядины R1', kzPair:'Ұсыныс: CHEESY MOOD Белпер Кнолле ірімшігімен тамаша үйлесім', ruPair:'Пара: к выдержанному сыру Белпер Кнолле CHEESY MOOD', comp:'сиыр еті R1, алма сірке суы, қуырылған кориандр, қара бұрыш, тұз.' }
  ]);

  // ПОЛНАЯ БАЗА ПОШАГОВЫХ ТЕХКАРТ ХАССП ДЛЯ ВЫЕЗЖАЮЩЕЙ ПАНЕЛИ
  readonly detailedTechCards = signal<DetailedTechCard[]>([
    {
      plu: 'PLU-02',
      name: 'Творог фермерский пластовой 9%',
      brand: 'CHEESY MOOD',
      dept: 'Сыроварня (Casaro 100 л)',
      outputNorm: '15,5 кг из 100 л молока (40 контейнеров по 385 г)',
      equipment: 'Сыроварня Casaro 100 л, pH-метр Hanna Foodcare, анализатор Эксперт Профи, лавсановые мешки, стол прессования',
      rawMaterials: [
        { name: 'Молоко фермерское сырое (КХ Береке)', amount: '100,0 л', note: 'Белок ≥ 3,2%, Жир 4,2%, СОМО ≥ 8,8%, pH 6,68' },
        { name: 'Закваска мезофильная Lactococcus lactis', amount: '4,0 г', note: 'Прямое внесение DVS при 30 °C' },
        { name: 'Раствор хлористого кальция 10% (CaCl₂)', amount: '20,0 г (200 мл)', note: 'Восстановление баланса ионов кальция' },
        { name: 'Сычужный фермент натуральный (микродоза)', amount: '0,3 г', note: 'Для формирования эластичного пластового зерна' }
      ],
      steps: [
        { id: 1, title: 'Входной биоконтроль сырья', desc: 'Замер на анализаторе «Эксперт Профи» и pH-метре Hanna. Печать акта приемки TEST-OK на TSC TE310 до слива молока в ванну.', ccpHaccp: 'ККТ-1 (Входное сырье: антибиотики отс., вода 0,0%)', tempTime: 't = 20...22 °C, pH 6,65–6,75', done: false },
        { id: 2, title: 'Мягкая пастеризация', desc: 'Нагрев в рубашке ванны Casaro до 72–74 °C с выдержкой 20 секунд. Смерть патогенной микрофлоры.', ccpHaccp: 'ККТ-2 (Термообработка)', tempTime: '72–74 °C, выдержка 20 сек', done: false },
        { id: 3, title: 'Охлаждение и внесение заквасок', desc: 'Подача ледяной воды в рубашку Casaro, сброс температуры до 28–30 °C. Внесение CaCl₂, закваски L. lactis и микродозы сычужного фермента.', tempTime: 't = 28–30 °C', done: false },
        { id: 4, title: 'Кислотно-сычужная коагуляция', desc: 'Сквашивание молока в покое 8–10 часов до образования плотного пластового калье и достижения целевого pH.', ccpHaccp: 'ККТ-3 (Кислотность калье: pH ≤ 4,65)', tempTime: 't = 26–28 °C, 8–10 ч', done: false },
        { id: 5, title: 'Разрезка сгустка и бережный подогрев', desc: 'Разрезка вертикальной и горизонтальной лирами Casaro на кубики 2×2 см. Выдержка 15 мин, плавный подогрев до 38 °C для отделения сыворотки.', tempTime: 't = 36–38 °C', done: false },
        { id: 6, title: 'Самопрессование и созревание', desc: 'Слив зерна в лавсановые мешки на стол прессования. Самопрессование 3–4 часа при +4 °C. Сбор сыворотки в бак пекарни.', tempTime: '+4 °C, 4 часа', done: false },
        { id: 7, title: 'Фасовка и маркировка (Пост Масса-К + TSC TE310)', desc: 'Укладка пластов творога по 385 г в контейнеры под запайку. Взвешивание на Масса-К, печать двуязычной этикетки Вариант №2 с QR-кодом партии.', ccpHaccp: 'ККТ-4 (Маркировка и срок: 7 суток)', tempTime: '+2...+4 °C', done: false }
      ],
      packagingRule: 'Контейнер 500 мл под запайку барьерной пленкой, этикетка ТермоТОП 58×60 мм (Вариант №2)',
      storageNorm: 'Хранить при температуре (4±2) °C. Срок годности: 7 суток'
    },
    {
      plu: 'PLU-23',
      name: 'Мортаделла Болонская с цельной фисташкой',
      brand: 'MEAT & BREAD MOOD',
      dept: 'Мясной цех (Ижица Varmen Mini)',
      outputNorm: '18,4 кг готовых батонов из 20 кг сырья (выход 92%)',
      equipment: 'Волчок-мясорубка, куттер вакуумный, шприц гидравлический 5 кг, термокамера Ижица Varmen Mini, душирующий душ',
      rawMaterials: [
        { name: 'Свинина постная жилованная S1', amount: '15,0 кг', note: 'Окорок без соединительной ткани (t = 0...+2 °C)' },
        { name: 'Шпик хребтовой плотный S8', amount: '4,0 кг', note: 'Кубик 8×8 мм, ошпаренный кипятком и охлажденный' },
        { name: 'Фисташка зеленая очищенная цельная', amount: '1,0 кг', note: 'Бланшированная в кипятке 2 мин' },
        { name: 'Лед чешуйчатый (+1 °C)', amount: '4,0 кг', note: '20% к массе постного мяса' },
        { name: 'Нитритная смесь + фосфат + мацис + белый перец', amount: '540 г', note: 'По нормам справочника Г. Коха 3-030' }
      ],
      steps: [
        { id: 1, title: 'Жиловка и измельчение мяса S1', desc: 'Пропуск подмороженной свинины S1 через решетку волчка 3 мм. Подготовка кубика шпика S8 (8 мм) и его ошпаривание.', tempTime: 't сырья = -1...+1 °C', done: false },
        { id: 2, title: 'Куттерование мышечной эмульсии со льдом', desc: 'Куттерование фарша S1 с внесением нитритной соли, фосфатов и чешуйчатого льда (+1 °C) до шелковистой эмульсии. Контроль температуры эмульсии не выше +11 °C!', ccpHaccp: 'ККТ-1 (Температура куттерования ≤ +11 °C)', tempTime: 't фарша ≤ +11 °C', done: false },
        { id: 3, title: 'Вмешивание шпика и фисташки', desc: 'Внесение ошпаренного холодного шпика S8 и цельной фисташки на малых оборотах куттера (или в фаршемешалке) до равномерного распределения мозаики.', done: false },
        { id: 4, title: 'Шприцевание в полиамидную оболочку', desc: 'Набивка шприцем 5 кг в барьерную оболочку калибра 80–90 мм без воздушных пор. Клипсование и вязка батонов шпагатом.', done: false },
        { id: 5, title: 'Осадка батонов', desc: 'Вывешивание рам с батонами в камере осадки при +2...+4 °C для созревания фарша и связывания миофибриллярных белков.', tempTime: '+2...+4 °C, 4 часа', done: false },
        { id: 6, title: 'Варка паром в камере Ижица Varmen Mini', desc: 'Прогрев камеры до 80 °C со 100% паром. Варка до достижения целевой температуры внутри батона.', ccpHaccp: 'ККТ-2 (Пастеризация центра: +71...+72 °C)', tempTime: 'Камера 80 °C -> Центр +72 °C', done: false },
        { id: 7, title: 'Ледяное водяное душирование', desc: 'Орошение рам ледяной водой из душирующего устройства для резкого сброса температуры с +72 °C до +25 °C и исключения сморщивания оболочки.', tempTime: 'Вода +10 °C, 25 мин', done: false },
        { id: 8, title: 'Слайсерная нарезка и вакуумирование', desc: 'Сервировочная нарезка ломтиками 1,0 мм на слайсере, укладка веером по 220 г на металлизированную подложку, вакуумирование и маркировка на TSC TE310.', ccpHaccp: 'ККТ-3 (Остаточный кислород ≤ 0,5%)', tempTime: '+2...+6 °C', done: false }
      ],
      packagingRule: 'Вакуумный пакет PA/PE 200×300 мм, нарезка 220 г, этикетка 58×60 мм (Вариант №2)',
      storageNorm: 'Хранить при температуре (4±2) °C. Срок годности: 15 суток'
    },
    {
      plu: 'PLU-10',
      name: 'Тартин подовый ремесленный на живой закваске',
      brand: 'MEAT & BREAD MOOD',
      dept: 'Пекарня (Unox)',
      outputNorm: '30 подовых буханок по 650 г из 14,8 кг муки',
      equipment: 'Спиральный тестомес, ротанговые банетоны, камера холодной расстойки (+4 °C), пароконвектомат Unox с подом',
      rawMaterials: [
        { name: 'Мука пшеничная в/с (W 300, белок 13%)', amount: '12,6 кг', note: '85% Baker\'s Formula' },
        { name: 'Мука пшеничная цельнозерновая', amount: '2,2 кг', note: '15% Baker\'s Formula' },
        { name: 'Сыворотка CHEESY MOOD + вода (50/50)', amount: '11,1 л', note: '75% гидратация (Zero-Waste синергия)' },
        { name: 'Закваска Levain (100% гидратации)', amount: '3,0 кг', note: '20% к массе муки, на пике подъема' },
        { name: 'Морская соль мелкая', amount: '325 г', note: '2,2% Baker\'s Formula' }
      ],
      steps: [
        { id: 1, title: 'Освежение закваски Levain', desc: 'Подкормка материнской закваски смесью муки и воды 1:2:2 за 5 часов до замеса теста. Достижение пика объема.', tempTime: 't = 25 °C, 5 часов', done: false },
        { id: 2, title: 'Автолиз теста', desc: 'Смешивание муки с охлажденной подсырной сывороткой и водой в тестомесе на 1 скорости без соли и закваски. Набухание белков.', tempTime: 't воды = 18 °C, 45 мин', done: false },
        { id: 3, title: 'Внесение закваски и соли', desc: 'Ввод закваски Levain и морской соли. Замес на 2 скорости до образования гладкого шелковистого теста и глютенового окна.', done: false },
        { id: 4, title: 'Основное брожение с обминками (Stretch & Fold)', desc: 'Брожение в гастроемкостях при 24 °C в течение 3,5 часов с 4 циклами растягивания и складывания каждые 45 минут.', tempTime: 't = 24 °C, 3,5 часа', done: false },
        { id: 5, title: 'Предформовка и формовка буханок', desc: 'Округление заготовок по 740 г (упек 12%), отдых 20 мин на столе. Окончательная формовка в овальные батарды и укладка в банетоны.', done: false },
        { id: 6, title: 'Ночная холодная ферментация', desc: 'Выдержка корзин в холодильной камере при +4...+6 °C в течение 14–16 часов для накопления молочной кислоты и аромата.', ccpHaccp: 'ККТ-1 (Холодная расстойка: t ≤ +6 °C)', tempTime: '+4...+6 °C, 14–16 ч', done: false },
        { id: 7, title: 'Надрез и выпечка в печи Unox с паром', desc: 'Утренняя смена 05:30: опрокидывание заготовок на лопату, продольный надрез лезвием под 45°. Выпечка с паром 15 мин при 250 °C, затем 215 °C на сухом жару 22 мин.', ccpHaccp: 'ККТ-2 (Готовность мякиша: 96–98 °C внутри)', tempTime: 'Печь 250 °C -> Центр 98 °C', done: false }
      ],
      packagingRule: 'Перфорированный крафт-пакет с окном, этикетка-стикер ТермоТОП',
      storageNorm: 'Хранить при температуре (18±3) °C. Срок годности: 72 часа'
    }
  ]);

  // Вычисляемая текущая подробная техкарта
  currentDetailedCard = computed<DetailedTechCard>(() => {
    const plu = this.activeTechCardPlu();
    const found = this.detailedTechCards().find(c => c.plu === plu);
    if (found) return found;
    // Дефолтная карточка, если специфическая не создана
    const line = this.giantLines().find(x => x.plu === plu) || this.giantLines()[0];
    return {
      plu: line.plu,
      name: line.name,
      brand: line.brand,
      dept: line.dept,
      outputNorm: \`\${line.monthlyKg} кг в месяц\`,
      equipment: 'Стандартная линия цеха ЖК Арай',
      rawMaterials: [{ name: 'Базовое сырье по спецификации', amount: '100%' }],
      steps: [
        { id: 1, title: 'Приемка и контроль сырья', desc: 'Проверка сопроводительных документов и биоконтроль.', done: false },
        { id: 2, title: 'Технологическая обработка', desc: line.pivotAction, done: false },
        { id: 3, title: 'Фасовка и маркировка TSC TE310', desc: 'Контрольное взвешивание и печать этикетки.', done: false }
      ],
      packagingRule: 'Индивидуальная потребительская упаковка',
      storageNorm: \`Режим: \${line.temp}, срок: \${line.shelfDays} суток\`
    };
  });

  // Процент выполнения шагов текущей техкарты
  cardProgressPct = computed<number>(() => {
    const card = this.currentDetailedCard();
    if (!card.steps.length) return 0;
    const doneCount = card.steps.filter(s => s.done).length;
    return Math.round((doneCount / card.steps.length) * 100);
  });

  constructor() {
    this.loadStepsState();
    effect(() => {
      this.saveStepsState();
    });
  }

  openTechCardDrawer(plu: string): void {
    this.activeTechCardPlu.set(plu);
    this.drawerOpen.set(true);
  }

  closeTechCardDrawer(): void {
    this.drawerOpen.set(false);
  }

  toggleStepDone(stepId: number): void {
    const card = this.currentDetailedCard();
    const step = card.steps.find(s => s.id === stepId);
    if (step) {
      step.done = !step.done;
      this.detailedTechCards.set([...this.detailedTechCards()]);
    }
  }

  resetCurrentCardSteps(): void {
    const card = this.currentDetailedCard();
    card.steps.forEach(s => s.done = false);
    this.detailedTechCards.set([...this.detailedTechCards()]);
  }

  private loadStepsState(): void {
    try {
      const raw = localStorage.getItem(LS_KEY_STEPS);
      if (raw) {
        const saved = JSON.parse(raw);
        this.detailedTechCards().forEach(card => {
          if (saved[card.plu]) {
            card.steps.forEach(s => {
              if (saved[card.plu][s.id] !== undefined) s.done = saved[card.plu][s.id];
            });
          }
        });
      }
    } catch {}
  }

  private saveStepsState(): void {
    try {
      const dump: Record<string, Record<number, boolean>> = {};
      this.detailedTechCards().forEach(card => {
        dump[card.plu] = {};
        card.steps.forEach(s => dump[card.plu][s.id] = s.done);
      });
      localStorage.setItem(LS_KEY_STEPS, JSON.stringify(dump));
    } catch {}
  }

  async initConnection(): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.get<any>(\`\${environment.apiUrl}?action=status\`));
      if (res?.status === 'ok') this.syncStatus.set(\`🟢 Подключено: \${res.server}\`);
    } catch {
      this.syncStatus.set('💻 Локальный стенд VS Code (LocalStorage DB)');
    }
  }

  async sendTsplToPrinterOrServer(tspl: string, plu: string, batch: string, massKg: number, totalKzt: number): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(\`\${environment.apiUrl}/print?action=print\`, {
          ip: this.printerIp(),
          port: 9100,
          tspl,
          plu,
          batch,
          massKg,
          totalKzt
        })
      );
      this.lastPrintMsg.set(res?.message || 'Отправлено');
    } catch {
      this.lastPrintMsg.set('Мост не запущен (выполните npm run bridge или скопируйте команду Терминала)');
    }
  }
}
`,

  // =========================================================================
  // 6. СТИЛИ (ВКЛЮЧАЯ АНИМИРОВАННЫЙ OFFCANVAS DRAWER ПРАВОЙ ПАНЕЛИ)
  // =========================================================================
  'src/styles.css': `:root {
  --bg: #0b0f14;
  --panel: #151b23;
  --panel-alt: #1c2430;
  --card: #18202a;
  --border: #2d3846;
  --text: #e6edf3;
  --muted: #8b949e;
  --amber: #f0883e;
  --blue: #388bfd;
  --green: #2ea043;
  --warn: #d29922;
  --red: #f85149;
  --purple: #a371f7;
  --cheese: #f59e0b;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  line-height: 1.45;
  overflow-x: hidden;
}
.top-bar { background: linear-gradient(90deg, #090d12 0%, #16202c 100%); border-bottom: 1px solid var(--border); padding: 12px 22px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; }
.top-title { font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.badge-main { background: var(--amber); color: #000; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
.nav-tabs { display: flex; background: var(--panel); border-bottom: 1px solid var(--border); padding: 0 20px; gap: 4px; overflow-x: auto; }
.nav-tab { padding: 12px 16px; cursor: pointer; font-weight: 700; font-size: 13px; color: var(--muted); border: none; background: transparent; border-bottom: 3px solid transparent; white-space: nowrap; transition: 0.15s; }
.nav-tab:hover { color: var(--text); }
.nav-tab.active { color: var(--amber); border-bottom-color: var(--amber); background: rgba(240, 136, 62, 0.08); }
.workspace { max-width: 1660px; margin: 0 auto; padding: 16px 20px 60px; }
.kpi-strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi-card { background: var(--panel); border: 1px solid var(--border); padding: 11px 14px; border-radius: 8px; }
.kpi-title { color: var(--muted); font-size: 11px; text-transform: uppercase; }
.kpi-val { font-size: 17px; font-weight: 800; margin-top: 4px; color: #fff; }
.kpi-sub { font-size: 11px; color: #58a6ff; margin-top: 2px; }
.card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 15px 18px; margin-bottom: 16px; }
.card h3 { margin: 0 0 12px 0; font-size: 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.btn { background: var(--amber); color: #000; border: none; padding: 7px 13px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; transition: 0.15s; }
.btn:hover { filter: brightness(1.1); }
.btn-outline { background: var(--panel-alt); color: var(--text); border: 1px solid var(--border); }
.btn-outline.active { background: var(--amber); color: #000; border-color: var(--amber); }
.btn-purple { background: rgba(163, 113, 247, 0.16); color: #d2a8ff; border: 1px solid var(--purple); }
.btn-purple.active { background: var(--purple); color: #000; box-shadow: 0 0 12px rgba(163, 113, 247, 0.5); }
.btn-green { background: var(--green); color: #fff; }
.btn-sm { padding: 3px 8px; font-size: 11px; }
input, select { background: var(--panel-alt); color: var(--text); border: 1px solid var(--border); padding: 6px 9px; border-radius: 6px; font-size: 12.5px; }
.plu-tag { background: #263342; color: #79c0ff; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 10.5px; font-weight: 700; }
.pill { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 700; }
.pill-ok { background: rgba(46, 160, 67, 0.2); color: #7ee787; }
.pill-warn { background: rgba(210, 153, 34, 0.25); color: #e3b341; }
.pill-crit { background: rgba(248, 81, 73, 0.25); color: #ffa198; }
.pill-pivot { background: rgba(163, 113, 247, 0.25); color: #d2a8ff; }
.legend-bar { display: flex; flex-wrap: wrap; gap: 16px; padding: 8px 14px; background: #10161d; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; font-size: 11.5px; color: var(--muted); }
.dot { width: 11px; height: 11px; border-radius: 3px; display: inline-block; vertical-align: middle; margin-right: 4px; }
.giant-wrap { overflow-x: auto; max-height: 520px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 16px; }
table.giant-table { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 1400px; }
.giant-table th, .giant-table td { border: 1px solid #232d38; text-align: center; height: 31px; padding: 0; font-size: 11px; }
.giant-table thead th { position: sticky; top: 0; background: #17212c; z-index: 10; color: var(--muted); }
.col-prod { width: 265px; text-align: left !important; padding: 3px 10px !important; position: sticky; left: 0; background: #141c25; z-index: 5; cursor: pointer; }
.giant-table thead th.col-prod { z-index: 15; }
.col-meta { width: 84px; background: #131b23; }
.col-stat { width: 135px; background: #131b23; }
.d-cell { width: 28px; cursor: pointer; font-weight: 700; font-size: 10px; user-select: none; }
.d-cell:hover { outline: 1.5px solid #fff; z-index: 4; }
.d-head-cur { background: var(--amber) !important; color: #000 !important; }
.d-col-cur { box-shadow: inset 0 0 0 1.5px var(--amber); }
.c-sup { background: rgba(56, 139, 253, 0.35); color: #79c0ff; }
.c-prd { background: var(--amber); color: #000; font-weight: 800; }
.c-sp { background: linear-gradient(135deg, #388bfd 45%, #f0883e 55%); color: #000; font-weight: 800; }
.c-ok { background: rgba(46, 160, 67, 0.26); color: #7ee787; }
.c-wrn { background: rgba(210, 153, 34, 0.35); color: #e3b341; }
.c-crt { background: rgba(248, 81, 73, 0.45); color: #ffa198; }
.c-pvt { background: rgba(163, 113, 247, 0.42); color: #e2c5ff; }
.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 16px; }
.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 16px; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 18px; }
.tech-card { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
.tech-card:hover { border-color: var(--amber); }
.mini-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 5px; }
.mini-table th, .mini-table td { padding: 5px 6px; border-bottom: 1px solid #242f3c; text-align: left; }
.mini-table td:last-child { text-align: right; font-weight: 700; color: var(--amber); }
.brine-subbox { background: rgba(56, 139, 253, 0.09); border-left: 3px solid var(--blue); padding: 9px 11px; border-radius: 5px; margin-top: 10px; font-size: 11.5px; }
.steps-subbox { background: rgba(245, 158, 11, 0.08); border-left: 3px solid var(--cheese); padding: 9px 11px; border-radius: 5px; margin-top: 10px; font-size: 11.5px; }
.econ-subbox { background: #10161d; border: 1px solid #283442; border-radius: 8px; padding: 11px 12px; margin-top: 12px; }
.tspl-pre { background: #080b0f; color: #7ee787; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 11px; white-space: pre-wrap; border: 1px solid #26303c; overflow-x: auto; }

/* =========================================================================
   ПРАВАЯ ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ (OFFCANVAS DRAWER)
   ========================================================================= */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}
.drawer-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 580px;
  max-width: 90vw;
  height: 100vh;
  background: #141a22;
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.7);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.drawer-header {
  padding: 16px 20px;
  background: #0d1217;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.drawer-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}
.drawer-footer {
  padding: 14px 20px;
  background: #0d1217;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 10px;
}
.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: var(--panel-alt);
  border-radius: 4px;
  overflow: hidden;
  margin: 10px 0 16px 0;
  border: 1px solid var(--border);
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #f0883e, #2ea043);
  transition: width 0.3s ease;
}
.step-item {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
  transition: border-color 0.15s, background 0.15s;
}
.step-item.is-done {
  border-color: var(--green);
  background: rgba(46, 160, 67, 0.08);
}
.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.step-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--green);
  cursor: pointer;
}
.step-badge-haccp {
  background: rgba(248, 81, 73, 0.2);
  color: #ffa198;
  border: 1px solid var(--red);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 700;
  margin-top: 4px;
  display: inline-block;
}
.step-badge-temp {
  background: rgba(56, 139, 253, 0.2);
  color: #79c0ff;
  border: 1px solid var(--blue);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10.5px;
  font-weight: 700;
  margin-top: 4px;
  display: inline-block;
}
`
};

// =========================================================================
// 7. СБОРКА И ПЕРЕНОС В СТРУКТУРУ ФАЙЛОВ
// =========================================================================
for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

console.log('✅ MOOD GROUP MASTER ERP v3.1 успешно обновлен в: ' + projectRoot);
console.log('👉 Запуск:');
console.log('   cd beermood-master-erp-v3');
console.log('   npm start');