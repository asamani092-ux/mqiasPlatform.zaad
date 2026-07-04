<?php
// ═══════════════════════════════════════════════════
//  api.php — باك-إند كامل (CRUD)
//  منصة مِقياس · جمعية الزاد 2026
// ═══════════════════════════════════════════════════

ob_start(); // منع أي output يخرب JSON
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
ob_clean();

// ── Base URL ديناميكي (يعمل على أي سيرفر) ───────────
function siteBaseUrl(): string {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $dir    = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    return $scheme . '://' . $host . $dir;
}

function ensureTableColumn(PDO $db, string $table, string $column, string $definition): void {
    try {
        $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE ?");
        $stmt->execute([$column]);
        if (!$stmt->fetch()) {
            $db->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
        }
    } catch (\Throwable $e) {
        // تجاهل الفشل أثناء التهيئة الأولى أو عند عدم وجود الجدول بعد.
    }
}

function tableHasColumn(PDO $db, string $table, string $column): bool {
    static $cache = [];
    $key = $table . '.' . $column;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }
    try {
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
        ");
        $stmt->execute([$table, $column]);
        $cache[$key] = (int)$stmt->fetchColumn() > 0;
    } catch (\Throwable $e) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

function tableHasIndex(PDO $db, string $table, string $indexName): bool {
    static $cache = [];
    $key = $table . '.' . $indexName;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }
    try {
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
        ");
        $stmt->execute([$table, $indexName]);
        $cache[$key] = (int)$stmt->fetchColumn() > 0;
    } catch (\Throwable $e) {
        $cache[$key] = false;
    }
    return $cache[$key];
}

function ensureTableIndex(PDO $db, string $table, string $indexName, array $columns): void {
    if (tableHasIndex($db, $table, $indexName)) {
        return;
    }
    try {
        $cols = implode(', ', array_map(
            static fn(string $column): string => '`' . str_replace('`', '', $column) . '`',
            $columns
        ));
        $db->exec("ALTER TABLE `{$table}` ADD INDEX `{$indexName}` ({$cols})");
    } catch (\Throwable $e) {
        // تجاهل الفشل إذا كان الفهرس موجوداً بالفعل أو صلاحية ALTER غير متاحة.
    }
}

function ensurePerformanceIndexes(PDO $db): void {
    static $booted = false;
    if ($booted) {
        return;
    }
    $booted = true;

    ensureKpiFileImportsTable($db);
    ensureTableIndex($db, 'departments', 'idx_departments_dept_section', ['dept_no', 'section_no']);
    ensureTableIndex($db, 'kpis', 'idx_kpis_status_type_year', ['status', 'type', 'year']);
    ensureTableIndex($db, 'kpis', 'idx_kpis_owner_dept', ['owner_dept']);
    ensureTableIndex($db, 'kpis', 'idx_kpis_goal_status', ['goal_code', 'status']);
    ensureTableIndex($db, 'kpi_values', 'idx_kpi_values_year_quarter_kpi', ['year', 'quarter', 'kpi_id']);
    ensureTableIndex($db, 'kpi_file_imports', 'idx_kpi_file_import_filename', ['filename']);
    ensureTableIndex($db, 'kpi_file_imports', 'idx_kpi_file_import_period', ['kpi_id', 'year', 'quarter']);
    ensureTableIndex($db, 'early_warning_log', 'idx_early_warning_period_status', ['year', 'quarter', 'status']);
    ensureTableIndex($db, 'governance_items', 'idx_governance_year_quarter_status', ['year', 'quarter', 'status']);
    ensureTableIndex($db, 'knowledge_assets', 'idx_knowledge_year_quarter_status', ['year', 'quarter', 'status']);
    ensureTableIndex($db, 'deviation_cards', 'idx_deviation_cards_year_quarter_status', ['year', 'quarter', 'status']);
}

function kpisSupportExtendedColumns(PDO $db): bool {
    static $supported = null;
    if ($supported !== null) {
        return $supported;
    }
    try {
        $db->query("SELECT baseline,formula_text,formula_vars,calc_type,q1_target,strat_link FROM kpis LIMIT 0");
        $supported = true;
    } catch (\Throwable $e) {
        $supported = false;
    }
    return $supported;
}

function apiCacheDir(): string {
    return __DIR__ . '/uploads/.api-cache';
}

function apiIsCacheableRequest(string $method, string $endpoint): bool {
    static $cacheable = [
        'dashboard' => true,
        'kpis' => true,
        'departments' => true,
        'strategic_goals' => true,
        'op_goals' => true,
        'early_warning' => true,
        'deviation_cards' => true,
        'governance' => true,
        'governance_summary' => true,
        'knowledge' => true,
    ];
    return $method === 'GET' && isset($cacheable[$endpoint]);
}

function apiCacheFile(string $endpoint): string {
    $params = $_GET;
    unset($params['endpoint'], $params['_'], $params['ts'], $params['t'], $params['cb'], $params['cacheBust']);
    ksort($params);
    $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    return apiCacheDir() . '/' . sha1($endpoint . '?' . $query) . '.json';
}

function apiServeCachedResponse(string $method, string $endpoint): void {
    if (!apiIsCacheableRequest($method, $endpoint)) {
        return;
    }

    $cacheFile = apiCacheFile($endpoint);
    if (!is_file($cacheFile) || filemtime($cacheFile) < (time() - 30)) {
        return;
    }

    $payload = json_decode((string)@file_get_contents($cacheFile), true);
    if (!is_array($payload) || !isset($payload['body'])) {
        @unlink($cacheFile);
        return;
    }

    header('X-Miqyas-Cache: HIT');
    http_response_code((int)($payload['status'] ?? 200));
    echo (string)$payload['body'];
    exit;
}

function apiStoreCachedResponse(string $method, string $endpoint, int $status): void {
    if (!apiIsCacheableRequest($method, $endpoint) || $status !== 200) {
        return;
    }

    $body = ob_get_contents();
    if (!is_string($body) || $body === '') {
        return;
    }

    $payload = json_encode([
        'status' => $status,
        'stored_at' => time(),
        'body' => $body,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($payload === false) {
        return;
    }

    safeFilePut(apiCacheFile($endpoint), $payload);
}

function apiInvalidateCache(): void {
    $dir = apiCacheDir();
    if (!is_dir($dir)) {
        return;
    }

    foreach (glob($dir . '/*.json') ?: [] as $file) {
        @unlink($file);
    }
}

// ── حماية Session ────────────────────────────────────
if (session_status() === PHP_SESSION_NONE) session_start();

// ── CSRF Token للعمليات الحساسة ──────────────────────
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$method   = $_SERVER['REQUEST_METHOD'];
$endpoint = trim($_GET['endpoint'] ?? '', '/');
$id       = isset($_GET['id']) ? (int)$_GET['id'] : null;

register_shutdown_function(static function () use ($method, $endpoint): void {
    $status = http_response_code();
    if ((($method !== 'GET') || $endpoint === 'setup') && $status >= 200 && $status < 300) {
        apiInvalidateCache();
        return;
    }
    apiStoreCachedResponse($method, $endpoint, $status);
});

apiServeCachedResponse($method, $endpoint);

// ═══════════════════════════════════════════════════
//  ROUTER
// ═══════════════════════════════════════════════════
match($endpoint) {
    'setup'           => handleSetup(),
    'dashboard'       => handleDashboard(),
    'kpis'            => handleKpis($method, $id),
    'kpi_values'      => handleKpiValues($method, $id),
    'departments'     => handleDepartments($method, $id),
    'strategic_goals' => handleStrategicGoals($method, $id),
    'op_goals'        => handleOpGoals($method, $id),
    'early_warning'   => handleEarlyWarning(),
    'reset_config'    => handleResetConfig(),
    'delete_file'      => handleDeleteFile(),
    'list_files'       => handleListFiles(),
    'email_settings'   => handleEmailSettings($method),
    'send_email'       => handleSendEmail($method),
    'deviation_cards'  => handleDeviationCards($method, $id),
    'governance'         => handleGovernance($method, $id),
    'governance_summary' => handleGovernance('GET', null),
    'knowledge'        => handleKnowledge($method, $id),
    'change_password'  => handleChangePassword($method),
    'csrf_token'       => jsonResponse(['token' => $_SESSION['csrf_token']]),
    default            => jsonResponse(['error' => 'Endpoint غير موجود: '.$endpoint], 404),
};


// ═══════════════════════════════════════════════════
//  1. SETUP — إنشاء الجداول وحقن البيانات الأولية
// ═══════════════════════════════════════════════════
function handleSetup(): void {
    $db = getDB();

    // ── إنشاء الجداول ────────────────────────────
    $db->exec("
    CREATE TABLE IF NOT EXISTS departments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        dept_no     INT,
        dept_name   VARCHAR(200) NOT NULL,
        section_no  INT,
        section_name VARCHAR(200),
        section_code VARCHAR(20),
        color       VARCHAR(20) DEFAULT '#00c9a7',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS strategic_goals (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        code        VARCHAR(20) NOT NULL UNIQUE,
        name        VARCHAR(500) NOT NULL,
        description TEXT,
        axis        VARCHAR(100),
        status      ENUM('active','inactive') DEFAULT 'active',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS operational_goals (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        code        VARCHAR(20) NOT NULL UNIQUE,
        name        VARCHAR(500) NOT NULL,
        description TEXT,
        department  VARCHAR(200),
        status      ENUM('active','inactive') DEFAULT 'active',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS kpis (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        code            VARCHAR(50) NOT NULL UNIQUE,
        goal_code       VARCHAR(20),
        name            VARCHAR(500) NOT NULL,
        description     TEXT,
        formula         TEXT,
        unit            VARCHAR(100),
        direction       VARCHAR(50) DEFAULT 'كلما زاد كان أفضل',
        frequency       VARCHAR(50) DEFAULT 'ربع سنوي',
        type            ENUM('strategic','operational') NOT NULL,
        owner_dept      VARCHAR(200),
        annual_target   DECIMAL(15,4),
        baseline        DECIMAL(15,4),
        q1_target       DECIMAL(15,4),
        q2_target       DECIMAL(15,4),
        q3_target       DECIMAL(15,4),
        q4_target       DECIMAL(15,4),
        year            YEAR DEFAULT 2026,
        strat_link      VARCHAR(50),
        status          ENUM('active','inactive') DEFAULT 'active',
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS kpi_values (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        kpi_id      INT NOT NULL,
        year        YEAR NOT NULL,
        quarter     TINYINT NOT NULL COMMENT '1-4',
        target      DECIMAL(15,4),
        actual      DECIMAL(15,4),
        notes       TEXT,
        status      ENUM('exceeded','achieved','partial','not_achieved','pending') DEFAULT 'pending',
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_kpi_quarter (kpi_id, year, quarter),
        FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS kpi_file_imports (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL,
        kpi_id      INT NOT NULL,
        year        YEAR NOT NULL,
        quarter     TINYINT NOT NULL,
        target      DECIMAL(15,4),
        actual      DECIMAL(15,4),
        notes       TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_kpi_file_import (filename, kpi_id, year, quarter),
        INDEX idx_kpi_file_import_filename (filename),
        INDEX idx_kpi_file_import_period (kpi_id, year, quarter),
        FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS early_warning_log (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        kpi_id      INT,
        year        YEAR,
        quarter     TINYINT,
        deviation   DECIMAL(8,4),
        risk_level  ENUM('high','medium','low','ok') DEFAULT 'medium',
        action      VARCHAR(500),
        responsible VARCHAR(200),
        due_date    DATE NULL,
        closed_at   TIMESTAMP NULL,
        closed_by   VARCHAR(200),
        status      ENUM('open','in_progress','closed') DEFAULT 'open',
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // ── جدول بطاقات الانحراف ──────────────────────────────
    $db->exec("
    CREATE TABLE IF NOT EXISTS deviation_cards (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        kpi_id          INT NOT NULL,
        year            SMALLINT NOT NULL DEFAULT 2026,
        quarter         TINYINT  NOT NULL,
        deviation_pct   DECIMAL(8,2) NOT NULL,
        actual          DECIMAL(18,4),
        target          DECIMAL(18,4),
        reason          TEXT,
        action          TEXT,
        responsible     VARCHAR(200),
        due_date        DATE NULL,
        impact          TEXT,
        improvement_value DECIMAL(18,4),
        improvement_pct   DECIMAL(8,2),
        remeasure_date    DATE NULL,
        risk_level        ENUM('مرتفع','متوسط','منخفض') DEFAULT NULL,
        status          ENUM('open','in_progress','under_execution','pending_verify','closed') DEFAULT 'open',
        closed_at       TIMESTAMP NULL,
        closed_by       VARCHAR(200),
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_dev_card (kpi_id, year, quarter),
        FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_year_q (year, quarter)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // ── جدول الحوكمة ──────────────────────────────────────
    $db->exec("
    CREATE TABLE IF NOT EXISTS governance_items (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        code            VARCHAR(30) NOT NULL UNIQUE,
        category        ENUM('policies','procedures','committees','reports','compliance') DEFAULT 'compliance',
        name            VARCHAR(500) NOT NULL,
        description     TEXT,
        owner           VARCHAR(200),
        status          ENUM('compliant','partial','non_compliant','pending') DEFAULT 'pending',
        compliance_pct  DECIMAL(5,2) DEFAULT 0,
        notes_count     INT DEFAULT 0,
        last_reviewed   DATE NULL,
        next_review     DATE NULL,
        year            YEAR DEFAULT 2026,
        quarter         TINYINT DEFAULT NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_status   (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // ── جدول إدارة المعرفة ────────────────────────────────
    $db->exec("
    CREATE TABLE IF NOT EXISTS knowledge_assets (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        code             VARCHAR(30) NOT NULL UNIQUE,
        type             ENUM('policy','procedure','lesson','best_practice','report','template','other') DEFAULT 'other',
        title            VARCHAR(500) NOT NULL,
        description      TEXT,
        owner            VARCHAR(200),
        kpi_id           INT NULL,
        governance_id    INT NULL,
        status           ENUM('draft','active','archived','under_review') DEFAULT 'draft',
        approved_by      VARCHAR(200),
        used_in_decision TINYINT(1) DEFAULT 0,
        decision_ref     VARCHAR(500),
        file_path        VARCHAR(500),
        year             YEAR DEFAULT 2026,
        quarter          TINYINT DEFAULT NULL,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kpi_id)        REFERENCES kpis(id)             ON DELETE SET NULL,
        FOREIGN KEY (governance_id) REFERENCES governance_items(id) ON DELETE SET NULL,
        INDEX idx_type   (type),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // ── ضمان وجود الأعمدة الإضافية في الجداول القديمة ───────────
    ensureTableColumn($db, 'kpis', 'baseline', 'DECIMAL(18,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'formula_text', 'VARCHAR(1000) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'formula_vars', 'VARCHAR(1000) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'calc_type', "ENUM('manual','formula') DEFAULT 'manual'");
    ensureTableColumn($db, 'kpis', 'weight', 'DECIMAL(5,2) DEFAULT 1.00');
    ensureTableColumn($db, 'kpis', 'formula', 'TEXT DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'q1_target', 'DECIMAL(15,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'q2_target', 'DECIMAL(15,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'q3_target', 'DECIMAL(15,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'q4_target', 'DECIMAL(15,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpis', 'year', 'YEAR DEFAULT 2026');
    ensureTableColumn($db, 'kpis', 'strat_link', 'VARCHAR(50) DEFAULT NULL');
    ensureTableColumn($db, 'kpi_values', 'manual_actual', 'DECIMAL(15,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpi_values', 'source_file', 'VARCHAR(255) DEFAULT NULL');
    ensureKpiFileImportsTable($db);
    ensureTableColumn($db, 'governance_items', 'year', 'YEAR DEFAULT 2026');
    ensureTableColumn($db, 'governance_items', 'quarter', 'TINYINT DEFAULT NULL');
    ensureTableColumn($db, 'knowledge_assets', 'year', 'YEAR DEFAULT 2026');
    ensureTableColumn($db, 'knowledge_assets', 'quarter', 'TINYINT DEFAULT NULL');
    ensureTableIndex($db, 'kpi_values', 'idx_kpi_values_source_file', ['source_file']);
    ensurePerformanceIndexes($db);

    $seed = getSetupSeedData();

    try {
        $db->beginTransaction();

        $db->exec("DELETE FROM knowledge_assets");
        $db->exec("DELETE FROM governance_items");
        $db->exec("DELETE FROM deviation_cards");
        $db->exec("DELETE FROM early_warning_log");
        $db->exec("DELETE FROM kpi_file_imports");
        $db->exec("DELETE FROM kpi_values");
        $db->exec("DELETE FROM kpis");
        $db->exec("DELETE FROM strategic_goals");
        $db->exec("DELETE FROM operational_goals");
        $db->exec("DELETE FROM departments");

        $deptStmt = $db->prepare("
            INSERT INTO departments (dept_no, dept_name, section_no, section_name, section_code, color)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        foreach ($seed['departments'] as $dept) {
            $deptStmt->execute($dept);
        }

        $strategicGoalStmt = $db->prepare("
            INSERT INTO strategic_goals (code, name, description, axis, status)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($seed['strategic_goals'] as $goal) {
            $strategicGoalStmt->execute([
                $goal['code'],
                $goal['name'],
                $goal['description'],
                $goal['axis'],
                $goal['status'],
            ]);
        }

        $operationalGoalStmt = $db->prepare("
            INSERT INTO operational_goals (code, name, description, department, status)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($seed['operational_goals'] as $goal) {
            $operationalGoalStmt->execute([
                $goal['code'],
                $goal['name'],
                $goal['description'],
                $goal['department'],
                $goal['status'],
            ]);
        }

        $kpiStmt = $db->prepare("
            INSERT INTO kpis (
                code, goal_code, name, description, formula, unit, direction, frequency,
                type, owner_dept, annual_target, baseline, q1_target, q2_target, q3_target,
                q4_target, year, strat_link, status
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        ");
        foreach ($seed['kpis'] as $kpi) {
            $kpiStmt->execute([
                $kpi['code'],
                $kpi['goal_code'],
                $kpi['name'],
                $kpi['description'],
                $kpi['formula'],
                $kpi['unit'],
                $kpi['direction'],
                $kpi['frequency'],
                $kpi['type'],
                $kpi['owner_dept'],
                $kpi['annual_target'],
                $kpi['baseline'],
                $kpi['q1_target'],
                $kpi['q2_target'],
                $kpi['q3_target'],
                $kpi['q4_target'],
                $kpi['year'],
                $kpi['strat_link'],
                $kpi['status'],
            ]);
        }

        $governanceStmt = $db->prepare("
            INSERT INTO governance_items (
                code, category, name, description, owner, status, compliance_pct, last_reviewed, next_review, year, quarter
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($seed['governance_items'] as $item) {
            $governanceStmt->execute([
                $item['code'],
                $item['category'],
                $item['name'],
                $item['description'],
                $item['owner'],
                $item['status'],
                $item['compliance_pct'],
                $item['last_reviewed'],
                $item['next_review'],
                $item['year'],
                $item['quarter'],
            ]);
        }

        $knowledgeStmt = $db->prepare("
            INSERT INTO knowledge_assets (
                code, type, title, description, owner, kpi_id, governance_id, status, approved_by, used_in_decision, decision_ref, year, quarter
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        foreach ($seed['knowledge_assets'] as $item) {
            $knowledgeStmt->execute([
                $item['code'],
                $item['type'],
                $item['title'],
                $item['description'],
                $item['owner'],
                $item['kpi_id'],
                $item['governance_id'],
                $item['status'],
                $item['approved_by'],
                $item['used_in_decision'],
                $item['decision_ref'],
                $item['year'],
                $item['quarter'],
            ]);
        }

        $kpiIdMap = [];
        foreach ($db->query("SELECT id, code FROM kpis") as $row) {
            $kpiIdMap[$row['code']] = (int)$row['id'];
        }

        $valueStmt = $db->prepare("
            INSERT INTO kpi_values (kpi_id, year, quarter, target, actual, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $insertedValues = 0;
        foreach ($seed['kpi_values'] as $value) {
            $kpiId = $kpiIdMap[$value['code']] ?? null;
            if (!$kpiId) {
                continue;
            }
            $valueStmt->execute([
                $kpiId,
                $value['year'],
                $value['quarter'],
                $value['target'],
                $value['actual'],
                $value['status'],
            ]);
            $insertedValues++;
        }

        $db->commit();

        $message = $seed['source'] === 'workbook'
            ? '✅ تم إنشاء الجداول واستيراد بيانات المنصة من ملف الإكسل'
            : '✅ قاعدة البيانات جاهزة وتم حقن البيانات الأولية الاحتياطية';

        jsonResponse([
            'success' => true,
            'message' => $message,
            'data_source' => $seed['source'],
            'workbook' => $seed['workbook'] ?? null,
            'warning' => $seed['warning'] ?? null,
            'counts' => [
                'departments' => count($seed['departments']),
                'strategic_goals' => count($seed['strategic_goals']),
                'operational_goals' => count($seed['operational_goals']),
                'kpis' => count($seed['kpis']),
                'kpi_values' => $insertedValues,
                'governance_items' => count($seed['governance_items']),
                'knowledge_assets' => count($seed['knowledge_assets']),
            ],
        ]);
    } catch (\Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        jsonResponse(['error' => 'فشل إعداد البيانات: ' . $e->getMessage()], 500);
    }
}


function getSetupSeedData(): array {
    try {
        return buildWorkbookSetupSeedData();
    } catch (\Throwable $e) {
        $legacy = buildLegacySetupSeedData();
        $legacy['warning'] = $e->getMessage();
        return $legacy;
    }
}

function normalizeDepartmentKeyPart(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    $value = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]+/u', '', $value) ?? $value;
    $value = preg_replace('/\s+/u', ' ', $value) ?? $value;
    $value = str_replace('ـ', '', $value);
    $value = str_replace(['أ', 'إ', 'آ'], 'ا', $value);
    $value = str_replace('ى', 'ي', $value);
    return function_exists('mb_strtolower') ? mb_strtolower($value, 'UTF-8') : strtolower($value);
}

function buildDepartmentHierarchy(array $rows): array {
    $departments = [];

    foreach ($rows as $row) {
        $deptNoRaw = $row['dept_no'] ?? null;
        $deptNo = ($deptNoRaw === null || $deptNoRaw === '') ? 0 : (int)$deptNoRaw;
        $deptName = trim((string)($row['dept_name'] ?? ''));
        if ($deptNo <= 0 && $deptName === '') {
            continue;
        }

        $deptKey = $deptNo > 0
            ? 'dept-no|' . $deptNo
            : 'dept-name|' . normalizeDepartmentKeyPart($deptName);
        $color = trim((string)($row['color'] ?? ''));
        if (!isset($departments[$deptKey])) {
            $departments[$deptKey] = [
                'dept_no' => $deptNo,
                'dept_name' => $deptName,
                'color' => $color !== '' ? $color : setupDepartmentColor($deptNo > 0 ? $deptNo : 1),
                'sections' => [],
            ];
        } elseif ($departments[$deptKey]['dept_name'] === '' && $deptName !== '') {
            $departments[$deptKey]['dept_name'] = $deptName;
        } elseif (
            $deptName !== '' &&
            normalizeDepartmentKeyPart($departments[$deptKey]['dept_name'] ?? '') === normalizeDepartmentKeyPart($deptName) &&
            (function_exists('mb_strlen') ? mb_strlen($deptName, 'UTF-8') : strlen($deptName)) >
            (function_exists('mb_strlen') ? mb_strlen((string)($departments[$deptKey]['dept_name'] ?? ''), 'UTF-8') : strlen((string)($departments[$deptKey]['dept_name'] ?? '')))
        ) {
            $departments[$deptKey]['dept_name'] = $deptName;
        } elseif ($departments[$deptKey]['color'] === '' && $color !== '') {
            $departments[$deptKey]['color'] = $color;
        }

        $sectionNoRaw = $row['section_no'] ?? null;
        $sectionNo = ($sectionNoRaw === null || $sectionNoRaw === '') ? null : (int)$sectionNoRaw;
        $sectionName = trim((string)($row['section_name'] ?? ''));
        $sectionCode = trim((string)($row['section_code'] ?? ''));
        if ($sectionNo === null && $sectionName === '' && $sectionCode === '') {
            continue;
        }

        $sectionKey = $sectionCode !== ''
            ? normalizeDepartmentKeyPart($sectionCode)
            : (($sectionNo ?? 0) . '|' . normalizeDepartmentKeyPart($sectionName));

        if (!isset($departments[$deptKey]['sections'][$sectionKey])) {
            $departments[$deptKey]['sections'][$sectionKey] = [
                'section_no' => $sectionNo,
                'section_name' => $sectionName,
                'section_code' => $sectionCode,
            ];
        }
    }

    uasort($departments, function (array $a, array $b): int {
        $deptCmp = ($a['dept_no'] ?? 0) <=> ($b['dept_no'] ?? 0);
        if ($deptCmp !== 0) {
            return $deptCmp;
        }
        return strcmp(normalizeDepartmentKeyPart($a['dept_name'] ?? ''), normalizeDepartmentKeyPart($b['dept_name'] ?? ''));
    });

    foreach ($departments as &$dept) {
        $sections = array_values($dept['sections']);
        usort($sections, function (array $a, array $b): int {
            $sectionCmp = (($a['section_no'] ?? 0) <=> ($b['section_no'] ?? 0));
            if ($sectionCmp !== 0) {
                return $sectionCmp;
            }
            return strcmp(
                normalizeDepartmentKeyPart($a['section_name'] ?? ''),
                normalizeDepartmentKeyPart($b['section_name'] ?? '')
            );
        });
        $dept['sections'] = $sections;
    }
    unset($dept);

    return array_values($departments);
}

function normalizeDepartmentSeedRows(array $rows): array {
    $assocRows = [];
    foreach ($rows as $row) {
        $assocRows[] = [
            'dept_no' => $row[0] ?? null,
            'dept_name' => $row[1] ?? '',
            'section_no' => $row[2] ?? null,
            'section_name' => $row[3] ?? '',
            'section_code' => $row[4] ?? '',
            'color' => $row[5] ?? '',
        ];
    }

    $normalized = [];
    foreach (buildDepartmentHierarchy($assocRows) as $dept) {
        foreach ($dept['sections'] as $section) {
            $normalized[] = [
                $dept['dept_no'],
                $dept['dept_name'],
                $section['section_no'],
                $section['section_name'],
                $section['section_code'],
                $dept['color'],
            ];
        }
    }

    return $normalized;
}

function buildWorkbookSetupSeedData(): array {
    $path = findSetupWorkbookPath();
    if (!$path) {
        throw new RuntimeException('لم يتم العثور على ملف بيانات الإكسل "داتا المنصة" داخل المشروع أو مجلد uploads');
    }

    $sheets = readWorkbookSheets($path);
    $requiredSheets = [
        'الإدارات',
        'الأهداف الإستراتيجية',
        'المؤشرات الاستراتيجية',
        'قياس المؤشرات الإستراتيجية',
        'الأهداف التشغيلية',
        'المؤشرات التشغيلية',
        'قياس المؤشرات التشغيلية',
    ];
    foreach ($requiredSheets as $sheetName) {
        if (!isset($sheets[$sheetName])) {
            throw new RuntimeException("الشيت المطلوب غير موجود في ملف الإكسل: {$sheetName}");
        }
    }

    $departments = [];
    $lastDeptNo = null;
    $lastDeptName = '';
    foreach (sheetToAssocRows($sheets['الإدارات']) as $row) {
        $deptNo = sheetCellInt($row, 'رقمالاداره');
        $deptName = sheetCellText($row, 'اسمالاداره');
        if ($deptNo !== null) {
            $lastDeptNo = $deptNo;
        }
        if ($deptName !== '') {
            $lastDeptName = $deptName;
        }

        $sectionNo = sheetCellInt($row, 'رقمالقسم');
        $sectionName = sheetCellText($row, 'القسم');
        if ($lastDeptNo === null || $lastDeptName === '' || $sectionNo === null || $sectionName === '') {
            continue;
        }

        $departments[] = [
            $lastDeptNo,
            $lastDeptName,
            $sectionNo,
            $sectionName,
            sheetCellText($row, 'كودالقسم'),
            setupDepartmentColor($lastDeptNo),
        ];
    }
    $departments = normalizeDepartmentSeedRows($departments);

    $strategicGoals = [];
    foreach (sheetToAssocRows($sheets['الأهداف الإستراتيجية']) as $row) {
        $code = sheetCellText($row, 'رمزالهدف');
        if ($code === '') {
            continue;
        }
        $strategicGoals[$code] = [
            'code' => $code,
            'name' => sheetCellText($row, 'اسمالهدف'),
            'description' => sheetCellText($row, 'وصفالهدف'),
            'axis' => sheetCellText($row, 'المحور'),
            'status' => normalizeSetupStatus(sheetCellText($row, 'حالهالهدف', 'الحاله')),
        ];
    }

    $operationalGoals = [];
    foreach (sheetToAssocRows($sheets['الأهداف التشغيلية']) as $row) {
        $code = sheetCellText($row, 'رمزالهدفالتشغيلي');
        if ($code === '') {
            continue;
        }
        $operationalGoals[$code] = [
            'code' => $code,
            'name' => sheetCellText($row, 'اسمالهدف'),
            'description' => sheetCellText($row, 'وصفالهدف'),
            'department' => sheetCellText($row, 'الادارهالمالكه'),
            'status' => normalizeSetupStatus(sheetCellText($row, 'الحاله')),
        ];
    }

    $strategicMeasureMap = buildQuarterMeasurementMap(sheetToAssocRows($sheets['قياس المؤشرات الإستراتيجية']));
    $operationalMeasureMap = buildQuarterMeasurementMap(sheetToAssocRows($sheets['قياس المؤشرات التشغيلية']));

    $kpis = [];
    $kpiValues = [];

    foreach (sheetToAssocRows($sheets['المؤشرات الاستراتيجية']) as $row) {
        $code = sheetCellText($row, 'رمزالموشر');
        if ($code === '') {
            continue;
        }
        $measure = $strategicMeasureMap[$code] ?? [];
        $goalCode = sheetCellText($row, 'رمزالهدف');
        $kpis[] = [
            'code' => $code,
            'goal_code' => $goalCode,
            'name' => sheetCellText($row, 'اسمالموشر'),
            'description' => sheetCellText($row, 'وصفالموشر'),
            'formula' => sheetCellText($row, 'معادلهالقياس'),
            'unit' => sheetCellText($row, 'وحدهالقياس'),
            'direction' => sheetCellText($row, 'الاتجاه') ?: 'كلما زاد كان أفضل',
            'frequency' => sheetCellText($row, 'دوريهالقياس') ?: 'ربع سنوي',
            'type' => 'strategic',
            'owner_dept' => sheetCellText($row, 'الادارهالمالكه'),
            'annual_target' => $measure['annual_target'] ?? sheetCellNumber($row, 'مستهدفعام2026'),
            'baseline' => sheetCellNumber($row, 'خطالاساس'),
            'q1_target' => $measure['q1_target'] ?? null,
            'q2_target' => $measure['q2_target'] ?? null,
            'q3_target' => $measure['q3_target'] ?? null,
            'q4_target' => $measure['q4_target'] ?? null,
            'year' => $measure['year'] ?? 2026,
            'strat_link' => null,
            'status' => normalizeSetupStatus(sheetCellText($row, 'الحاله')),
        ];
        $kpiValues = array_merge($kpiValues, buildQuarterValueRows($code, $measure));
    }

    foreach (sheetToAssocRows($sheets['المؤشرات التشغيلية']) as $row) {
        $code = sheetCellText($row, 'رمزالموشر');
        if ($code === '') {
            continue;
        }
        $goalCode = sheetCellText($row, 'رمزالهدفالتشغيلي');
        $measure = $operationalMeasureMap[$code] ?? [];
        $kpis[] = [
            'code' => $code,
            'goal_code' => $goalCode,
            'name' => sheetCellText($row, 'اسمالموشر'),
            'description' => sheetCellText($row, 'وصفالموشر'),
            'formula' => sheetCellText($row, 'معادلهالقياس'),
            'unit' => sheetCellText($row, 'وحدهالقياس'),
            'direction' => sheetCellText($row, 'الاتجاه') ?: 'كلما زاد كان أفضل',
            'frequency' => sheetCellText($row, 'دوريهالقياس') ?: 'ربع سنوي',
            'type' => 'operational',
            'owner_dept' => $operationalGoals[$goalCode]['department'] ?? '',
            'annual_target' => $measure['annual_target'] ?? sheetCellNumber($row, 'مستهدفعام2026'),
            'baseline' => sheetCellNumber($row, 'خطالاساس'),
            'q1_target' => $measure['q1_target'] ?? null,
            'q2_target' => $measure['q2_target'] ?? null,
            'q3_target' => $measure['q3_target'] ?? null,
            'q4_target' => $measure['q4_target'] ?? null,
            'year' => $measure['year'] ?? 2026,
            'strat_link' => null,
            'status' => normalizeSetupStatus(sheetCellText($row, 'الحاله')),
        ];
        $kpiValues = array_merge($kpiValues, buildQuarterValueRows($code, $measure));
    }

    return [
        'source' => 'workbook',
        'workbook' => basename($path),
        'departments' => array_values($departments),
        'strategic_goals' => array_values($strategicGoals),
        'operational_goals' => array_values($operationalGoals),
        'kpis' => $kpis,
        'kpi_values' => $kpiValues,
        'governance_items' => getDefaultGovernanceSeedData(),
        'knowledge_assets' => getDefaultKnowledgeSeedData(),
    ];
}

function buildLegacySetupSeedData(): array {
    $departments = normalizeDepartmentSeedRows([
        [1,'الرعاية والتمكين',1,'إسناد ونمو','1/1','#00c9a7'],
        [1,'الرعاية والتمكين',2,'التمكين','1/2','#00c9a7'],
        [1,'الرعاية والتمكين',3,'الرعاية','1/3','#00c9a7'],
        [1,'الرعاية والتمكين',4,'البحث الاجتماعي','1/4','#00c9a7'],
        [2,'التكافل المجتمعي',1,'التطوع','2/1','#00b4d8'],
        [2,'التكافل المجتمعي',2,'التكافل المجتمعي','2/2','#00b4d8'],
        [3,'الاستدامة',1,'شركة ثمين','3/1','#f4a535'],
        [3,'الاستدامة',2,'المشاريع الاستثمارية','3/2','#f4a535'],
        [3,'الاستدامة',3,'الإسناد','3/3','#f4a535'],
        [4,'الأداء والنمو',1,'الاستراتيجية','4/1','#a78bfa'],
        [4,'الأداء والنمو',2,'الموارد البشرية','4/2','#a78bfa'],
        [4,'الأداء والنمو',3,'مكتب المشاريع','4/3','#a78bfa'],
        [5,'الشؤون المالية والإدارية',1,'المالية','5/1','#fb7185'],
        [5,'الشؤون المالية والإدارية',2,'التقنية','5/2','#fb7185'],
        [5,'الشؤون المالية والإدارية',3,'الإدارية','5/3','#fb7185'],
        [6,'الاتصال المؤسسي',1,'الإعلام','6/1','#34d399'],
        [6,'الاتصال المؤسسي',2,'تنمية الموارد','6/2','#34d399'],
        [6,'الاتصال المؤسسي',3,'العلاقات والشركات','6/3','#34d399'],
    ]);

    $strategicGoals = [
        ['code' => 'ع1', 'name' => 'تحسين المستوى المعيشي للأسر المستفيدة', 'description' => '', 'axis' => 'العملاء', 'status' => 'active'],
        ['code' => 'ع2', 'name' => 'المساهمة في تمكين الأسر المستفيدة وأفرادها', 'description' => '', 'axis' => 'العملاء', 'status' => 'active'],
        ['code' => 'ع3', 'name' => 'المساهمة في حماية الأسر من مسببات الفقر', 'description' => '', 'axis' => 'العملاء', 'status' => 'active'],
        ['code' => 'م1', 'name' => 'زيادة الإيرادات من المصادر الثابتة والاستثمارات', 'description' => '', 'axis' => 'المالي', 'status' => 'active'],
        ['code' => 'م2', 'name' => 'زيادة وتنويع التبرعات', 'description' => '', 'axis' => 'المالي', 'status' => 'active'],
        ['code' => 'د1', 'name' => 'الإبتكار في تصميم وتقديم البرامج والخدمات', 'description' => '', 'axis' => 'العمليات الداخلية', 'status' => 'active'],
        ['code' => 'د3', 'name' => 'بناء منظومة تقنية متكاملة', 'description' => '', 'axis' => 'العمليات الداخلية', 'status' => 'active'],
        ['code' => 'د4', 'name' => 'إيجاد وتعزيز الشراكات والعلاقات الفاعلة', 'description' => '', 'axis' => 'العمليات الداخلية', 'status' => 'active'],
        ['code' => 'ن1', 'name' => 'التطوير المستمر للعاملين', 'description' => '', 'axis' => 'التعلم و النمو', 'status' => 'active'],
        ['code' => 'ن2', 'name' => 'إستقطاب وتفعيل المتطوعين', 'description' => '', 'axis' => 'التعلم و النمو', 'status' => 'active'],
        ['code' => 'ن3', 'name' => 'توفير بيئة عمل ممكنة ومحفزة', 'description' => '', 'axis' => 'التعلم و النمو', 'status' => 'active'],
    ];

    $kpis = [
        ['code' => 'ع1-1', 'goal_code' => 'ع1', 'name' => 'متوسط ما تتحصل عليه الأسرة من الجمعية', 'description' => '', 'formula' => '', 'unit' => 'ريال', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الرعاية والتمكين', 'annual_target' => 20000, 'baseline' => null, 'q1_target' => 4000, 'q2_target' => 6000, 'q3_target' => 6000, 'q4_target' => 4000, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ع2-1', 'goal_code' => 'ع1', 'name' => 'نسبة الأسر التي تم توفير الاحتياجات الضرورية لها', 'description' => '', 'formula' => '', 'unit' => 'نسبة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الرعاية والتمكين', 'annual_target' => 0.94, 'baseline' => null, 'q1_target' => 0.94, 'q2_target' => 0.94, 'q3_target' => 0.94, 'q4_target' => 0.94, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ع1-2', 'goal_code' => 'ع2', 'name' => 'عدد المستفيدين الذين تم تأهيلهم', 'description' => '', 'formula' => '', 'unit' => 'مستفيد', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الرعاية والتمكين', 'annual_target' => 450, 'baseline' => null, 'q1_target' => 100, 'q2_target' => 50, 'q3_target' => 250, 'q4_target' => 50, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ع2-2', 'goal_code' => 'ع2', 'name' => 'عدد الأسر التي استغنت عن خدمات الجمعية', 'description' => '', 'formula' => '', 'unit' => 'أسرة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة التكافل المجتمعي', 'annual_target' => 50, 'baseline' => null, 'q1_target' => 5, 'q2_target' => 10, 'q3_target' => 25, 'q4_target' => 10, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ع1-3', 'goal_code' => 'ع3', 'name' => 'عدد المبادرات المنفذة لحماية الأسر من مسببات الفقر', 'description' => '', 'formula' => '', 'unit' => 'مبادرة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة التكافل المجتمعي', 'annual_target' => 13, 'baseline' => null, 'q1_target' => 0, 'q2_target' => 0, 'q3_target' => 5, 'q4_target' => 8, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'م1-1', 'goal_code' => 'م1', 'name' => 'صافي أرباح المصادر الثابتة', 'description' => '', 'formula' => '', 'unit' => 'ريال', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الشؤون المالية والإدارية', 'annual_target' => 1500000, 'baseline' => null, 'q1_target' => 300000, 'q2_target' => 330000, 'q3_target' => 420000, 'q4_target' => 450000, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'م2-1', 'goal_code' => 'م1', 'name' => 'صافي أرباح الاستثمارات', 'description' => '', 'formula' => '', 'unit' => 'ريال', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الاستدامة', 'annual_target' => 10350000, 'baseline' => null, 'q1_target' => 0, 'q2_target' => 0, 'q3_target' => 0, 'q4_target' => 0, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'م1-2', 'goal_code' => 'م2', 'name' => 'عدد مصادر الدخل الجديدة', 'description' => '', 'formula' => '', 'unit' => 'مصدر دخل', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الاتصال المؤسسي', 'annual_target' => 1, 'baseline' => null, 'q1_target' => 0, 'q2_target' => 0, 'q3_target' => 1, 'q4_target' => 0, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'م2-2', 'goal_code' => 'م2', 'name' => 'إجمالي الإيرادات من مصادر الدخل الجديدة', 'description' => '', 'formula' => '', 'unit' => 'ريال', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الاتصال المؤسسي', 'annual_target' => 50000, 'baseline' => null, 'q1_target' => null, 'q2_target' => null, 'q3_target' => null, 'q4_target' => null, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'د1-1', 'goal_code' => 'د1', 'name' => 'عدد البرامج المبتكرة التي تم تصميمها', 'description' => '', 'formula' => '', 'unit' => 'برامج', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الرعاية والتمكين', 'annual_target' => 14, 'baseline' => null, 'q1_target' => 3, 'q2_target' => 5, 'q3_target' => 4, 'q4_target' => 2, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'د2-1', 'goal_code' => 'د1', 'name' => 'عدد الخدمات المبتكرة التي تم تصميمها', 'description' => '', 'formula' => '', 'unit' => 'خدمة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الرعاية والتمكين', 'annual_target' => 18, 'baseline' => null, 'q1_target' => null, 'q2_target' => null, 'q3_target' => null, 'q4_target' => null, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'د1-3', 'goal_code' => 'د3', 'name' => 'نسبة نضج واستدامة البيئة التقنية', 'description' => '', 'formula' => '', 'unit' => 'نسبة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الشؤون المالية والإدارية', 'annual_target' => 1, 'baseline' => null, 'q1_target' => null, 'q2_target' => null, 'q3_target' => null, 'q4_target' => null, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'د1-4', 'goal_code' => 'د4', 'name' => 'عدد الشراكات الفاعلة', 'description' => '', 'formula' => '', 'unit' => 'شراكة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الاتصال المؤسسي', 'annual_target' => 80, 'baseline' => null, 'q1_target' => 25, 'q2_target' => 20, 'q3_target' => 20, 'q4_target' => 15, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ن1-1', 'goal_code' => 'ن1', 'name' => 'متوسط عدد الساعات التطويرية المقدمة للفرد', 'description' => '', 'formula' => '', 'unit' => 'ساعة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الأداء والنمو', 'annual_target' => 50, 'baseline' => null, 'q1_target' => null, 'q2_target' => null, 'q3_target' => null, 'q4_target' => null, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ن1-2', 'goal_code' => 'ن2', 'name' => 'عدد المتطوعين في أعمال وبرامج الجمعية', 'description' => '', 'formula' => '', 'unit' => 'متطوع', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة التكافل المجتمعي', 'annual_target' => 2500, 'baseline' => null, 'q1_target' => 1300, 'q2_target' => 625, 'q3_target' => 350, 'q4_target' => 275, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
        ['code' => 'ن1-3', 'goal_code' => 'ن3', 'name' => 'نسبة رضا العاملين عن بيئة العمل', 'description' => '', 'formula' => '', 'unit' => 'نسبة', 'direction' => 'كلما زاد كان أفضل', 'frequency' => 'ربع سنوي', 'type' => 'strategic', 'owner_dept' => 'إدارة الأداء والنمو', 'annual_target' => 0.88, 'baseline' => null, 'q1_target' => null, 'q2_target' => null, 'q3_target' => null, 'q4_target' => null, 'year' => 2026, 'strat_link' => null, 'status' => 'active'],
    ];

    $quarterMap = [
        'ع1-1' => [4000, 6000, 6000, 4000],
        'ع2-1' => [0.94, 0.94, 0.94, 0.94],
        'ع1-2' => [100, 50, 250, 50],
        'ع2-2' => [5, 10, 25, 10],
        'م1-1' => [300000, 330000, 420000, 450000],
        'م2-1' => [0, 0, 0, 0],
        'م1-2' => [0, 0, 1, 0],
        'د1-1' => [3, 5, 4, 2],
        'د1-4' => [25, 20, 20, 15],
        'ن1-2' => [1300, 625, 350, 275],
    ];
    $kpiValues = [];
    foreach ($quarterMap as $code => $targets) {
        foreach ($targets as $index => $target) {
            $kpiValues[] = [
                'code' => $code,
                'year' => 2026,
                'quarter' => $index + 1,
                'target' => $target,
                'actual' => null,
                'status' => 'pending',
            ];
        }
    }

    return [
        'source' => 'fallback',
        'workbook' => null,
        'departments' => $departments,
        'strategic_goals' => $strategicGoals,
        'operational_goals' => [],
        'kpis' => $kpis,
        'kpi_values' => $kpiValues,
        'governance_items' => getDefaultGovernanceSeedData(),
        'knowledge_assets' => getDefaultKnowledgeSeedData(),
    ];
}

function getDefaultGovernanceSeedData(): array {
    return [
        ['code'=>'GOV-01','category'=>'policies','name'=>'سياسة إدارة الأداء المؤسسي','description'=>'','owner'=>'الأداء والنمو','status'=>'compliant','compliance_pct'=>95,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-02','category'=>'procedures','name'=>'إجراءات رفع تقارير الأداء الربعية','description'=>'','owner'=>'الأداء والنمو','status'=>'compliant','compliance_pct'=>90,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-03','category'=>'committees','name'=>'لجنة الأداء والتطوير المؤسسي','description'=>'','owner'=>'الإدارة العليا','status'=>'partial','compliance_pct'=>75,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-04','category'=>'reports','name'=>'تقرير الأداء الربعي','description'=>'','owner'=>'الأداء والنمو','status'=>'compliant','compliance_pct'=>100,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-05','category'=>'compliance','name'=>'معايير مكين للحوكمة','description'=>'','owner'=>'جميع الإدارات','status'=>'partial','compliance_pct'=>80,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-06','category'=>'policies','name'=>'سياسة إدارة المخاطر','description'=>'','owner'=>'الشؤون المالية','status'=>'pending','compliance_pct'=>40,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-07','category'=>'procedures','name'=>'إجراءات اعتماد الخطط التشغيلية','description'=>'','owner'=>'الأداء والنمو','status'=>'compliant','compliance_pct'=>85,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-08','category'=>'committees','name'=>'مجلس الإدارة — الاجتماعات الدورية','description'=>'','owner'=>'الإدارة العليا','status'=>'compliant','compliance_pct'=>100,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-09','category'=>'compliance','name'=>'الإفصاح والشفافية المؤسسية','description'=>'','owner'=>'الاتصال المؤسسي','status'=>'partial','compliance_pct'=>70,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
        ['code'=>'GOV-10','category'=>'reports','name'=>'التقرير السنوي للأداء المؤسسي','description'=>'','owner'=>'الأداء والنمو','status'=>'pending','compliance_pct'=>0,'last_reviewed'=>null,'next_review'=>null,'year'=>2026,'quarter'=>null],
    ];
}

function getDefaultKnowledgeSeedData(): array {
    return [
        ['code'=>'KA-001','type'=>'policy','title'=>'سياسة قياس الأداء المؤسسي 2026','description'=>'','owner'=>'الأداء والنمو','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>1,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-002','type'=>'procedure','title'=>'دليل إدخال بيانات المؤشرات','description'=>'','owner'=>'الأداء والنمو','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>1,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-003','type'=>'lesson','title'=>'دروس مستفادة — الربع الرابع 2025','description'=>'','owner'=>'الإدارة العليا','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>0,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-004','type'=>'best_practice','title'=>'أفضل ممارسات التطوع المؤسسي','description'=>'','owner'=>'التكافل المجتمعي','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>0,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-005','type'=>'report','title'=>'تقرير تحليل الفجوة 2025','description'=>'','owner'=>'الأداء والنمو','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>1,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-006','type'=>'template','title'=>'نموذج بطاقة انحراف المؤشر','description'=>'','owner'=>'الأداء والنمو','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>0,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-007','type'=>'procedure','title'=>'إجراءات الشراكات الاستراتيجية','description'=>'','owner'=>'الاتصال المؤسسي','kpi_id'=>null,'governance_id'=>null,'status'=>'draft','approved_by'=>'','used_in_decision'=>0,'decision_ref'=>'','year'=>2026,'quarter'=>null],
        ['code'=>'KA-008','type'=>'lesson','title'=>'تجربة تنفيذ برنامج التمكين 2025','description'=>'','owner'=>'الرعاية والتمكين','kpi_id'=>null,'governance_id'=>null,'status'=>'active','approved_by'=>'','used_in_decision'=>1,'decision_ref'=>'','year'=>2026,'quarter'=>null],
    ];
}

function findSetupWorkbookPath(): ?string {
    $candidates = [
        dirname(__DIR__) . '/داتا المنصة (1).xlsx',
        dirname(__DIR__) . '/داتا المنصة.xlsx',
        __DIR__ . '/uploads/داتا المنصة (1).xlsx',
        __DIR__ . '/uploads/داتا المنصة.xlsx',
    ];
    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            return $candidate;
        }
    }

    foreach ([dirname(__DIR__), __DIR__ . '/uploads'] as $dir) {
        foreach (glob($dir . '/*.xlsx') ?: [] as $file) {
            $name = basename($file);
            if (str_contains($name, 'داتا') || str_contains(strtolower($name), 'data')) {
                return $file;
            }
        }
    }

    return null;
}

function buildQuarterMeasurementMap(array $rows): array {
    $map = [];
    foreach ($rows as $row) {
        $code = sheetCellText($row, 'رمزالموشر');
        if ($code === '') {
            continue;
        }
        $map[$code] = [
            'year' => sheetCellInt($row, 'العام') ?? 2026,
            'annual_target' => sheetCellNumber($row, 'مستهدفعام2026'),
            'q1_target' => sheetCellNumber($row, 'المستهدفللربعالاول'),
            'q2_target' => sheetCellNumber($row, 'المستهدفللربعالثاني'),
            'q3_target' => sheetCellNumber($row, 'المستهدفللربعالثالث'),
            'q4_target' => sheetCellNumber($row, 'المستهدفللربعالرابع'),
            'q1_actual' => sheetCellNumber($row, 'المتحققالفعليللربعالاول'),
            'q2_actual' => sheetCellNumber($row, 'المتحققالفعليللربعالثاني'),
            'q3_actual' => sheetCellNumber($row, 'المتحققالفعليللربعالثالث'),
            'q4_actual' => sheetCellNumber($row, 'المتحققالفعليللربعالرابع'),
        ];
    }
    return $map;
}

function buildQuarterValueRows(string $code, array $measure): array {
    if (empty($measure)) {
        return [];
    }

    $values = [];
    $year = (int)($measure['year'] ?? 2026);
    for ($quarter = 1; $quarter <= 4; $quarter++) {
        $target = $measure["q{$quarter}_target"] ?? null;
        $actual = $measure["q{$quarter}_actual"] ?? null;
        if ($target === null && $actual === null) {
            continue;
        }
        $values[] = [
            'code' => $code,
            'year' => $year,
            'quarter' => $quarter,
            'target' => $target,
            'actual' => $actual,
            'status' => calculateSetupKpiStatus($actual, $target),
        ];
    }

    return $values;
}

function readWorkbookSheets(string $path): array {
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('امتداد ZipArchive غير مفعّل على السيرفر');
    }

    $zip = new ZipArchive();
    $result = $zip->open($path);
    if ($result !== true) {
        throw new RuntimeException('تعذر فتح ملف الإكسل: ' . basename($path));
    }

    $sharedStrings = [];
    $sharedStringsXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($sharedStringsXml !== false) {
        $sharedStringsDoc = @simplexml_load_string(normalizeWorkbookXml($sharedStringsXml));
        if ($sharedStringsDoc) {
            foreach ($sharedStringsDoc->si as $item) {
                $text = '';
                foreach ($item->r as $run) {
                    $text .= (string)($run->t ?? '');
                }
                if ($text === '') {
                    $text = (string)($item->t ?? '');
                }
                $sharedStrings[] = $text;
            }
        }
    }

    $workbookXml = $zip->getFromName('xl/workbook.xml');
    $relsXml = $zip->getFromName('xl/_rels/workbook.xml.rels');
    if ($workbookXml === false || $relsXml === false) {
        $zip->close();
        throw new RuntimeException('ملف الإكسل لا يحتوي على بنية xlsx مكتملة');
    }

    $workbook = @simplexml_load_string(normalizeWorkbookXml($workbookXml));
    $rels = @simplexml_load_string(normalizeWorkbookXml($relsXml));
    if (!$workbook || !$rels) {
        $zip->close();
        throw new RuntimeException('تعذر قراءة بنية ملف الإكسل');
    }

    $sheetTargets = [];
    foreach ($rels->Relationship as $rel) {
        $sheetTargets[(string)($rel['Id'] ?? '')] = (string)($rel['Target'] ?? '');
    }

    $sheets = [];
    foreach ($workbook->sheets->sheet as $sheet) {
        $name = trim((string)($sheet['name'] ?? ''));
        $relId = (string)($sheet['id'] ?? '');
        $target = $sheetTargets[$relId] ?? '';
        if ($name === '' || $target === '') {
            continue;
        }

        $sheetPath = ltrim($target, '/');
        if (!str_starts_with($sheetPath, 'xl/')) {
            $sheetPath = 'xl/' . $sheetPath;
        }
        $sheetPath = str_replace('../', '', $sheetPath);

        $sheetXml = $zip->getFromName($sheetPath);
        if ($sheetXml === false) {
            continue;
        }
        $sheets[$name] = readWorkbookSheetRows($sheetXml, $sharedStrings);
    }

    $zip->close();
    return $sheets;
}

function readWorkbookSheetRows(string $sheetXml, array $sharedStrings): array {
    $sheetDoc = @simplexml_load_string(normalizeWorkbookXml($sheetXml));
    if (!$sheetDoc || !isset($sheetDoc->sheetData)) {
        return [];
    }

    $matrix = [];
    $maxRow = 0;
    $maxCol = 0;

    foreach ($sheetDoc->sheetData->row as $rowEl) {
        $rowNumber = (int)($rowEl['r'] ?? 0);
        if ($rowNumber > $maxRow) {
            $maxRow = $rowNumber;
        }
        foreach ($rowEl->c as $cell) {
            $ref = (string)($cell['r'] ?? '');
            $type = (string)($cell['t'] ?? '');
            $rawValue = (string)($cell->v ?? '');
            $inlineValue = '';

            if (isset($cell->is->t)) {
                $inlineValue = (string)$cell->is->t;
            } elseif (isset($cell->is->r)) {
                foreach ($cell->is->r as $run) {
                    $inlineValue .= (string)($run->t ?? '');
                }
            }

            if ($type === 's') {
                $value = $sharedStrings[(int)$rawValue] ?? '';
            } elseif ($type === 'inlineStr' || $inlineValue !== '') {
                $value = $inlineValue;
            } elseif ($type === 'b') {
                $value = $rawValue === '1' ? 'TRUE' : 'FALSE';
            } else {
                $value = $rawValue;
            }

            if (!preg_match('/^([A-Z]+)/i', $ref, $matches)) {
                continue;
            }
            $colIdx = workbookColumnToIndex(strtoupper($matches[1]));
            if ($colIdx > $maxCol) {
                $maxCol = $colIdx;
            }
            $matrix[$rowNumber][$colIdx] = trim((string)$value);
        }
    }

    $rows = [];
    for ($row = 1; $row <= $maxRow; $row++) {
        $current = [];
        for ($col = 0; $col <= $maxCol; $col++) {
            $current[] = $matrix[$row][$col] ?? '';
        }
        $rows[] = $current;
    }

    return $rows;
}

function normalizeWorkbookXml(string $xml): string {
    $xml = preg_replace('/\s+xmlns(:\w+)?="[^"]*"/', '', $xml);
    $xml = preg_replace('/(<\/?)(\w+):/u', '$1', $xml);
    $xml = preg_replace('/\s(\w+):(\w+)=/u', ' $2=', $xml);
    return $xml;
}

function workbookColumnToIndex(string $column): int {
    $index = 0;
    for ($i = 0; $i < strlen($column); $i++) {
        $index = ($index * 26) + (ord($column[$i]) - 64);
    }
    return $index - 1;
}

function sheetToAssocRows(array $rows): array {
    if (empty($rows)) {
        return [];
    }

    $headers = array_shift($rows);
    $normalizedHeaders = [];
    foreach ($headers as $index => $header) {
        $normalizedHeaders[$index] = normalizeSheetHeader((string)$header);
    }

    $result = [];
    foreach ($rows as $row) {
        $assoc = [];
        $hasData = false;
        foreach ($normalizedHeaders as $index => $header) {
            if ($header === '') {
                continue;
            }
            $value = $row[$index] ?? '';
            if ($value !== null && trim((string)$value) !== '') {
                $hasData = true;
            }
            $assoc[$header] = $value;
        }
        if ($hasData) {
            $result[] = $assoc;
        }
    }

    return $result;
}

function normalizeSheetHeader(string $value): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    $value = str_replace(["\r", "\n", "\t", '(', ')', '؛', ':', '-', '_', '/', '\\'], '', $value);
    $value = preg_replace('/\s+/u', '', $value);
    $value = strtr($value, [
        'أ' => 'ا',
        'إ' => 'ا',
        'آ' => 'ا',
        'ى' => 'ي',
        'ؤ' => 'و',
        'ئ' => 'ي',
        'ة' => 'ه',
    ]);

    return mb_strtolower($value, 'UTF-8');
}

function sheetCellText(array $row, string ...$keys): string {
    foreach ($keys as $key) {
        if (!array_key_exists($key, $row)) {
            continue;
        }
        $value = trim((string)$row[$key]);
        if ($value === '') {
            continue;
        }
        return preg_replace('/\s+/u', ' ', $value);
    }
    return '';
}

function sheetCellNumber(array $row, string ...$keys): ?float {
    foreach ($keys as $key) {
        if (!array_key_exists($key, $row)) {
            continue;
        }
        $value = $row[$key];
        if ($value === null || $value === '') {
            continue;
        }
        $clean = trim((string)$value);
        if ($clean === '') {
            continue;
        }
        $clean = str_replace(['،', ',', '%', 'SAR', 'ر.س', 'ريال', ' '], '', $clean);
        if (is_numeric($clean)) {
            return (float)$clean;
        }
    }
    return null;
}

function sheetCellInt(array $row, string ...$keys): ?int {
    $number = sheetCellNumber($row, ...$keys);
    return $number === null ? null : (int)$number;
}

function normalizeSetupStatus(string $status): string {
    $normalized = normalizeSheetHeader($status);
    if ($normalized === '' || in_array($normalized, ['نشط', 'مفعل', 'فعال', 'active'], true)) {
        return 'active';
    }
    if (in_array($normalized, ['غيرنشط', 'غيرمفعل', 'موقوف', 'متوقف', 'inactive'], true)) {
        return 'inactive';
    }
    return 'active';
}

function calculateSetupKpiStatus(?float $actual, ?float $target): string {
    if ($actual === null || $target === null || $target <= 0) {
        return 'pending';
    }

    $pct = $actual / $target;
    return match (true) {
        $pct >= 1.0  => 'exceeded',
        $pct >= 0.85 => 'achieved',
        $pct >= 0.5  => 'partial',
        default      => 'not_achieved',
    };
}

function syncEarlyWarningForValue(PDO $db, int $kpiId, int $year, int $quarter, ?float $actual, ?float $target): void {
    $existing = $db->prepare("
        SELECT id
        FROM early_warning_log
        WHERE kpi_id = ? AND year = ? AND quarter = ? AND status != 'closed'
        ORDER BY id DESC
        LIMIT 1
    ");
    $existing->execute([$kpiId, $year, $quarter]);
    $warningId = $existing->fetchColumn();

    if ($actual === null || $target === null || $target <= 0) {
        if ($warningId) {
            $db->prepare("
                DELETE FROM early_warning_log
                WHERE kpi_id = ? AND year = ? AND quarter = ? AND status != 'closed'
            ")->execute([$kpiId, $year, $quarter]);
        }
        return;
    }

    $deviation = ($actual - $target) / $target;
    if ($deviation < -0.15) {
        $risk = $deviation < -0.3 ? 'high' : 'medium';
        if ($warningId) {
            $db->prepare("
                UPDATE early_warning_log
                SET deviation = ?, risk_level = ?, updated_at = NOW()
                WHERE id = ?
            ")->execute([$deviation * 100, $risk, $warningId]);
        } else {
            $db->prepare("
                INSERT INTO early_warning_log (kpi_id, year, quarter, deviation, risk_level)
                VALUES (?, ?, ?, ?, ?)
            ")->execute([$kpiId, $year, $quarter, $deviation * 100, $risk]);
        }
        return;
    }

    if ($warningId) {
        $db->prepare("
            DELETE FROM early_warning_log
            WHERE kpi_id = ? AND year = ? AND quarter = ? AND status != 'closed'
        ")->execute([$kpiId, $year, $quarter]);
    }
}

function setupDepartmentColor(int $deptNo): string {
    $palette = [
        1 => '#00c9a7',
        2 => '#00b4d8',
        3 => '#f4a535',
        4 => '#a78bfa',
        5 => '#fb7185',
        6 => '#34d399',
        7 => '#60a5fa',
        8 => '#f97316',
    ];
    return $palette[$deptNo] ?? $palette[(($deptNo - 1) % count($palette)) + 1];
}


// ═══════════════════════════════════════════════════
//  2. DASHBOARD — إحصائيات لوحة التحكم
// ═══════════════════════════════════════════════════
function handleDashboard(): void {
    $db   = getDB();
    ensurePerformanceIndexes($db);
    $year = (int)($_GET['year'] ?? 2026);
    $q    = (int)($_GET['quarter'] ?? 1);
    $hasKpiYearCol = tableHasColumn($db, 'kpis', 'year');

    // إجمالي المؤشرات
    $totalsSql = "SELECT type, COUNT(*) as cnt FROM kpis WHERE status='active'";
    $totalsParams = [];
    if ($hasKpiYearCol) {
        $totalsSql .= " AND (year=? OR year IS NULL)";
        $totalsParams[] = $year;
    }
    $totalsSql .= " GROUP BY type";
    $totalsStmt = $db->prepare($totalsSql);
    $totalsStmt->execute($totalsParams);
    $totals = $totalsStmt->fetchAll();
    $strategic = 0; $operational = 0;
    foreach ($totals as $t) {
        if ($t['type'] === 'strategic')   $strategic   = (int)$t['cnt'];
        if ($t['type'] === 'operational') $operational = (int)$t['cnt'];
    }

    // حالات المؤشرات في الربع المحدد
    $statusCountsSql = "
        SELECT
            SUM(CASE WHEN v.actual IS NULL THEN 0 ELSE 1 END) as has_data,
            SUM(CASE WHEN v.actual >= v.target AND v.target > 0 THEN 1 ELSE 0 END) as exceeded,
            SUM(CASE WHEN v.actual >= v.target*0.85 AND v.actual < v.target AND v.target > 0 THEN 1 ELSE 0 END) as achieved,
            SUM(CASE WHEN v.actual >= v.target*0.5  AND v.actual < v.target*0.85 AND v.target > 0 THEN 1 ELSE 0 END) as partial,
            SUM(CASE WHEN v.actual < v.target*0.5 AND v.target > 0 AND v.actual IS NOT NULL THEN 1 ELSE 0 END) as not_achieved,
            SUM(CASE WHEN v.actual IS NULL THEN 1 ELSE 0 END) as pending
        FROM kpi_values v
        JOIN kpis k ON k.id = v.kpi_id
        WHERE v.year=? AND v.quarter=? AND k.status='active'
    ";
    $statusParams = [$year, $q];
    if ($hasKpiYearCol) {
        $statusCountsSql .= " AND (k.year=? OR k.year IS NULL)";
        $statusParams[] = $year;
    }
    $statusCounts = $db->prepare($statusCountsSql);
    $statusCounts->execute($statusParams);
    $sc = $statusCounts->fetch();
    $sc = array_merge([
        'has_data' => 0,
        'exceeded' => 0,
        'achieved' => 0,
        'partial' => 0,
        'not_achieved' => 0,
        'pending' => 0,
    ], is_array($sc) ? array_map(static fn($value) => (int)($value ?? 0), $sc) : []);

    // الأداء حسب المحور
    $axisPerfSql = "
        SELECT
            SUBSTRING(k.goal_code,1,1) as axis,
            COUNT(*) as total,
            AVG(CASE WHEN v.target > 0 AND v.actual IS NOT NULL
                THEN LEAST(v.actual/v.target,1)*100 ELSE NULL END) as avg_pct
        FROM kpis k
        LEFT JOIN kpi_values v ON v.kpi_id=k.id AND v.year=? AND v.quarter=?
        WHERE k.type='strategic' AND k.status='active'
        GROUP BY axis
    ";
    $axisParams = [$year, $q];
    if ($hasKpiYearCol) {
        $axisPerfSql = str_replace("GROUP BY axis", "AND (k.year=? OR k.year IS NULL)\n        GROUP BY axis", $axisPerfSql);
        $axisParams[] = $year;
    }
    $axisPerf = $db->prepare($axisPerfSql);
    $axisPerf->execute($axisParams);
    $axes = $axisPerf->fetchAll();

    // الأداء حسب الإدارة
    $deptPerfSql = "
        SELECT
            k.owner_dept,
            COUNT(*) as total,
            SUM(CASE WHEN v.actual IS NOT NULL AND v.target > 0 THEN 1 ELSE 0 END) as has_data,
            AVG(CASE WHEN v.target > 0 AND v.actual IS NOT NULL
                THEN LEAST(v.actual/v.target,1)*100 ELSE NULL END) as avg_pct
        FROM kpis k
        LEFT JOIN kpi_values v ON v.kpi_id=k.id AND v.year=? AND v.quarter=?
        WHERE k.status='active'
        GROUP BY k.owner_dept
        ORDER BY avg_pct DESC
    ";
    $deptParams = [$year, $q];
    if ($hasKpiYearCol) {
        $deptPerfSql = str_replace("GROUP BY k.owner_dept", "AND (k.year=? OR k.year IS NULL)\n        GROUP BY k.owner_dept", $deptPerfSql);
        $deptParams[] = $year;
    }
    $deptPerf = $db->prepare($deptPerfSql);
    $deptPerf->execute($deptParams);
    $depts = $deptPerf->fetchAll();

    // إنذار مبكر — انحراف > 15%
    $alertsSql = "
        SELECT k.id as kpi_id, k.code, k.name, k.owner_dept, v.target, v.actual,
               CASE WHEN v.target > 0 AND v.actual IS NOT NULL
                    THEN (v.actual - v.target) / v.target * 100
                    ELSE NULL END as deviation_pct
        FROM kpis k
        JOIN kpi_values v ON v.kpi_id=k.id AND v.year=? AND v.quarter=?
        WHERE v.target > 0 AND v.actual IS NOT NULL
          AND (v.actual / v.target) < 0.85
        ORDER BY deviation_pct ASC
        LIMIT 10
    ";
    $alertParams = [$year, $q];
    if ($hasKpiYearCol) {
        $alertsSql = str_replace("ORDER BY deviation_pct ASC", "AND (k.year=? OR k.year IS NULL)\n        ORDER BY deviation_pct ASC", $alertsSql);
        $alertParams[] = $year;
    }
    $alerts = $db->prepare($alertsSql);
    $alerts->execute($alertParams);
    $alertRows = $alerts->fetchAll();

    jsonResponse([
        'year'    => $year,
        'quarter' => $q,
        'summary' => [
            'strategic'   => $strategic,
            'operational' => $operational,
            'total'       => $strategic + $operational,
        ],
        'status_counts' => $sc,
        'axis_performance' => $axes,
        'dept_performance' => $depts,
        'alerts'           => $alertRows,
    ]);
}


// ═══════════════════════════════════════════════════
//  3. KPIs — قراءة / إنشاء / تعديل / حذف
// ═══════════════════════════════════════════════════
function handleKpis(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);

    if ($method === 'GET') {
        $type  = $_GET['type']  ?? null;
        $dept  = $_GET['dept']  ?? null;
        $year  = (int)($_GET['year']    ?? 2026);
        $q     = (int)($_GET['quarter'] ?? 1);
        $hasKpiYearCol = tableHasColumn($db, 'kpis', 'year');

        // SELECT آمن — يعمل مع أي إصدار من الجدول
        try {
            if (!kpisSupportExtendedColumns($db)) {
                throw new RuntimeException('legacy_kpis_table');
            }
            $extraCols = "IFNULL(k.baseline,NULL) as baseline,
                        IFNULL(k.q1_target,NULL) as q1_target, IFNULL(k.q2_target,NULL) as q2_target,
                        IFNULL(k.q3_target,NULL) as q3_target, IFNULL(k.q4_target,NULL) as q4_target,
                        IFNULL(k.strat_link,NULL) as strat_link,
                        IFNULL(k.formula_text,NULL) as formula_text,
                        IFNULL(k.formula_vars,NULL) as formula_vars,
                        IFNULL(k.calc_type,'manual') as calc_type";
        } catch (\Throwable $e) {
            $extraCols = "NULL as baseline, NULL as q1_target, NULL as q2_target,
                        NULL as q3_target, NULL as q4_target, NULL as strat_link,
                        NULL as formula_text, NULL as formula_vars, 'manual' as calc_type";
        }
        $qcol = "CASE ? WHEN 1 THEN k.q1_target WHEN 2 THEN k.q2_target WHEN 3 THEN k.q3_target WHEN 4 THEN k.q4_target ELSE k.q1_target END";
        $sql  = "SELECT k.id,k.code,k.goal_code,k.name,k.description,k.unit,k.direction,
                        k.frequency,k.type,k.owner_dept,k.annual_target,k.status,k.created_at,
                        COALESCE(v.target, $qcol) as q_target,
                        v.actual as q_actual, v.status as q_status,
                        v.id as val_id, v.quarter, v.year,
                        $extraCols
                 FROM kpis k
                 LEFT JOIN kpi_values v ON v.kpi_id=k.id AND v.year=? AND v.quarter=?
                 WHERE k.status='active'";
        $params = [$q, $year, $q];

        if ($hasKpiYearCol) {
            $sql .= " AND (k.year=? OR k.year IS NULL)";
            $params[] = $year;
        }

        if ($type)  { $sql .= " AND k.type=?"; $params[] = $type; }
        if ($dept)  { $sql .= " AND k.owner_dept LIKE ?"; $params[] = "%$dept%"; }
        if ($id)    { $sql .= " AND k.id=?"; $params[] = $id; }

        $sql .= " ORDER BY k.code";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $id ? $stmt->fetch() : $stmt->fetchAll();

        // احسب نسبة الإنجاز
        if (!$id && is_array($rows)) {
            foreach ($rows as &$row) {
                $row['achievement_pct'] = ($row['q_target'] > 0 && $row['q_actual'] !== null)
                    ? round(($row['q_actual'] / $row['q_target']) * 100, 1)
                    : null;
            }
        }
        jsonResponse($rows ?: ($id ? ['error' => 'غير موجود'] : []));
    }

    if ($method === 'POST') {
        $d = getInput();
        $stmt = $db->prepare("
            INSERT INTO kpis (code,goal_code,name,description,unit,type,owner_dept,annual_target,frequency)
            VALUES (:code,:goal_code,:name,:desc,:unit,:type,:dept,:target,:freq)
            ON DUPLICATE KEY UPDATE
                name=VALUES(name), description=VALUES(description),
                unit=VALUES(unit), annual_target=VALUES(annual_target)
        ");
        $stmt->execute([
            ':code'      => $d['code']         ?? '',
            ':goal_code' => $d['goal_code']    ?? '',
            ':name'      => $d['name']         ?? '',
            ':desc'      => $d['description']  ?? '',
            ':unit'      => $d['unit']         ?? '',
            ':type'      => $d['type']         ?? 'strategic',
            ':dept'      => $d['owner_dept']   ?? '',
            ':target'    => $d['annual_target']?? null,
            ':freq'         => $d['frequency']    ?? 'ربع سنوي',
        ]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId()], 201);
    }

    if ($method === 'PUT' && $id) {
        $d = getInput();
        $stmt = $db->prepare("
            UPDATE kpis SET
                code=:code, goal_code=:goal_code, name=:name,
                description=:desc, unit=:unit, type=:type,
                owner_dept=:dept, annual_target=:target,
                baseline=:baseline, formula_text=:formula_text,
                formula_vars=:formula_vars, calc_type=:calc_type
            WHERE id=:id
        ");
        $stmt->execute([
            ':code'      => $d['code']         ?? '',
            ':goal_code' => $d['goal_code']    ?? '',
            ':name'      => $d['name']         ?? '',
            ':desc'      => $d['description']  ?? '',
            ':unit'      => $d['unit']         ?? '',
            ':type'      => $d['type']         ?? 'strategic',
            ':dept'      => $d['owner_dept']   ?? '',
            ':target'       => $d['annual_target'] ?? null,
            ':baseline'     => $d['baseline']      ?? null,
            ':formula_text' => $d['formula_text']  ?? null,
            ':formula_vars' => $d['formula_vars']  ?? null,
            ':calc_type'    => $d['calc_type']     ?? 'manual',
            ':id'           => $id,
        ]);
        jsonResponse(['success' => true]);
    }

    if ($method === 'DELETE' && $id) {
        $db->prepare("UPDATE kpis SET status='inactive' WHERE id=?")->execute([$id]);
        jsonResponse(['success' => true]);
    }
}


// ═══════════════════════════════════════════════════
//  4. KPI VALUES — إدخال / تعديل قيم الأرباع
// ═══════════════════════════════════════════════════
function handleKpiValues(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);
    ensureTableColumn($db, 'kpi_values', 'manual_actual', 'DECIMAL(15,4) DEFAULT NULL');
    ensureTableColumn($db, 'kpi_values', 'source_file', 'VARCHAR(255) DEFAULT NULL');
    ensureTableIndex($db, 'kpi_values', 'idx_kpi_values_source_file', ['source_file']);
    ensureKpiFileImportsTable($db);

    if ($method === 'GET') {
        $kpiId = (int)($_GET['kpi_id'] ?? 0);
        $year  = (int)($_GET['year']   ?? 2026);

        if ($kpiId) {
            $stmt = $db->prepare("SELECT * FROM kpi_values WHERE kpi_id=? AND year=? ORDER BY quarter");
            $stmt->execute([$kpiId, $year]);
            jsonResponse($stmt->fetchAll());
        }
        jsonResponse(['error' => 'kpi_id مطلوب'], 400);
    }

    // POST أو PUT — UPSERT
    if (in_array($method, ['POST','PUT'])) {
        $d = getInput();
        $kpiId   = (int)($d['kpi_id']  ?? 0);
        $year    = (int)($d['year']    ?? 2026);
        $quarter = (int)($d['quarter'] ?? 1);
        $target  = isset($d['target']) ? (float)$d['target'] : null;
        $actual  = isset($d['actual']) ? (float)$d['actual'] : null;
        $notes   = $d['notes'] ?? '';

        if (!$kpiId) jsonResponse(['error' => 'kpi_id مطلوب'], 400);

        // ── محرك المعادلات: إذا calc_type=formula احسب actual تلقائياً ──
        if ($actual === null) {
            try {
                $kpiRow = $db->prepare("SELECT calc_type, formula_text FROM kpis WHERE id=? LIMIT 1");
                $kpiRow->execute([$kpiId]);
                $kpiMeta = $kpiRow->fetch();
                if ($kpiMeta && ($kpiMeta['calc_type'] ?? '') === 'formula' && ($kpiMeta['formula_text'] ?? '')) {
                    $fVars = $d['formula_vars_values'] ?? [];
                    $calc  = calcFormula($kpiMeta['formula_text'], $fVars);
                    if ($calc !== null) { $actual = $calc; }
                }
            } catch (\Throwable $e) { /* العمود غير موجود */ }
        }

        $imports = fetchKpiFileImportAggregate($db, $kpiId, $year, $quarter);
        $finalActual = $actual;
        if ($actual !== null) {
            $finalActual += $imports['file_actual_sum'];
        }

        $status = calcKpiStatus($finalActual, $target);
        $sourceMarker = null;
        if ($imports['file_count'] === 1) {
            $sourceMarker = $imports['latest_filename'];
        } elseif ($imports['file_count'] > 1) {
            $sourceMarker = '__multi__';
        }

        $stmt = $db->prepare("
            INSERT INTO kpi_values (kpi_id, year, quarter, target, actual, notes, status, manual_actual, source_file)
            VALUES (:kpi_id,:year,:quarter,:target,:actual,:notes,:status,:manual_actual,:source_file)
            ON DUPLICATE KEY UPDATE
                target=VALUES(target),
                actual=VALUES(actual),
                notes=VALUES(notes),
                status=VALUES(status),
                manual_actual=VALUES(manual_actual),
                source_file=VALUES(source_file),
                updated_at=NOW()
        ");
        $stmt->execute([
            ':kpi_id'        => $kpiId,
            ':year'          => $year,
            ':quarter'       => $quarter,
            ':target'        => $target,
            ':actual'        => $finalActual,
            ':notes'         => $notes,
            ':status'        => $status,
            ':manual_actual' => $actual,
            ':source_file'   => $sourceMarker,
        ]);

        // مزامنة سجل الإنذار المبكر مع القيمة الحالية للمؤشر
        syncEarlyWarningForValue($db, $kpiId, $year, $quarter, $finalActual, $target);

        // ── إرسال إيميل إنذار تلقائي عند انخفاض المستوى ────────────
        $emailSent = false;
        if ($finalActual !== null && $target !== null && $target > 0) {
            $devPct = ($finalActual - $target) / $target * 100;
            
            // تحميل إعدادات البريد
            $settingsFile = __DIR__ . '/email_settings.json';
            if (file_exists($settingsFile)) {
                try {
                    $emailSettings = json_decode(file_get_contents($settingsFile), true) ?? [];
                    $threshold     = (float)($emailSettings['alert_threshold'] ?? 15);
                    
                    // هل الانحراف أكبر من الحد المحدد؟
                    $alertEnabled = $emailSettings['alert_enabled'] ?? true;
                    $alertOnEntry = $emailSettings['alert_on_entry'] ?? true;
                    $alertEmails = !empty($emailSettings['alert_recipients'])
                        ? $emailSettings['alert_recipients']
                        : ($emailSettings['recipients'] ?? []);
                    if ($alertEnabled && $alertOnEntry && $devPct < -$threshold && !empty($emailSettings['smtp_from']) && !empty($emailSettings['smtp_pass']) && !empty($alertEmails)) {

                        // جلب اسم المؤشر
                        $kpiInfo = $db->prepare("SELECT code, name, owner_dept FROM kpis WHERE id=? LIMIT 1");
                        $kpiInfo->execute([$kpiId]);
                        $kpi = $kpiInfo->fetch();

                        // استخدام إيميلات الإنذار المخصصة إذا وُجدت
                        $alertEmailSettings = array_merge($emailSettings, ['recipients' => $alertEmails]);

                        $alertData = [[
                            'kpi_id'       => $kpiId,
                            'code'         => $kpi['code']   ?? "KPI-{$kpiId}",
                            'name'         => $kpi['name']   ?? 'مؤشر',
                            'owner_dept'   => $kpi['owner_dept'] ?? '',
                            'target'       => $target,
                            'actual'       => $finalActual,
                            'deviation_pct'=> round($devPct, 1),
                        ]];
                        
                        $emailResult = sendEmail($alertEmailSettings,
                            '⚠️ إنذار مبكر — منصة مِقياس | جمعية الزاد',
                            buildAlertEmailBody($alertData, $emailSettings)
                        );
                        $emailSent = $emailResult['success'] ?? false;
                    }
                } catch (\Throwable $e) { /* تجاهل أخطاء البريد */ }
            }
        }

        jsonResponse([
            'success'    => true,
            'status'     => $status,
            'achievement'=> ($target > 0 && $finalActual !== null) ? round($finalActual/$target*100,1) : null,
            'email_sent' => $emailSent,
        ]);
    }

    // DELETE — حذف قيمة ربع معين
    if ($method === 'DELETE') {
        $kpiId   = (int)($_GET['kpi_id']  ?? 0);
        $year    = (int)($_GET['year']    ?? 0);
        $quarter = (int)($_GET['quarter'] ?? 0);
        if (!$kpiId || !$year || !$quarter) {
            jsonResponse(['error' => 'kpi_id وyear وquarter مطلوبة'], 400);
        }
        $imports = fetchKpiFileImportAggregate($db, $kpiId, $year, $quarter);
        if ($imports['file_count'] > 0) {
            $db->prepare("
                UPDATE kpi_values
                SET manual_actual = NULL, updated_at = NOW()
                WHERE kpi_id=? AND year=? AND quarter=?
            ")->execute([$kpiId, $year, $quarter]);
            $rebuilt = rebuildKpiAggregateValue($db, $kpiId, $year, $quarter);
            syncEarlyWarningForValue($db, $kpiId, $year, $quarter, $rebuilt['actual'], $rebuilt['target']);
            jsonResponse([
                'success' => true,
                'deleted' => 1,
                'message' => 'تم حذف القيمة اليدوية مع الإبقاء على أثر الملفات المرفوعة',
            ]);
        }

        $db->prepare("DELETE FROM kpi_values WHERE kpi_id=? AND year=? AND quarter=?")
           ->execute([$kpiId, $year, $quarter]);
        syncEarlyWarningForValue($db, $kpiId, $year, $quarter, null, null);
        jsonResponse(['success' => true, 'deleted' => $db->rowCount()]);
    }
}


// ═══════════════════════════════════════════════════
//  5. DEPARTMENTS
// ═══════════════════════════════════════════════════
function handleDepartments(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);

    if ($method === 'GET') {
        if ($id) {
            $s = $db->prepare("SELECT * FROM departments WHERE id=?"); $s->execute([$id]);
            jsonResponse($s->fetch());
        }
        $rows = $db->query("
            SELECT dept_no, dept_name, section_no, section_name, section_code, color
            FROM departments
            ORDER BY dept_no, section_no, id
        ")->fetchAll();
        jsonResponse(buildDepartmentHierarchy($rows));
    }

    if ($method === 'PUT' && $id) {
        $d = getInput();
        $db->prepare("UPDATE departments SET color=? WHERE id=?")->execute([$d['color'] ?? '#00c9a7', $id]);
        jsonResponse(['success' => true]);
    }
}


// ═══════════════════════════════════════════════════
//  6. STRATEGIC GOALS
// ═══════════════════════════════════════════════════
function handleStrategicGoals(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);
    if ($method === 'GET') {
        $rows = $db->query("SELECT * FROM strategic_goals ORDER BY code")->fetchAll();
        jsonResponse($rows);
    }
}


// ═══════════════════════════════════════════════════
//  7. OPERATIONAL GOALS
// ═══════════════════════════════════════════════════
function handleOpGoals(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);
    if ($method === 'GET') {
        $rows = $db->query("SELECT * FROM operational_goals ORDER BY code")->fetchAll();
        jsonResponse($rows);
    }
}


// ═══════════════════════════════════════════════════
//  8. EARLY WARNING
// ═══════════════════════════════════════════════════
function handleEarlyWarning(): void {
    $db   = getDB();
    ensurePerformanceIndexes($db);
    $year = (int)($_GET['year']    ?? 2026);
    $q    = (int)($_GET['quarter'] ?? 1);
    $hasKpiYearCol = tableHasColumn($db, 'kpis', 'year');

    $sql = "
        SELECT
            k.id AS kpi_id,
            k.code,
            k.name,
            k.description,
            k.owner_dept,
            v.target,
            v.actual,
            ROUND((v.actual - v.target) / v.target * 100, 2) AS deviation_pct,
            CASE
                WHEN (v.actual / v.target) < 0.70 THEN 'high'
                WHEN (v.actual / v.target) < 0.85 THEN 'medium'
                ELSE 'low'
            END AS risk_level,
            w.id AS warning_id,
            w.status AS warning_status,
            dc.id AS deviation_card_id,
            dc.status AS card_status
        FROM kpi_values v
        JOIN kpis k ON k.id = v.kpi_id
        LEFT JOIN early_warning_log w
            ON w.kpi_id = v.kpi_id
           AND w.year = v.year
           AND w.quarter = v.quarter
           AND w.status != 'closed'
        LEFT JOIN deviation_cards dc
            ON dc.kpi_id = v.kpi_id
           AND dc.year = v.year
           AND dc.quarter = v.quarter
        WHERE v.year = ?
          AND v.quarter = ?
          AND k.status = 'active'
          AND v.target > 0
          AND v.actual IS NOT NULL
          AND (v.actual / v.target) < 0.85
    ";
    $params = [$year, $q];
    if ($hasKpiYearCol) {
        $sql .= " AND (k.year = ? OR k.year IS NULL)";
        $params[] = $year;
    }
    $sql .= " ORDER BY deviation_pct ASC, k.code ASC";

    $rows = $db->prepare($sql);
    $rows->execute($params);
    jsonResponse($rows->fetchAll());
}

// ═══════════════════════════════════════════════════
//  9. RESET CONFIG — مسح إعدادات قاعدة البيانات
// ═══════════════════════════════════════════════════
function handleResetConfig(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['error' => 'POST فقط'], 405);
    }
    $configPath = __DIR__ . '/config.php';
    $emptyConfig = "<?php
define('DB_HOST',    'localhost');
define('DB_NAME',    '');
define('DB_USER',    '');
define('DB_PASS',    '');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    throw new PDOException('لم يتم إعداد قاعدة البيانات بعد');
}
if (!function_exists('jsonResponse')) {
function jsonResponse(mixed \$data, int \$status = 200): void {
    http_response_code(\$status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
}
if (!function_exists('getInput')) {
function getInput(): array {
    \$raw = file_get_contents('php://input');
    return json_decode(\$raw, true) ?? \$_POST;
}
}
";
    if (file_put_contents($configPath, $emptyConfig) !== false) {
        jsonResponse(['success' => true, 'message' => '✅ تم مسح إعدادات قاعدة البيانات']);
    } else {
        jsonResponse(['error' => '❌ فشل الكتابة على config.php'], 500);
    }
}

// ═══════════════════════════════════════════════════
//  DELETE FILE — حذف ملف Excel
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
//  LIST FILES — قائمة الملفات المرفوعة
// ═══════════════════════════════════════════════════
function handleListFiles(): void {
    $uploadDir = __DIR__ . '/uploads/';
    $files = [];
    if (is_dir($uploadDir)) {
        foreach (scandir($uploadDir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
            if (!in_array($ext, ['xlsx','xls','csv'])) continue;
            $files[] = [
                'name' => $f,
                'size' => filesize($uploadDir . $f),
                'time' => filemtime($uploadDir . $f),
            ];
        }
        usort($files, fn($a,$b) => $b['time'] - $a['time']);
    }
    jsonResponse(['success' => true, 'files' => $files]);
}

function handleDeleteFile(): void {
    // v4.0 — يحذف فقط بيانات الملف المحدد مع حماية القيم السابقة المدخلة يدويًا
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(['error' => 'POST only'], 405);
    }

    $input       = getInput();
    $filename    = basename($input['filename'] ?? '');
    $deleteData  = (bool)($input['delete_data'] ?? false);

    if (empty($filename)) {
        jsonResponse(['error' => 'اسم الملف مطلوب'], 400);
    }

    // تحقق من الامتداد
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
        jsonResponse(['error' => 'نوع ملف غير مسموح'], 403);
    }

    $uploadDir = __DIR__ . '/uploads/';
    $filePath  = $uploadDir . $filename;

    // إذا لم يُعثر على الملف — جرب البحث بشكل مرن
    if (!file_exists($filePath)) {
        // البحث عن ملف بنفس الامتداد ويحتوي جزءاً من الاسم
        $found = false;
        $files = scandir($uploadDir);
        foreach ($files as $f) {
            if ($f === '.' || $f === '..') continue;
            // مطابقة تامة بعد basename
            if (basename($f) === $filename) {
                $filePath = $uploadDir . $f;
                $filename = $f;
                $found = true;
                break;
            }
        }
        if (!$found) {
            jsonResponse([
                'error'    => 'الملف غير موجود: ' . $filename,
                'searched' => $uploadDir,
                'files'    => array_values(array_filter($files, fn($f) => !in_array($f, ['.','..']))),
            ], 404);
        }
    }

    // ── حذف البيانات من قاعدة البيانات إذا طُلب ─────────
    $deletedValues = 0;
    $restoredValues = 0;
    $affectedPeriods = [];
    if ($deleteData) {
        $db = null;
        try {
            $db = getDB();
            ensureTableColumn($db, 'kpi_values', 'manual_actual', 'DECIMAL(15,4) DEFAULT NULL');
            ensureTableColumn($db, 'kpi_values', 'source_file', 'VARCHAR(255) DEFAULT NULL');
            ensureTableIndex($db, 'kpi_values', 'idx_kpi_values_source_file', ['source_file']);
            ensureKpiFileImportsTable($db);
            $db->beginTransaction();

            $trackedStmt = $db->prepare("SELECT COUNT(*) FROM kpi_file_imports WHERE filename = ?");
            $trackedStmt->execute([$filename]);
            $trackedCount = (int)$trackedStmt->fetchColumn();

            if ($trackedCount > 0) {
                $periodStmt = $db->prepare("
                    SELECT DISTINCT kpi_id, year, quarter
                    FROM kpi_file_imports
                    WHERE filename = ?
                ");
                $periodStmt->execute([$filename]);
                $affectedPeriods = array_map(static fn(array $row): array => [
                    'kpi_id' => (int)$row['kpi_id'],
                    'year' => (int)$row['year'],
                    'quarter' => (int)$row['quarter'],
                ], $periodStmt->fetchAll());

                $deleteTrackedStmt = $db->prepare("DELETE FROM kpi_file_imports WHERE filename = ?");
                $deleteTrackedStmt->execute([$filename]);
                $deletedValues = $deleteTrackedStmt->rowCount();

                foreach ($affectedPeriods as $period) {
                    $rebuilt = rebuildKpiAggregateValue($db, $period['kpi_id'], $period['year'], $period['quarter']);
                    if ($rebuilt['exists'] && $rebuilt['manual_actual'] !== null && $rebuilt['file_count'] === 0) {
                        $restoredValues++;
                    }
                    syncEarlyWarningForValue(
                        $db,
                        $period['kpi_id'],
                        $period['year'],
                        $period['quarter'],
                        $rebuilt['actual'],
                        $rebuilt['target']
                    );
                }
            } else {
                // مسار قديم للتوافق مع الملفات المستوردة قبل دعم تتبع كل ملف بشكل مستقل
                $checkStmt = $db->prepare("
                    SELECT COUNT(*) FROM kpi_values
                    WHERE source_file = ? AND source_file IS NOT NULL AND source_file != ''
                ");
                $checkStmt->execute([$filename]);
                $linkedCount = (int)$checkStmt->fetchColumn();

                if ($linkedCount === 0) {
                    $deletedValues = 0;
                } else {
                    $stmtIds = $db->prepare("
                        SELECT DISTINCT id, kpi_id, year, quarter, target, manual_actual
                        FROM kpi_values
                        WHERE source_file = ? AND source_file IS NOT NULL AND source_file != ''
                    ");
                    $stmtIds->execute([$filename]);
                    $linkedRows = $stmtIds->fetchAll();
                    $affectedPeriods = array_map(static fn(array $row): array => [
                        'kpi_id' => (int)$row['kpi_id'],
                        'year' => (int)$row['year'],
                        'quarter' => (int)$row['quarter'],
                    ], $linkedRows);

                    $stmtRestore = $db->prepare("
                        UPDATE kpi_values
                        SET actual        = manual_actual,
                            status        = CASE
                                WHEN manual_actual IS NULL OR target IS NULL OR target <= 0 THEN 'pending'
                                WHEN manual_actual / target >= 1 THEN 'exceeded'
                                WHEN manual_actual / target >= 0.85 THEN 'achieved'
                                WHEN manual_actual / target >= 0.5 THEN 'partial'
                                ELSE 'not_achieved'
                            END,
                            source_file   = NULL,
                            manual_actual = NULL,
                            updated_at    = NOW()
                        WHERE source_file = ?
                          AND source_file IS NOT NULL
                          AND manual_actual IS NOT NULL
                    ");
                    $stmtRestore->execute([$filename]);
                    $restoredValues = $stmtRestore->rowCount();

                    $stmt = $db->prepare("
                        DELETE FROM kpi_values
                        WHERE source_file = ?
                          AND source_file IS NOT NULL
                          AND source_file != ''
                          AND (manual_actual IS NULL)
                    ");
                    $stmt->execute([$filename]);
                    $deletedValues = $stmt->rowCount() + $restoredValues;

                    $valueStmt = $db->prepare("
                        SELECT actual, target
                        FROM kpi_values
                        WHERE kpi_id = ? AND year = ? AND quarter = ?
                        LIMIT 1
                    ");
                    foreach ($affectedPeriods as $period) {
                        $valueStmt->execute([$period['kpi_id'], $period['year'], $period['quarter']]);
                        $current = $valueStmt->fetch();
                        syncEarlyWarningForValue(
                            $db,
                            $period['kpi_id'],
                            $period['year'],
                            $period['quarter'],
                            $current ? (isset($current['actual']) ? (float)$current['actual'] : null) : null,
                            $current ? (isset($current['target']) ? (float)$current['target'] : null) : null
                        );
                    }
                }
            }

        } catch (Exception $e) {
            if ($db instanceof PDO && $db->inTransaction()) {
                $db->rollBack();
            }
            jsonResponse([
                'error' => 'تعذر حذف البيانات المرتبطة بالملف، لذلك لم يتم حذف الملف حفاظاً على سلامة السجلات',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ── حذف الملف ────────────────────────────────────────
    if (unlink($filePath)) {
        if ($deleteData && isset($db) && $db instanceof PDO && $db->inTransaction()) {
            $db->commit();
        }
        apiInvalidateCache();
        jsonResponse([
            'success'        => true,
            'message'        => 'تم حذف الملف' . ($deleteData ? ' وبياناته المرتبطة دون المساس بالقيم السابقة' : ''),
            'deleted_values' => $deletedValues,
            'restored_values'=> $restoredValues,
            'delete_data'    => $deleteData,
            'api_version'    => 'v4.0',
        ]);
    } else {
        if ($deleteData && isset($db) && $db instanceof PDO && $db->inTransaction()) {
            $db->rollBack();
        }
        jsonResponse(['error' => 'فشل حذف الملف - تحقق من الصلاحيات'], 500);
    }
}

// ── استخراج رموز المؤشرات من الملف ──────────────────────
function extractCodesFromFile(string $filePath, string $ext): array {
    $codes = [];
    try {
        if ($ext === 'csv') {
            $content = file_get_contents($filePath);
            $lines   = explode("\n", $content);
            $headerSkipped = false;
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line)) continue;
                $cols = str_getcsv($line);
                $code = trim($cols[0] ?? '');
                if (!$headerSkipped) { $headerSkipped = true; continue; }
                if ($code && mb_strlen($code) <= 20) {
                    if (preg_match('/^[\w\x{0600}-\x{06FF}]{1,6}[\d\-]+$/u', $code) ||
                        preg_match('/^[A-Z]{2,5}[-_]\d/i', $code)) {
                        $codes[] = $code;
                    }
                }
            }
        } elseif (class_exists('ZipArchive')) {
            $zip = new ZipArchive();
            if ($zip->open($filePath) === true) {
                $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
                $zip->close();
                if ($sheetXml) {
                    $sheetXml = str_replace('xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"', '', $sheetXml);
                    $xml = @simplexml_load_string($sheetXml);
                    if ($xml) {
                        foreach ($xml->sheetData->row as $row) {
                            foreach ($row->c as $cell) {
                                $ref = (string)($cell['r'] ?? '');
                                // العمود B فقط (index 1)
                                if (preg_match('/^B\d+$/', $ref)) {
                                    $t = (string)($cell['t'] ?? '');
                                    $v = $t === 'inlineStr'
                                        ? (string)($cell->is->t ?? '')
                                        : (string)($cell->v ?? '');
                                    $v = trim($v);
                                    if ($v && mb_strlen($v) <= 20) {
                                        if (preg_match('/^[\w\x{0600}-\x{06FF}]{1,6}[\d\-]+$/u', $v) ||
                                            preg_match('/^[A-Z]{2,5}[-_]\d/i', $v)) {
                                            $codes[] = $v;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (Exception $e) {}
    return array_unique($codes);
}

// ═══════════════════════════════════════════════════
//  EMAIL SETTINGS — حفظ/قراءة إعدادات البريد
// ═══════════════════════════════════════════════════
function handleEmailSettings(string $method): void {
    $settingsFile = __DIR__ . '/email_settings.json';
    $logFile      = __DIR__ . '/email_log.json';

    $defaults = [
        'smtp_provider'   => 'gmail',
        'smtp_from'       => '',
        'smtp_pass'       => '',
        'smtp_name'       => 'منصة مِقياس | جمعية الزاد',
        'recipients'      => [],
        'alert_threshold' => 15,
        'alert_enabled'    => true,
        'alert_on_entry'   => true,
        'alert_on_excel'   => true,
        'alert_recipients' => [],
        'weekly_recipients'=> [],
        'weekly_day'      => 0,
        'last_sent'       => null,
    ];

    if ($method === 'GET') {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
        $settings = $defaults;
        if (file_exists($settingsFile)) {
            $saved = json_decode(file_get_contents($settingsFile), true);
            if ($saved) $settings = array_merge($defaults, $saved);
        }
        // أخفِ كلمة المرور الفعلية
        $settings['smtp_pass'] = !empty($settings['smtp_pass']) ? '••••••••••••' : '';

        $log = [];
        if (file_exists($logFile)) {
            $log = json_decode(file_get_contents($logFile), true) ?? [];
            $log = array_slice(array_reverse($log), 0, 10);
        }
        jsonResponse(['settings' => $settings, 'log' => $log]);
    }

    if ($method === 'POST') {
        $d = getInput();

        // قراءة الإعدادات الحالية للحفاظ على كلمة المرور
        $current = $defaults;
        if (file_exists($settingsFile)) {
            $saved = json_decode(file_get_contents($settingsFile), true);
            if ($saved) $current = array_merge($defaults, $saved);
        }

        $smtpFrom = trim($d['smtp_from'] ?? $current['smtp_from']);
        $rawProvider = trim($d['smtp_provider'] ?? $current['smtp_provider'] ?? 'gmail');
        $settings = [
            'smtp_provider'   => normalizeSmtpProvider($rawProvider, $smtpFrom),
            'alert_enabled'    => $d['alert_enabled']    ?? $current['alert_enabled']    ?? true,
            'alert_on_entry'   => $d['alert_on_entry']   ?? $current['alert_on_entry']   ?? true,
            'alert_on_excel'   => $d['alert_on_excel']   ?? $current['alert_on_excel']   ?? true,
            'alert_recipients' => $d['alert_recipients'] ?? $current['alert_recipients'] ?? [],
            'weekly_recipients'=> $d['weekly_recipients']?? $current['weekly_recipients']?? [],
            'smtp_from'       => $smtpFrom,
            'smtp_pass'       => !empty($d['smtp_pass']) && !str_contains($d['smtp_pass'], '•')
                                    ? trim($d['smtp_pass'])
                                    : $current['smtp_pass'],
            'smtp_name'       => trim($d['smtp_name']       ?? $current['smtp_name']),
            'recipients'      => array_values(array_filter(array_map('trim', $d['recipients'] ?? $current['recipients']))),
            'alert_threshold' => (int)($d['alert_threshold'] ?? $current['alert_threshold']),
            'weekly_day'      => (int)($d['weekly_day']      ?? $current['weekly_day']),
            'last_sent'       => $current['last_sent'],
        ];

        $result = safeFilePut($settingsFile, json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        if ($result['ok']) {
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => $result['error']], 500);
        }
    }
}


// ═══════════════════════════════════════════════════
//  SEND EMAIL — إرسال البريد الإلكتروني
// ═══════════════════════════════════════════════════
function handleSendEmail(string $method): void {
    if ($method !== 'POST') { jsonResponse(['error' => 'POST only'], 405); }

    $input = getInput();
    $type  = $input['type'] ?? 'alert'; // test | alert | weekly

    // قراءة إعدادات البريد
    $settingsFile = __DIR__ . '/email_settings.json';
    if (!file_exists($settingsFile)) {
        jsonResponse(['error' => 'لم يتم إعداد البريد الإلكتروني بعد'], 400);
    }
    $settings = json_decode(file_get_contents($settingsFile), true);
    if (empty($settings['smtp_from']) || empty($settings['smtp_pass'])) {
        jsonResponse(['error' => 'يرجى إدخال بريد المُرسِل وكلمة مرور التطبيق'], 400);
    }
    $sendSettings = $settings;

    // تحضير محتوى الإيميل حسب النوع
    try {
        $db = getDB();
        switch ($type) {
            case 'alert_test':
                if (!empty($settings['alert_recipients'])) {
                    $sendSettings = array_merge($sendSettings, ['recipients' => $settings['alert_recipients']]);
                }
                // اختبار نظام الإنذار — يُرسل إيميل نموذج إنذار
                $testAlerts = [[
                    'kpi_id'       => 0,
                    'code'         => 'TEST-01',
                    'name'         => 'مؤشر اختباري — تحقق من عمل نظام الإنذار',
                    'owner_dept'   => 'اختبار النظام',
                    'target'       => 100,
                    'actual'       => 60,
                    'deviation_pct'=> -40,
                ]];
                $subject = '🧪 اختبار نظام الإنذار — منصة مِقياس | جمعية الزاد';
                $body    = buildAlertEmailBody($testAlerts, $sendSettings);
                break;
            case 'test':
                $subject = '✅ اختبار — منصة مِقياس | جمعية الزاد';
                $body    = buildTestEmailBody($sendSettings);
                break;
            case 'weekly':
                // الإيميلات المخصصة للتقرير
                $customRcpts = $input['custom_recipients'] ?? [];
                if (!empty($customRcpts)) {
                    $sendSettings = array_merge($sendSettings, ['recipients' => $customRcpts]);
                } elseif (!empty($settings['weekly_recipients'])) {
                    $sendSettings = array_merge($sendSettings, ['recipients' => $settings['weekly_recipients']]);
                }
                $subject = '📊 التقرير الدوري — منصة مِقياس | جمعية الزاد';
                $body    = buildWeeklyEmailBody($db);
                break;
            default: // alert
                $alerts  = $input['alerts'] ?? [];
                if (!empty($settings['alert_recipients'])) {
                    $sendSettings = array_merge($sendSettings, ['recipients' => $settings['alert_recipients']]);
                }
                $subject = '⚠️ إنذار مبكر — منصة مِقياس | جمعية الزاد';
                $body    = buildAlertEmailBody($alerts, $sendSettings);
        }
    } catch (Exception $e) {
        $subject = '⚠️ إنذار — منصة مِقياس';
        $body    = '<p>حدث خطأ أثناء تحضير التقرير: ' . $e->getMessage() . '</p>';
    }

    if (empty($sendSettings['recipients'])) {
        jsonResponse(['error' => 'يرجى إضافة مستلم واحد على الأقل'], 400);
    }

    // إرسال عبر SMTP (Gmail أو Microsoft)
    $result = sendEmail($sendSettings, $subject, $body);

    // سجّل الإرسال
    logEmail($type, $result['success'] ? 'success' : 'failed', $result['message'] ?? '');

    if ($result['success']) {
        // تحديث last_sent
        $settings['last_sent'] = date('Y-m-d H:i');
        safeFilePut($settingsFile, json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        jsonResponse(['success' => true, 'message' => 'تم إرسال البريد بنجاح']);
    } else {
        jsonResponse(['error' => $result['message']], 500);
    }
}


// ═══════════════════════════════════════════════════
//  SMTP — دالة الإرسال (Gmail + Microsoft)
// ═══════════════════════════════════════════════════
function normalizeSmtpProvider(string $provider, string $from): string {
    $email = strtolower(trim($from));
    if (str_ends_with($email, '@gmail.com') || str_ends_with($email, '@googlemail.com')) {
        return 'gmail';
    }
    if (
        str_ends_with($email, '@outlook.com') ||
        str_ends_with($email, '@hotmail.com') ||
        str_ends_with($email, '@live.com') ||
        str_ends_with($email, '@msn.com')
    ) {
        return 'microsoft';
    }
    return $provider;
}

function sendEmail(array $settings, string $subject, string $body): array {
    $provider   = normalizeSmtpProvider($settings['smtp_provider'] ?? 'gmail', $settings['smtp_from'] ?? '');
    $from       = $settings['smtp_from'];
    $pass       = $settings['smtp_pass'];
    $fromName   = $settings['smtp_name'] ?? 'منصة مِقياس';
    $recipients = $settings['recipients'];
    $eol        = "\r\n";

    // إعدادات السيرفر حسب المزود
    if ($provider === 'microsoft') {
        $smtpHost = 'smtp.office365.com';
        $smtpPort = 587;
        $useTLS   = true;
    } else {
        // Gmail (افتراضي)
        $smtpHost = 'smtp.gmail.com';
        $smtpPort = 465;
        $useTLS   = false; // SSL مباشرة
    }

    try {
        if ($useTLS) {
            // TLS (STARTTLS) — للـ Office365 على port 587
            $socket = fsockopen($smtpHost, $smtpPort, $errno, $errstr, 30);
        } else {
            // SSL مباشر — للـ Gmail على port 465
            $socket = fsockopen('ssl://' . $smtpHost, $smtpPort, $errno, $errstr, 30);
        }
        if (!$socket) throw new Exception("فشل الاتصال بـ $smtpHost: $errstr ($errno)");

        $read = fgets($socket, 515);
        if (substr($read, 0, 3) !== '220') throw new Exception("استجابة خاطئة: $read");

        // EHLO
        fputs($socket, "EHLO miqyas.platform{$eol}");
        $ehloResp = '';
        while ($line = fgets($socket, 515)) {
            $ehloResp .= $line;
            if ($line[3] === ' ') break;
        }

        // STARTTLS للـ Office365
        if ($useTLS) {
            fputs($socket, "STARTTLS{$eol}");
            $tlsResp = fgets($socket, 515);
            if (substr($tlsResp, 0, 3) !== '220') throw new Exception("فشل STARTTLS: $tlsResp");
            // ترقية الاتصال إلى TLS
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            // EHLO مرة أخرى بعد TLS
            fputs($socket, "EHLO miqyas.platform{$eol}");
            while ($line = fgets($socket, 515)) { if ($line[3] === ' ') break; }
        }

        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN{$eol}");
        fgets($socket, 515);
        fputs($socket, base64_encode($from) . $eol);
        fgets($socket, 515);
        fputs($socket, base64_encode($pass) . $eol);
        $authResp = fgets($socket, 515);
        if (substr($authResp, 0, 3) !== '235') {
            fclose($socket);
            $hint = $provider === 'microsoft'
                ? 'تحقق من كلمة مرور حساب Microsoft أو App Password إذا كان MFA مُفعَّلاً'
                : 'تحقق من App Password في إعدادات Google';
            throw new Exception("فشل المصادقة — $hint");
        }

        // MAIL FROM
        fputs($socket, "MAIL FROM:<{$from}>{$eol}");
        fgets($socket, 515);

        // RCPT TO
        foreach ($recipients as $to) {
            fputs($socket, "RCPT TO:<{$to}>{$eol}");
            fgets($socket, 515);
        }

        // DATA
        fputs($socket, "DATA{$eol}");
        fgets($socket, 515);

        $toList         = implode(', ', $recipients);
        $date           = date('r');
        $msgId          = '<' . time() . '@miqyas.platform>';
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encodedFrom    = '=?UTF-8?B?' . base64_encode($fromName) . '?=';

        $message  = "Date: {$date}{$eol}";
        $message .= "From: {$encodedFrom} <{$from}>{$eol}";
        $message .= "To: {$toList}{$eol}";
        $message .= "Subject: {$encodedSubject}{$eol}";
        $message .= "Message-ID: {$msgId}{$eol}";
        $message .= "MIME-Version: 1.0{$eol}";
        $message .= "Content-Type: text/html; charset=UTF-8{$eol}";
        $message .= "Content-Transfer-Encoding: base64{$eol}{$eol}";
        $message .= chunk_split(base64_encode($body));
        $message .= "{$eol}.{$eol}";

        fputs($socket, $message);
        $dataResp = fgets($socket, 515);

        fputs($socket, "QUIT{$eol}");
        fclose($socket);

        if (substr($dataResp, 0, 3) === '250') {
            return ['success' => true, 'message' => 'تم الإرسال لـ ' . count($recipients) . ' مستلم عبر ' . ($provider === 'microsoft' ? 'Microsoft' : 'Gmail')];
        }
        throw new Exception("فشل إرسال البيانات: $dataResp");

    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}


// ═══════════════════════════════════════════════════
//  EMAIL BODY BUILDERS
// ═══════════════════════════════════════════════════
function buildEmailLayout(
    string $badge,
    string $title,
    string $subtitle,
    string $intro,
    string $summaryHtml,
    string $bodyHtml,
    string $actionsHtml = '',
    string $accent = '#8b1a3a'
): string {
    $baseUrl = siteBaseUrl();

    return "<!DOCTYPE html><html dir='rtl' lang='ar'><head><meta charset='UTF-8'></head>"
        . "<body style='margin:0;padding:24px;background:#eef2f7;font-family:Tahoma,Arial,sans-serif;color:#1f2937'>"
        . "<div style='max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ee;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08)'>"
        . "<div style='background:linear-gradient(135deg,{$accent} 0%,#5b1024 100%);padding:26px 30px;color:#fff'>"
        . "<table style='width:100%;border-collapse:collapse'><tr>"
        . "<td style='vertical-align:top'>"
        . "<div style='display:inline-block;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.22);padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-bottom:14px'>{$badge}</div>"
        . "<h1 style='margin:0;font-size:28px;line-height:1.4;font-weight:800'>{$title}</h1>"
        . "<p style='margin:10px 0 0;color:rgba(255,255,255,.88);font-size:14px;line-height:1.8'>{$subtitle}</p>"
        . "</td>"
        . "<td style='width:160px;vertical-align:top;text-align:left'>"
        . "<div style='background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px'>"
        . "<p style='margin:0 0 6px;font-size:12px;color:rgba(255,255,255,.78)'>الجهة</p>"
        . "<p style='margin:0;font-size:15px;font-weight:800;color:#fff'>جمعية الزاد</p>"
        . "<p style='margin:10px 0 6px;font-size:12px;color:rgba(255,255,255,.78)'>النظام</p>"
        . "<p style='margin:0;font-size:14px;font-weight:700;color:#fff'>منصة مِقياس</p>"
        . "</div>"
        . "</td>"
        . "</tr></table>"
        . "</div>"
        . "<div style='padding:30px'>"
        . "<div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:22px'>"
        . "<p style='margin:0 0 12px;font-size:14px;font-weight:800;color:#334155'>السلام عليكم ورحمة الله وبركاته،</p>"
        . "<p style='margin:0;font-size:14px;line-height:2;color:#475569'>{$intro}</p>"
        . "</div>"
        . $summaryHtml
        . $bodyHtml
        . ($actionsHtml !== '' ? "<div style='margin-top:24px;text-align:center'>{$actionsHtml}</div>" : '')
        . "<div style='margin-top:26px;padding:18px 20px;background:#fffaf0;border:1px solid #f4e1b7;border-radius:14px'>"
        . "<p style='margin:0 0 8px;font-size:13px;font-weight:800;color:#7c5c00'>ملاحظة تنظيمية</p>"
        . "<p style='margin:0;font-size:13px;line-height:1.9;color:#6b7280'>هذه الرسالة صادرة آلياً من منصة مِقياس لمتابعة الأداء المؤسسي. عند الحاجة إلى استكمال الإجراء أو المراجعة، يرجى الدخول إلى النظام ومتابعة تفاصيل المؤشر أو التقرير من خلال الروابط المعتمدة.</p>"
        . "</div>"
        . "</div>"
        . "<div style='background:#0f172a;padding:18px 24px;text-align:center'>"
        . "<p style='margin:0;font-size:12px;color:#cbd5e1'>منصة مِقياس للأداء المؤسسي - جمعية الزاد</p>"
        . "<p style='margin:6px 0 0;font-size:11px;color:#94a3b8'>رابط النظام: <a href='{$baseUrl}/index.php' style='color:#f8d57e;text-decoration:none'>فتح المنصة</a></p>"
        . "</div>"
        . "</div></body></html>";
}

function buildMetricCards(array $items): string {
    $cards = '';
    foreach ($items as $item) {
        $label = $item['label'] ?? '';
        $value = $item['value'] ?? '';
        $color = $item['color'] ?? '#8b1a3a';
        $cards .= "<td style='padding:0 6px 12px'>"
            . "<div style='background:#ffffff;border:1px solid #e2e8f0;border-top:4px solid {$color};border-radius:14px;padding:16px 14px;height:100%'>"
            . "<p style='margin:0 0 8px;font-size:12px;color:#64748b'>{$label}</p>"
            . "<p style='margin:0;font-size:24px;font-weight:800;color:#0f172a'>{$value}</p>"
            . "</div></td>";
    }
    return "<table style='width:100%;border-collapse:collapse;margin-bottom:22px'><tr>{$cards}</tr></table>";
}

function buildTestEmailBody(array $settings): string {
    $time  = date('Y/m/d H:i');
    $from  = htmlspecialchars((string)($settings['smtp_from'] ?? ''), ENT_QUOTES, 'UTF-8');
    $count = count($settings['recipients'] ?? []);
    $rcpts = array_map(
        static fn($email) => '<li style="margin:0 0 6px">' . htmlspecialchars((string)$email, ENT_QUOTES, 'UTF-8') . '</li>',
        $settings['recipients'] ?? []
    );

    $summary = buildMetricCards([
        ['label' => 'نوع الإشعار', 'value' => 'بريد تجريبي', 'color' => '#8b1a3a'],
        ['label' => 'عدد المستلمين', 'value' => $count, 'color' => '#0f766e'],
        ['label' => 'وقت الإرسال', 'value' => $time, 'color' => '#d97706'],
    ]);

    $body = "<div style='margin-bottom:22px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>بيانات التهيئة الحالية</h2>"
        . "<table style='width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden'>"
        . "<tr style='background:#f8fafc'><td style='padding:12px 14px;color:#64748b;width:180px'>بريد المُرسِل</td><td style='padding:12px 14px;font-weight:700;color:#111827'>{$from}</td></tr>"
        . "<tr><td style='padding:12px 14px;color:#64748b;border-top:1px solid #e5e7eb'>اسم المُرسِل</td><td style='padding:12px 14px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb'>"
        . htmlspecialchars((string)($settings['smtp_name'] ?? 'منصة مِقياس | جمعية الزاد'), ENT_QUOTES, 'UTF-8')
        . "</td></tr>"
        . "<tr style='background:#f8fafc'><td style='padding:12px 14px;color:#64748b;border-top:1px solid #e5e7eb'>حد الإنذار</td><td style='padding:12px 14px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb'>"
        . (int)($settings['alert_threshold'] ?? 15) . "%</td></tr>"
        . "</table></div>"
        . "<div style='margin-bottom:22px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>المستلمون المعتمدون</h2>"
        . "<div style='background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:16px 20px'>"
        . "<ul style='margin:0;padding-right:18px;font-size:14px;color:#475569;line-height:1.9'>" . implode('', $rcpts) . "</ul>"
        . "</div></div>"
        . "<div style='margin-bottom:10px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>الغرض من هذه الرسالة</h2>"
        . "<div style='background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px'>"
        . "<p style='margin:0 0 10px;font-size:14px;line-height:1.9;color:#475569'>تهدف هذه الرسالة إلى التحقق من سلامة إعدادات الإرسال المعتمدة في النظام، والتأكد من جاهزية استقبال الإشعارات التشغيلية والتنبيهات الدورية على البريد المحدد.</p>"
        . "<p style='margin:0;font-size:14px;line-height:1.9;color:#475569'>عند نجاح هذا الاختبار، يصبح النظام مهيأً لإرسال رسائل الإنذار المبكر والتقارير الدورية وفق الإعدادات المعتمدة في لوحة الإدارة.</p>"
        . "</div></div>";

    $actions = "<a href='" . siteBaseUrl() . "/dashboard.php?tab=email' style='display:inline-block;background:#8b1a3a;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:800'>مراجعة إعدادات البريد الإلكتروني</a>";

    return buildEmailLayout(
        'إشعار نظامي آلي',
        'إفادة باكتمال اختبار البريد الإلكتروني',
        "تأكيد فني على نجاح اختبار قناة الإرسال المعتمدة في منصة مِقياس بتاريخ {$time}.",
        'نفيدكم بأنه تم تنفيذ اختبار فني على قناة البريد الإلكتروني المرتبطة بمنصة مِقياس، وقد أُرسلت هذه الرسالة للتحقق من سلامة التهيئة واعتماد بيانات الإرسال والمستلمين.',
        $summary,
        $body,
        $actions,
        '#8b1a3a'
    );
}

function buildAlertEmailBody(array $alerts, array $settings): string {
    $threshold = (int)($settings['alert_threshold'] ?? 15);
    $time      = date('Y/m/d H:i');
    $count     = count($alerts);
    $baseUrl   = siteBaseUrl();

    $rows = '';
    foreach ($alerts as $a) {
        $dev = isset($a['deviation_pct']) ? round((float)$a['deviation_pct'], 1) : 0;
        $devAbs = abs($dev);
        $color = $devAbs > 30 ? '#b91c1c' : ($devAbs > 15 ? '#b45309' : '#0f766e');
        $risk = $devAbs > 30 ? 'مرتفع' : ($devAbs > 15 ? 'متوسط' : 'محدود');
        $owner = htmlspecialchars((string)($a['owner_dept'] ?? 'غير محدد'), ENT_QUOTES, 'UTF-8');
        $rows .= "<tr>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;font-weight:800;color:#111827'>" . htmlspecialchars((string)($a['code'] ?? '—'), ENT_QUOTES, 'UTF-8') . "</td>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;color:#374151;line-height:1.8'>" . htmlspecialchars((string)($a['name'] ?? '—'), ENT_QUOTES, 'UTF-8') . "</td>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;color:#374151'>" . $owner . "</td>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#111827'>" . htmlspecialchars((string)($a['target'] ?? '—'), ENT_QUOTES, 'UTF-8') . "</td>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:800;color:{$color}'>" . htmlspecialchars((string)($a['actual'] ?? '—'), ENT_QUOTES, 'UTF-8') . "</td>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:800;color:{$color}'>{$dev}%</td>"
            . "<td style='padding:11px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:{$color};font-weight:700'>{$risk}</td>"
            . "</tr>";
    }

    $summary = buildMetricCards([
        ['label' => 'نوع الإشعار', 'value' => 'إنذار مبكر', 'color' => '#991b1b'],
        ['label' => 'عدد المؤشرات', 'value' => $count, 'color' => '#8b1a3a'],
        ['label' => 'حد الإنذار المعتمد', 'value' => $threshold . '%', 'color' => '#d97706'],
        ['label' => 'وقت الرصد', 'value' => $time, 'color' => '#0f766e'],
    ]);

    $body = "<div style='margin-bottom:22px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>ملخص الحالة</h2>"
        . "<div style='background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px'>"
        . "<p style='margin:0;font-size:14px;line-height:2;color:#7c2d12'>تم رصد مؤشرات أداء انخفضت نتائجها الفعلية عن المستهدف المعتمد بما يتجاوز حد الإنذار المبكر المقرر في النظام. ويوصى بمراجعة العناصر الواردة أدناه واتخاذ الإجراء التصحيحي المناسب وفق الجهة المالكة لكل مؤشر.</p>"
        . "</div></div>"
        . "<div style='margin-bottom:22px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>تفاصيل المؤشرات المتأثرة</h2>"
        . "<table style='width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden'>"
        . "<thead><tr style='background:#f8fafc'>"
        . "<th style='padding:11px 12px;text-align:right;color:#64748b'>الرمز</th>"
        . "<th style='padding:11px 12px;text-align:right;color:#64748b'>المؤشر</th>"
        . "<th style='padding:11px 12px;text-align:right;color:#64748b'>الجهة المالكة</th>"
        . "<th style='padding:11px 12px;text-align:center;color:#64748b'>المستهدف</th>"
        . "<th style='padding:11px 12px;text-align:center;color:#64748b'>الفعلي</th>"
        . "<th style='padding:11px 12px;text-align:center;color:#64748b'>الانحراف</th>"
        . "<th style='padding:11px 12px;text-align:center;color:#64748b'>التقدير</th>"
        . "</tr></thead><tbody>{$rows}</tbody></table></div>"
        . "<div style='margin-bottom:8px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>الإجراء المقترح</h2>"
        . "<div style='background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:16px 18px'>"
        . "<ol style='margin:0;padding-right:18px;font-size:14px;line-height:2;color:#475569'>"
        . "<li>مراجعة سبب الانحراف مقارنة بالمستهدف المعتمد للفترة الحالية.</li>"
        . "<li>إسناد مسؤولية المعالجة للجهة المالكة للمؤشر وتحديد الإجراء التصحيحي.</li>"
        . "<li>تحديث بطاقة الانحراف أو بيانات المتابعة في النظام فور اعتماد المعالجة.</li>"
        . "</ol>"
        . "</div></div>";

    $actions = "<a href='{$baseUrl}/deviation.php' style='display:inline-block;background:#8b1a3a;color:#ffffff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:800;margin-left:8px'>فتح بطاقات الانحراف</a>"
        . "<a href='{$baseUrl}/index.php' style='display:inline-block;background:#ffffff;color:#8b1a3a;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:800;border:1px solid #8b1a3a'>فتح لوحة الأداء</a>";

    return buildEmailLayout(
        'تنبيه تشغيلي عاجل',
        'إشعار إنذار مبكر بشأن انحراف مؤشر أداء',
        "تم إصدار هذا الإشعار آلياً من منصة مِقياس بتاريخ {$time} استناداً إلى حد الإنذار المعتمد في النظام.",
        'نفيدكم برصد حالة انحراف في واحد أو أكثر من مؤشرات الأداء المؤسسي عن المستهدف المعتمد، بما يستدعي الاطلاع والمراجعة واتخاذ الإجراء المناسب حسب الصلاحيات والإجراءات الداخلية المعتمدة.',
        $summary,
        $body,
        $actions,
        '#991b1b'
    );
}

function buildWeeklyEmailBody(PDO $db): string {
    $year    = 2026;
    $quarter = 1;
    $date    = date('l، d F Y');
    $dateAr  = date('Y/m/d');

    // ── إحصائيات عامة ─────────────────────────────
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status='exceeded'    THEN 1 ELSE 0 END) as exceeded,
            SUM(CASE WHEN status='achieved'    THEN 1 ELSE 0 END) as achieved,
            SUM(CASE WHEN status='partial'     THEN 1 ELSE 0 END) as partial,
            SUM(CASE WHEN status='not_achieved' THEN 1 ELSE 0 END) as not_achieved,
            SUM(CASE WHEN actual IS NULL        THEN 1 ELSE 0 END) as pending
        FROM kpi_values WHERE year=? AND quarter=?
    ");
    $stmt->execute([$year, $quarter]);
    $s = $stmt->fetch() ?: ['total'=>77,'exceeded'=>0,'achieved'=>0,'partial'=>0,'not_achieved'=>0,'pending'=>77];

    $done    = (int)$s['exceeded'] + (int)$s['achieved'];
    $total   = max((int)$s['total'], 1);
    $pct     = round($done / $total * 100);
    $barW    = $pct;
    $barCol  = $pct >= 85 ? '#16a34a' : ($pct >= 60 ? '#d97706' : '#dc2626');

    // ── أداء المحاور الأربعة ───────────────────────
    $axisStmt = $db->prepare("
        SELECT SUBSTRING(k.goal_code,1,1) as axis,
               COUNT(*) as total,
               AVG(CASE WHEN v.target>0 AND v.actual IS NOT NULL
                   THEN LEAST(v.actual/v.target,1.5)*100 ELSE NULL END) as avg_pct
        FROM kpis k LEFT JOIN kpi_values v ON v.kpi_id=k.id AND v.year=? AND v.quarter=?
        WHERE k.type='strategic' AND k.status='active'
        GROUP BY axis ORDER BY axis
    ");
    $axisStmt->execute([$year, $quarter]);
    $axes = $axisStmt->fetchAll();

    $axisNames = ['ع'=>'محور العملاء','م'=>'المحور المالي','د'=>'العمليات الداخلية','ن'=>'التعلم والنمو'];
    $axisColors= ['ع'=>'#00c9a7','م'=>'#f4a535','د'=>'#00b4d8','ن'=>'#a78bfa'];
    $axisRows  = '';
    foreach ($axes as $ax) {
        $key   = $ax['axis'] ?? '';
        $name  = $axisNames[$key] ?? $key;
        $color = $axisColors[$key] ?? '#94a3b8';
        $p     = round((float)($ax['avg_pct'] ?? 0));
        $bw    = min($p, 100);
        $axisRows .= "<tr>"
            . "<td style='padding:10px 12px;font-weight:700;color:{$color}'>{$name}</td>"
            . "<td style='padding:10px 12px;text-align:center;color:#1e293b'>{$ax['total']}</td>"
            . "<td style='padding:10px 12px'><div style='background:#e2e8f0;border-radius:99px;height:8px;overflow:hidden'>"
            . "<div style='background:{$color};width:{$bw}%;height:100%;border-radius:99px'></div></div></td>"
            . "<td style='padding:10px 12px;text-align:center;font-weight:700;color:{$color}'>{$p}%</td>"
            . "</tr>";
    }

    // ── أكثر 5 مؤشرات انحرافاً ────────────────────
    $alertStmt = $db->prepare("
        SELECT k.code, k.name, v.target, v.actual,
               ROUND((v.actual-v.target)/v.target*100,1) as dev
        FROM kpi_values v JOIN kpis k ON k.id=v.kpi_id
        WHERE v.year=? AND v.quarter=? AND v.target>0 AND v.actual IS NOT NULL
          AND v.actual/v.target < 0.85
        ORDER BY v.actual/v.target ASC LIMIT 5
    ");
    $alertStmt->execute([$year, $quarter]);
    $alertData = $alertStmt->fetchAll();

    $alertSection = '';
    if (!empty($alertData)) {
        $aRows = '';
        foreach ($alertData as $a) {
            $dev   = (float)$a['dev'];
            $col   = $dev < -30 ? '#b91c1c' : '#b45309';
            $aRows .= "<tr style='border-bottom:1px solid #f1f5f9'>"
                . "<td style='padding:10px 12px;font-weight:800;color:#111827'>" . htmlspecialchars((string)$a['code'], ENT_QUOTES, 'UTF-8') . "</td>"
                . "<td style='padding:10px 12px;color:#475569;font-size:13px'>" . htmlspecialchars(mb_substr((string)$a['name'], 0, 40), ENT_QUOTES, 'UTF-8') . "</td>"
                . "<td style='padding:10px 12px;text-align:center;color:#111827'>" . number_format((float)$a['target'], 0) . "</td>"
                . "<td style='padding:10px 12px;text-align:center;font-weight:800;color:{$col}'>" . number_format((float)$a['actual'], 0) . "</td>"
                . "<td style='padding:10px 12px;text-align:center;font-weight:800;color:{$col}'>{$dev}%</td>"
                . "</tr>";
        }
        $alertSection = "<div style='margin-bottom:24px'>"
            . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>المؤشرات ذات الأولوية في المتابعة</h2>"
            . "<table style='width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden'>"
            . "<thead><tr style='background:#f8fafc'>"
            . "<th style='padding:10px 12px;text-align:right;color:#64748b'>الرمز</th>"
            . "<th style='padding:10px 12px;text-align:right;color:#64748b'>المؤشر</th>"
            . "<th style='padding:10px 12px;text-align:center;color:#64748b'>المستهدف</th>"
            . "<th style='padding:10px 12px;text-align:center;color:#64748b'>الفعلي</th>"
            . "<th style='padding:10px 12px;text-align:center;color:#64748b'>الانحراف</th>"
            . "</tr></thead><tbody>{$aRows}</tbody></table></div>";
    } else {
        $alertSection = "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px 18px;margin-bottom:24px'>"
            . "<p style='margin:0;font-size:14px;font-weight:700;color:#166534'>لا توجد مؤشرات تجاوزت حد الانحراف المسموح خلال الفترة محل التقرير.</p></div>";
    }

    $summary = buildMetricCards([
        ['label' => 'الفترة', 'value' => 'الربع الأول 2026', 'color' => '#8b1a3a'],
        ['label' => 'نسبة الإنجاز العامة', 'value' => $pct . '%', 'color' => $barCol],
        ['label' => 'إجمالي المؤشرات', 'value' => (int)$s['total'], 'color' => '#0f766e'],
        ['label' => 'تاريخ التقرير', 'value' => $dateAr, 'color' => '#d97706'],
    ]);

    $body = "<div style='margin-bottom:22px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>ملخص تنفيذي</h2>"
        . "<div style='background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px'>"
        . "<p style='margin:0 0 12px;font-size:14px;line-height:2;color:#475569'>يعرض هذا التقرير ملخصاً دورياً لحالة مؤشرات الأداء خلال الفترة المحددة، ويتضمن نسبة الإنجاز العامة، توزيع الحالات، وأبرز المؤشرات التي تحتاج إلى متابعة أو معالجة من الجهات ذات العلاقة.</p>"
        . "<div style='background:#e2e8f0;border-radius:999px;height:12px;overflow:hidden;margin-top:14px'>"
        . "<div style='background:{$barCol};width:{$barW}%;height:100%;border-radius:999px'></div></div>"
        . "</div></div>"
        . buildMetricCards([
            ['label' => 'متجاوز للمستهدف', 'value' => (int)$s['exceeded'], 'color' => '#15803d'],
            ['label' => 'متحقق', 'value' => (int)$s['achieved'], 'color' => '#16a34a'],
            ['label' => 'جزئي', 'value' => (int)$s['partial'], 'color' => '#d97706'],
            ['label' => 'غير متحقق', 'value' => (int)$s['not_achieved'], 'color' => '#dc2626'],
        ])
        . "<div style='margin-bottom:24px'>"
        . "<h2 style='margin:0 0 12px;font-size:17px;color:#111827'>أداء المحاور الاستراتيجية</h2>"
        . "<table style='width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden'>"
        . "<thead><tr style='background:#f8fafc'>"
        . "<th style='padding:10px 12px;text-align:right;color:#64748b'>المحور</th>"
        . "<th style='padding:10px 12px;text-align:center;color:#64748b'>عدد المؤشرات</th>"
        . "<th style='padding:10px 12px;text-align:right;color:#64748b'>الإنجاز</th>"
        . "<th style='padding:10px 12px;text-align:center;color:#64748b'>النسبة</th>"
        . "</tr></thead><tbody>{$axisRows}</tbody></table></div>"
        . $alertSection;

    $actions = "<a href='" . siteBaseUrl() . "/index.php' style='display:inline-block;background:#8b1a3a;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:800'>فتح لوحة الأداء الكاملة</a>";

    return buildEmailLayout(
        'تقرير دوري آلي',
        'التقرير الدوري لمؤشرات الأداء المؤسسي',
        "تقرير أداء صادر من منصة مِقياس للفترة: الربع الأول 2026 - {$date}",
        'نرفق لكم التقرير الدوري المعتمد لمؤشرات الأداء المؤسسي، وذلك لتمكين القيادات والجهات المالكة من متابعة حالة الأداء، ورصد المؤشرات المتطلبة للمعالجة، والاطلاع على مستوى الإنجاز العام خلال الفترة الحالية.',
        $summary,
        $body,
        $actions,
        '#0f172a'
    );
}

function logEmail(string $type, string $status, string $message): void {
    $logFile = __DIR__ . '/email_log.json';
    $log = [];
    if (file_exists($logFile)) {
        $log = json_decode(file_get_contents($logFile), true) ?? [];
    }
    $log[] = [
        'type'    => $type === 'test' ? '🧪 تجريبي' : ($type === 'weekly' ? '📊 أسبوعي' : '⚠️ إنذار مبكر'),
        'status'  => $status,
        'message' => $message,
        'sent_at' => date('Y/m/d H:i'),
    ];
    // احتفظ بآخر 50 سجل فقط
    if (count($log) > 50) $log = array_slice($log, -50);
    safeFilePut($logFile, json_encode($log, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}


// ═══════════════════════════════════════════════════
//  DEVIATION CARDS — بطاقات الانحراف
// ═══════════════════════════════════════════════════
function handleDeviationCards(string $method, ?int $id): void {
    $db   = getDB();
    ensurePerformanceIndexes($db);
    $year = (int)($_GET['year'] ?? 2026);
    // quarter: إذا فارغ أو غير موجود = كل الأرباع
    $qRaw = $_GET['quarter'] ?? '';
    $q    = ($qRaw !== '' && $qRaw !== null) ? (int)$qRaw : null;

    if ($method === 'GET') {
        if ($id) {
            $s = $db->prepare("
                SELECT dc.*, k.code as kpi_code, k.name as kpi_name, k.description as kpi_description, k.unit
                FROM deviation_cards dc
                JOIN kpis k ON k.id = dc.kpi_id
                WHERE dc.id = ?
            ");
            $s->execute([$id]);
            jsonResponse($s->fetch() ?: ['error' => 'غير موجود']);
        }
        // قائمة مع فلتر — quarter اختياري
        $status = $_GET['status'] ?? null;
        $sql    = "SELECT dc.*, k.code as kpi_code, k.name as kpi_name, k.description as kpi_description, k.unit
                   FROM deviation_cards dc
                   JOIN kpis k ON k.id = dc.kpi_id
                   WHERE dc.year = ?";
        $params = [$year];
        if ($q !== null)  { $sql .= " AND dc.quarter = ?"; $params[] = $q; }
        if ($status)      { $sql .= " AND dc.status = ?";  $params[] = $status; }
        $sql .= " ORDER BY dc.quarter ASC, ABS(dc.deviation_pct) DESC";
        $s = $db->prepare($sql); $s->execute($params);
        jsonResponse($s->fetchAll());
    }

    if ($method === 'POST') {
        $d = getInput();
        $kpiId  = (int)($d['kpi_id']  ?? 0);
        $yr     = (int)($d['year']    ?? 2026);
        $qtr    = (int)($d['quarter'] ?? 1);
        if (!$kpiId) jsonResponse(['error' => 'kpi_id مطلوب'], 400);

        // احسب الانحراف من kpi_values
        $vStmt = $db->prepare("SELECT actual, target FROM kpi_values WHERE kpi_id=? AND year=? AND quarter=?");
        $vStmt->execute([$kpiId, $yr, $qtr]);
        $val   = $vStmt->fetch();
        $dev   = ($val && $val['target'] > 0 && $val['actual'] !== null)
                 ? round(($val['actual'] - $val['target']) / $val['target'] * 100, 2)
                 : (float)($d['deviation_pct'] ?? 0);

        $stmt = $db->prepare("
            INSERT INTO deviation_cards
                (kpi_id, year, quarter, deviation_pct, actual, target,
                 reason, action, impact, responsible, due_date, status,
                 risk_level, improvement_value, improvement_pct, remeasure_date)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                deviation_pct     = VALUES(deviation_pct),
                actual            = VALUES(actual),
                target            = VALUES(target),
                reason            = VALUES(reason),
                action            = VALUES(action),
                impact            = VALUES(impact),
                responsible       = VALUES(responsible),
                due_date          = VALUES(due_date),
                status            = VALUES(status),
                risk_level        = VALUES(risk_level),
                improvement_value = VALUES(improvement_value),
                improvement_pct   = VALUES(improvement_pct),
                remeasure_date    = VALUES(remeasure_date)
        ");
        $stmt->execute([
            $kpiId, $yr, $qtr, $dev,
            $val['actual']        ?? $d['actual']            ?? null,
            $val['target']        ?? $d['target']            ?? null,
            $d['reason']          ?? '',
            $d['action']          ?? '',
            $d['impact']          ?? null,
            $d['responsible']     ?? '',
            !empty($d['due_date'])       ? $d['due_date']       : null,
            $d['status']          ?? 'open',
            !empty($d['risk_level'])     ? $d['risk_level']     : null,
            !empty($d['improvement_value']) ? (float)$d['improvement_value'] : null,
            !empty($d['improvement_pct'])   ? (float)$d['improvement_pct']   : null,
            !empty($d['remeasure_date'])    ? $d['remeasure_date']            : null,
        ]);
        $insertId = $db->lastInsertId() ?: null;
        jsonResponse(['success' => true, 'id' => $insertId, 'deviation_pct' => $dev]);
    }

    if ($method === 'PUT' && $id) {
        $d = getInput();
        $fields = [];
        $params = [];
        foreach (['reason','action','impact','responsible','due_date','status','closed_by',
                  'risk_level','improvement_value','improvement_pct','remeasure_date'] as $f) {
            if (isset($d[$f])) { $fields[] = "{$f}=?"; $params[] = $d[$f]; }
        }
        if (($d['status'] ?? '') === 'closed') {
            $fields[] = 'closed_at=NOW()';
        }
        if (empty($fields)) jsonResponse(['error' => 'لا يوجد بيانات للتحديث'], 400);
        $params[] = $id;
        $db->prepare("UPDATE deviation_cards SET " . implode(', ', $fields) . " WHERE id=?")->execute($params);
        jsonResponse(['success' => true]);
    }

    if ($method === 'DELETE' && $id) {
        $db->prepare("DELETE FROM deviation_cards WHERE id=?")->execute([$id]);
        jsonResponse(['success' => true]);
    }
}

// ═══════════════════════════════════════════════════
//  GOVERNANCE — الحوكمة
// ═══════════════════════════════════════════════════
function handleGovernance(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);

    if ($method === 'GET') {
        if ($id) {
            $s = $db->prepare("SELECT * FROM governance_items WHERE id=?");
            $s->execute([$id]); jsonResponse($s->fetch() ?: ['error'=>'غير موجود']);
        }
        $cat   = $_GET['category'] ?? null;
        $year  = (int)($_GET['year']    ?? 2026);
        $q     = (int)($_GET['quarter'] ?? 0);
        $sql   = "SELECT * FROM governance_items WHERE 1=1";
        $params = [];
        if ($cat) { $sql .= " AND category=?"; $params[] = $cat; }
        // year/quarter filters — آمن حتى لو الأعمدة غير موجودة
        $hasYearCol = tableHasColumn($db, 'governance_items', 'year');
        if ($hasYearCol && $year) { $sql .= " AND (year=? OR year IS NULL)"; $params[] = $year; }
        if ($hasYearCol && $q)    { $sql .= " AND (quarter=? OR quarter IS NULL)"; $params[] = $q; }
        $sql .= " ORDER BY code";
        $s = $db->prepare($sql); $s->execute($params);
        $items = $s->fetchAll();

        // احسب الإجمالي
        $total     = count($items);
        $compliant = count(array_filter($items, fn($i) => $i['status'] === 'compliant'));
        $avgPct    = $total > 0 ? round(array_sum(array_column($items,'compliance_pct')) / $total, 1) : 0;

        jsonResponse([
            'items'       => $items,
            'summary'     => ['total'=>$total,'compliant'=>$compliant,'avg_pct'=>$avgPct],
        ]);
    }

    if ($method === 'POST') {
        $d = getInput();
        if (empty($d['name']) || empty($d['code'])) jsonResponse(['error'=>'code و name مطلوبان'], 400);
        $stmt = $db->prepare("
            INSERT INTO governance_items (code,category,name,description,owner,status,compliance_pct,last_reviewed,next_review)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                name=VALUES(name), description=VALUES(description),
                owner=VALUES(owner), status=VALUES(status),
                compliance_pct=VALUES(compliance_pct)
        ");
        $stmt->execute([
            $d['code'], $d['category']??'compliance', $d['name'], $d['description']??'',
            $d['owner']??'', $d['status']??'pending', $d['compliance_pct']??0,
            $d['last_reviewed']??null, $d['next_review']??null,
        ]);
        jsonResponse(['success'=>true, 'id'=>$db->lastInsertId()]);
    }

    if ($method === 'PUT' && $id) {
        $d = getInput();
        $db->prepare("
            UPDATE governance_items SET
                name=:name, category=:cat, description=:desc, owner=:owner,
                status=:status, compliance_pct=:pct, notes_count=:notes,
                last_reviewed=:lr, next_review=:nr
            WHERE id=:id
        ")->execute([
            ':name'=>$d['name']??'', ':cat'=>$d['category']??'compliance',
            ':desc'=>$d['description']??'', ':owner'=>$d['owner']??'',
            ':status'=>$d['status']??'pending', ':pct'=>$d['compliance_pct']??0,
            ':notes'=>$d['notes_count']??0, ':lr'=>$d['last_reviewed']??null,
            ':nr'=>$d['next_review']??null, ':id'=>$id,
        ]);
        jsonResponse(['success'=>true]);
    }

    if ($method === 'DELETE' && $id) {
        $db->prepare("DELETE FROM governance_items WHERE id=?")->execute([$id]);
        jsonResponse(['success'=>true]);
    }
}


// ═══════════════════════════════════════════════════
//  KNOWLEDGE — إدارة المعرفة
// ═══════════════════════════════════════════════════
function handleKnowledge(string $method, ?int $id): void {
    $db = getDB();
    ensurePerformanceIndexes($db);

    if ($method === 'GET') {
        if ($id) {
            $s = $db->prepare("
                SELECT ka.*, k.code as kpi_code, k.name as kpi_name,
                       g.code as gov_code, g.name as gov_name
                FROM knowledge_assets ka
                LEFT JOIN kpis k ON k.id=ka.kpi_id
                LEFT JOIN governance_items g ON g.id=ka.governance_id
                WHERE ka.id=?
            ");
            $s->execute([$id]); jsonResponse($s->fetch() ?: ['error'=>'غير موجود']);
        }
        $type   = $_GET['type']    ?? null;
        $status = $_GET['status']  ?? null;
        $year   = (int)($_GET['year']    ?? 2026);
        $q      = (int)($_GET['quarter'] ?? 0);
        $sql    = "SELECT ka.*, k.code as kpi_code, g.code as gov_code
                   FROM knowledge_assets ka
                   LEFT JOIN kpis k ON k.id=ka.kpi_id
                   LEFT JOIN governance_items g ON g.id=ka.governance_id
                   WHERE 1=1";
        $params = [];
        if ($type)   { $sql .= " AND ka.type=?";   $params[] = $type; }
        if ($status) { $sql .= " AND ka.status=?"; $params[] = $status; }
        // year/quarter — آمن حتى لو الأعمدة غير موجودة
        $hasKaYearCol = tableHasColumn($db, 'knowledge_assets', 'year');
        if ($hasKaYearCol && $year) { $sql .= " AND (ka.year=? OR ka.year IS NULL)"; $params[] = $year; }
        if ($hasKaYearCol && $q)    { $sql .= " AND (ka.quarter=? OR ka.quarter IS NULL)"; $params[] = $q; }
        $sql .= " ORDER BY ka.created_at DESC";
        $s = $db->prepare($sql); $s->execute($params);
        jsonResponse($s->fetchAll());
    }

    if ($method === 'POST') {
        $d = getInput();
        if (empty($d['title']) || empty($d['code'])) jsonResponse(['error'=>'code و title مطلوبان'], 400);
        $stmt = $db->prepare("
            INSERT INTO knowledge_assets
                (code,type,title,description,owner,kpi_id,governance_id,status,approved_by,used_in_decision,decision_ref)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            ON DUPLICATE KEY UPDATE
                title=VALUES(title), description=VALUES(description),
                status=VALUES(status), used_in_decision=VALUES(used_in_decision)
        ");
        $stmt->execute([
            $d['code'], $d['type']??'other', $d['title'], $d['description']??'',
            $d['owner']??'', $d['kpi_id']??null, $d['governance_id']??null,
            $d['status']??'draft', $d['approved_by']??'',
            (int)($d['used_in_decision']??0), $d['decision_ref']??'',
        ]);
        jsonResponse(['success'=>true,'id'=>$db->lastInsertId()]);
    }

    if ($method === 'PUT' && $id) {
        $d = getInput();
        $db->prepare("
            UPDATE knowledge_assets SET
                type=:type, title=:title, description=:desc, owner=:owner,
                kpi_id=:kpi, governance_id=:gov, status=:status,
                approved_by=:approved, used_in_decision=:used, decision_ref=:ref
            WHERE id=:id
        ")->execute([
            ':type'=>$d['type']??'other', ':title'=>$d['title']??'',
            ':desc'=>$d['description']??'', ':owner'=>$d['owner']??'',
            ':kpi'=>$d['kpi_id']??null, ':gov'=>$d['governance_id']??null,
            ':status'=>$d['status']??'draft', ':approved'=>$d['approved_by']??'',
            ':used'=>(int)($d['used_in_decision']??0), ':ref'=>$d['decision_ref']??'',
            ':id'=>$id,
        ]);
        jsonResponse(['success'=>true]);
    }

    if ($method === 'DELETE' && $id) {
        $db->prepare("DELETE FROM knowledge_assets WHERE id=?")->execute([$id]);
        jsonResponse(['success'=>true]);
    }
}

// ═══════════════════════════════════════════════════
//  calcFormula — حساب المعادلة بأمان
// ═══════════════════════════════════════════════════
function calcFormula(string $formula, array $vars): ?float {
    // حماية من الكود الخطير
    $blocked = ['exec','system','shell_exec','eval','file_get_contents',
                'fopen','include','require','base64_decode','passthru'];
    foreach ($blocked as $b) {
        if (stripos($formula, $b) !== false) return null;
    }
    // استبدال المتغيرات بقيمها
    foreach ($vars as $key => $value) {
        if (is_numeric($value)) {
            $formula = str_replace($key, (string)(float)$value, $formula);
        }
    }
    // تأكد أنه رقمي فقط
    if (preg_replace('/[\d\.\+\-\*\/\(\)\s]/', '', $formula) !== '') return null;
    try {
        $result = eval("return ($formula);");
        return is_numeric($result) ? round((float)$result, 4) : null;
    } catch (\Throwable $e) {
        return null;
    }
}

function handleChangePassword(string $method): void {
    if ($method !== 'POST') { jsonResponse(['error'=>'POST only'],405); return; }
    $d = getInput();
    $current = trim($d['current'] ?? '');
    $newpass  = trim($d['newpass']  ?? '');
    $dashFile = __DIR__ . '/dashboard.php';
    $dashCont = file_get_contents($dashFile);
    preg_match("/define\('DASHBOARD_PASS',\s*'([^']+)'\)/", $dashCont, $m);
    $stored = $m[1] ?? '';
    if ($current !== $stored) { jsonResponse(['error'=>'كلمة المرور الحالية غير صحيحة'],403); return; }
    if (strlen($newpass) < 6) { jsonResponse(['error'=>'كلمة المرور قصيرة جداً'],400); return; }
    $new = preg_replace(
        "/define\('DASHBOARD_PASS',\s*'[^']*'\)/",
        "define('DASHBOARD_PASS', '" . addslashes($newpass) . "')",
        $dashCont
    );
    if ($new && $new !== $dashCont && file_put_contents($dashFile, $new)) {
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'فشل تحديث الملف — تحقق من صلاحيات الكتابة'],500);
    }
}
