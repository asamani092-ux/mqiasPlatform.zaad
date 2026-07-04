<?php
ob_start();
// ═══════════════════════════════════════════════════
//  process_excel.php — معالج ملفات Excel الذكي
//  منصة مِقياس · جمعية الزاد 2026
//  v4.0 — حماية البيانات اليدوية عند الاستيراد
// ═══════════════════════════════════════════════════

// ── حماية JSON: إخفاء كل الأخطاء وتحويلها لـ JSON ──
error_reporting(0);
ini_set('display_errors', '0');

// التقاط أي output خاطئ (warnings/notices/HTML) لمنع تخريب JSON
ob_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
ob_clean(); // احذف أي output صدر أثناء require

// ── معالج أخطاء PHP — يحولها لـ JSON بدلاً من HTML ──
set_error_handler(function(int $errno, string $errstr) {
    // تجاهل notices و warnings غير المهمة
    if ($errno === E_NOTICE || $errno === E_DEPRECATED) return true;
    ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'خطأ داخلي: ' . $errstr], JSON_UNESCAPED_UNICODE);
    exit;
});

set_exception_handler(function(Throwable $e) {
    ob_clean();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'استثناء: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
});

// ── Base URL ديناميكي ─────────────────────────────────
function siteBaseUrl(): string {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $dir    = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    return $scheme . '://' . $host . $dir;
}

function ensureProcessTableColumn(PDO $db, string $table, string $column, string $definition): void {
    try {
        $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE ?");
        $stmt->execute([$column]);
        if (!$stmt->fetch()) {
            $db->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
        }
    } catch (Throwable $e) {
        // تجاهل الفشل المؤقت؛ ستظهر رسالة أوضح لاحقًا إذا كان العمود مطلوبًا فعلاً.
    }
}

function processTableHasColumn(PDO $db, string $table, string $column): bool {
    try {
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
        ");
        $stmt->execute([$table, $column]);
        return (int)$stmt->fetchColumn() > 0;
    } catch (Throwable $e) {
        return false;
    }
}

function importTypeMeta(string $dataType): array {
    return match ($dataType) {
        'kpi_operational' => ['label' => 'مسار الأداء التشغيلي', 'item' => 'مؤشر تشغيلي'],
        'governance'      => ['label' => 'مسار الحوكمة', 'item' => 'معيار حوكمة'],
        'knowledge'       => ['label' => 'مسار المعرفة', 'item' => 'أصل معرفي'],
        default           => ['label' => 'مسار الأداء الاستراتيجي', 'item' => 'مؤشر استراتيجي'],
    };
}

function invalidateProcessApiCache(): void {
    $dir = __DIR__ . '/uploads/.api-cache';
    if (!is_dir($dir)) {
        return;
    }
    foreach (glob($dir . '/*.json') ?: [] as $file) {
        @unlink($file);
    }
}

// ── دالة إرسال البريد (Gmail + Microsoft) ─────────────
function sendEmail(array $settings, string $subject, string $body): array {
    $provider   = $settings['smtp_provider'] ?? 'gmail';
    $from       = $settings['smtp_from'];
    $pass       = $settings['smtp_pass'];
    $fromName   = $settings['smtp_name'] ?? 'منصة مِقياس';
    $recipients = $settings['recipients'];
    if ($provider === 'microsoft') {
        $smtpHost = 'smtp.office365.com'; $smtpPort = 587; $useTLS = true;
    } else {
        $smtpHost = 'smtp.gmail.com'; $smtpPort = 465; $useTLS = false;
    }
    try {
        $socket = $useTLS
            ? fsockopen($smtpHost, $smtpPort, $errno, $errstr, 30)
            : fsockopen('ssl://' . $smtpHost, $smtpPort, $errno, $errstr, 30);
        if (!$socket) throw new Exception("فشل الاتصال بـ $smtpHost: $errstr ($errno)");
        $read = fgets($socket, 515);
        if (substr($read, 0, 3) !== '220') throw new Exception("استجابة خاطئة: $read");
        fputs($socket, "EHLO miqyas.platform\r\n");
        while ($line = fgets($socket, 515)) { if ($line[3] === ' ') break; }
        if ($useTLS) {
            fputs($socket, "STARTTLS\r\n");
            $tlsResp = fgets($socket, 515);
            if (substr($tlsResp, 0, 3) !== '220') throw new Exception("فشل STARTTLS: $tlsResp");
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($socket, "EHLO miqyas.platform\r\n");
            while ($line = fgets($socket, 515)) { if ($line[3] === ' ') break; }
        }
        fputs($socket, "AUTH LOGIN\r\n"); fgets($socket, 515);
        fputs($socket, base64_encode($from) . "\r\n"); fgets($socket, 515);
        fputs($socket, base64_encode($pass) . "\r\n");
        $authResp = fgets($socket, 515);
        if (substr($authResp, 0, 3) !== '235') {
            fclose($socket);
            throw new Exception('فشل المصادقة — تحقق من App Password');
        }
        fputs($socket, "MAIL FROM:<{$from}>\r\n"); fgets($socket, 515);
        foreach ($recipients as $to) { fputs($socket, "RCPT TO:<{$to}>\r\n"); fgets($socket, 515); }
        fputs($socket, "DATA\r\n"); fgets($socket, 515);
        $enc  = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $fn   = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
        $msg  = "Date: " . date('r') . "\r\n";
        $msg .= "From: {$fn} <{$from}>\r\n";
        $msg .= "To: " . implode(', ', $recipients) . "\r\n";
        $msg .= "Subject: {$enc}\r\nMIME-Version: 1.0\r\n";
        $msg .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
        $msg .= chunk_split(base64_encode($body)) . "\r\n.\r\n";
        fputs($socket, $msg);
        $resp = fgets($socket, 515);
        fputs($socket, "QUIT\r\n"); fclose($socket);
        if (substr($resp, 0, 3) === '250') {
            return ['success' => true, 'message' => 'تم الإرسال لـ ' . count($recipients) . ' مستلم'];
        }
        throw new Exception("فشل إرسال البيانات: $resp");
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'POST only'], JSON_UNESCAPED_UNICODE); exit;
}

$input    = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$action   = $input['action']   ?? 'preview';
$filename = basename($input['filename'] ?? '');
$year     = (int)($input['year']    ?? 2026);
$quarter  = (int)($input['quarter'] ?? 1);
$dataType = $input['data_type'] ?? 'kpi_strategic'; // kpi_strategic | kpi_operational | governance | knowledge
$selectedKpiType = match ($dataType) {
    'kpi_strategic'   => 'strategic',
    'kpi_operational' => 'operational',
    default           => null,
};
$typeMeta = importTypeMeta($dataType);

if (empty($filename)) {
    echo json_encode(['error' => 'اسم الملف مطلوب'], JSON_UNESCAPED_UNICODE); exit;
}

$filePath = __DIR__ . '/uploads/' . $filename;
if (!file_exists($filePath)) {
    echo json_encode(['error' => 'الملف غير موجود: ' . $filename], JSON_UNESCAPED_UNICODE); exit;
}

$ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

// ── قراءة الملف ──────────────────────────────────────
try {
    $allRows = ($ext === 'csv') ? readCsvFile($filePath) : readExcelFile($filePath);
} catch (Exception $e) {
    echo json_encode(['error' => 'فشل قراءة الملف: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE); exit;
}

if (empty($allRows)) {
    echo json_encode(['error' => 'الملف فارغ'], JSON_UNESCAPED_UNICODE); exit;
}

// ── اكتشاف صف الـ headers تلقائياً ──────────────────
$headerRowIndex = -1;
$codeKeywords   = ['رمز المؤشر', 'رمزالمؤشر', 'رمز', 'code', 'kpi'];

foreach ($allRows as $i => $row) {
    foreach ($row as $cell) {
        $cell = mb_strtolower(trim(preg_replace('/[\x{1F300}-\x{1F9FF}]/u', '', (string)$cell)));
        foreach ($codeKeywords as $kw) {
            if (str_contains($cell, mb_strtolower($kw))) {
                $headerRowIndex = $i;
                break 3;
            }
        }
    }
}

if ($headerRowIndex === -1) {
    echo json_encode([
        'error'   => 'لم يُعثر على صف العناوين في الملف',
        'hint'    => 'تأكد أن الملف يحتوي على عمود اسمه: رمز المؤشر',
        'preview' => array_slice($allRows, 0, 4),
    ], JSON_UNESCAPED_UNICODE); exit;
}

// ── استخراج headers وبيانات ──────────────────────────
$headers  = array_map('strval', $allRows[$headerRowIndex]);
$dataRows = array_slice($allRows, $headerRowIndex + 1);
$colMap   = detectColumns($headers);

// ── تحليل صفوف البيانات ──────────────────────────────
$parsed   = [];
$warnings = [];

foreach ($dataRows as $i => $row) {
    // تجاهل الصفوف الفارغة
    if (empty(array_filter(array_map('trim', $row)))) continue;

    // تجاهل صفوف الفواصل (فاصل المحاور)
    $rawCode = (string)($row[$colMap['code']] ?? '');
    $code    = trim($rawCode);

    if (empty($code))           continue; // خلية فارغة
    if (mb_strlen($code) > 20)  continue; // نص طويل = فاصل
    if (str_starts_with($rawCode, '  ')) continue; // يبدأ بمسافتين = فاصل

    // تحقق أن الرمز يبدو كرمز مؤشر (مثل ع1-1 أو FIN-01 أو HR-01-KPI-01)
    // وليس نص عربي عادي مثل "محور العملاء"
    if (!preg_match('/^[a-zA-Z\x{0600}-\x{06FF}]{1,6}[0-9\-]+$/u', $code) &&
        !preg_match('/^[A-Z]{2,5}[-_][0-9]/i', $code)) {
        $warnings[] = "تم تجاهل السطر: '{$code}' (ليس رمز مؤشر)";
        continue;
    }

    $actual = cleanNumber($row[$colMap['actual']] ?? null);
    $target = cleanNumber($row[$colMap['target']] ?? null);
    $notes  = trim((string)($row[$colMap['notes']] ?? ''));

    $parsed[] = compact('code', 'actual', 'target', 'notes');
}

if (empty($parsed)) {
    echo json_encode([
        'error'    => 'لم يُعثر على بيانات صالحة · تأكد من بنية الملف',
        'col_map'  => $colMap,
        'headers'  => $headers,
    ], JSON_UNESCAPED_UNICODE); exit;
}

// ── ربط الرموز بقاعدة البيانات ───────────────────────
try { $db = getDB(); }
catch (Exception $e) {
    echo json_encode(['error' => 'فشل الاتصال بقاعدة البيانات: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE); exit;
}

ensureProcessTableColumn($db, 'kpi_values', 'manual_actual', 'DECIMAL(15,4) DEFAULT NULL');
ensureProcessTableColumn($db, 'kpi_values', 'source_file', 'VARCHAR(255) DEFAULT NULL');
ensureKpiFileImportsTable($db);
$hasManualActualCol = processTableHasColumn($db, 'kpi_values', 'manual_actual');
$hasSourceFileCol   = processTableHasColumn($db, 'kpi_values', 'source_file');
$supportsTrackedFileImport = $hasManualActualCol && $hasSourceFileCol;

// ══ إذا كان النوع حوكمة أو معرفة — معالجة مختلفة ══
if ($dataType === 'governance') {
    if ($action === 'preview') {
        // معاينة: تحقق من الرموز في قاعدة البيانات
        $rows = [];
        foreach ($parsed as $row) {
            $code = $row['code'];
            $pct  = is_numeric($row['actual']) ? (float)$row['actual'] : null;
            $stmt = $db->prepare("SELECT id, name, status, compliance_pct FROM governance_items WHERE code=? LIMIT 1");
            $stmt->execute([$code]);
            $gov = $stmt->fetch();
            $statusCalc = $pct === null ? 'pending'
                        : ($pct >= 90 ? 'compliant' : ($pct >= 50 ? 'partial' : 'non_compliant'));
            $rows[] = [
                'code'      => $code,
                'kpi_name'  => $gov['name'] ?? 'غير موجود',
                'found'     => !!$gov,
                'target'    => 100,
                'actual'    => $pct,
                'kpi_type'  => 'governance',
                'notes'     => $statusCalc,
            ];
            if (!$gov) $warnings[] = "الرمز '{$code}' غير موجود في بيانات الحوكمة";
        }
        $foundRows    = array_filter($rows, fn($r) => $r['found']);
        $notFoundRows = array_filter($rows, fn($r) => !$r['found']);
        echo json_encode([
            'success'   => true, 'action' => 'preview',
            'total'     => count($rows),
            'found'     => count($foundRows),
            'not_found' => count($notFoundRows),
            'data_type' => $dataType,
            'path_label'=> $typeMeta['label'],
            'rows'      => array_values($rows),
            'warnings'  => $warnings,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($action === 'import') {
        $imported = 0; $skipped = 0;
        foreach ($parsed as $row) {
            $code  = $row['code'];
            $pct   = is_numeric($row['actual']) ? (float)$row['actual'] : null;
            $status = $pct === null ? 'pending'
                   : ($pct >= 90 ? 'compliant' : ($pct >= 50 ? 'partial' : 'non_compliant'));
            try {
                $stmt_gov = $db->prepare("UPDATE governance_items SET compliance_pct=?, status=?, updated_at=NOW() WHERE code=?");
                $stmt_gov->execute([$pct, $status, $code]);
                if ($stmt_gov->rowCount() > 0) { $imported++; } else { $skipped++; }
            } catch (Exception $e) { $skipped++; }
        }
        invalidateProcessApiCache();
        echo json_encode([
            'success'   => true, 'imported' => $imported, 'skipped' => $skipped,
            'failed'    => 0, 'year' => $year, 'quarter' => $quarter,
            'message'   => "تم تحديث {$imported} معيار حوكمة", 'data_type' => 'governance', 'path_label' => $typeMeta['label'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if ($dataType === 'knowledge') {
    if ($action === 'preview') {
        $rows = [];
        foreach ($parsed as $row) {
            $code   = $row['code'];
            $status = trim((string)($row['notes'] ?? $row['actual'] ?? 'active'));
            if (!in_array($status, ['draft','active','archived','under_review'])) $status = 'active';
            $stmt = $db->prepare("SELECT id, title, status FROM knowledge_assets WHERE code=? LIMIT 1");
            $stmt->execute([$code]);
            $asset = $stmt->fetch();
            $rows[] = [
                'code'     => $code,
                'kpi_name' => $asset['title'] ?? 'غير موجود',
                'found'    => !!$asset,
                'target'   => null,
                'actual'   => null,
                'kpi_type' => 'knowledge',
                'notes'    => $status,
            ];
            if (!$asset) $warnings[] = "الرمز '{$code}' غير موجود في بيانات المعرفة";
        }
        $foundRows    = array_filter($rows, fn($r) => $r['found']);
        $notFoundRows = array_filter($rows, fn($r) => !$r['found']);
        echo json_encode([
            'success'   => true, 'action' => 'preview',
            'total'     => count($rows),
            'found'     => count($foundRows),
            'not_found' => count($notFoundRows),
            'data_type' => $dataType,
            'path_label'=> $typeMeta['label'],
            'rows'      => array_values($rows),
            'warnings'  => $warnings,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($action === 'import') {
        $imported = 0; $skipped = 0;
        foreach ($parsed as $row) {
            $code   = $row['code'];
            $status = trim((string)($row['notes'] ?? $row['actual'] ?? 'active'));
            if (!in_array($status, ['draft','active','archived','under_review'])) $status = 'active';
            try {
                $stmt_know = $db->prepare("UPDATE knowledge_assets SET status=?, updated_at=NOW() WHERE code=?");
                $stmt_know->execute([$status, $code]);
                if ($stmt_know->rowCount() > 0) { $imported++; } else { $skipped++; }
            } catch (Exception $e) { $skipped++; }
        }
        invalidateProcessApiCache();
        echo json_encode([
            'success'   => true, 'imported' => $imported, 'skipped' => $skipped,
            'failed'    => 0, 'year' => $year, 'quarter' => $quarter,
            'message'   => "تم تحديث {$imported} أصل معرفي", 'data_type' => 'knowledge', 'path_label' => $typeMeta['label'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

foreach ($parsed as &$item) {
    $kpiSql = "SELECT id, name, unit, annual_target, type FROM kpis WHERE code=? AND status='active'";
    $params = [$item['code']];
    if ($selectedKpiType !== null) {
        $kpiSql .= " AND type=?";
        $params[] = $selectedKpiType;
    }
    $kpiSql .= " LIMIT 1";
    $stmt = $db->prepare($kpiSql);
    $stmt->execute($params);
    $kpi = $stmt->fetch();

    if ($kpi) {
        $item['kpi_id']   = $kpi['id'];
        $item['kpi_name'] = $kpi['name'];
        $item['unit']     = $kpi['unit'];
        $item['kpi_type'] = $kpi['type'];
        $item['found']    = true;

        // إذا ما في مستهدف بالملف خذه من DB
        if ($item['target'] === null) {
            $v = $db->prepare("SELECT target FROM kpi_values WHERE kpi_id=? AND year=? AND quarter=? LIMIT 1");
            $v->execute([$kpi['id'], $year, $quarter]);
            $ex = $v->fetch();
            $item['target'] = $ex['target'] ?? $kpi['annual_target'];
        }

        // القيمة الحالية في DB
        $v2 = $db->prepare("SELECT actual, target FROM kpi_values WHERE kpi_id=? AND year=? AND quarter=? LIMIT 1");
        $v2->execute([$kpi['id'], $year, $quarter]);
        $ex2 = $v2->fetch();
        $item['current_actual'] = $ex2['actual'] ?? null;
        $item['current_target'] = $ex2['target'] ?? $item['target'];
    } else {
        $item['found']    = false;
        $item['unit']     = '';
        $item['kpi_type'] = null;

        if ($selectedKpiType !== null) {
            $altStmt = $db->prepare("SELECT name, type FROM kpis WHERE code=? AND status='active' LIMIT 1");
            $altStmt->execute([$item['code']]);
            $altKpi = $altStmt->fetch();
            if ($altKpi) {
                $actualPath = ($altKpi['type'] ?? '') === 'operational' ? 'الأداء التشغيلي' : 'الأداء الاستراتيجي';
                $item['kpi_name'] = ($altKpi['name'] ?? 'مؤشر موجود') . ' — مسار مختلف';
                $item['kpi_type'] = $altKpi['type'] ?? null;
                $warnings[] = "الرمز '{$item['code']}' موجود لكنه يتبع مسار {$actualPath} وليس المسار المختار";
                continue;
            }
        }

        $item['kpi_name'] = 'غير موجود في النظام';
        $item['unit']     = '';
        $warnings[]       = "الرمز '{$item['code']}' غير موجود";
    }
}
unset($item);

$found    = array_values(array_filter($parsed, fn($p) =>  $p['found']));
$notFound = array_values(array_filter($parsed, fn($p) => !$p['found']));

// ══ معاينة ════════════════════════════════════════════
if ($action === 'preview') {
    echo json_encode([
        'success'   => true,
        'action'    => 'preview',
        'data_type' => $dataType,
        'path_label'=> $typeMeta['label'],
        'year'      => $year,
        'quarter'   => $quarter,
        'total'     => count($parsed),
        'found'     => count($found),
        'not_found' => count($notFound),
        'rows'      => $parsed,
        'warnings'  => $warnings,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ══ استيراد ════════════════════════════════════════════
if ($action === 'import') {
    $imported = 0;
    $details  = [];
    if (!$supportsTrackedFileImport && $selectedKpiType !== null) {
        $warnings[] = 'تم تشغيل وضع التوافق للمؤشرات لأن قاعدة البيانات الحالية لا تحتوي بعد على أعمدة تتبع الملف. سيتم الاستيراد بنجاح، لكن ربط الحذف الذكي بالملف يتطلب رفع api.php الجديد أو تشغيل التهيئة التي تضيف الأعمدة المساندة.';
    }

    try {
        $db->beginTransaction();

        foreach ($found as $item) {
            $actual = $item['actual'];
            $target = $item['target'];

            // احسب الحالة
            $status = 'pending';
            if ($actual !== null && $target !== null && (float)$target > 0) {
                $pct    = (float)$actual / (float)$target;
                $status = match(true) {
                    $pct >= 1.0  => 'exceeded',
                    $pct >= 0.85 => 'achieved',
                    $pct >= 0.5  => 'partial',
                    default      => 'not_achieved',
                };
            }

            if ($supportsTrackedFileImport) {
                $db->prepare("
                    INSERT INTO kpi_file_imports (filename, kpi_id, year, quarter, target, actual, notes)
                    VALUES (:filename, :kpi_id, :year, :quarter, :target, :actual, :notes)
                    ON DUPLICATE KEY UPDATE
                        target = VALUES(target),
                        actual = VALUES(actual),
                        notes = VALUES(notes),
                        updated_at = NOW()
                ")->execute([
                    ':filename' => $filename,
                    ':kpi_id'   => $item['kpi_id'],
                    ':year'     => $year,
                    ':quarter'  => $quarter,
                    ':target'   => $target,
                    ':actual'   => $actual,
                    ':notes'    => $item['notes'],
                ]);

                $rebuilt = rebuildKpiAggregateValue(
                    $db,
                    (int)$item['kpi_id'],
                    $year,
                    $quarter,
                    $target !== null ? (float)$target : null,
                    $item['notes']
                );
                $actual = $rebuilt['actual'];
                $target = $rebuilt['target'];
                $status = $rebuilt['status'];
            } else {
                // وضع توافق للقواعد القديمة: استيراد مباشر بدون تتبع مصدر الملف
                $db->prepare("
                    INSERT INTO kpi_values (kpi_id, year, quarter, target, actual, notes, status)
                    VALUES (:kpi_id, :year, :quarter, :target, :actual, :notes, :status)
                    ON DUPLICATE KEY UPDATE
                        target      = VALUES(target),
                        actual      = VALUES(actual),
                        notes       = VALUES(notes),
                        status      = VALUES(status),
                        updated_at  = NOW()
                ")->execute([
                    ':kpi_id'  => $item['kpi_id'],
                    ':year'    => $year,
                    ':quarter' => $quarter,
                    ':target'  => $target,
                    ':actual'  => $actual,
                    ':notes'   => $item['notes'],
                    ':status'  => $status,
                ]);
            }

            $pct2 = ($target > 0 && $actual !== null) ? round((float)$actual / (float)$target * 100, 1) : null;
            $details[] = [
                'code'   => $item['code'],
                'name'   => $item['kpi_name'],
                'actual' => $actual,
                'target' => $target,
                'pct'    => $pct2,
                'status' => $status,
            ];
            $imported++;
        }

        $db->commit();
        invalidateProcessApiCache();

        // ── إرسال إيميل الإنذار المبكر تلقائياً ────────────
        $settings_threshold = 15; // default
        $alertsToSend = array_filter($details, function($d) use ($settings_threshold) {
            return isset($d['pct']) && $d['pct'] !== null && $d['pct'] < (100 - $settings_threshold);
        });

        $emailSent = false;
        if (!empty($alertsToSend)) {
            $settingsFile = __DIR__ . '/email_settings.json';
            if (file_exists($settingsFile)) {
                $emailSettings = json_decode(file_get_contents($settingsFile), true) ?? [];
                $threshold = $emailSettings['alert_threshold'] ?? 15;
                $alertEnabled = $emailSettings['alert_enabled'] ?? true;
                $alertOnExcel = $emailSettings['alert_on_excel'] ?? true;
                $alertEmails = !empty($emailSettings['alert_recipients'])
                    ? $emailSettings['alert_recipients']
                    : ($emailSettings['recipients'] ?? []);
                // فلتر حسب الحد الفعلي
                $realAlerts = array_filter($details, function($d) use ($threshold) {
                    return isset($d['pct']) && $d['pct'] !== null && $d['pct'] < (100 - $threshold);
                });
                if (
                    $alertEnabled &&
                    $alertOnExcel &&
                    !empty($realAlerts) &&
                    !empty($emailSettings['smtp_from']) &&
                    !empty($emailSettings['smtp_pass']) &&
                    !empty($alertEmails)
                ) {
                    // أرسل عبر API داخلياً
                    $alertData = array_map(function($d) {
                        return [
                            'code'          => $d['code'],
                            'name'          => $d['name'],
                            'actual'        => $d['actual'],
                            'target'        => $d['target'],
                            'deviation_pct' => $d['pct'] !== null ? $d['pct'] - 100 : null,
                        ];
                    }, array_values($realAlerts));
                    $alertEmailSettings = array_merge($emailSettings, ['recipients' => $alertEmails]);
                    // استدعاء دالة الإرسال مباشرة
                    $emailResult = triggerAlertEmail($alertData, $alertEmailSettings);
                    $emailSent = $emailResult['success'] ?? false;
                }
            }
        }

        echo json_encode([
            'success'   => true,
            'action'    => 'import',
            'version'   => 'v4.0',
            'data_type' => $dataType,
            'path_label'=> $typeMeta['label'],
            'tracked_file_import' => $supportsTrackedFileImport,
            'email_sent'=> $emailSent,
            'year'     => $year,
            'quarter'  => $quarter,
            'imported' => $imported,
            'skipped'  => count($notFound),
            'details'  => $details,
            'warnings' => $warnings,
            'message'  => "تم استيراد {$imported} {$typeMeta['item']} بنجاح" . ($selectedKpiType !== null ? " للربع {$quarter} من {$year}" : ''),
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    } catch (Exception $e) {
        $db->rollBack();
        echo json_encode(['error' => 'فشل الاستيراد: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

echo json_encode(['error' => 'action غير معروف'], JSON_UNESCAPED_UNICODE);

// ════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ════════════════════════════════════════════════════

function detectColumns(array $headers): array {
    $map = ['code' => -1, 'actual' => -1, 'target' => -1, 'notes' => -1];

    $patterns = [
        'code'   => ['رمز المؤشر','رمزالمؤشر','رمز','code','kpi code','kpi'],
        'actual' => ['القيمة الفعلية','الفعلي','المتحقق الفعلي','المتحقق','actual','value','قيمة فعلية','نسبة الاستيفاء','compliance','compliance pct'],
        'target' => ['المستهدف','target','goal','القيمة المستهدفة'],
        'notes'  => ['ملاحظات','notes','تعليق','comments','الحالة','status'],
    ];

    foreach ($headers as $i => $header) {
        // إزالة emojis والمسافات
        $h = preg_replace('/[\x{1F300}-\x{1F9FF}✏️]/u', '', (string)$header);
        $h = mb_strtolower(trim($h));
        foreach ($patterns as $field => $kws) {
            if ($map[$field] !== -1) continue;
            foreach ($kws as $kw) {
                if (str_contains($h, mb_strtolower($kw))) {
                    $map[$field] = $i; break;
                }
            }
        }
    }

    // Fallback: إذا ما لقى actual خذ العمود التالي بعد code
    if ($map['code'] !== -1 && $map['actual'] === -1) {
        $map['actual'] = $map['code'] + 1;
    }

    return $map;
}

function cleanNumber($val): ?float {
    if ($val === null || $val === '') return null;
    $v = trim((string)$val);
    if (in_array($v, ['—','-','None','null','N/A','لا يوجد',''])) return null;
    $v = str_replace(['،',',',' ','%','ر','﷼','SAR'], '', $v);
    return is_numeric($v) ? (float)$v : null;
}

function readCsvFile(string $path): array {
    $rows    = [];
    $content = file_get_contents($path);
    if ($content === false) return [];
    // إزالة BOM
    $content = ltrim($content, "\xEF\xBB\xBF");
    foreach (explode("\n", $content) as $line) {
        $line = trim($line);
        if ($line !== '') $rows[] = str_getcsv($line);
    }
    return $rows;
}

function readExcelFile(string $path): array {
    // قراءة xlsx مباشرة بـ PHP/ZipArchive — لا تحتاج SimpleXLSX أو أي مكتبة خارجية
    if (!class_exists('ZipArchive')) {
        throw new Exception(
            'ZipArchive غير مفعّل على السيرفر — ' .
            'الحل: sudo apt install php-zip ثم أعد تشغيل Apache. ' .
            'أو ارفع الملف بصيغة CSV بدلاً من xlsx.'
        );
    }

    if (!file_exists($path)) {
        throw new Exception('الملف غير موجود على السيرفر: ' . basename($path));
    }

    $zip = new ZipArchive();
    $result = $zip->open($path);
    if ($result !== true) {
        $errCodes = [
            ZipArchive::ER_NOZIP  => 'الملف ليس xlsx صالحاً',
            ZipArchive::ER_INCONS => 'الملف تالف أو غير مكتمل',
            ZipArchive::ER_OPEN   => 'تعذّر فتح الملف — تحقق من الصلاحيات',
        ];
        $msg = $errCodes[$result] ?? "خطأ رقم {$result}";
        throw new Exception("تعذّر فتح ملف Excel: {$msg}");
    }

    // ── Shared Strings ────────────────────────────────
    $sharedStrings = [];
    $ssXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($ssXml) {
        $ssXml = preg_replace('/\s+xmlns[^=]*="[^"]*"/', '', $ssXml);
        $ssXml = preg_replace('/<(\w+):/', '<', $ssXml);
        $ssXml = preg_replace('/<\/(\w+):/', '</', $ssXml);
        libxml_use_internal_errors(true);
        $ss = @simplexml_load_string($ssXml, 'SimpleXMLElement', LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        if ($ss) {
            foreach ($ss->si as $si) {
                $text = '';
                // rich text (r elements)
                foreach ($si->r as $r) { $text .= (string)($r->t ?? ''); }
                // plain text
                if (empty($text)) $text = (string)($si->t ?? '');
                $sharedStrings[] = $text;
            }
        }
    }

    // ── Sheet1 XML ────────────────────────────────────
    $sheetXml = null;
    for ($i = 1; $i <= 5; $i++) {
        $try = $zip->getFromName("xl/worksheets/sheet{$i}.xml");
        if ($try) { $sheetXml = $try; break; }
    }
    $zip->close();

    if (!$sheetXml) throw new Exception('لم يُعثر على بيانات في الملف');

    // إزالة namespaces لتبسيط التحليل
    $sheetXml = preg_replace('/\s+xmlns[^=]*="[^"]*"/', '', $sheetXml);
    $sheetXml = preg_replace('/<(\w+):/', '<', $sheetXml);
    $sheetXml = preg_replace('/<\/(\w+):/', '</', $sheetXml);

    libxml_use_internal_errors(true);
    $xml = @simplexml_load_string($sheetXml, 'SimpleXMLElement', LIBXML_NOERROR | LIBXML_NOWARNING);
    libxml_clear_errors();
    if (!$xml) throw new Exception('فشل تحليل XML');

    // ── بناء المصفوفة ──────────────────────────────────
    $matrix = [];
    $maxRow = 0;
    $maxCol = 0;

    foreach ($xml->sheetData->row as $rowEl) {
        $rn = (int)($rowEl['r'] ?? 0);
        if ($rn > $maxRow) $maxRow = $rn;

        foreach ($rowEl->c as $cell) {
            $ref    = (string)($cell['r'] ?? '');
            $t      = (string)($cell['t'] ?? '');
            $v      = (string)($cell->v ?? '');
            $inlineT= (string)($cell->is->t ?? '');

            // تحديد القيمة
            if ($t === 's') {
                // Shared string
                $idx = (int)$v;
                $v   = $sharedStrings[$idx] ?? '';
            } elseif ($t === 'inlineStr' || !empty($inlineT)) {
                $v = $inlineT;
            } elseif ($t === 'b') {
                $v = $v ? 'TRUE' : 'FALSE';
            }
            // تنظيف
            $v = trim($v);

            // تحديد موقع العمود
            preg_match('/^([A-Z]+)/i', $ref, $m);
            $colLetter = strtoupper($m[1] ?? 'A');
            $colIdx    = xlColToIndex($colLetter);
            if ($colIdx > $maxCol) $maxCol = $colIdx;

            $matrix[$rn][$colIdx] = $v;
        }
    }

    // ── تحويل لمصفوفة منتظمة ─────────────────────────
    $rows = [];
    for ($r = 1; $r <= $maxRow; $r++) {
        $row = [];
        for ($c = 0; $c <= $maxCol; $c++) {
            $row[] = $matrix[$r][$c] ?? '';
        }
        $rows[] = $row;
    }

    return $rows;
}

function xlColToIndex(string $col): int {
    $idx = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $idx = $idx * 26 + (ord($col[$i]) - ord('A') + 1);
    }
    return $idx - 1;
}

function triggerAlertEmail(array $alerts, array $settings): array {
    // استخدام دالة sendEmail المركزية من api.php
    if (empty($settings['recipients']) || empty($settings['smtp_from']) || empty($settings['smtp_pass'])) {
        return ['success' => false, 'message' => 'إعدادات البريد غير مكتملة'];
    }
    $subject = '⚠️ إنذار مبكر — منصة مِقياس | جمعية الزاد';
    $body    = buildAlertEmailBodySimple($alerts, $settings);
    return sendEmail($settings, $subject, $body);
}

function buildAlertEmailBodySimple(array $alerts, array $settings): string {
    $threshold = $settings['alert_threshold'] ?? 15;
    $time      = date('Y/m/d H:i');
    $count     = count($alerts);
    $rows = '';
    foreach ($alerts as $a) {
        $dev    = round((float)($a['deviation_pct'] ?? 0), 1);
        $devAbs = abs($dev);
        $color  = $devAbs > 30 ? '#dc2626' : '#d97706';
        $risk   = $devAbs > 30 ? '🔴 خطر' : '🟠 تحذير';
        $rows  .= "<tr>
          <td style='padding:8px;border-bottom:1px solid #eee;font-weight:700'>{$a['code']}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;font-size:13px'>{$a['name']}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center'>{$a['target']}</td>
          <td style='padding:8px;border-bottom:1px solid #eee;text-align:center;font-weight:700;color:{$color}'>{$a['actual']}</td>
          <td style='padding:8px;text-align:center;font-weight:700;color:{$color}'>{$dev}%  {$risk}</td>
        </tr>";
    }
    $baseUrl = siteBaseUrl();
    return "<!DOCTYPE html><html dir='rtl' lang='ar'><head><meta charset='UTF-8'></head>
<body style='font-family:Arial,sans-serif;background:#f0f4f8;padding:20px'>
<div style='max-width:700px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden'>
  <div style='background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:24px;text-align:center'>
    <h1 style='color:#fff;margin:0;font-size:22px'>⚠️ إنذار مبكر تلقائي</h1>
    <p style='color:rgba(255,255,255,.85);margin:8px 0 0'>منصة مِقياس | جمعية الزاد · {$time}</p>
  </div>
  <div style='padding:24px'>
    <div style='background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;margin-bottom:20px'>
      <p style='margin:0;color:#991b1b;font-size:15px;font-weight:700'>🔔 تم رصد {$count} مؤشر منحرف عن المستهدف بأكثر من {$threshold}%</p>
      <p style='margin:6px 0 0;color:#666;font-size:13px'>هذا البريد أُرسل تلقائياً بعد استيراد بيانات Excel</p>
    </div>
    <table style='width:100%;border-collapse:collapse;font-size:14px'>
      <thead><tr style='background:#f8fafc'>
        <th style='padding:8px;text-align:right;color:#64748b;font-size:12px'>الرمز</th>
        <th style='padding:8px;text-align:right;color:#64748b;font-size:12px'>المؤشر</th>
        <th style='padding:8px;text-align:center;color:#64748b;font-size:12px'>المستهدف</th>
        <th style='padding:8px;text-align:center;color:#64748b;font-size:12px'>الفعلي</th>
        <th style='padding:8px;text-align:center;color:#64748b;font-size:12px'>الانحراف</th>
      </tr></thead>
      <tbody>{$rows}</tbody>
    </table>
    <div style='margin-top:20px;text-align:center'>
      <a href='{$baseUrl}/index.php' style='background:#8b1a3a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:700'>📊 فتح لوحة الأداء</a>
    </div>
  </div>
  <div style='background:#f8f9fa;padding:16px;text-align:center;border-top:1px solid #eee'>
    <p style='color:#aaa;font-size:12px;margin:0'>© 2026 جمعية الزاد · منصة مِقياس للأداء المؤسسي</p>
  </div>
</div>
</body></html>";
}
