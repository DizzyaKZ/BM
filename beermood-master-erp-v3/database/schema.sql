-- ==============================================================
-- BEERMOOD Master ERP v3 — База данных MySQL 8.x
-- Холдинг MOOD GROUP (BEERMOOD.PUB / MEAT&BREAD / CHEESY / SPICY)
-- Объект: Алматы, ул. Жарокова 137/1 (ЖК «Арай»)
-- ==============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `beermood_erp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `beermood_erp`;

-- 1. Справочник стандартов мяса (Кох ⇄ СТ РК ⇄ Halal)
DROP TABLE IF EXISTS `meat_standards`;
CREATE TABLE `meat_standards` (
  `code` VARCHAR(20) NOT NULL PRIMARY KEY,
  `name_de` VARCHAR(255) NOT NULL,
  `name_kz` VARCHAR(255) NOT NULL,
  `name_halal` VARCHAR(255) NOT NULL,
  `price_kzt` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `price_halal_kzt` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Мониторинг рыночных цен на сырье в Алматы
DROP TABLE IF EXISTS `raw_material_prices`;
CREATE TABLE `raw_material_prices` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL,
  `category` ENUM('MEAT', 'MILK', 'FLOUR', 'SPICE', 'CASING', 'PACKAGING', 'ENERGY') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `current_cost_kzt` DECIMAL(10, 2) NOT NULL,
  `market_avg_kzt` DECIMAL(10, 2) NOT NULL,
  `market_min_kzt` DECIMAL(10, 2) NOT NULL,
  `market_max_kzt` DECIMAL(10, 2) NOT NULL,
  `trend` ENUM('UP', 'DOWN', 'STABLE') NOT NULL DEFAULT 'STABLE',
  `trend_pct` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `supplier` VARCHAR(255) NOT NULL,
  `last_updated` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Бенчмаркинг цен конкурентов (Galmart, Magnum, Беккер, рестораны)
DROP TABLE IF EXISTS `competitor_benchmarks`;
CREATE TABLE `competitor_benchmarks` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `category` VARCHAR(100) NOT NULL,
  `our_product_title` VARCHAR(255) NOT NULL,
  `our_price_kzt` DECIMAL(10, 2) NOT NULL,
  `our_unit` VARCHAR(50) NOT NULL,
  `competitor_name` VARCHAR(255) NOT NULL,
  `competitor_price_kzt` DECIMAL(10, 2) NOT NULL,
  `price_gap_pct` DECIMAL(6, 2) NOT NULL,
  `quality_tier` ENUM('PREMIUM_CRAFT', 'RESTAURANT', 'MASS_MARKET') NOT NULL,
  `channel` VARCHAR(50) NOT NULL,
  `notes` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. P&L Финансовые прогнозы и точка безубыточности
DROP TABLE IF EXISTS `financial_forecasts`;
CREATE TABLE `financial_forecasts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `period_label` VARCHAR(100) NOT NULL,
  `revenue_pub_kzt` DECIMAL(12, 2) NOT NULL,
  `revenue_takeaway_kzt` DECIMAL(12, 2) NOT NULL,
  `revenue_arai_kzt` DECIMAL(12, 2) NOT NULL,
  `total_revenue_kzt` DECIMAL(12, 2) NOT NULL,
  `total_cogs_kzt` DECIMAL(12, 2) NOT NULL,
  `gross_profit_kzt` DECIMAL(12, 2) NOT NULL,
  `gross_margin_pct` DECIMAL(5, 2) NOT NULL,
  `total_fixed_opex_kzt` DECIMAL(12, 2) NOT NULL,
  `ebitda_kzt` DECIMAL(12, 2) NOT NULL,
  `ebitda_margin_pct` DECIMAL(5, 2) NOT NULL,
  `breakeven_revenue_kzt` DECIMAL(12, 2) NOT NULL,
  `breakeven_batches_kg` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Стратегические рекомендации и лог синхронизации
DROP TABLE IF EXISTS `pricing_recommendations`;
CREATE TABLE `pricing_recommendations` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `type` ENUM('RAW_MATERIAL', 'RECIPE_PRICE', 'PRODUCTION_VOLUME', 'COST_SAVING') NOT NULL,
  `target_code` VARCHAR(50) NOT NULL,
  `target_title` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `rationale` TEXT NOT NULL,
  `current_value` DECIMAL(10, 2) NOT NULL,
  `recommended_value` DECIMAL(10, 2) NOT NULL,
  `unit` VARCHAR(20) NOT NULL,
  `financial_impact_kzt` DECIMAL(12, 2) NOT NULL,
  `priority` ENUM('HIGH', 'MEDIUM', 'OPPORTUNITY') NOT NULL,
  `is_applied` TINYINT(1) NOT NULL DEFAULT 0,
  `applied_at` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Технологические карты Коха
DROP TABLE IF EXISTS `koch_tech_cards`;
CREATE TABLE `koch_tech_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `plu` VARCHAR(20) NOT NULL,
  `ean_prefix` VARCHAR(10) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `title_kz` VARCHAR(255) NOT NULL,
  `goal` VARCHAR(50) NOT NULL,
  `tier_label` VARCHAR(255) NOT NULL,
  `labor_score` INT NOT NULL DEFAULT 1,
  `yield_ratio` DECIMAL(5, 3) NOT NULL,
  `addon_per_kg_kzt` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `price_takeaway_kzt` DECIMAL(10, 2) NOT NULL,
  `price_pub_kzt` DECIMAL(10, 2) NOT NULL,
  `casing` VARCHAR(255) NOT NULL,
  `shelf_life_days` INT NOT NULL,
  `tech_process` TEXT NOT NULL,
  `recipe_json` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Журнал приемки молока («Эксперт Профи»)
DROP TABLE IF EXISTS `milk_lab_records`;
CREATE TABLE `milk_lab_records` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `sample_time` DATETIME NOT NULL,
  `supplier` VARCHAR(255) NOT NULL,
  `batch_code` VARCHAR(50) NOT NULL,
  `volume_liters` DECIMAL(10, 2) NOT NULL,
  `fat_pct` DECIMAL(4, 2) NOT NULL,
  `protein_pct` DECIMAL(4, 2) NOT NULL,
  `snf_pct` DECIMAL(4, 2) NOT NULL,
  `density_degree` DECIMAL(5, 2) NOT NULL,
  `added_water_pct` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
  `freezing_point` DECIMAL(5, 3) NOT NULL,
  `temperature_c` DECIMAL(4, 1) NOT NULL,
  `acidity_ph` DECIMAL(4, 2) NOT NULL,
  `acidity_turner` DECIMAL(4, 1) NOT NULL,
  `calculated_grade` ENUM('EXTRA', 'FIRST', 'SECOND', 'REJECT') NOT NULL,
  `cheese_score` INT NOT NULL,
  `base_price_kzt` DECIMAL(10, 2) NOT NULL,
  `adjusted_price_kzt` DECIMAL(10, 2) NOT NULL,
  `total_sum_kzt` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('ACCEPTED', 'QUARANTINE', 'REJECTED') NOT NULL DEFAULT 'ACCEPTED',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 7b. Журнал приемки и входного контроля мясного сырья (ХАССП ККТ-1)
DROP TABLE IF EXISTS `meat_lab_records`;
CREATE TABLE `meat_lab_records` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `sample_time` DATETIME NOT NULL,
  `supplier` VARCHAR(255) NOT NULL,
  `batch_code` VARCHAR(50) NOT NULL,
  `vet_doc_number` VARCHAR(100) NOT NULL,
  `animal_type` ENUM('HORSE', 'BEEF', 'PORK', 'LAMB') NOT NULL,
  `cut_code` VARCHAR(50) NOT NULL,
  `cut_name` VARCHAR(255) NOT NULL,
  `weight_kg` DECIMAL(10, 2) NOT NULL,
  `temperature_c` DECIMAL(4, 1) NOT NULL,
  `thermal_state` ENUM('CHILLED', 'FROZEN', 'WARM') NOT NULL DEFAULT 'CHILLED',
  `acidity_ph` DECIMAL(4, 2) NOT NULL,
  `defect_type` ENUM('NOR', 'PSE', 'DFD') NOT NULL DEFAULT 'NOR',
  `water_binding_capacity_pct` DECIMAL(4, 1) NOT NULL,
  `fat_color` VARCHAR(100) NOT NULL,
  `organoleptic_score` INT NOT NULL,
  `has_vet_stamp` TINYINT(1) NOT NULL DEFAULT 1,
  `is_halal_certified` TINYINT(1) NOT NULL DEFAULT 0,
  `calculated_grade` ENUM('EXTRA_CRAFT', 'FIRST_GRADE', 'PROCESSING_ONLY', 'REJECT') NOT NULL,
  `craft_suitability_score` INT NOT NULL,
  `base_price_kzt` DECIMAL(10, 2) NOT NULL,
  `adjusted_price_kzt` DECIMAL(10, 2) NOT NULL,
  `total_sum_kzt` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('ACCEPTED', 'QUARANTINE', 'REJECTED') NOT NULL DEFAULT 'ACCEPTED',
  `operator` VARCHAR(100) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Заказы жильцов ЖК «Арай»
DROP TABLE IF EXISTS `arai_orders`;
CREATE TABLE `arai_orders` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `block` VARCHAR(20) NOT NULL,
  `apartment` VARCHAR(50) NOT NULL,
  `delivery_date` DATE NOT NULL,
  `delivery_slot` VARCHAR(50) NOT NULL,
  `subtotal_kzt` DECIMAL(10, 2) NOT NULL,
  `discount_pct` DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
  `discount_sum_kzt` DECIMAL(10, 2) NOT NULL,
  `final_total_kzt` DECIMAL(10, 2) NOT NULL,
  `payment_method` ENUM('KASPI_QR', 'CASH', 'PUB_TAB') NOT NULL DEFAULT 'KASPI_QR',
  `status` ENUM('NEW', 'PREPARING', 'PACKED_LABELED', 'DELIVERED') NOT NULL DEFAULT 'NEW',
  `is_tspl_printed` TINYINT(1) NOT NULL DEFAULT 0,
  `items_json` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Задачи GIANT-планирования
DROP TABLE IF EXISTS `production_tasks`;
CREATE TABLE `production_tasks` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `shift_date` DATE NOT NULL,
  `equipment` VARCHAR(50) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `batch_input` DECIMAL(10, 2) NOT NULL,
  `expected_output` DECIMAL(10, 2) NOT NULL,
  `labor_hours` DECIMAL(5, 1) NOT NULL,
  `operator` VARCHAR(100) NOT NULL,
  `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
  `status` ENUM('PLANNED', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'PLANNED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
