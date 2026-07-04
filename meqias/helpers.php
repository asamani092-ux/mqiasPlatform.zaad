<?php
// helpers.php — منصة مِقياس | جمعية الزاد 2026

function ensureWritable(string $path): bool {
    $dir = is_dir($path) ? $path : dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    if (!is_writable($dir)) {
        @chmod($dir, 0777);
        @exec("chmod 777 " . escapeshellarg($dir) . " 2>/dev/null");
    }
    return is_writable($dir);
}

function safeFilePut(string $filePath, string $content): array {
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        if (!@mkdir($dir, 0777, true)) {
            return ['ok' => false, 'error' => 'فشل انشاء المجلد: ' . $dir];
        }
    }
    if (!is_writable($dir)) {
        @chmod($dir, 0777);
        @exec("chmod 777 " . escapeshellarg($dir) . " 2>/dev/null");
        @exec("chown www-data:www-data " . escapeshellarg($dir) . " 2>/dev/null");
        if (!is_writable($dir)) {
            return ['ok' => false, 'error' => 'لا توجد صلاحية كتابة في: ' . $dir];
        }
    }
    $result = @file_put_contents($filePath, $content, LOCK_EX);
    if ($result === false) {
        return ['ok' => false, 'error' => 'فشل الكتابة في: ' . $filePath];
    }
    @chmod($filePath, 0644);
    return ['ok' => true, 'bytes' => $result, 'path' => $filePath];
}

function readProfile(): array {
    $defaults = [
        'name'          => 'مدير المنصة',
        'title'         => 'مدير الاداء والنمو',
        'avatar_type'   => 'initials',
        'avatar_text'   => 'م',
        'avatar_img'    => '',
        'show_on_index' => true,
    ];
    $file = __DIR__ . '/profile.json';
    if (!file_exists($file)) return $defaults;
    $raw = @file_get_contents($file);
    if (!$raw) return $defaults;
    $data = @json_decode($raw, true);
    if (!is_array($data) || empty($data)) return $defaults;
    return array_merge($defaults, $data);
}

function saveProfile(array $data): array {
    $file = __DIR__ . '/profile.json';
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    return safeFilePut($file, $json);
}

function initDirectories(): void {
    $dirs = [
        __DIR__,
        __DIR__ . '/uploads',
        __DIR__ . '/uploads/avatars',
    ];
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) @mkdir($dir, 0777, true);
        if (!is_writable($dir)) {
            @chmod($dir, 0777);
            @exec("chmod 777 " . escapeshellarg($dir) . " 2>/dev/null");
        }
    }
}

initDirectories();

function ensureKpiFileImportsTable(PDO $db): void {
    static $booted = false;
    if ($booted) {
        return;
    }
    $db->exec("
        CREATE TABLE IF NOT EXISTS kpi_file_imports (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            filename    VARCHAR(255) NOT NULL,
            kpi_id      INT NOT NULL,
            year        YEAR NOT NULL,
            quarter     TINYINT NOT NULL,
            target      DECIMAL(15,4) DEFAULT NULL,
            actual      DECIMAL(15,4) DEFAULT NULL,
            notes       TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_kpi_file_import (filename, kpi_id, year, quarter),
            INDEX idx_kpi_file_import_filename (filename),
            INDEX idx_kpi_file_import_period (kpi_id, year, quarter),
            CONSTRAINT fk_kpi_file_import_kpi
                FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $booted = true;
}

function calcKpiStatus(?float $actual, ?float $target): string {
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

function fetchKpiFileImportAggregate(PDO $db, int $kpiId, int $year, int $quarter): array {
    ensureKpiFileImportsTable($db);

    $sumStmt = $db->prepare("
        SELECT COUNT(*) AS file_count, COALESCE(SUM(actual), 0) AS file_actual_sum
        FROM kpi_file_imports
        WHERE kpi_id = ? AND year = ? AND quarter = ?
    ");
    $sumStmt->execute([$kpiId, $year, $quarter]);
    $sumRow = $sumStmt->fetch() ?: [];

    $latestStmt = $db->prepare("
        SELECT filename, target, notes
        FROM kpi_file_imports
        WHERE kpi_id = ? AND year = ? AND quarter = ?
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
    ");
    $latestStmt->execute([$kpiId, $year, $quarter]);
    $latestRow = $latestStmt->fetch() ?: [];

    return [
        'file_count'      => (int)($sumRow['file_count'] ?? 0),
        'file_actual_sum' => (float)($sumRow['file_actual_sum'] ?? 0),
        'latest_filename' => $latestRow['filename'] ?? null,
        'latest_target'   => isset($latestRow['target']) ? (float)$latestRow['target'] : null,
        'latest_notes'    => $latestRow['notes'] ?? null,
    ];
}

function rebuildKpiAggregateValue(PDO $db, int $kpiId, int $year, int $quarter, ?float $preferredTarget = null, ?string $preferredNotes = null): array {
    ensureKpiFileImportsTable($db);

    $rowStmt = $db->prepare("
        SELECT id, target, actual, notes, manual_actual, source_file
        FROM kpi_values
        WHERE kpi_id = ? AND year = ? AND quarter = ?
        LIMIT 1
    ");
    $rowStmt->execute([$kpiId, $year, $quarter]);
    $row = $rowStmt->fetch() ?: null;

    $imports = fetchKpiFileImportAggregate($db, $kpiId, $year, $quarter);
    $manualActual = null;

    if ($row) {
        if ($row['manual_actual'] !== null) {
            $manualActual = (float)$row['manual_actual'];
        } elseif (($row['source_file'] ?? '') === '' || $row['source_file'] === null) {
            $manualActual = $row['actual'] !== null ? (float)$row['actual'] : null;
        }
    }

    $hasManual = $manualActual !== null;
    $hasFiles  = $imports['file_count'] > 0;

    if (!$hasManual && !$hasFiles) {
        if ($row) {
            $db->prepare("DELETE FROM kpi_values WHERE id = ?")->execute([$row['id']]);
        }
        return [
            'exists'        => false,
            'deleted'       => (bool)$row,
            'manual_actual' => null,
            'actual'        => null,
            'target'        => $preferredTarget ?? ($row && $row['target'] !== null ? (float)$row['target'] : null),
            'status'        => 'pending',
            'file_count'    => 0,
        ];
    }

    $target = $preferredTarget;
    if ($target === null && $row && $row['target'] !== null) {
        $target = (float)$row['target'];
    }
    if ($target === null && $imports['latest_target'] !== null) {
        $target = (float)$imports['latest_target'];
    }

    $notes = $preferredNotes;
    if ($notes === null && $row) {
        $notes = $row['notes'] ?? null;
    }
    if ($notes === null && $imports['latest_notes'] !== null) {
        $notes = $imports['latest_notes'];
    }

    $finalActual = ($manualActual ?? 0) + ($hasFiles ? $imports['file_actual_sum'] : 0);
    $status = calcKpiStatus($finalActual, $target);
    $sourceMarker = null;
    if ($imports['file_count'] === 1) {
        $sourceMarker = $imports['latest_filename'];
    } elseif ($imports['file_count'] > 1) {
        $sourceMarker = '__multi__';
    }

    if ($row) {
        $db->prepare("
            UPDATE kpi_values
            SET target        = ?,
                actual        = ?,
                notes         = ?,
                status        = ?,
                manual_actual = ?,
                source_file   = ?,
                updated_at    = NOW()
            WHERE id = ?
        ")->execute([
            $target,
            $finalActual,
            $notes ?? '',
            $status,
            $manualActual,
            $sourceMarker,
            $row['id'],
        ]);
        $valueId = (int)$row['id'];
    } else {
        $db->prepare("
            INSERT INTO kpi_values (kpi_id, year, quarter, target, actual, notes, status, manual_actual, source_file)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ")->execute([
            $kpiId,
            $year,
            $quarter,
            $target,
            $finalActual,
            $notes ?? '',
            $status,
            $manualActual,
            $sourceMarker,
        ]);
        $valueId = (int)$db->lastInsertId();
    }

    return [
        'exists'        => true,
        'deleted'       => false,
        'id'            => $valueId,
        'manual_actual' => $manualActual,
        'actual'        => $finalActual,
        'target'        => $target,
        'status'        => $status,
        'file_count'    => $imports['file_count'],
        'source_file'   => $sourceMarker,
    ];
}
