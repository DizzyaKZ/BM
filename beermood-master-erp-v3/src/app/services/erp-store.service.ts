import { Injectable, inject, signal, effect } from '@angular/core';
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
      await firstValueFrom(this.http.post(`${environment.apiUrl}?action=save_snapshot`, {
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
      const res = await firstValueFrom(this.http.post<any>(`${environment.apiUrl}/print?action=print`, {
        ip: this.printerIp(),
        tspl
      }));
      this.lastPrintStatus.set(res?.msg || 'Отправлено на печать');
    } catch {
      this.lastPrintStatus.set('Мост не запущен (выполните npm run bridge или скопируйте однострочник Терминала)');
    }
  }
}
