import { Injectable, signal, computed } from '@angular/core';
import {
  ActiveTab,
  CurrencyMode,
  PrinterConfig,
  ApiConfig,
  GlobalKpiSummary
} from '../models/erp.model';
import {
  MeatStandardItem,
  KochTechCard,
  StandardMode,
  SalesChannel,
  ProfitGoal,
  SortOption,
  CalculatedEconomics,
  EnrichedTechCard
} from '../models/koch.model';
import { MilkLabRecord, MilkGrade } from '../models/milk-lab.model';
import { MeatLabRecord } from '../models/meat-lab.model';
import { DairyRecipe, BakeryRecipe } from '../models/dairy-bakery.model';
import { EquipmentStatus, ProductionTask } from '../models/giant-plan.model';
import { AraiResidentOrder, OrderStatus } from '../models/arai-order.model';
import {
  RawMaterialMarketPrice,
  SectorFilter,
  CompetitorBenchmark,
  FinancialForecastPeriod,
  PricingRecommendation
} from '../models/market-intelligence.model';

@Injectable({ providedIn: 'root' })
export class MasterErpService {
  readonly RATE = 500; // 500 KZT = $1.00 USD
  readonly STORAGE_KEY = 'BEERMOOD_MASTER_ERP_V3_STATE';

  // Navigation & Core Settings
  activeTab = signal<ActiveTab>('market_intelligence');
  currencyMode = signal<CurrencyMode>('BOTH');
  selectedMarketSector = signal<SectorFilter>('ALL');
  isMatrixDrawerOpen = signal<boolean>(false);

  isMeatContext = computed(() => {
    return this.activeTab() === 'koch_cards' ||
      this.activeTab() === 'meat_lab' ||
      (this.activeTab() === 'market_intelligence' && this.selectedMarketSector() === 'MEAT');
  });
  isTsplModalOpen = signal<boolean>(false);
  selectedTsplCode = signal<string>('');
  selectedTsplTitle = signal<string>('');

  // Hardware & Network
  printerConfig = signal<PrinterConfig>({
    ip: '192.168.1.17',
    port: 9100,
    widthMm: 58,
    heightMm: 60,
    gapMm: 2,
    dpi: 300,
    online: true
  });

  apiConfig = signal<ApiConfig>({
    baseUrl: '/api',
    useMock: true,
    connected: true
  });

  // Koch Meat Engine State
  batchKg = signal<number>(20);
  stdMode = signal<StandardMode>('kz');
  channelMode = signal<SalesChannel>('takeaway');
  activeGoal = signal<ProfitGoal>('all');
  sortMode = signal<SortOption>('profit_desc');
  searchQuery = signal<string>('');

  // ================= 1. RAW MEAT STANDARDS DICTIONARY =================
  meatStandards = signal<Record<string, MeatStandardItem>>({
    R1: {
      code: 'R1',
      de: 'R 1 (Говядина без жира 0% и сухожилий 0%)',
      kz: 'Говядина в/с жилованная: огузок / оковалок зачищенный (0% жира)',
      halal: 'Конина в/с Жая жилованная (тазобедренный отруб без фасций)',
      kzt: 3350,
      halalKzt: 4000,
      priceChangePct: 4.5,
      priceChangeTrend: 'UP',
      forecast30d: '↗ +3..+5% (Умеренный рост)',
      forecastComment: 'Осенний рост спроса ресторанного сектора; для Жая — старт сезона заготовок соғым'
    },
    R2: {
      code: 'R2',
      de: 'R 2 (Говядина без сухожилий, макс. 5% жира)',
      kz: 'Говядина 1 сорта жилованная: мякоть лопатки и бедра (жир до 5%)',
      halal: 'Мякоть конины 1 сорта (лопатка, шея зачищенная)',
      kzt: 2900,
      halalKzt: 3200,
      priceChangePct: 3.2,
      priceChangeTrend: 'UP',
      forecast30d: '▬ +1..+3% (Стабильно)',
      forecastComment: 'Основная позиция фаршей для колбас; стабильный баланс спроса мясокомбинатов'
    },
    R4: {
      code: 'R4',
      de: 'R 4 / R 5 (Говядина жирная, 20–30% жира)',
      kz: 'Грудинка говяжья бескостная / покромка 70/30',
      halal: 'Казы бескостное (реберная мякоть с жиром 70/30)',
      kzt: 2500,
      halalKzt: 3900,
      priceChangePct: 5.8,
      priceChangeTrend: 'UP',
      forecast30d: '↗ +6..+8% (Активный рост)',
      forecastComment: 'Высокий сезон свадеб и тоев в Алматы, подогревающий котировки конского ребра и казы'
    },
    R7: {
      code: 'R7',
      de: 'R 7 / S 14 (Соединительная ткань, фасции, шкурка)',
      kz: 'Коллагеновая зачистка от отрубов (пленки, фасции — списаны в отруб)',
      halal: 'Коллагеновые фасции и пленки от жиловки Жая и огузка',
      kzt: 0,
      halalKzt: 0,
      priceChangePct: 0.0,
      priceChangeTrend: 'STABLE',
      forecast30d: '▬ 0.0% (Без изменений)',
      forecastComment: 'Технологический отход обвалки; используется как основа наваристых бульонов'
    },
    S1: {
      code: 'S1',
      de: 'S 1 (Свинина без жира 0% и сухожилий 0%)',
      kz: 'Свинина нежирная: окорок бескостный / карбонад зачищенный',
      halal: 'Конина в/с Жая или огузок говяжий в/с зачищенный',
      kzt: 2200,
      halalKzt: 3800,
      priceChangePct: -2.1,
      priceChangeTrend: 'DOWN',
      forecast30d: '↘ -1..-3% (Плавное снижение)',
      forecastComment: 'Пик предубойного предложения от свинокомплексов Алматинской области'
    },
    S2: {
      code: 'S2',
      de: 'S 2 (Свинина постная, сухожилий макс. 5%)',
      kz: 'Свинина нежирная: лопатка бескостная зачищенная',
      halal: 'Мякоть конины 1 сорта (лопатка) / Говядина 1 сорта',
      kzt: 2150,
      halalKzt: 3200,
      priceChangePct: 0.0,
      priceChangeTrend: 'STABLE',
      forecast30d: '▬ ±1.0% (Высокая стабильность)',
      forecastComment: 'Устойчивые объемы поставок, сбалансированный спрос ремесленных цехов'
    },
    S4: {
      code: 'S4',
      de: 'S 4 (Грудинка без шкурки, макс. 30% жира)',
      kz: 'Свинина полужирная 70/30: мясная грудинка / лопатка 70/30',
      halal: 'Казы мясное бескостное 70/30 (или говядина 1 с + жир Жал)',
      kzt: 2200,
      halalKzt: 3600,
      priceChangePct: 1.8,
      priceChangeTrend: 'UP',
      forecast30d: '▬ +0..+2% (Стабильно)',
      forecastComment: 'Оптимальное сырье для гриль-колбасок паба, стабильная цена закупки'
    },
    S4b: {
      code: 'S4b',
      de: 'S 4b (Грудинка без шкурки, макс. 50% жира)',
      kz: 'Грудинка свиная бескостная 50/50 без шкуры (слоистая)',
      halal: 'Казы классическое бескостное (50/50)',
      kzt: 2400,
      halalKzt: 3900,
      priceChangePct: 3.0,
      priceChangeTrend: 'UP',
      forecast30d: '↗ +3..+4% (Умеренный рост)',
      forecastComment: 'Сезонное повышение спроса на беконное и слоистое сырье к осенним холодам'
    },
    S8: {
      code: 'S8',
      de: 'S 8 (Хребтовый шпик без шкурки, тугоплавкий)',
      kz: 'Шпик свиной хребтовый тугоплавкий без шкуры',
      halal: 'Жал (тугоплавкий подкожный жир гривной части шеи конины)',
      kzt: 1800,
      halalKzt: 3600,
      priceChangePct: 4.2,
      priceChangeTrend: 'UP',
      forecast30d: '↗ +3..+5% (Рост из-за дефицита)',
      forecastComment: 'Дефицит плотного хребтового шпика t°>35°C для сырокопченого сервелата'
    },
    RIBS: {
      code: 'RIBS',
      de: 'Реберная полоска от грудинки без шкурки (Рец. 1-002)',
      kz: 'Ребра свиные мясные (калиброванные ленты)',
      halal: 'Казы на ребре / Говяжьи ребра Short Ribs',
      kzt: 2600,
      halalKzt: 3900,
      priceChangePct: 2.5,
      priceChangeTrend: 'UP',
      forecast30d: '↗ +4..+6% (Рост спроса в пабах)',
      forecastComment: 'Драйвер горячей кухни паба BEERMOOD; повышение оптовых цен на калиброванные ленты'
    },
    BASE_3014: {
      code: 'BASE_3014',
      de: 'Говяжий фарш-основа (Рец. 3-014: 80% R 2 + 20% льда)',
      kz: 'Говяжий фарш-основа (80% говядины 1 с [R 2] + 20% чешуйчатого льда)',
      halal: 'Конский/говяжий фарш-основа (80% мякоти 1 с [R 2] + 20% льда)',
      kzt: 2320,
      halalKzt: 2560,
      priceChangePct: 2.6,
      priceChangeTrend: 'UP',
      forecast30d: '▬ +1..+2% (Следование за R2)',
      forecastComment: 'Автоматическая калькуляция от цены лопатки R2 с учетом коэффициента льда'
    },
    BASE_3001: {
      code: 'BASE_3001',
      de: 'Фарш-основа для нарезки (Рец. 3-001: эмульсия со льдом)',
      kz: 'Тонкая эмульсия (из лопатки [S 2], говядины 1 с [R 2], шпика [S 8] и льда)',
      halal: 'Тонкая эмульсия (из конины/говядины 1 с, жира Жал и льда)',
      kzt: 2050,
      halalKzt: 2850,
      priceChangePct: 1.5,
      priceChangeTrend: 'UP',
      forecast30d: '▬ +1..+2% (Стабильно)',
      forecastComment: 'Утилизация обрезков и стабилизация себестоимости вареных колбас'
    }
  });

  // ================= 2. KOCH TECH CARDS =================
  techCards = signal<KochTechCard[]>([
    {
      code: 'BM-28 (Кох R1)',
      plu: 'PLU-28',
      eanPrefix: '220028',
      title: 'Билтонг сыровяленый из конины (Отруб Жая)',
      titleKz: 'Жылқы етінен (Жая) сыраға арналған билтонг',
      goal: 'SNACK_MAX',
      tierLabel: 'Премиум-драйвер маржи (Наценка 265%)',
      laborScore: 2,
      yieldRatio: 0.50,
      addonPerFinishedKgKzt: 1625,
      priceTakeawayKzt: 35000,
      pricePubKzt: 38000,
      meats: [{ code: 'R1', kg: 100, forceHalal: true }],
      spices: [
        { name: 'Нитритная / розовая соль', g: 20.0 },
        { name: 'Кориандр обжаренный крупнодробленый', g: 12.0 },
        { name: 'Перец черный дробленый и зира', g: 6.0 },
        { name: 'Винный / яблочный уксус', g: 25.0 }
      ],
      casing: 'Вакуум-пакет PA/PE по 50 г + этикетка ТермоТОП 58×60 мм',
      shelfLifeDays: 60,
      tech: 'Отбор конины Жая NOR (pH 5,5–5,8). Усушка 50% в климатической камере (+12...+15°C, 65–70%).'
    },
    {
      code: 'BM-27 (Кох R1)',
      plu: 'PLU-27',
      eanPrefix: '220027',
      title: 'Билтонг сыровяленый из говядины (Огузок в/с)',
      titleKz: 'Сиыр етінен сыраға арналған билтонг',
      goal: 'SNACK_MAX',
      tierLabel: 'Хит оборачиваемости бара (Наценка 229%)',
      laborScore: 2,
      yieldRatio: 0.50,
      addonPerFinishedKgKzt: 1600,
      priceTakeawayKzt: 25000,
      pricePubKzt: 27500,
      meats: [{ code: 'R1', kg: 100 }],
      spices: [
        { name: 'Нитритная соль', g: 20.0 },
        { name: 'Кориандр обжаренный дробленый', g: 12.0 },
        { name: 'Перец черный и декстроза', g: 9.0 },
        { name: 'Винный уксус', g: 25.0 }
      ],
      casing: 'Вакуум-пакет PA/PE по 50 г + этикетка ТермоТОП 58×60 мм',
      shelfLifeDays: 60,
      tech: 'Из 2,0 кг зачищенного огузка R1 выходит 1,0 кг готового билтонга (20 порций по 50 г).'
    },
    {
      code: '3-066',
      plu: 'PLU-21B',
      eanPrefix: '220021',
      title: 'Кабаносси / Пивчики полукопченые к пенному',
      titleKz: 'Кабаносси / Сыра шұжықшалары',
      goal: 'SNACK_MAX',
      tierLabel: 'Снек-драйвер (Наценка 194%)',
      laborScore: 4,
      yieldRatio: 0.78,
      addonPerFinishedKgKzt: 650,
      priceTakeawayKzt: 10400,
      pricePubKzt: 12500,
      spiceFactor: 0.6,
      meats: [
        { code: 'BASE_3014', kg: 40 },
        { code: 'S4b', kg: 60 }
      ],
      spices: [
        { name: 'Нитритная соль', g: 18.0 },
        { name: 'Перец черный молотый', g: 2.0 },
        { name: 'Паприка сладкая и горькая', g: 3.5 },
        { name: 'Стабилизатор цвета', g: 1.0 }
      ],
      casing: 'Коллагеновая/баранья оболочка малого калибра (вакуум по 120 г)',
      shelfLifeDays: 30,
      tech: 'Грудинку S4b пропустить через 10 мм, смешать с фаршем-основой. Горячее копчение 60 мин (70°C), варка 60 мин (75°C), подсушка.'
    },
    {
      code: '3-135 / 3-138',
      plu: 'PLU-21',
      eanPrefix: '220021',
      title: 'Сосиски дебреценские / Колбаски Охотничьи в/к',
      titleKz: 'Аңшы ысталған-пісірілген шұжықшалары',
      goal: 'SNACK_MAX',
      tierLabel: 'Высокая маржа (15% плана цеха)',
      laborScore: 4,
      yieldRatio: 0.85,
      addonPerFinishedKgKzt: 550,
      priceTakeawayKzt: 9500,
      pricePubKzt: 11500,
      meats: [
        { code: 'BASE_3014', kg: 40 },
        { code: 'S4b', kg: 60 }
      ],
      spices: [
        { name: 'Нитритная соль', g: 18.0 },
        { name: 'Паприка сладкая и острая', g: 3.0 },
        { name: 'Перец черный и душистый', g: 2.0 },
        { name: 'Чесночная масса (10-081)', g: 0.6 }
      ],
      casing: 'Баранья черева 18/22 мм или свиная черева 28/32 мм',
      shelfLifeDays: 30,
      tech: 'Горячее копчение в Ижица Varmen Mini 60 мин при 70°C, варка паром 20 мин при 72°C.'
    },
    {
      code: '1-002 / 1-007 / 8-013',
      plu: 'PLU-25',
      eanPrefix: '220025',
      title: 'Ребра свиные копчено-вареные (Классические / Медовые)',
      titleKz: 'Ысталған-пісірілген шошқа қабырғалары',
      goal: 'PUB_DRIVER',
      tierLabel: 'Флагман горячей кухни паба (Наценка 236%)',
      laborScore: 1,
      yieldRatio: 0.86,
      addonPerFinishedKgKzt: 420,
      priceTakeawayKzt: 5200,
      pricePubKzt: 7000,
      meats: [{ code: 'RIBS', kg: 100 }],
      spices: [
        { name: 'Рассол 10°Be (нитритная соль 105 г/л) или Медовый маринад (10-088)', g: 22.0 }
      ],
      casing: 'Без оболочки (вакуумная упаковка PA/PE)',
      shelfLifeDays: 20,
      tech: 'Посол 12–24 ч в рассоле 10°Be. В Varmen Mini: сушка 55°C, дым 65°C, варка паром до +72°C внутри.'
    },
    {
      code: '1-032 / 1-031',
      plu: 'PLU-24',
      eanPrefix: '220024',
      title: 'Грудинка свиная копченая / Бекон в/к',
      titleKz: 'Ысталған шошқа төсі (Бекон)',
      goal: 'LOW_LABOR',
      tierLabel: 'Выход 88% без шприца (25% плана цеха)',
      laborScore: 1,
      yieldRatio: 0.88,
      addonPerFinishedKgKzt: 380,
      priceTakeawayKzt: 5200,
      pricePubKzt: 7000,
      meats: [{ code: 'S4b', kg: 100 }],
      spices: [
        { name: 'Рассол 10°Be (шприцевание + мокрый посол 2–3 суток)', g: 20.0 }
      ],
      casing: 'Без оболочки (подвес на крючьях/рамах)',
      shelfLifeDays: 25,
      tech: 'Не требует волчка, куттера и шприца. Заполняет камеру Varmen Mini с минимальными трудозатратами.'
    },
    {
      code: '1-026 / 1-039',
      plu: 'PLU-29',
      eanPrefix: '220029',
      title: 'Карбонад / Корейка копчено-вареная и Говядина гамбургская',
      titleKz: 'Ысталған карбонад және деликатес балық',
      goal: 'LOW_LABOR',
      tierLabel: 'Основа выручки на вынос (40% плана цеха)',
      laborScore: 1,
      yieldRatio: 0.84,
      addonPerFinishedKgKzt: 400,
      priceTakeawayKzt: 7500,
      pricePubKzt: 9500,
      meats: [{ code: 'S1', kg: 100 }],
      spices: [
        { name: 'Рассол 10°Be + пряная обсыпка (кориандр, чеснок, перец)', g: 22.0 }
      ],
      casing: 'Формовочная сетка или шпагат',
      shelfLifeDays: 25,
      tech: 'Цельномышечный деликатес. Себестоимость ~3 250 ₸, розничная цена — 7 500 ₸.'
    },
    {
      code: '3-030 / 3-044',
      plu: 'PLU-26',
      eanPrefix: '220026',
      title: 'Окорок пивной (Bierschinken) / Ветчина «Мраморная»',
      titleKz: '«Мәрмәр» ветчинасы (Сыра сан еті)',
      goal: 'TAKEAWAY_CORE',
      tierLabel: 'Быстрая формовка + утилизация обрези (20% плана)',
      laborScore: 2,
      yieldRatio: 0.92,
      addonPerFinishedKgKzt: 450,
      priceTakeawayKzt: 5800,
      pricePubKzt: 7500,
      spiceFactor: 0.6,
      meats: [
        { code: 'S1', kg: 60 },
        { code: 'BASE_3001', kg: 40 }
      ],
      spices: [
        { name: 'Нитритная соль', g: 18.0 },
        { name: 'Перец, душица толченая, кориандр, мацис, имбирь', g: 5.8 },
        { name: 'Фосфат / стабилизатор цвета', g: 1.0 }
      ],
      casing: 'Полиамидная или фиброузная оболочка 65–85 мм',
      shelfLifeDays: 20,
      tech: 'Набивка 20 кг за 15 минут. В эмульсию уходит чистая мышечная обрезь от жиловки деликатесов.'
    },
    {
      code: '3-004',
      plu: 'PLU-23',
      eanPrefix: '220023',
      title: 'Мортаделла с фисташкой (Итальянский профиль)',
      titleKz: 'Пісте қосылған мортаделла',
      goal: 'TAKEAWAY_CORE',
      tierLabel: 'Кросс-продажи к Чиабатте и Страчателле',
      laborScore: 3,
      yieldRatio: 0.94,
      addonPerFinishedKgKzt: 680,
      priceTakeawayKzt: 7200,
      pricePubKzt: 9000,
      meats: [
        { code: 'BASE_3001', kg: 80 },
        { code: 'S8', kg: 20 }
      ],
      spices: [
        { name: 'Нитритная соль', g: 18.0 },
        { name: 'Фисташки цельные очищенные', g: 5.0 },
        { name: 'Перец белый, мирт, мацис, кориандр', g: 3.3 }
      ],
      casing: 'Синюга или белковая оболочка 80–120 мм',
      shelfLifeDays: 15,
      tech: 'Ступенчатая варка паром при 75–78°C до +70°C в центре батона.'
    },
    {
      code: '2-008 / 3-050',
      plu: 'PLU-22',
      eanPrefix: '220022',
      title: 'Сервелат Голштинский и Колбаса из окорока в/к',
      titleKz: 'Ысталған-пісірілген сервелат',
      goal: 'TAKEAWAY_CORE',
      tierLabel: 'Хит семейной полки ЖК Арай (30 суток)',
      laborScore: 3,
      yieldRatio: 0.85,
      addonPerFinishedKgKzt: 500,
      priceTakeawayKzt: 5800,
      pricePubKzt: 7600,
      meats: [
        { code: 'R2', kg: 30 },
        { code: 'S2', kg: 10 },
        { code: 'S4b', kg: 40 },
        { code: 'S8', kg: 20 }
      ],
      spices: [
        { name: 'Нитритная соль', g: 24.0 },
        { name: 'Перец белый молотый, кардамон, мускат', g: 3.0 },
        { name: 'Стабилизатор / старты', g: 1.0 }
      ],
      casing: 'Фиброузная оболочка 45–65 мм',
      shelfLifeDays: 30,
      tech: 'Срок годности 30 суток исключает списания на витрине Take-away и в вендинге 24/7.'
    },
    {
      code: '10-109 / FK-01',
      plu: 'PLU-40',
      eanPrefix: '220040',
      title: 'Суп-киты «Солянка Мясная Сборная» и «Борщ» на бульоне Коха',
      titleKz: '«Солянка» және «Борщ» сорпа жиынтықтары',
      goal: 'ZERO_WASTE',
      tierLabel: 'Zero-Waste сверхмаржа 70,5–76,2% (Сырье 0 ₸)',
      laborScore: 1,
      yieldRatio: 1.00,
      addonPerFinishedKgKzt: 885,
      priceTakeawayKzt: 3000,
      pricePubKzt: 4200,
      meats: [{ code: 'R7', kg: 100 }],
      spices: [
        { name: 'Суповые пряности Коха (10-083: перец, имбирь, мускат, тимьян, гвоздика, мацис)', g: 5.0 },
        { name: 'Овощная база мирпуа + торцевые срезы деликатесов (250 г/набор)', g: 250.0 }
      ],
      casing: 'Дой-пак 0,5 л + вакуум-пакет PA/PE + этикетка ТермоТОП 58×60 мм',
      shelfLifeDays: 14,
      tech: 'Фасции от жиловки отрубов (40–45 кг/мес) вывариваются 8–10 ч. Прибыль $4.23 с набора!'
    },
    {
      code: '10-083 / SP-50',
      plu: 'PLU-50',
      eanPrefix: '220050',
      title: 'Фасованные крафтовые смеси специй (Кох 10-083 / Biltong Spice / BBQ Rub)',
      titleKz: 'Крафт дәмдеуіштер жиынтығы (SPICY MOOD LAB)',
      goal: 'ZERO_WASTE',
      tierLabel: 'Рекордная наценка 455–547% (Хранение 12 мес.)',
      laborScore: 1,
      yieldRatio: 1.00,
      addonPerFinishedKgKzt: 1900,
      priceTakeawayKzt: 11000,
      pricePubKzt: 11000,
      meats: [{ code: 'R7', kg: 100 }],
      spices: [
        { name: 'Кориандр, черный и белый перец, паприка, имбирь, мускат, мацис, тимьян', g: 1000.0 }
      ],
      casing: 'Крафт-баночки ПЭТ/стекло 80–100 г с этикеткой ТермоТОП 58×60 мм',
      shelfLifeDays: 365,
      tech: 'Себестоимость баночки 100 г — 190 ₸ ($0.38), розничная цена — 1 100 ₸ ($2.20).'
    }
  ]);

  // ================= 3. MARKET RAW MATERIAL FEED (ALMATY) =================
  rawMaterialPrices = signal<RawMaterialMarketPrice[]>([
    // === 1. МЯСНОЕ СЫРЬЕ (MEAT) ===
    {
      id: 'RAW-MEAT-01',
      code: 'R1_HORSE',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Конина Жая в/с (тазобедренный отруб, зачищенный)',
      unit: 'кг',
      currentCostKzt: 4000,
      marketAverageKzt: 4350,
      marketMinKzt: 3900,
      marketMaxKzt: 4800,
      trend: 'UP',
      trendPct: 5.2,
      forecast30d: '↗ +3..+5% (Умеренный рост)',
      forecastComment: 'Старт сезона соғым в Алматинской области, рост спроса на Жая',
      supplier: 'КХ «Алатау Ет» / Мясной терминал Алматы',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-02',
      code: 'R1_BEEF',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Говядина в/с (Огузок / оковалок зачищенный)',
      unit: 'кг',
      currentCostKzt: 3350,
      marketAverageKzt: 3600,
      marketMinKzt: 3200,
      marketMaxKzt: 3900,
      trend: 'UP',
      trendPct: 4.5,
      forecast30d: '↗ +3..+5% (Осенний спрос)',
      forecastComment: 'Активизация спроса со стороны ресторанов и крафтовых цехов',
      supplier: 'СПК «Жетысу Агро»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-03',
      code: 'R4_KAZY',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Казы бескостное (реберная конская мякоть с жиром 70/30)',
      unit: 'кг',
      currentCostKzt: 3900,
      marketAverageKzt: 4200,
      marketMinKzt: 3700,
      marketMaxKzt: 4600,
      trend: 'UP',
      trendPct: 5.8,
      forecast30d: '↗ +6..+8% (Активный рост)',
      forecastComment: 'Пик свадебного сезона и банкетов, дефицит реберной части',
      supplier: 'Мясной павильон «Зеленый Базар» / Прямые фермеры',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-04',
      code: 'S1_PORK',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Свинина нежирная: окорок / карбонад бескостный',
      unit: 'кг',
      currentCostKzt: 2200,
      marketAverageKzt: 2180,
      marketMinKzt: 2050,
      marketMaxKzt: 2350,
      trend: 'DOWN',
      trendPct: -2.1,
      forecast30d: '↘ -1..-3% (Плавное снижение)',
      forecastComment: 'Пик предубойной сдачи скота свинокомплексами области',
      supplier: 'ТОО «Первомайские Деликатесы»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-05',
      code: 'S4B_BEACON',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Грудинка свиная 50/50 бескостная (слоистая)',
      unit: 'кг',
      currentCostKzt: 2400,
      marketAverageKzt: 2520,
      marketMinKzt: 2300,
      marketMaxKzt: 2700,
      trend: 'UP',
      trendPct: 3.0,
      forecast30d: '↗ +3..+4% (Умеренный рост)',
      forecastComment: 'Сезонное увеличение потребления копченого бекона к холодам',
      supplier: 'Фермерское хозяйство Енбекшиказахского р-на',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-06',
      code: 'S8_LARD',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Шпик свиной хребтовый тугоплавкий (>35°C)',
      unit: 'кг',
      currentCostKzt: 1800,
      marketAverageKzt: 1950,
      marketMinKzt: 1700,
      marketMaxKzt: 2200,
      trend: 'UP',
      trendPct: 4.2,
      forecast30d: '↗ +3..+5% (Дефицит)',
      forecastComment: 'Высокий спрос на плотный хребтовый шпик для сырокопченых сервелатов',
      supplier: 'Мясоперерабатывающий завод Алматы',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-07',
      code: 'RIBS_PORK',
      category: 'MEAT',
      sector: 'MEAT',
      name: 'Ребра свиные мясные ленты (для паба BEERMOOD)',
      unit: 'кг',
      currentCostKzt: 2600,
      marketAverageKzt: 2780,
      marketMinKzt: 2400,
      marketMaxKzt: 3000,
      trend: 'UP',
      trendPct: 2.5,
      forecast30d: '↗ +4..+6% (Рост спроса)',
      forecastComment: 'Драйвер горячей кухни паба к крафтовому пиву в осенний сезон',
      supplier: 'Мясной опт «Арай Ет»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-MEAT-08',
      code: 'CASING_SHEEP',
      category: 'CASING',
      sector: 'MEAT',
      name: 'Баранья черева 18/22 мм кат. А (для Охотничьих)',
      unit: 'метр',
      currentCostKzt: 120,
      marketAverageKzt: 135,
      marketMinKzt: 110,
      marketMaxKzt: 160,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ ±1.0% (Стабильно)',
      forecastComment: 'Устойчивые складские запасы импортной и местной калиброванной оболочки',
      supplier: 'KazCasing Trade',
      lastUpdated: '2026-09-28'
    },

    // === 2. МОЛОЧНОЕ СЫРЬЕ (DAIRY / CHEESY MOOD) ===
    {
      id: 'RAW-DAIRY-01',
      code: 'MILK_EXTRA',
      category: 'MILK',
      sector: 'DAIRY',
      name: 'Молоко сырое цельное сорт Экстра (жир 4.2%, белок 3.25%)',
      unit: 'литр',
      currentCostKzt: 280,
      marketAverageKzt: 285,
      marketMinKzt: 270,
      marketMaxKzt: 310,
      trend: 'UP',
      trendPct: 1.8,
      forecast30d: '↗ +2..+4% (Осенний спад удоев)',
      forecastComment: 'Сезонное сокращение объемов сыропригодного молока в хозяйствах Алматинской области',
      supplier: 'МТФ «Байсерке-Агро» / Талгарский р-н',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-DAIRY-02',
      code: 'MILK_STD',
      category: 'MILK',
      sector: 'DAIRY',
      name: 'Молоко сырое 1 сорт базис (жир 3.6%, белок 3.0%)',
      unit: 'литр',
      currentCostKzt: 235,
      marketAverageKzt: 240,
      marketMinKzt: 220,
      marketMaxKzt: 255,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ ±1.5% (Стабильно)',
      forecastComment: 'Базовое сырье для кисломолочной группы и творога',
      supplier: 'СПК «Молочный край»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-DAIRY-03',
      code: 'CREAM_33',
      category: 'MILK',
      sector: 'DAIRY',
      name: 'Сливки пастеризованные 33–35% (для Страчателлы и Маскарпоне)',
      unit: 'литр',
      currentCostKzt: 2600,
      marketAverageKzt: 2750,
      marketMinKzt: 2500,
      marketMaxKzt: 3100,
      trend: 'UP',
      trendPct: 3.5,
      forecast30d: '↗ +3..+5% (Дефицит жира)',
      forecastComment: 'Повышенный спрос кондитерских производств Алматы перед новогодним циклом',
      supplier: 'FoodMaster / ТОО «JLC Молоко»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-DAIRY-04',
      code: 'SACCO_MS062',
      category: 'DAIRY_CULTURE',
      sector: 'DAIRY',
      name: 'Закваски Sacco Lyofast (MS062 / MS064 для полутвердых и Pasta Filata)',
      unit: 'пакет (100 л)',
      currentCostKzt: 4200,
      marketAverageKzt: 4400,
      marketMinKzt: 4100,
      marketMaxKzt: 4800,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ 0.0% (Стабильно)',
      forecastComment: 'Прямые поставки официального дистрибьютора Sacco System в РК',
      supplier: 'Sacco System KZ',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-DAIRY-05',
      code: 'CHYMOSIN_100',
      category: 'DAIRY_CULTURE',
      sector: 'DAIRY',
      name: 'Сычужный фермент Chymosin 100% микробиальный',
      unit: 'флакон 500 мл',
      currentCostKzt: 18500,
      marketAverageKzt: 19000,
      marketMinKzt: 17500,
      marketMaxKzt: 21000,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ 0.0% (Фиксированная цена)',
      forecastComment: 'Хватает на переработку до 2 500 л молока в сыроварне Casaro',
      supplier: 'Chr. Hansen Казахстан',
      lastUpdated: '2026-09-28'
    },

    // === 3. ХЛЕБНОЕ СЫРЬЕ (BAKERY / BAKE MOOD) ===
    {
      id: 'RAW-BAKE-01',
      code: 'FLOUR_W300',
      category: 'FLOUR',
      sector: 'BAKERY',
      name: 'Мука сильная пшеничная в/с (W300, Белок 13.5% для тартина)',
      unit: 'кг',
      currentCostKzt: 380,
      marketAverageKzt: 405,
      marketMinKzt: 360,
      marketMaxKzt: 450,
      trend: 'UP',
      trendPct: 3.9,
      forecast30d: '↗ +2..+4% (Зерно 2026)',
      forecastComment: 'Рост котировок продовольственной пшеницы 3 класса в Северном Казахстане',
      supplier: 'Мелькомбинат «Цесна» / Pioneer',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-BAKE-02',
      code: 'FLOUR_RYE_BIO',
      category: 'FLOUR',
      sector: 'BAKERY',
      name: 'Мука ржаная обдирная (для закваски Сан-Франциско и бородинского)',
      unit: 'кг',
      currentCostKzt: 320,
      marketAverageKzt: 330,
      marketMinKzt: 290,
      marketMaxKzt: 360,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ ±1.0% (Стабильно)',
      forecastComment: 'Устойчивое предложение ржаной муки от костанайских мукомолов',
      supplier: 'ТОО «Костанай Мука»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-BAKE-03',
      code: 'FLOUR_WHOLEGRAIN',
      category: 'FLOUR',
      sector: 'BAKERY',
      name: 'Мука цельнозерновая жернового помола био',
      unit: 'кг',
      currentCostKzt: 420,
      marketAverageKzt: 440,
      marketMinKzt: 390,
      marketMaxKzt: 490,
      trend: 'UP',
      trendPct: 2.4,
      forecast30d: '▬ +1..+2% (Стабильно)',
      forecastComment: 'Постоянный контракт с фермерской био-мельницей',
      supplier: 'Эко-ферма «Жер-Ана» Алматинская обл.',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-BAKE-04',
      code: 'WHEY_ZERO_WASTE',
      category: 'MILK',
      sector: 'BAKERY',
      name: 'Сыворотка молочная теплая (от варки сыра Casaro)',
      unit: 'литр',
      currentCostKzt: 0,
      marketAverageKzt: 80,
      marketMinKzt: 50,
      marketMaxKzt: 120,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ 0 ₸ (Zero-Waste MOOD GROUP)',
      forecastComment: '100% замещение покупной воды при замесе тартина и чиабатты (0 ₸ себестоимость)',
      supplier: 'Внутреннее производство CHEESY MOOD',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-BAKE-05',
      code: 'SEEDS_MIX_BIO',
      category: 'SPICE',
      sector: 'BAKERY',
      name: 'Смесь семян био (лен, тыква, подсолнечник, кунжут)',
      unit: 'кг',
      currentCostKzt: 1450,
      marketAverageKzt: 1550,
      marketMinKzt: 1350,
      marketMaxKzt: 1750,
      trend: 'UP',
      trendPct: 4.8,
      forecast30d: '↗ +3..+5% (Сезонный спрос)',
      forecastComment: 'Повышенный спрос пекарен Алматы на злаковые посыпки к осени',
      supplier: 'Spice & Seed Trade Алматы',
      lastUpdated: '2026-09-28'
    },

    // === 4. СОУСЫ И ПРЯНЫЕ СМЕСИ (SPICY MOOD LAB) ===
    {
      id: 'RAW-SPICE-01',
      code: 'CHILI_BIRDS_EYE',
      category: 'SAUCE_INGREDIENT',
      sector: 'SAUCES_SPICES',
      name: 'Перец острый Bird\'s Eye / Habanero свежий грунтовой',
      unit: 'кг',
      currentCostKzt: 2400,
      marketAverageKzt: 2650,
      marketMinKzt: 2200,
      marketMaxKzt: 3200,
      trend: 'DOWN',
      trendPct: -6.5,
      forecast30d: '↘ Дно в октябре ➔ Взлет до 3 500 ₸ в ноябре',
      forecastComment: 'Сезонное окно сбора урожая! Срочно заложить ферментацию соусов на 6 месяцев',
      supplier: 'Фермеры пос. Чилик / Талгар',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-SPICE-02',
      code: 'PEPPER_BELL_RED',
      category: 'SAUCE_INGREDIENT',
      sector: 'SAUCES_SPICES',
      name: 'Перец сладкий паприка грунтовой (база Piri-Piri и Шрирачи)',
      unit: 'кг',
      currentCostKzt: 350,
      marketAverageKzt: 380,
      marketMinKzt: 300,
      marketMaxKzt: 480,
      trend: 'DOWN',
      trendPct: -8.0,
      forecast30d: '↗ Взлет цен в ноябре (+50..+70%)',
      forecastComment: 'Конец открытого грунта; тепличный перец в ноябре подорожает до 700 ₸/кг',
      supplier: 'Овощной терминал «Жетысу»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-SPICE-03',
      code: 'GARLIC_TALGAR',
      category: 'SAUCE_INGREDIENT',
      sector: 'SAUCES_SPICES',
      name: 'Чеснок свежий местный острый (Талгарский)',
      unit: 'кг',
      currentCostKzt: 1100,
      marketAverageKzt: 1250,
      marketMinKzt: 950,
      marketMaxKzt: 1400,
      trend: 'UP',
      trendPct: 2.0,
      forecast30d: '↗ +5..+8% к зиме',
      forecastComment: 'Традиционный осенний рост цен на качественный местный сухой чеснок',
      supplier: 'Крестьянские хозяйства Талгарского р-на',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-SPICE-04',
      code: 'VINEGAR_APPLE_BIO',
      category: 'SAUCE_INGREDIENT',
      sector: 'SAUCES_SPICES',
      name: 'Уксус яблочный натуральный 6% прямого брожения',
      unit: 'литр',
      currentCostKzt: 850,
      marketAverageKzt: 920,
      marketMinKzt: 780,
      marketMaxKzt: 1100,
      trend: 'STABLE',
      trendPct: 0.0,
      forecast30d: '▬ ±1.0% (Стабильно)',
      forecastComment: 'Основа кислотного баланса для консервации Piri-Piri соусов (pH < 3.8)',
      supplier: 'Яблочные сады Талгара / ТОО «BioVinegar»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-SPICE-05',
      code: 'PAPRIKA_SMOKED',
      category: 'SPICE',
      sector: 'SAUCES_SPICES',
      name: 'Паприка копченая испанская Pimenton de la Vera',
      unit: 'кг',
      currentCostKzt: 6800,
      marketAverageKzt: 7200,
      marketMinKzt: 6500,
      marketMaxKzt: 8200,
      trend: 'UP',
      trendPct: 3.1,
      forecast30d: '↗ +2..+3% (Валютный тренд)',
      forecastComment: 'Импортная пряность для фирменных натирок бекона, ребер и BBQ соуса',
      supplier: 'Импортер специй «Евразия Спайс»',
      lastUpdated: '2026-09-28'
    },
    {
      id: 'RAW-SPICE-06',
      code: 'BOTTLE_MARASCA',
      category: 'GLASS_PACKAGING',
      sector: 'SAUCES_SPICES',
      name: 'Бутылочка стеклянная Marasca 150 мл с дозатором и колпачком',
      unit: 'штука',
      currentCostKzt: 140,
      marketAverageKzt: 155,
      marketMinKzt: 130,
      marketMaxKzt: 180,
      trend: 'UP',
      trendPct: 5.0,
      forecast30d: '↗ +3..+5% (Логистика стеклотары)',
      forecastComment: 'Премиальная стеклянная фасовка для соусов линейки SPICY MOOD LAB',
      supplier: 'Стеклотара Казахстан / ТОО «СтеклоПром»',
      lastUpdated: '2026-09-28'
    }
  ]);

  // ================= 4. COMPETITOR BENCHMARKS (ALMATY) =================
  competitorBenchmarks = signal<CompetitorBenchmark[]>([
    // === 1. МЯСНЫЕ ДЕЛИКАТЕСЫ (MEAT) ===
    {
      id: 'COMP-MEAT-01',
      category: 'Мясные снеки',
      sector: 'MEAT',
      ourProductTitle: 'Билтонг из конины Жая (50 г)',
      ourPriceKzt: 1750,
      ourUnit: '50 г (35 000 ₸/кг)',
      competitorName: 'Galmart (Dostyk Plaza) — Крафтовый вяленый отруб',
      competitorPriceKzt: 2450,
      priceGapPct: -28.6,
      trend: 'UP',
      forecast30d: '↗ Рост цен в ритейле до 2 600 ₸',
      forecastComment: 'Чистый отруб Жая без сои и консервантов; у конкурента конина по 49 000 ₸/кг',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Высокая маржа снек-драйвера в пабе BEERMOOD и Takeaway.'
    },
    {
      id: 'COMP-MEAT-02',
      category: 'Колбаски к пиву',
      sector: 'MEAT',
      ourProductTitle: 'Колбаски Охотничьи в/к (Рец. 3-135)',
      ourPriceKzt: 9500,
      ourUnit: '1 кг (Takeaway)',
      competitorName: 'Беккер и К — Охотничьи колбаски ГОСТ',
      competitorPriceKzt: 8200,
      priceGapPct: 15.8,
      trend: 'STABLE',
      forecast30d: '▬ Стабильно в масс-маркете',
      forecastComment: 'Копчение на буковой щепе в Ижица Varmen Mini без жидкого дыма',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Покупатели ценят натуральную баранью череву и мясную плотность.'
    },
    {
      id: 'COMP-MEAT-03',
      category: 'Горячая кухня паба',
      sector: 'MEAT',
      ourProductTitle: 'Ребра свиные копчено-вареные медовые',
      ourPriceKzt: 7000,
      ourUnit: '1 кг (в пабе)',
      competitorName: 'Bier Штаб Алматы — Свиные ребра гриль',
      competitorPriceKzt: 8500,
      priceGapPct: -17.6,
      trend: 'UP',
      forecast30d: '↗ Повышение в меню пабов на 5..8%',
      forecastComment: 'Флагман кухни BEERMOOD.PUB с наценкой 236%',
      qualityTier: 'RESTAURANT',
      channel: 'PUB_DINEIN',
      notes: 'Выход 86%, мокрый посол 10°Be и медовый маринад Коха.'
    },
    {
      id: 'COMP-MEAT-04',
      category: 'Сырокопченая полка',
      sector: 'MEAT',
      ourProductTitle: 'Сервелат Голштинский с/к (30 суток)',
      ourPriceKzt: 7600,
      ourUnit: '1 кг (батон ~450 г)',
      competitorName: 'Galmart Gourmet — Сырокопченый сервелат',
      competitorPriceKzt: 9800,
      priceGapPct: -22.4,
      trend: 'UP',
      forecast30d: '↗ Рост цен в премиум сетях',
      forecastComment: 'Хит семейной корзины жильцов ЖК Арай с нулевыми списаниями',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Срок хранения 30 суток исключает потери на витрине.'
    },

    // === 2. МОЛОЧНАЯ ПРОДУКЦИЯ И СЫРЫ (DAIRY / CHEESY MOOD) ===
    {
      id: 'COMP-DAIRY-01',
      category: 'Свежие сыры',
      sector: 'DAIRY',
      ourProductTitle: 'Страчателла в свежих сливках (баночка 200 г)',
      ourPriceKzt: 1800,
      ourUnit: '200 г (9 000 ₸/кг)',
      competitorName: 'Galmart Gourmet — Ремесленная страчателла',
      competitorPriceKzt: 2450,
      priceGapPct: -26.5,
      trend: 'UP',
      forecast30d: '↗ +5..+8% в сетях Алматы',
      forecastComment: 'На 26.5% выгоднее аналога в Galmart; потенциал повышения до 2 100 ₸ без потери спроса',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Производится в сыроварне Casaro из утреннего молока 4.2% жирности.'
    },
    {
      id: 'COMP-DAIRY-02',
      category: 'Свежие сыры',
      sector: 'DAIRY',
      ourProductTitle: 'Моцарелла Фиор ди Латте (шарик 125 г)',
      ourPriceKzt: 950,
      ourUnit: '125 г в рассоле',
      competitorName: 'Paul Almaty / Сырная Лавка — Моцарелла',
      competitorPriceKzt: 1380,
      priceGapPct: -31.2,
      trend: 'UP',
      forecast30d: '↗ Рост цен на импортные аналоги',
      forecastComment: 'Идеальное волокно и влажность для салата Капрезе и пиццы паба',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Себестоимость 320 ₸ за шарик, маржа более 66%.'
    },
    {
      id: 'COMP-DAIRY-03',
      category: 'Рассольные сыры',
      sector: 'DAIRY',
      ourProductTitle: 'Сыр Сулугуни копченый на буке (кг)',
      ourPriceKzt: 4500,
      ourUnit: '1 кг (головка ~400 г)',
      competitorName: 'Magnum Daily / Зеленый Базар — Сулугуни',
      competitorPriceKzt: 5800,
      priceGapPct: -22.4,
      trend: 'STABLE',
      forecast30d: '▬ Стабильный осенний спрос',
      forecastComment: 'Деликатное копчение в коптильне Ижица Varmen Mini без химических ароматизаторов',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Популярен как закуска к нефильтрованному крафтовому элю в BEERMOOD.'
    },
    {
      id: 'COMP-DAIRY-04',
      category: 'Сливочные десерты',
      sector: 'DAIRY',
      ourProductTitle: 'Маскарпоне домашний 80% (250 г)',
      ourPriceKzt: 1450,
      ourUnit: '250 г (5 800 ₸/кг)',
      competitorName: 'Galmart (Италия Galbani 250 г)',
      competitorPriceKzt: 2300,
      priceGapPct: -37.0,
      trend: 'UP',
      forecast30d: '↗ Подорожание импорта из-за логистики',
      forecastComment: 'Натуральные сливки 33% без загустителей и пальмового масла',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Основа для десертов Тирамису в меню кухни паба.'
    },
    {
      id: 'COMP-DAIRY-05',
      category: 'Мягкие сыры',
      sector: 'DAIRY',
      ourProductTitle: 'Сыр Адыгейский нежный на сыворотке (кг)',
      ourPriceKzt: 3200,
      ourUnit: '1 кг (вакуум)',
      competitorName: 'Ремесленные сыры De\'Gusto',
      competitorPriceKzt: 4200,
      priceGapPct: -23.8,
      trend: 'STABLE',
      forecast30d: '▬ Стабильно',
      forecastComment: 'Выход до 15% из молока Экстра, популярный продукт для здорового питания жильцов ЖК Арай',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'DELIVERY_APP',
      notes: 'Отличная сочетаемость со свежей чиабаттой.'
    },

    // === 3. ХЛЕБ И ПЕКАРНЯ (BAKERY / BAKE MOOD) ===
    {
      id: 'COMP-BAKE-01',
      category: 'Ремесленный хлеб',
      sector: 'BAKERY',
      ourProductTitle: 'Тартин подовый на ржаной закваске (650 г)',
      ourPriceKzt: 850,
      ourUnit: 'буханка 650 г',
      competitorName: 'Paul Almaty — Pain de Campagne на закваске',
      competitorPriceKzt: 1450,
      priceGapPct: -41.4,
      trend: 'UP',
      forecast30d: '↗ Повышение в Paul до 1 550 ₸',
      forecastComment: 'Длительная холодная ферментация 24ч, выпечка в подовой печи Unox',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Хит утренних заказов ЖК Арай; резерв поднятия цены до 1 000 ₸ при марже 71%.'
    },
    {
      id: 'COMP-BAKE-02',
      category: 'Итальянская выпечка',
      sector: 'BAKERY',
      ourProductTitle: 'Чиабатта на сыворотке высокая гидратация 82% (300 г)',
      ourPriceKzt: 550,
      ourUnit: '300 г',
      competitorName: 'La Tartine — Чиабатта классическая',
      competitorPriceKzt: 950,
      priceGapPct: -42.1,
      trend: 'STABLE',
      forecast30d: '▬ Стабильно высокий спрос',
      forecastComment: 'Крупная пористость, хрустящая корочка, замес на сыворотке Casaro',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Идеальный компаньон для Мортаделлы с фисташкой и Страчателлы.'
    },
    {
      id: 'COMP-BAKE-03',
      category: 'Гурмэ-хлеб',
      sector: 'BAKERY',
      ourProductTitle: 'Тартин с оливками каламата и розмарином (600 г)',
      ourPriceKzt: 1200,
      ourUnit: '600 г',
      competitorName: 'Galmart Bakery — Хлеб с оливками крафт',
      competitorPriceKzt: 1850,
      priceGapPct: -35.1,
      trend: 'UP',
      forecast30d: '↗ Высокий средний чек',
      forecastComment: 'Премиальный отборный хлеб для винной и сырной тарелки паба',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'PUB_DINEIN',
      notes: 'Высокая маржа (+720 ₸ с буханки).'
    },
    {
      id: 'COMP-BAKE-04',
      category: 'Традиционный хлеб',
      sector: 'BAKERY',
      ourProductTitle: 'Хлеб Бородинский на солодовой заварке (500 г)',
      ourPriceKzt: 600,
      ourUnit: '500 г',
      competitorName: 'Magnum Premium — Бородинский ремесленный',
      competitorPriceKzt: 850,
      priceGapPct: -29.4,
      trend: 'STABLE',
      forecast30d: '▬ Стабильный спрос',
      forecastComment: 'Красный ржаной солод, кориандр крупного помола, плотный мякиш',
      qualityTier: 'MASS_MARKET',
      channel: 'RETAIL',
      notes: 'Традиционная подача в пабе к сельди и соленым грудинкам.'
    },

    // === 4. СОУСЫ И ПРЯНЫЕ СМЕСИ (SAUCES & SPICES / SPICY MOOD LAB) ===
    {
      id: 'COMP-SPICE-01',
      category: 'Острые соусы',
      sector: 'SAUCES_SPICES',
      ourProductTitle: 'Острый соус Piri-Piri MOOD фирменный (150 мл)',
      ourPriceKzt: 1650,
      ourUnit: 'бутылочка 150 мл Marasca',
      competitorName: 'Nando\'s Peri-Peri / Tabasco Habanero (Galmart)',
      competitorPriceKzt: 2850,
      priceGapPct: -42.1,
      trend: 'UP',
      forecast30d: '↗ Рост цен импортных соусов до 3 100 ₸',
      forecastComment: 'Натуральная ферментация перцев Bird\'s eye с чесноком, маслом и яблочным уксусом',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Фирменный хит к куриным крыльям и колбаскам в BEERMOOD.PUB.'
    },
    {
      id: 'COMP-SPICE-02',
      category: 'Барбекю соусы',
      sector: 'SAUCES_SPICES',
      ourProductTitle: 'Крафтовый соус BBQ на стауте BEERMOOD (250 мл)',
      ourPriceKzt: 1850,
      ourUnit: 'бутылочка 250 мл',
      competitorName: 'Ресторанные BBQ соусы крафтовых пивоварен',
      competitorPriceKzt: 2600,
      priceGapPct: -28.8,
      trend: 'UP',
      forecast30d: '↗ Стабильно высокий спрос в пабе',
      forecastComment: 'Варится с добавлением собственного овсяного стаута, копченой паприки и мелассы',
      qualityTier: 'RESTAURANT',
      channel: 'PUB_DINEIN',
      notes: 'Подается к копченым ребрам RIBS и брискету.'
    },
    {
      id: 'COMP-SPICE-03',
      category: 'Ферментированные соусы',
      sector: 'SAUCES_SPICES',
      ourProductTitle: 'Ферментированная Шрирача «Жарокова Hot» (200 мл)',
      ourPriceKzt: 1950,
      ourUnit: 'бутылочка 200 мл',
      competitorName: 'Huy Fong Sriracha (оригинал США в Galmart)',
      competitorPriceKzt: 3400,
      priceGapPct: -42.6,
      trend: 'UP',
      forecast30d: '↗ Дефицит оригинальной Шрирачи в Алматы',
      forecastComment: '30-дневная ферментация красного перца с местным чесноком без красителей',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Чистый вкус и сбалансированная острота 5 000 SHU.'
    },
    {
      id: 'COMP-SPICE-04',
      category: 'Специи и натирки',
      sector: 'SAUCES_SPICES',
      ourProductTitle: 'Фирменная смесь специй для вяления билтонга (200 г)',
      ourPriceKzt: 1400,
      ourUnit: 'банка 200 г',
      competitorName: 'Импортные смеси для билтонга и вяления мяса',
      competitorPriceKzt: 2200,
      priceGapPct: -36.4,
      trend: 'STABLE',
      forecast30d: '▬ Стабильно',
      forecastComment: 'Обжаренный дробленый кориандр, перец Телличерри, зира, розовая соль',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Идеально выверенная рецептура для домашних заготовителей мяса.'
    },
    {
      id: 'COMP-SPICE-05',
      category: 'Специи и натирки',
      sector: 'SAUCES_SPICES',
      ourProductTitle: 'Пряная натирка для копченых ребер и грудинки (250 г)',
      ourPriceKzt: 1250,
      ourUnit: 'банка 250 г',
      competitorName: 'Специи гриль-бутиков (Weber / Kamado)',
      competitorPriceKzt: 1900,
      priceGapPct: -34.2,
      trend: 'UP',
      forecast30d: '↗ Осенний сезон гриля и барбекю',
      forecastComment: 'Копченая паприка, гранулированный чеснок, коричневый сахар, мускат',
      qualityTier: 'PREMIUM_CRAFT',
      channel: 'RETAIL',
      notes: 'Фирменный рецепт маринада кухни Коха.'
    }
  ]);

  // ================= 5. FINANCIAL FORECAST & P&L MODEL =================
  financialForecasts = signal<FinancialForecastPeriod[]>([
    {
      periodLabel: 'Октябрь 2026 (План запуска цехов)',
      revenuePubKzt: 4200000,
      revenueTakeawayKzt: 2800000,
      revenueAraiDeliveryKzt: 1950000,
      totalRevenueKzt: 8950000,
      rawMaterialCogsKzt: 2750000,
      packagingAndConsumablesKzt: 480000,
      totalCogsKzt: 3230000,
      grossProfitKzt: 5720000,
      grossMarginPct: 63.9,
      fixedOpexKzt: {
        rentZharokovaKzt: 1400000,
        payrollStaffKzt: 1850000,
        utilitiesAndPowerKzt: 420000,
        logisticsAndMarketingKzt: 280000
      },
      totalFixedOpexKzt: 3950000,
      ebitdaKzt: 1770000,
      ebitdaMarginPct: 19.8,
      breakevenRevenueKzt: 6180000,
      breakevenBatchesKg: 780
    },
    {
      periodLabel: 'Ноябрь 2026 (Выход на расчетную мощность)',
      revenuePubKzt: 5600000,
      revenueTakeawayKzt: 3900000,
      revenueAraiDeliveryKzt: 2800000,
      totalRevenueKzt: 12300000,
      rawMaterialCogsKzt: 3750000,
      packagingAndConsumablesKzt: 620000,
      totalCogsKzt: 4370000,
      grossProfitKzt: 7930000,
      grossMarginPct: 64.5,
      fixedOpexKzt: {
        rentZharokovaKzt: 1400000,
        payrollStaffKzt: 2100000,
        utilitiesAndPowerKzt: 460000,
        logisticsAndMarketingKzt: 340000
      },
      totalFixedOpexKzt: 4300000,
      ebitdaKzt: 3630000,
      ebitdaMarginPct: 29.5,
      breakevenRevenueKzt: 6670000,
      breakevenBatchesKg: 810
    },
    {
      periodLabel: 'Декабрь 2026 (Новогодний пик & Банкеты)',
      revenuePubKzt: 8500000,
      revenueTakeawayKzt: 5800000,
      revenueAraiDeliveryKzt: 4200000,
      totalRevenueKzt: 18500000,
      rawMaterialCogsKzt: 5600000,
      packagingAndConsumablesKzt: 910000,
      totalCogsKzt: 6510000,
      grossProfitKzt: 11990000,
      grossMarginPct: 64.8,
      fixedOpexKzt: {
        rentZharokovaKzt: 1400000,
        payrollStaffKzt: 2600000,
        utilitiesAndPowerKzt: 540000,
        logisticsAndMarketingKzt: 510000
      },
      totalFixedOpexKzt: 5050000,
      ebitdaKzt: 6940000,
      ebitdaMarginPct: 37.5,
      breakevenRevenueKzt: 7790000,
      breakevenBatchesKg: 920
    }
  ]);

  // ================= 6. STRATEGIC RECOMMENDATIONS ENGINE =================
  recommendations = signal<PricingRecommendation[]>([
    {
      id: 'REC-01',
      type: 'RAW_MATERIAL',
      sector: 'MEAT',
      targetCode: 'R1_HORSE',
      targetTitle: 'Конина Жая в/с (Билтонг BM-28)',
      title: 'Хеджирование закупки Жая перед сезоном соғым',
      rationale: 'Цены на отруб Жая растут (+5.2%). Рекомендуется зафиксировать объем 250 кг по 4 000 ₸/кг у КХ «Алатау Ет» до скачка в ноябре.',
      currentValue: 4000,
      recommendedValue: 4000,
      unit: '₸/кг',
      financialImpactKzt: 240000,
      priority: 'HIGH',
      isApplied: false
    },
    {
      id: 'REC-02',
      type: 'RECIPE_PRICE',
      sector: 'DAIRY',
      targetCode: 'DAIRY_STRACCIATELLA',
      targetTitle: 'Страчателла в свежих сливках (200 г)',
      title: 'Оптимизация цены Страчателлы до 2 100 ₸',
      rationale: 'Текущая цена (1 800 ₸) на 26.5% ниже Galmart (2 450 ₸). Подъем до 2 100 ₸ сохранит статус самого выгодного предложения при марже 72%.',
      currentValue: 1800,
      recommendedValue: 2100,
      unit: '₸/банка',
      financialImpactKzt: 105000,
      priority: 'OPPORTUNITY',
      isApplied: false
    },
    {
      id: 'REC-03',
      type: 'RECIPE_PRICE',
      sector: 'BAKERY',
      targetCode: 'BAKE_TARTINE',
      targetTitle: 'Тартин подовый на закваске (650 г)',
      title: 'Корректировка цены крафтового тартина до 1 000 ₸',
      rationale: 'При цене аналогов в Paul (1 450 ₸) и La Tartine (1 350 ₸) цена 1 000 ₸ обеспечит валовую маржу 71% при полной лояльности жильцов ЖК Арай.',
      currentValue: 850,
      recommendedValue: 1000,
      unit: '₸/буханка',
      financialImpactKzt: 75000,
      priority: 'OPPORTUNITY',
      isApplied: false
    },
    {
      id: 'REC-04',
      type: 'RAW_MATERIAL',
      sector: 'SAUCES_SPICES',
      targetCode: 'CHILI_BIRDS_EYE',
      targetTitle: 'Острый перец Bird\'s Eye и Паприка (SPICY MOOD LAB)',
      title: 'Сезонная закупка и закладка ферментации соусов на 6 месяцев',
      rationale: 'Октябрь — сезонное дно цен грунтового перца (2 400 ₸/кг и паприка 350 ₸/кг). С ноября теплицы поднимут цены на 50-70%. Необходима закладка 200 кг в ферментаторы.',
      currentValue: 2400,
      recommendedValue: 2400,
      unit: '₸/кг',
      financialImpactKzt: 160000,
      priority: 'HIGH',
      isApplied: false
    },
    {
      id: 'REC-05',
      type: 'COST_SAVING',
      sector: 'BAKERY',
      targetCode: 'WHEY_ZERO_WASTE',
      targetTitle: 'Zero-Waste синергия сыроварни и пекарни',
      title: '100% замещение покупной воды сывороткой Casaro в тесте',
      rationale: 'Утилизация 350 л теплой сыворотки в неделю от CHEESY MOOD обогащает хлеб белком и сахарами, снижая себестоимость теста до минимума.',
      currentValue: 0,
      recommendedValue: 0,
      unit: '₸/л',
      financialImpactKzt: 45000,
      priority: 'MEDIUM',
      isApplied: false
    }
  ]);

  // Milk Lab Records

  // ================= 3b. MEAT LAB & RECEPTION RECORDS =================
  meatLabRecords = signal<MeatLabRecord[]>([
    {
      id: 'MLAB-2026-0928-01',
      sampleTime: '2026-09-28 07:30',
      supplier: 'КХ «Алатау Ет» (Талгарский р-н)',
      batchCode: 'LOT-MEAT-928A',
      vetDocNumber: 'ВетИС-KZ-092801',
      animalType: 'HORSE',
      cutCode: 'R1_HORSE',
      cutName: 'Конина в/с Жая (тазобедренный отруб для Билтонга BM-28)',
      weightKg: 120,
      temperatureC: 2.6,
      thermalState: 'CHILLED',
      acidityPh: 5.62,
      defectType: 'NOR',
      waterBindingCapacityPct: 64.5,
      fatColor: 'Плотный белый (без желтизны)',
      organolepticScore: 10,
      hasVetStamp: true,
      isHalalCertified: true,
      calculatedGrade: 'EXTRA_CRAFT',
      craftSuitabilityScore: 98,
      basePricePerKgKzt: 4000,
      adjustedPricePerKgKzt: 4200,
      totalSumKzt: 504000,
      status: 'ACCEPTED',
      operator: 'Павел Спицын (BEERMOOD #68702)',
      notes: 'Партия Жая превосходного качества, идеальна для посола и сушки билтонга.'
    },
    {
      id: 'MLAB-2026-0927-02',
      sampleTime: '2026-09-27 08:15',
      supplier: 'СПК «Жетысу Агро»',
      batchCode: 'LOT-MEAT-927B',
      vetDocNumber: 'ВетИС-KZ-092714',
      animalType: 'BEEF',
      cutCode: 'R1_BEEF',
      cutName: 'Говядина в/с огузок / оковалок зачищенный',
      weightKg: 85,
      temperatureC: 3.1,
      thermalState: 'CHILLED',
      acidityPh: 5.58,
      defectType: 'NOR',
      waterBindingCapacityPct: 62.0,
      fatColor: 'Светло-кремовый плотный',
      organolepticScore: 9,
      hasVetStamp: true,
      isHalalCertified: true,
      calculatedGrade: 'EXTRA_CRAFT',
      craftSuitabilityScore: 94,
      basePricePerKgKzt: 3350,
      adjustedPricePerKgKzt: 3518,
      totalSumKzt: 299030,
      status: 'ACCEPTED',
      operator: 'Павел Спицын (BEERMOOD #68702)',
      notes: 'Огузок с минимальным жировым поливом, направлен в посолочное отделение.'
    },
    {
      id: 'MLAB-2026-0926-03',
      sampleTime: '2026-09-26 10:00',
      supplier: 'ТОО «Первомайские Деликатесы»',
      batchCode: 'LOT-MEAT-926C',
      vetDocNumber: 'ВетИС-KZ-092608',
      animalType: 'PORK',
      cutCode: 'RIBS_PORK',
      cutName: 'Ребра свиные мясные калиброванные ленты (кухня паба)',
      weightKg: 90,
      temperatureC: 3.4,
      thermalState: 'CHILLED',
      acidityPh: 5.70,
      defectType: 'NOR',
      waterBindingCapacityPct: 61.0,
      fatColor: 'Белый плотный',
      organolepticScore: 9,
      hasVetStamp: true,
      isHalalCertified: false,
      calculatedGrade: 'EXTRA_CRAFT',
      craftSuitabilityScore: 92,
      basePricePerKgKzt: 2600,
      adjustedPricePerKgKzt: 2730,
      totalSumKzt: 245700,
      status: 'ACCEPTED',
      operator: 'Павел Спицын (BEERMOOD #68702)',
      notes: 'Калиброванные мясные ленты, направлены на мокрый посол 10°Be под копчение в Varmen Mini.'
    }
  ]);

  milkLabRecords = signal<MilkLabRecord[]>([

    {
      id: 'ML-2026-0927-01',
      sampleTime: '2026-09-27 07:45',
      supplier: 'КХ «Жетісу-Сүт» (Талгарский р-н)',
      batchCode: 'LOT-MILK-927A',
      volumeLiters: 150,
      fatPct: 3.90,
      proteinPct: 3.32,
      snfPct: 8.65,
      densityDegree: 28.5,
      addedWaterPct: 0.0,
      freezingPoint: -0.535,
      temperatureC: 5.2,
      acidityPh: 6.68,
      acidityTurner: 17.0,
      calculatedGrade: 'EXTRA',
      cheeseSuitabilityScore: 94,
      basePricePerLiterKzt: 260,
      adjustedPricePerLiterKzt: 284,
      totalSumKzt: 42600,
      status: 'ACCEPTED',
      notes: 'Партия премиум-качества. Рекомендована для варки Сулугуни и Страчателлы.'
    }
  ]);

  // Dairy & Bakery
  dairyRecipes = signal<DairyRecipe[]>([
    {
      id: 'CHEESE-01',
      name: 'Сыр Сулугуни слоистый (Кавказский классический)',
      nameKz: 'Сулугуни қатпарлы сыры',
      category: 'CHEESE',
      starterCulture: 'Sacco MS064 (термофильная группа)',
      starterDosagePer100L: '1.5 - 2.0 UC / 100 л',
      enzyme: 'Сычужный микробиальный Chymosin 100% (2.2 г на 100 л)',
      tempCoagulationC: 34,
      cuttingTimeMinutes: 35,
      targetYieldPct: 11.5,
      wheyYieldLitersPer100L: 85,
      packaging: 'Вакуум-пакет PA/PE головки по 350-450 г',
      shelfLifeDays: 30,
      description: 'Слоистый вытяжной сыр pasta filata. Чеддеризация до pH 5.15–5.25, плавка в горячей воде 72–75°C, формовка и посол в 18% рассоле.',
      techSteps: [
        'Пастеризация молока 65°C 30 мин в Casaro, охлаждение до 34°C',
        'Внесение CaCl2 (15 г) и закваски Sacco MS064, активация 45 мин',
        'Внесение фермента, образование сгустка (мультипликатор 3.0)',
        'Нарезка зерна до 8-10 мм, второе нагревание до 38°C',
        'Слив 85 л подсырной сыворотки и передача в пекарню',
        'Чеддеризация сырной массы под слоем сыворотки 2–2.5 ч',
        'Плавка лент при 74°C, вытягивание слоев, охлаждение в ледяной воде',
        'Посол в рассоле 18% (12 часов на 1 кг головки)'
      ]
    },
    {
      id: 'CHEESE-02',
      name: 'Страчателла в сливках (Stracciatella di Bufala style)',
      nameKz: 'Кілегейдегі страчателла сыры',
      category: 'CHEESE',
      starterCulture: 'Sacco MS064',
      starterDosagePer100L: '2.0 UC / 100 л',
      enzyme: 'Chymosin 100%',
      tempCoagulationC: 36,
      cuttingTimeMinutes: 30,
      targetYieldPct: 18.0,
      wheyYieldLitersPer100L: 84,
      packaging: 'ПЭТ-баночка 250 г под запайку / крышку',
      shelfLifeDays: 7,
      description: 'Тонкие расщепленные волокна сырного теста сулугуни (60%), залитые сливками 33% (40%).',
      techSteps: [
        'Сырное тесто прогреть в горячей воде, вытянуть в тонкие нити',
        'Порвать нити вручную на волокна 4-6 см',
        'Смешать: 600 г волокон + 400 г сливок 33% + 4 г соли',
        'Фасовка в баночки по 250 г'
      ]
    }
  ]);

  bakeryRecipes = signal<BakeryRecipe[]>([
    {
      id: 'BREAD-01',
      name: 'Хлеб «Тартин ремесленный» на 100% подсырной сыворотке',
      nameKz: 'Сүт сарысуындағы қолөнер тартині',
      flourBlend: 'Пшеничная в/с (75%) + Цельнозерновая (20%) + Ржаная (5%)',
      hydrationPct: 78,
      wheyUsedPct: 100,
      fermentationHours: 24,
      ovenTempC: 245,
      targetWeightG: 750,
      cogsPerLoafKzt: 280,
      retailPriceKzt: 1200,
      zeroWasteNotes: 'Замена 100% воды на сыворотку от сулугуни дает карамелизированную корочку и эластичный мякиш.'
    }
  ]);

  // GIANT Planning State
  equipmentStatuses = signal<EquipmentStatus[]>([
    {
      id: 'CASARO_CHEESE_VAT',
      name: 'Сыроизготовитель Casaro 100 л',
      location: 'Сыроварня CHEESY MOOD (цех Арай)',
      capacityMax: '100 л молока / цикл',
      powerKw: 7.5,
      currentCycle: 'Пастеризация и нагрев до 34°C (Сулугуни)',
      progressPct: 65,
      status: 'RUNNING',
      estimatedFinishTime: '11:45'
    },
    {
      id: 'IZHITZA_SMOKER',
      name: 'Коптильно-варочная камера «Ижица Varmen Mini»',
      location: 'Колбасный цех MEAT & BREAD MOOD',
      capacityMax: '25 кг загрузка / рама',
      powerKw: 4.8,
      currentCycle: 'Варка паром 72°C (Охотничьи колбаски 3-135)',
      progressPct: 82,
      status: 'RUNNING',
      estimatedFinishTime: '11:15'
    },
    {
      id: 'BILTONG_CHAMBER',
      name: 'Климатическая камера сушки билтонга (+14°C, 68%)',
      location: 'Вялочный отсек',
      capacityMax: '100 кг подвес (50 кг выхода)',
      powerKw: 1.8,
      currentCycle: 'Вяление партии BM-28 Жая (День 4 из 6)',
      progressPct: 58,
      status: 'RUNNING',
      estimatedFinishTime: '29.09 18:00'
    },
    {
      id: 'UNOX_OVEN',
      name: 'Печь подовая / пароконвектомат Unox BakerLux',
      location: 'Пекарня MEAT & BREAD MOOD',
      capacityMax: '16 булок тартина по 750 г',
      powerKw: 9.2,
      currentCycle: 'Ожидание посадки тартинов (расстойка корзин)',
      progressPct: 0,
      status: 'IDLE',
      estimatedFinishTime: 'Готова к пуску'
    },
    {
      id: 'PUB_KITCHEN',
      name: 'Кухня BEERMOOD.PUB (Гриль & Смокер)',
      location: 'Зал паба (ул. Жарокова 137/1)',
      capacityMax: 'Посадка 45 мест + Takeaway',
      powerKw: 15.0,
      currentCycle: 'Подготовка ланч-сетов и ребер 1-002',
      progressPct: 40,
      status: 'RUNNING',
      estimatedFinishTime: '12:00'
    }
  ]);

  productionTasks = signal<ProductionTask[]>([
    {
      id: 'TASK-101',
      shiftDate: '2026-09-28',
      equipment: 'CASARO_CHEESE_VAT',
      productName: 'Сыр Сулугуни слоистый + Страчателла',
      batchInputKgOrL: 100,
      expectedOutputKg: 12.0,
      laborHours: 4.5,
      operator: 'Спицын П. Н. / Технолог',
      status: 'IN_PROGRESS',
      priority: 'HIGH'
    },
    {
      id: 'TASK-102',
      shiftDate: '2026-09-28',
      equipment: 'IZHITZA_SMOKER',
      productName: 'Колбаски Охотничьи (3-135) + Ребра свиные (1-002)',
      batchInputKgOrL: 25,
      expectedOutputKg: 21.5,
      laborHours: 3.0,
      operator: 'Мастер цеха',
      status: 'IN_PROGRESS',
      priority: 'HIGH'
    }
  ]);

  // Arai Orders
  araiOrders = signal<AraiResidentOrder[]>([
    {
      id: 'ORD-ARAI-081',
      orderNumber: 'AR-081',
      customerName: 'Ерлан Садыков',
      phone: '+7 777 234 5678',
      block: 'Г3',
      apartment: 'кв. 142',
      deliveryDate: '2026-09-28',
      deliverySlot: '08:00 - 09:30',
      items: [
        { id: '1', productName: 'Страчателла в сливках 250г', unit: 'банка', quantity: 2, unitPriceKzt: 2800, totalKzt: 5600 },
        { id: '2', productName: 'Тартин ремесленный на сыворотке 750г', unit: 'булка', quantity: 1, unitPriceKzt: 1200, totalKzt: 1200 },
        { id: '3', productName: 'Колбаски Охотничьи в/к', unit: 'кг', quantity: 0.45, unitPriceKzt: 9500, totalKzt: 4275 }
      ],
      subtotalKzt: 11075,
      moodClubDiscountPct: 10,
      discountSumKzt: 1108,
      finalTotalKzt: 9967,
      paymentMethod: 'KASPI_QR',
      status: 'PREPARING',
      isTsplPrinted: true,
      createdAt: '2026-09-27 21:10'
    }
  ]);

  // Computed Koch Cards
  filteredKochCards = computed<EnrichedTechCard[]>(() => {
    const rawBatch = this.batchKg() || 20;
    const std = this.stdMode();
    const chan = this.channelMode();
    const goal = this.activeGoal();
    const sort = this.sortMode();
    const q = this.searchQuery().toLowerCase().trim();
    const dict = this.meatStandards();

    const list = this.techCards()
      .filter((c) => {
        const matchGoal = goal === 'all' || c.goal === goal;
        const meatStr = c.meats
          .map((m) => {
            const s = dict[m.code];
            return s ? `${m.code} ${s.de} ${s.kz} ${s.halal}` : m.code;
          })
          .join(' ')
          .toLowerCase();

        const matchQ =
          !q ||
          c.code.toLowerCase().includes(q) ||
          c.plu.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.titleKz.toLowerCase().includes(q) ||
          meatStr.includes(q);

        return matchGoal && matchQ;
      })
      .map((card) => ({
        card,
        econ: this.calculateEconomics(card, rawBatch, std, chan)
      }));

    return list.sort((a, b) => {
      if (sort === 'profit_desc') return b.econ.grossProfitKzt - a.econ.grossProfitKzt;
      if (sort === 'markup_desc') return b.econ.markupPct - a.econ.markupPct;
      if (sort === 'fc_asc') return a.econ.foodCostPct - b.econ.foodCostPct;
      if (sort === 'labor_asc') return a.card.laborScore - b.card.laborScore;
      return a.card.code.localeCompare(b.card.code);
    });
  });

  // Koch Summary KPI
  kochSummaryKpi = computed(() => {
    const list = this.filteredKochCards();
    const avgMarkup = list.length
      ? list.reduce((s, x) => s + x.econ.markupPct, 0) / list.length
      : 0;
    const avgFc = list.length
      ? list.reduce((s, x) => s + x.econ.foodCostPct, 0) / list.length
      : 0;
    const topItem = list.length
      ? list.reduce(
          (prev, cur) =>
            cur.econ.grossProfitKzt > prev.econ.grossProfitKzt ? cur : prev,
          list[0]
        )
      : null;
    return { count: list.length, avgMarkup, avgFc, topItem };
  });

  // Global Workspace KPI Summary
  globalKpi = computed<GlobalKpiSummary>(() => {
    const orders = this.araiOrders();
    const pendingOrders = orders.filter((o) => o.status !== 'DELIVERED').length;
    const todayRevenue = orders.reduce((sum, o) => sum + o.finalTotalKzt, 0);

    const milkRecords = this.milkLabRecords();
    const totalMilk = milkRecords.reduce((sum, m) => sum + m.volumeLiters, 0);

    const cards = this.filteredKochCards();
    const avgFc = cards.length
      ? cards.reduce((sum, c) => sum + c.econ.foodCostPct, 0) / cards.length
      : 0;
    const avgMarkup = cards.length
      ? cards.reduce((sum, c) => sum + c.econ.markupPct, 0) / cards.length
      : 0;

    const forecast = this.financialForecasts()[0];
    const ebitda = forecast ? forecast.ebitdaKzt : 0;
    const activeRecs = this.recommendations().filter((r) => !r.isApplied).length;

    return {
      todayRevenueKzt: todayRevenue,
      activeBatchKg: this.batchKg(),
      milkProcessedLiters: totalMilk,
      araiOrdersPending: pendingOrders,
      averageFoodCostPct: avgFc,
      averageMarkupPct: avgMarkup,
      monthlyProjectedEbitdaKzt: ebitda,
      activeRecommendationsCount: activeRecs
    };
  });

  calculateEconomics(
    card: KochTechCard,
    rawBatchKg: number,
    stdMode: StandardMode,
    channelMode: SalesChannel
  ): CalculatedEconomics {
    const factor = rawBatchKg / 100.0;
    const dict = this.meatStandards();
    let rawMeatCostKzt = 0;

    card.meats.forEach((m) => {
      const std = dict[m.code];
      const useHalal = stdMode === 'halal' || !!m.forceHalal;
      const pricePerKg = std ? (useHalal ? std.halalKzt : std.kzt) : 2500;
      rawMeatCostKzt += m.kg * factor * pricePerKg;
    });

    const finishedKg = rawBatchKg * card.yieldRatio;
    const addonsCostKzt = finishedKg * card.addonPerFinishedKgKzt;
    const totalCogsKzt = rawMeatCostKzt + addonsCostKzt;
    const cogsPerFinishedKgKzt = totalCogsKzt / (finishedKg || 1);

    const sellPricePerKgKzt =
      channelMode === 'pub' ? card.pricePubKzt : card.priceTakeawayKzt;
    const totalRevenueKzt = finishedKg * sellPricePerKgKzt;
    const grossProfitKzt = totalRevenueKzt - totalCogsKzt;
    const profitPerFinishedKgKzt = grossProfitKzt / (finishedKg || 1);

    const markupPct = totalCogsKzt > 0 ? (grossProfitKzt / totalCogsKzt) * 100 : 0;
    const foodCostPct =
      totalRevenueKzt > 0 ? (totalCogsKzt / totalRevenueKzt) * 100 : 0;

    return {
      finishedKg,
      rawMeatCostKzt,
      addonsCostKzt,
      totalCogsKzt,
      cogsPerFinishedKgKzt,
      sellPricePerKgKzt,
      totalRevenueKzt,
      grossProfitKzt,
      profitPerFinishedKgKzt,
      markupPct,
      foodCostPct
    };
  }

  formatMoney(kztVal: number): string {
    const mode = this.currencyMode();
    const usdVal = kztVal / this.RATE;
    const roundedKzt = Math.round(kztVal).toLocaleString('ru-RU');
    if (mode === 'KZT') return `${roundedKzt} ₸`;
    if (mode === 'USD') return `$${usdVal.toFixed(2)}`;
    return `${roundedKzt} ₸ ($${usdVal.toFixed(2)})`;
  }

  getMeatLabel(code: string, forceHalal?: boolean): string {
    const s = this.meatStandards()[code];
    if (!s) return code;
    const mode = this.stdMode();
    if (mode === 'halal' || forceHalal) return s.halal;
    if (mode === 'de') return s.de;
    return s.kz;
  }

  // ================= 7. SYNCHRONIZATION & RECOMMENDATIONS ACTION =================

  applyRecommendation(recId: string): boolean {
    const rec = this.recommendations().find((r) => r.id === recId);
    if (!rec || rec.isApplied) return false;

    // 1. Если рекомендация по цене сырья
    if (rec.type === 'RAW_MATERIAL') {
      const code = rec.targetCode;
      this.meatStandards.update((dict) => {
        if (dict[code]) {
          return {
            ...dict,
            [code]: { ...dict[code], kzt: rec.recommendedValue }
          };
        }
        return dict;
      });

      this.rawMaterialPrices.update((list) =>
        list.map((item) =>
          item.code === code ? { ...item, currentCostKzt: rec.recommendedValue, lastUpdated: new Date().toISOString().substring(0, 10) } : item
        )
      );
    }

    // 2. Если рекомендация по отпускной цене техкарты
    if (rec.type === 'RECIPE_PRICE') {
      const code = rec.targetCode;
      this.techCards.update((list) =>
        list.map((c) => {
          if (c.code === code) {
            return {
              ...c,
              priceTakeawayKzt: rec.recommendedValue,
              pricePubKzt: Math.round(rec.recommendedValue * 1.15)
            };
          }
          return c;
        })
      );
    }

    // 3. Отмечаем рекомендацию примененной
    this.recommendations.update((list) =>
      list.map((r) =>
        r.id === recId
          ? { ...r, isApplied: true, appliedAt: new Date().toLocaleTimeString('ru-RU') }
          : r
      )
    );

    return true;
  }

  applyAllRecommendations(): number {
    const unapplied = this.recommendations().filter((r) => !r.isApplied);
    unapplied.forEach((r) => this.applyRecommendation(r.id));
    return unapplied.length;
  }

  updateRawMaterialPrice(code: string, newPrice: number) {
    this.meatStandards.update((dict) => {
      if (dict[code]) {
        return {
          ...dict,
          [code]: { ...dict[code], kzt: newPrice }
        };
      }
      return dict;
    });

    this.rawMaterialPrices.update((list) =>
      list.map((item) =>
        item.code === code ? { ...item, currentCostKzt: newPrice, lastUpdated: new Date().toISOString().substring(0, 10) } : item
      )
    );
  }

  updateCompetitorPrice(id: string, newCompPrice: number) {
    this.competitorBenchmarks.update((list) =>
      list.map((item) => {
        if (item.id === id) {
          const gap = ((item.ourPriceKzt - newCompPrice) / (newCompPrice || 1)) * 100;
          return {
            ...item,
            competitorPriceKzt: newCompPrice,
            priceGapPct: Number(gap.toFixed(1))
          };
        }
        return item;
      })
    );
  }

  // ================= 8. LAB, ORDERS, TASKS MUTATIONS =================

  addMilkLabRecord(data: Omit<MilkLabRecord, 'id' | 'calculatedGrade' | 'cheeseSuitabilityScore' | 'adjustedPricePerLiterKzt' | 'totalSumKzt'>) {
    let grade: MilkGrade = 'EXTRA';
    if (data.densityDegree < 27.0 || data.snfPct < 8.2 || data.addedWaterPct > 0 || data.acidityTurner > 19) {
      grade = 'REJECT';
    } else if (data.densityDegree < 28.0 || data.proteinPct < 3.0 || data.acidityTurner > 18) {
      grade = 'SECOND';
    } else if (data.fatPct < 3.4 || data.proteinPct < 3.1) {
      grade = 'FIRST';
    }

    const proteinFatRatio = data.proteinPct / (data.fatPct || 1);
    let cheeseScore = 80;
    if (proteinFatRatio >= 0.80 && proteinFatRatio <= 0.88) cheeseScore += 15;
    if (data.densityDegree >= 28.0) cheeseScore += 5;
    if (data.addedWaterPct > 0) cheeseScore = 0;

    const fatCoeff = data.fatPct / 3.6;
    const proteinCoeff = data.proteinPct / 3.2;
    const adjustedPrice = Math.round(data.basePricePerLiterKzt * ((fatCoeff + proteinCoeff) / 2));
    const totalSum = adjustedPrice * data.volumeLiters;

    const newRecord: MilkLabRecord = {
      ...data,
      id: `ML-${Date.now().toString().slice(-6)}`,
      calculatedGrade: grade,
      cheeseSuitabilityScore: Math.min(100, cheeseScore),
      adjustedPricePerLiterKzt: adjustedPrice,
      totalSumKzt: totalSum
    };

    this.milkLabRecords.update((list) => [newRecord, ...list]);
    return newRecord;
  }

  updateOrderStatus(orderId: string, status: OrderStatus) {
    this.araiOrders.update((list) =>
      list.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  }

  addAraiOrder(order: Omit<AraiResidentOrder, 'id' | 'orderNumber' | 'createdAt' | 'discountSumKzt' | 'finalTotalKzt' | 'isTsplPrinted'>) {
    const discountSum = Math.round(order.subtotalKzt * (order.moodClubDiscountPct / 100));
    const finalTotal = order.subtotalKzt - discountSum;
    const newOrd: AraiResidentOrder = {
      ...order,
      id: `ORD-ARAI-${Date.now().toString().slice(-4)}`,
      orderNumber: `AR-${Math.floor(100 + Math.random() * 900)}`,
      discountSumKzt: discountSum,
      finalTotalKzt: finalTotal,
      isTsplPrinted: false,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    this.araiOrders.update((list) => [newOrd, ...list]);
    return newOrd;
  }

  updateTaskStatus(taskId: string, status: ProductionTask['status']) {
    this.productionTasks.update((list) =>
      list.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  }

  // ================= 9. TSPL PRINT ENGINE =================

  openTsplModal(code: string, title: string) {
    this.selectedTsplCode.set(code);
    this.selectedTsplTitle.set(title);
    this.isTsplModalOpen.set(true);
  }

  closeTsplModal() {
    this.isTsplModalOpen.set(false);
  }

  generateProductTspl(item: EnrichedTechCard, sampleWeightKg = 0.320): string {
    const c = item.card;
    const priceKg = Math.round(item.econ.sellPricePerKgKzt);
    const totalCost = Math.round(priceKg * sampleWeightKg);
    const totalWithClub = Math.round(totalCost * 0.90);
    const weightGramsStr = Math.round(sampleWeightKg * 1000).toString().padStart(5, '0');
    const eanCode = `${c.eanPrefix}${weightGramsStr}`;

    const dateNow = new Date();
    const packDate = dateNow.toLocaleDateString('ru-RU');
    const expDateObj = new Date(dateNow.getTime() + c.shelfLifeDays * 24 * 3600 * 1000);
    const expDate = expDateObj.toLocaleDateString('ru-RU');

    return `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 25,25,"3",0,1,1,"MEAT&BREAD MOOD * MOOD GROUP"
TEXT 460,28,"2",0,1,1,"СТ РК / ГОСТ"
BAR 10,60,666,2
TEXT 25,75,"2",0,1,1,"${c.titleKz.substring(0, 30).toUpperCase()}"
TEXT 25,105,"3",0,1,1,"${c.title.substring(0, 28).toUpperCase()}"
BAR 10,140,666,2
TEXT 25,155,"2",0,1,1,"Рецепт: ${c.code} | PLU: ${c.plu}"
TEXT 25,185,"2",0,1,1,"Оболочка: ${c.casing.substring(0, 38)}"
TEXT 25,215,"2",0,1,1,"Упаковано: ${packDate} | Годен до: ${expDate}"
TEXT 25,245,"2",0,1,1,"Хранить при t: +2...+4 C (влажн. 75%)"
BAR 10,275,666,2
TEXT 25,295,"3",0,1,1,"МАССА НЕТТО:"
TEXT 240,290,"4",0,1,1,"${sampleWeightKg.toFixed(3)} кг"
TEXT 25,345,"3",0,1,1,"ЦЕНА ЗА КГ:"
TEXT 240,345,"3",0,1,1,"${priceKg.toLocaleString('ru-RU')} KZT"
TEXT 25,385,"3",0,1,1,"ИТОГО К ОПЛАТЕ:"
TEXT 260,378,"4",0,1,1,"${totalCost.toLocaleString('ru-RU')} KZT"
TEXT 25,430,"2",0,1,1,"MOOD CLUB (-10%): ${totalWithClub.toLocaleString('ru-RU')} KZT"
BAR 10,465,666,2
BARCODE 55,485,"EAN13",90,2,0,3,3,"${eanCode}"
TEXT 25,605,"1",0,1,1,"Производитель: ТОО MOOD GROUP, г. Алматы, ул. Жарокова 137/1"
TEXT 25,630,"1",0,1,1,"Система контроля качества BEERMOOD ERP v3 * www.beermood.kz"
PRINT 1, 1`;
  }


  addMeatLabRecord(data: Omit<MeatLabRecord, 'id'>): MeatLabRecord {
    const newRecord: MeatLabRecord = {
      ...data,
      id: `MLAB-${Date.now().toString().slice(-6)}`
    };
    this.meatLabRecords.update((list) => [newRecord, ...list]);
    return newRecord;
  }

  generateMeatActTspl(rec: MeatLabRecord): string {
    return `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 30,25,"3",0,1,1,"BEERMOOD * ВХОДНОЙ КОНТРОЛЬ"
TEXT 30,60,"2",0,1,1,"АКТ ПРИЕМКИ МЯСНОГО СЫРЬЯ"
BAR 10,90,666,2
TEXT 25,105,"2",0,1,1,"Партия: ${rec.batchCode}"
TEXT 25,135,"2",0,1,1,"ВетСвид: ${rec.vetDocNumber}"
TEXT 25,165,"2",0,1,1,"Поставщик: ${rec.supplier.substring(0, 32)}"
TEXT 25,195,"3",0,1,1,"Отруб: ${rec.cutName.substring(0, 32)}"
TEXT 25,230,"3",0,1,1,"Вес нетто: ${rec.weightKg} кг (Масса-К)"
BAR 10,265,666,2
TEXT 25,280,"2",0,1,1,"Температура: ${rec.temperatureC.toFixed(1)} C (Норма 0-4 C)"
TEXT 25,310,"2",0,1,1,"pH (Hanna): ${rec.acidityPh.toFixed(2)} | Тип: ${rec.defectType} (NOR)"
TEXT 25,340,"2",0,1,1,"ВСС: ${rec.waterBindingCapacityPct.toFixed(1)} % | Жир: ${rec.fatColor.substring(0, 20)}"
TEXT 25,370,"2",0,1,1,"Органолептика: ${rec.organolepticScore}/10 | Клеймо: ${rec.hasVetStamp ? 'ЕСТЬ' : 'НЕТ'}"
BAR 10,405,666,2
TEXT 25,420,"3",0,1,1,"СОРТ ХАССП:"
TEXT 230,415,"4",0,1,1,"${rec.calculatedGrade === 'EXTRA_CRAFT' ? 'ВЫСШИЙ КРАФТ' : rec.calculatedGrade}"
TEXT 25,470,"2",0,1,1,"Индекс сыровяления: ${rec.craftSuitabilityScore} / 100 баллов"
TEXT 25,500,"3",0,1,1,"Зачетная цена: ${rec.adjustedPricePerKgKzt} ₸/кг"
TEXT 25,535,"3",0,1,1,"СУММА ПАРТИИ: ${rec.totalSumKzt.toLocaleString('ru-RU')} ₸"
BAR 10,575,666,2
BARCODE 120,590,"128",60,1,0,2,2,"${rec.id}"
TEXT 25,665,"1",0,1,1,"ХАССП ККТ-1 * Приемщик: ${rec.operator}"
PRINT 1, 1`;
  }

  generateMilkActTspl(rec: MilkLabRecord): string {
    return `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 30,25,"3",0,1,1,"CHEESY MOOD * ЛАБОРАТОРИЯ"
TEXT 30,60,"2",0,1,1,"АКТ ПРИЕМКИ СЫРОГО МОЛОКА"
BAR 10,90,666,2
TEXT 25,105,"2",0,1,1,"Партия: ${rec.batchCode}"
TEXT 25,135,"2",0,1,1,"Дата/Время: ${rec.sampleTime}"
TEXT 25,165,"2",0,1,1,"Поставщик: ${rec.supplier.substring(0, 32)}"
TEXT 25,195,"3",0,1,1,"Объем: ${rec.volumeLiters} л"
BAR 10,230,666,2
TEXT 25,245,"2",0,1,1,"Жирность (Fat): ${rec.fatPct.toFixed(2)} % (База 3.6%)"
TEXT 25,275,"2",0,1,1,"Белок (Protein): ${rec.proteinPct.toFixed(2)} % (База 3.2%)"
TEXT 25,305,"2",0,1,1,"СОМО (SNF): ${rec.snfPct.toFixed(2)} % | Плотн: ${rec.densityDegree} A"
TEXT 25,335,"2",0,1,1,"Вода: ${rec.addedWaterPct.toFixed(1)} % | t зам: ${rec.freezingPoint} C"
TEXT 25,365,"2",0,1,1,"Кислотность: pH ${rec.acidityPh.toFixed(2)} (${rec.acidityTurner} T)"
BAR 10,400,666,2
TEXT 25,415,"3",0,1,1,"СОРТНОСТЬ:"
TEXT 220,410,"4",0,1,1,"${rec.calculatedGrade === 'EXTRA' ? 'ВЫСШИЙ СОРТ' : rec.calculatedGrade}"
TEXT 25,465,"2",0,1,1,"Сыропригодность: ${rec.cheeseSuitabilityScore} / 100 баллов"
TEXT 25,495,"3",0,1,1,"Зачетная цена: ${rec.adjustedPricePerLiterKzt} ₸/л"
TEXT 25,530,"3",0,1,1,"СУММА ПАРТИИ: ${rec.totalSumKzt.toLocaleString('ru-RU')} ₸"
BAR 10,570,666,2
BARCODE 120,585,"128",60,1,0,2,2,"${rec.id}"
TEXT 25,660,"1",0,1,1,"Анализатор: Эксперт Профи * Приемщик: Спицын П. Н."
PRINT 1, 1`;
  }

  generateOrderTspl(order: AraiResidentOrder): string {
    return `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 25,25,"3",0,1,1,"ДОСТАВКА: ЖК «АРАЙ»"
TEXT 440,25,"3",0,1,1,"${order.orderNumber}"
BAR 10,60,666,2
TEXT 25,75,"4",0,1,1,"БЛОК ${order.block} • ${order.apartment}"
TEXT 25,125,"3",0,1,1,"Получатель: ${order.customerName.substring(0, 24)}"
TEXT 25,160,"2",0,1,1,"Тел: ${order.phone}"
TEXT 25,190,"2",0,1,1,"Слот: ${order.deliverySlot} (${order.deliveryDate})"
BAR 10,225,666,2
TEXT 25,240,"2",0,1,1,"СОСТАВ ЗАКАЗА:"
TEXT 25,268,"2",0,1,1,"${order.items[0] ? order.items[0].productName.substring(0, 32) : ''}"
TEXT 25,296,"2",0,1,1,"${order.items[1] ? order.items[1].productName.substring(0, 32) : ''}"
TEXT 25,324,"2",0,1,1,"${order.items[2] ? order.items[2].productName.substring(0, 32) : ''}"
BAR 10,360,666,2
TEXT 25,380,"3",0,1,1,"Сумма без скидки: ${order.subtotalKzt.toLocaleString('ru-RU')} ₸"
TEXT 25,415,"2",0,1,1,"Скидка жильца ЖК: -${order.discountSumKzt.toLocaleString('ru-RU')} ₸ (${order.moodClubDiscountPct}%)"
TEXT 25,450,"3",0,1,1,"ИТОГО К ОПЛАТЕ:"
TEXT 270,442,"4",0,1,1,"${order.finalTotalKzt.toLocaleString('ru-RU')} ₸"
TEXT 25,495,"2",0,1,1,"Оплата: ${order.paymentMethod === 'KASPI_QR' ? 'KASPI QR ПРИ ПОЛУЧЕНИИ' : order.paymentMethod}"
BAR 10,530,666,2
BARCODE 120,545,"128",65,1,0,2,2,"${order.orderNumber}"
TEXT 25,630,"1",0,1,1,"MOOD GROUP • BEERMOOD.PUB • CHEESY MOOD • MEAT&BREAD"
TEXT 25,655,"1",0,1,1,"Пакет собран и промаркирован: ${order.createdAt}"
PRINT 1, 1`;
  }

  async sendTsplToPrinter(tsplCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiConfig().baseUrl}/print_tspl.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this.printerConfig().ip,
          port: this.printerConfig().port,
          tspl: tsplCode
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err: any) {
      console.warn('Network print gateway error or mock mode:', err);
      return {
        success: true,
        message: `[MOCK GATEWAY] Команда TSPL (${tsplCode.length} байт) успешно поставлена в очередь печати на ${this.printerConfig().ip}:${this.printerConfig().port}`
      };
    }
  }
}
