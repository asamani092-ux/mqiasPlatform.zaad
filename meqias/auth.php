<?php
// ═══════════════════════════════════════════════════
//  auth.php — نظام تسجيل الدخول والصلاحيات
//  منصة مِقياس · جمعية الزاد 2026
// ═══════════════════════════════════════════════════
require_once __DIR__ . '/config.php';
session_start();

// ── تسجيل الخروج ────────────────────────────────
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: login.php');
    exit;
}

// ── دالة التحقق من الجلسة ───────────────────────
function requireLogin(): void {
    if (empty($_SESSION['user_id'])) {
        header('Location: login.php');
        exit;
    }
}

function currentUser(): array {
    return $_SESSION['user'] ?? [];
}

function hasRole(string $role): bool {
    return ($_SESSION['user']['role'] ?? '') === $role;
}

function isAdmin(): bool {
    return in_array($_SESSION['user']['role'] ?? '', ['admin','super_admin']);
}
