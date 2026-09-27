import { Injectable, inject, signal, effect, computed } from '@angular/core';
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
        { name: 'Мука пшеничная в/с (W 300, белок 13%)', amount: '12,6 кг', note: "85% Baker's Formula" },
        { name: 'Мука пшеничная цельнозерновая', amount: '2,2 кг', note: "15% Baker's Formula" },
        { name: 'Сыворотка CHEESY MOOD + вода (50/50)', amount: '11,1 л', note: '75% гидратация (Zero-Waste синергия)' },
        { name: 'Закваска Levain (100% гидратации)', amount: '3,0 кг', note: '20% к массе муки, на пике подъема' },
        { name: 'Морская соль мелкая', amount: '325 г', note: "2,2% Baker's Formula" }
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
      outputNorm: `${line.monthlyKg} кг в месяц`,
      equipment: 'Стандартная линия цеха ЖК Арай',
      rawMaterials: [{ name: 'Базовое сырье по спецификации', amount: '100%' }],
      steps: [
        { id: 1, title: 'Приемка и контроль сырья', desc: 'Проверка сопроводительных документов и биоконтроль.', done: false },
        { id: 2, title: 'Технологическая обработка', desc: line.pivotAction, done: false },
        { id: 3, title: 'Фасовка и маркировка TSC TE310', desc: 'Контрольное взвешивание и печать этикетки.', done: false }
      ],
      packagingRule: 'Индивидуальная потребительская упаковка',
      storageNorm: `Режим: ${line.temp}, срок: ${line.shelfDays} суток`
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
      const res = await firstValueFrom(this.http.get<any>(`${environment.apiUrl}?action=status`));
      if (res?.status === 'ok') this.syncStatus.set(`🟢 Подключено: ${res.server}`);
    } catch {
      this.syncStatus.set('💻 Локальный стенд VS Code (LocalStorage DB)');
    }
  }

  async sendTsplToPrinterOrServer(tspl: string, plu: string, batch: string, massKg: number, totalKzt: number): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/print?action=print`, {
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
