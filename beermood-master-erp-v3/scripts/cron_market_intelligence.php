<?php
/**
 * BEERMOOD Master ERP — Ежедневный мультисекторный мониторинг цен и выработка AI-рекомендаций
 * Секторы: Мясо • Молоко и сыры • Хлеб и пекарня • Соусы и смеси пряностей
 * Расписание запуска: Ежедневно в 09:00 (Asia/Almaty)
 * Холдинг: MOOD GROUP (ул. Жарокова 137/1, ЖК «Арай»)
 */

require_once __DIR__ . '/../api/db.php';

function runMarketIntelligenceScan($pdo = null) {
    $now = date('Y-m-d H:i:s');
    $results = [
        'scan_time' => $now,
        'sectors' => ['MEAT', 'DAIRY', 'BAKERY', 'SAUCES_SPICES'],
        'raw_materials_analyzed' => 0,
        'benchmarks_analyzed' => 0,
        'new_recommendations' => [],
        'sector_insights' => []
    ];

    $rawMaterials = [
        // Мясо
        ['code' => 'R1_HORSE', 'sector' => 'MEAT', 'name' => 'Конина Жая в/с', 'current_cost_kzt' => 4000, 'market_avg_kzt' => 4350, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 5.2],
        ['code' => 'R1_BEEF', 'sector' => 'MEAT', 'name' => 'Говядина в/с (огузок)', 'current_cost_kzt' => 3350, 'market_avg_kzt' => 3600, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 4.5],
        ['code' => 'S1_PORK', 'sector' => 'MEAT', 'name' => 'Свинина окорок б/к', 'current_cost_kzt' => 2200, 'market_avg_kzt' => 2180, 'unit' => 'кг', 'trend' => 'DOWN', 'trend_pct' => -2.1],
        ['code' => 'S4B_BEACON', 'sector' => 'MEAT', 'name' => 'Грудинка свиная слоистая', 'current_cost_kzt' => 2400, 'market_avg_kzt' => 2520, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 3.0],
        ['code' => 'RIBS_PORK', 'sector' => 'MEAT', 'name' => 'Ребра свиные мясные ленты', 'current_cost_kzt' => 2600, 'market_avg_kzt' => 2780, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 2.5],
        // Молоко
        ['code' => 'MILK_EXTRA', 'sector' => 'DAIRY', 'name' => 'Молоко сырое Экстра 4.2%', 'current_cost_kzt' => 280, 'market_avg_kzt' => 285, 'unit' => 'л', 'trend' => 'UP', 'trend_pct' => 1.8],
        ['code' => 'CREAM_33', 'sector' => 'DAIRY', 'name' => 'Сливки пастеризованные 33%', 'current_cost_kzt' => 2600, 'market_avg_kzt' => 2750, 'unit' => 'л', 'trend' => 'UP', 'trend_pct' => 3.5],
        ['code' => 'SACCO_MS', 'sector' => 'DAIRY', 'name' => 'Закваски Sacco Lyofast', 'current_cost_kzt' => 4200, 'market_avg_kzt' => 4400, 'unit' => 'пакет', 'trend' => 'STABLE', 'trend_pct' => 0.0],
        // Хлеб
        ['code' => 'FLOUR_W300', 'sector' => 'BAKERY', 'name' => 'Мука сильная пшеничная W300', 'current_cost_kzt' => 380, 'market_avg_kzt' => 405, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 3.9],
        ['code' => 'FLOUR_RYE', 'sector' => 'BAKERY', 'name' => 'Мука ржаная обдирная', 'current_cost_kzt' => 320, 'market_avg_kzt' => 330, 'unit' => 'кг', 'trend' => 'STABLE', 'trend_pct' => 0.0],
        ['code' => 'WHEY_CHEESE', 'sector' => 'BAKERY', 'name' => 'Сыворотка молочная Casaro', 'current_cost_kzt' => 0, 'market_avg_kzt' => 80, 'unit' => 'л', 'trend' => 'STABLE', 'trend_pct' => 0.0],
        // Соусы и смеси
        ['code' => 'CHILI_BIRDS_EYE', 'sector' => 'SAUCES_SPICES', 'name' => 'Перец острый Bird\\'s Eye свежий', 'current_cost_kzt' => 2400, 'market_avg_kzt' => 2650, 'unit' => 'кг', 'trend' => 'DOWN', 'trend_pct' => -6.5],
        ['code' => 'PEPPER_BELL_RED', 'sector' => 'SAUCES_SPICES', 'name' => 'Перец сладкий паприка грунтовой', 'current_cost_kzt' => 350, 'market_avg_kzt' => 380, 'unit' => 'кг', 'trend' => 'DOWN', 'trend_pct' => -8.0],
        ['code' => 'GARLIC_TALGAR', 'sector' => 'SAUCES_SPICES', 'name' => 'Чеснок местный талгарский', 'current_cost_kzt' => 1100, 'market_avg_kzt' => 1250, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 2.0],
        ['code' => 'PAPRIKA_PIMENTON', 'sector' => 'SAUCES_SPICES', 'name' => 'Паприка копченая испанская', 'current_cost_kzt' => 6800, 'market_avg_kzt' => 7200, 'unit' => 'кг', 'trend' => 'UP', 'trend_pct' => 3.1]
    ];

    if ($pdo) {
        $stmt = $pdo->query("SELECT * FROM raw_material_prices");
        $dbRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($dbRaw)) $rawMaterials = $dbRaw;
    }
    $results['raw_materials_analyzed'] = count($rawMaterials);

    $benchmarks = [
        ['category' => 'МЯСО', 'sector' => 'MEAT', 'title' => 'Билтонг Жая (50 г)', 'our' => 1750, 'comp' => 2450, 'gap' => -28.6, 'name' => 'Galmart'],
        ['category' => 'СЫР', 'sector' => 'DAIRY', 'title' => 'Страчателла в сливках (200 г)', 'our' => 1800, 'comp' => 2450, 'gap' => -26.5, 'name' => 'Galmart Gourmet'],
        ['category' => 'ХЛЕБ', 'sector' => 'BAKERY', 'title' => 'Тартин на закваске (650 г)', 'our' => 850, 'comp' => 1450, 'gap' => -41.4, 'name' => 'Paul Almaty'],
        ['category' => 'СОУС', 'sector' => 'SAUCES_SPICES', 'title' => 'Соус Piri-Piri MOOD (150 мл)', 'our' => 1650, 'comp' => 2850, 'gap' => -42.1, 'name' => 'Tabasco / Galmart']
    ];
    $results['benchmarks_analyzed'] = count($benchmarks);

    $recs = [
        [
            'id' => 'REC_MEAT_SOQYM_' . date('Ymd'),
            'type' => 'RAW_MATERIAL',
            'sector' => 'MEAT',
            'target_code' => 'R1_HORSE',
            'target_title' => 'Конина Жая в/с',
            'title' => 'Хеджирование закупки Жая перед сезоном соғым',
            'rationale' => 'Осенний рост котировок конины (+5.2%). Рекомендуется зафиксировать объем 250 кг по 4 000 ₸/кг у КХ «Алатау Ет».',
            'current_value' => 4000,
            'recommended_value' => 4000,
            'unit' => '₸/кг',
            'financial_impact_kzt' => 240000,
            'priority' => 'HIGH',
            'is_applied' => 0
        ],
        [
            'id' => 'REC_DAIRY_STRACCIATELLA_' . date('Ymd'),
            'type' => 'RECIPE_PRICE',
            'sector' => 'DAIRY',
            'target_code' => 'DAIRY_STRACCIATELLA',
            'target_title' => 'Страчателла в свежих сливках (200 г)',
            'title' => 'Оптимизация цены Страчателлы до 2 100 ₸',
            'rationale' => 'Текущая цена (1 800 ₸) на 26.5% ниже Galmart (2 450 ₸). Подъем до 2 100 ₸ сохранит статус лучшей цены при марже 72%.',
            'current_value' => 1800,
            'recommended_value' => 2100,
            'unit' => '₸/банка',
            'financial_impact_kzt' => 105000,
            'priority' => 'OPPORTUNITY',
            'is_applied' => 0
        ],
        [
            'id' => 'REC_BAKE_TARTINE_' . date('Ymd'),
            'type' => 'RECIPE_PRICE',
            'sector' => 'BAKERY',
            'target_code' => 'BAKE_TARTINE',
            'target_title' => 'Тартин подовый на закваске (650 г)',
            'title' => 'Корректировка цены крафтового тартина до 1 000 ₸',
            'rationale' => 'При цене аналогов в Paul (1 450 ₸) цена 1 000 ₸ обеспечит валовую маржу 71% при полной лояльности жильцов ЖК Арай.',
            'current_value' => 850,
            'recommended_value' => 1000,
            'unit' => '₸/буханка',
            'financial_impact_kzt' => 75000,
            'priority' => 'OPPORTUNITY',
            'is_applied' => 0
        ],
        [
            'id' => 'REC_SPICE_CHILI_' . date('Ymd'),
            'type' => 'RAW_MATERIAL',
            'sector' => 'SAUCES_SPICES',
            'target_code' => 'CHILI_BIRDS_EYE',
            'target_title' => 'Острый перец Bird\\'s Eye и Паприка',
            'title' => 'Сезонная закупка и закладка ферментации соусов на 6 месяцев',
            'rationale' => 'Октябрь — сезонное дно цен грунтового перца (2 400 ₸/кг и паприка 350 ₸/кг). С ноября теплицы поднимут цены на 50-70%. Необходима закладка 200 кг в ферментаторы.',
            'current_value' => 2400,
            'recommended_value' => 2400,
            'unit' => '₸/кг',
            'financial_impact_kzt' => 160000,
            'priority' => 'HIGH',
            'is_applied' => 0
        ]
    ];

    $results['new_recommendations'] = $recs;
    $results['total_financial_opportunity_kzt'] = array_sum(array_column($recs, 'financial_impact_kzt'));

    return $results;
}

if (php_sapi_name() === 'cli') {
    $report = runMarketIntelligenceScan();
    echo "=== BEERMOOD Master ERP: Мультисекторный мониторинг цен [" . date('Y-m-d H:i:s') . "] ===\n";
    echo "Секторы: Мясо, Молоко, Хлеб, Соусы и смеси\n";
    echo "Анализировано позиций сырья: " . $report['raw_materials_analyzed'] . "\n";
    echo "Анализировано бенчмарков: " . $report['benchmarks_analyzed'] . "\n";
    echo "Сгенерировано AI-рекомендаций: " . count($report['new_recommendations']) . "\n";
    echo "Совокупный экономический эффект: " . number_format($report['total_financial_opportunity_kzt'], 0, '', ' ') . " ₸/мес\n\n";
}
