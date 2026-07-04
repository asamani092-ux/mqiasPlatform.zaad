<?php
// ═══════════════════════════════════════════
//  operational.php — مسار الأداء التشغيلي
//  جمعية الزاد 2026
// ═══════════════════════════════════════════
session_start();
require_once __DIR__ . '/helpers.php';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>الأداء التشغيلي | مِقياس</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f6f7f4;--card:#ffffff;--card2:#f1f3ef;
  --border:#e2e5dd;--bhi:#c8cebf;
  --teal:#0f5132;--cyan:#157f6d;--gold:#c7a15a;
  --red:#c0392b;--maroon:#0b3d2e;--purple:#0f5132;
  --text:#1f2a2e;--dim:#5b6b73;--slate:#71808a;
}
body{font-family:'Almarai',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.topbar{background:var(--card);border-bottom:1px solid var(--border);padding:.65rem 1.25rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap;position:static;z-index:50}
.back{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .9rem;border-radius:.6rem;font-size:.78rem;font-weight:700;text-decoration:none;color:var(--slate);border:1px solid var(--border);font-family:'Almarai',sans-serif;transition:all .2s}
.back:hover{border-color:var(--bhi);color:var(--text)}
.sel{background:var(--card2);border:1px solid var(--border);color:var(--text);padding:.45rem .8rem;border-radius:.6rem;font-family:'Almarai',sans-serif;font-size:.78rem;font-weight:700;outline:none;cursor:pointer}
.wrap{max-width:1200px;margin:0 auto;padding:1.5rem}
#pageDesc{max-width:620px !important;margin:.4rem 0 0 !important;padding:.6rem .85rem !important;border-radius:0 .45rem .45rem 0 !important}
#pageDesc p{font-size:.72rem !important;line-height:1.65 !important;margin-bottom:.35rem !important}
#pageDesc ul{gap:.2rem .7rem !important}
#pageDesc li{font-size:.68rem !important}
.card{background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.25rem}
.prog{height:5px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden}
.prog-fill{height:100%;border-radius:99px;transition:width 1.3s ease}
/* إدارة */
.dept-block{margin-bottom:2rem}
.dept-header{display:flex;justify-content:space-between;align-items:center;padding:.7rem 1rem;background:var(--card);border-radius:.75rem;margin-bottom:1rem}
/* هدف تشغيلي */
.goal-block{margin-bottom:1.25rem;padding-right:1rem;border-right:2px solid rgba(255,255,255,.08)}
.goal-header{display:flex;align-items:center;gap:.6rem;padding:.45rem .8rem;background:var(--card2);border-radius:.6rem;margin-bottom:.65rem}
/* مؤشر */
.kpi-row{background:var(--card);border:1px solid var(--border);border-radius:.75rem;padding:.85rem;display:flex;align-items:center;gap:.85rem;margin-bottom:.4rem}
.kpi-code{font-size:.7rem;font-weight:800;color:var(--cyan);background:rgba(196,162,70,.1);padding:.18rem .5rem;border-radius:.3rem;flex-shrink:0}
.kpi-name{font-size:.8rem;font-weight:700;flex:1}
.kpi-stat{text-align:center;min-width:70px}
.kpi-stat-lbl{font-size:.6rem;color:var(--dim)}
.kpi-stat-val{font-size:.82rem;font-weight:800}
.status-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}


:root/* الهيدر والتوبار */
/* الكاردات العادية - بيضاء مع حد خفيف */
/* كاردات الإحصائيات - gradient أحمر → برتقالي */
/* stat-box في dashboard */
/* كاردات KPI */
/* العناوين الرئيسية */
/* خط تحت العنوان */
/* الحقول والـ inputs */
/* goal-header */
/* الأزرار الرئيسية */
/* path-btn كاردات التنقل */
/* icon-box - برتقالي */
/* select options */
/* modal */
/* tables */
/* badge */
/* back button */
/* alert items */
/* kpi-code badge */
/* field داخل كارد KPI */
/* dim text */

/* ══════════════════════════════════════════════════════
   وضع النهار — مطابق للصور المرجعية
   خلفية بيضاء + كاردات gradient ملوّنة + عناوين عنابي
══════════════════════════════════════════════════════ */

/* ── كاردات الأرقام الرئيسية (stat-card) ─────────────── */

/* ── stat-box في dashboard ────────────────────────────── */

/* ── sum-card كاردات ملخص الأداء ─────────────────────── */

/* ── بطاقات KPI والأهداف ──────────────────────────────── */

/* ── حقول الإدخال ─────────────────────────────────────── */

/* ── الكاردات العامة ──────────────────────────────────── */

/* ── بطاقات التنقل ────────────────────────────────────── */

/* ── الجداول ──────────────────────────────────────────── */

/* ── النصوص والعناوين ─────────────────────────────────── */

/* ── الأزرار ──────────────────────────────────────────── */

/* body لـ dashboard */

/* ══════════════════════════════════════════════════════════════
   وضع النهار الشامل — يغطي كل عنصر في المنصة
   خلفية بيضاء + عنابي + برتقالي + نصوص داكنة
══════════════════════════════════════════════════════════════ */

/* ── المتغيرات الأساسية ───────────────────────────────── */
html {
  --bg:#f9f9f9; --card:#ffffff; --card2:#f4f4f4;
  --border:#e5e5e5; --bhi:#cccccc;
  --teal:#8b1a2a; --cyan:#e8700a; --gold:#f5a623;
  --red:#c0392b; --maroon:#8b1a2a; --purple:#8b1a2a;
  --text:#222222; --dim:#666666; --slate:#888888;
}

/* ── الجسم والخلفية ───────────────────────────────────── */
html body {
  background:#f9f9f9 !important;
  color:#222222 !important;
}

/* ── الهيدر والتوبار ──────────────────────────────────── */
html header,
html .topbar {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  box-shadow:0 1px 6px rgba(0,0,0,.06) !important;
  color:#222222 !important;
}
html header *,
html .topbar * { color:#222222 !important; }
html .back {
  color:#666666 !important;
  border-color:#e5e5e5 !important;
  background:transparent !important;
}
html .back:hover { color:#8b1a2a !important; border-color:#8b1a2a !important; }
html .filters { background:transparent !important; }

/* ── الـ Select و Input ───────────────────────────────── */
html .sel,
html select,
html input,
html textarea,
html .inp,
html .dc-inp,
html .dc-sel {
  background:#f4f4f4 !important;
  color:#222222 !important;
  border-color:#e5e5e5 !important;
}
html select option { background:#ffffff; color:#222222; }
html input::placeholder,
html textarea::placeholder { color:#aaaaaa !important; }

/* ── المحاور والأهداف ────────────────────────────────── */
html .axis-block { background:transparent !important; }
html .axis-header {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  box-shadow:0 1px 4px rgba(0,0,0,.05) !important;
}
html .axis-header * { color:#222222 !important; }
html .goal-block { border-right-color:#e0e0e0 !important; }
html .goal-header {
  background:#fff5f7 !important;
  border-radius:.65rem !important;
}
html .goal-header * { color:#222222 !important; }
html .goal-code { color:#8b1a2a !important; background:rgba(139,26,42,.08) !important; }

/* ── بطاقات المؤشرات KPI ─────────────────────────────── */
html .kpi-card {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  box-shadow:0 2px 8px rgba(0,0,0,.05) !important;
}
html .kpi-card:hover {
  border-color:#e8700a !important;
  box-shadow:0 4px 16px rgba(232,112,10,.12) !important;
}
html .kpi-row { color:#222222 !important; }
html .kpi-name { color:#222222 !important; font-weight:700 !important; }
html .kpi-code {
  color:#8b1a2a !important;
  background:rgba(139,26,42,.08) !important;
}
html .kpi-fields { background:transparent !important; }

/* ── حقول القيم ──────────────────────────────────────── */
html .field {
  background:#f4f4f4 !important;
  border-radius:.4rem !important;
}
html .field-lbl { color:#888888 !important; }
html .field-val { color:#222222 !important; }

/* ── Progress Bar ────────────────────────────────────── */
html .prog { background:#e5e5e5 !important; }
html .prog-fill { opacity:.9 !important; }

/* ── Footer المؤشر والأزرار ──────────────────────────── */
html .kpi-footer { border-top-color:#e5e5e5 !important; }
html .status-badge { font-weight:700 !important; }
html .trend { color:#666666 !important; }

html .btn-analysis {
  background:#8b1a2a !important;
  color:#ffffff !important;
  border:none !important;
}
html .btn-analysis:hover { background:#6d1520 !important; }

/* كل أزرار داخل kpi-card */
html .kpi-card button {
  color:#222222 !important;
}
html .kpi-card button[style*="rgba(255,77"] {
  background:rgba(192,57,43,.1) !important;
  color:#c0392b !important;
  border-color:rgba(192,57,43,.25) !important;
}
html .kpi-card button[style*="rgba(139,26"] {
  background:rgba(139,26,42,.08) !important;
  color:#8b1a2a !important;
  border-color:rgba(139,26,42,.2) !important;
}
html .kpi-card button[style*="rgba(196,162"] {
  background:rgba(232,112,10,.1) !important;
  color:#e8700a !important;
  border-color:rgba(232,112,10,.25) !important;
}

/* ── Modal ───────────────────────────────────────────── */
html .modal-wrap { background:rgba(0,0,0,.5) !important; }
html .modal-box {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  box-shadow:0 8px 32px rgba(0,0,0,.15) !important;
}
html .modal-head {
  background:#8b1a2a !important;
  color:#ffffff !important;
  border-color:#8b1a2a !important;
}
html .modal-head * { color:#ffffff !important; }
html .modal-body { color:#222222 !important; }
html .modal-body * { color:#222222 !important; }
html .close-btn {
  background:rgba(0,0,0,.06) !important;
  color:#444444 !important;
  border-color:#e5e5e5 !important;
}
html .close-btn:hover { background:rgba(139,26,42,.1) !important; color:#8b1a2a !important; }

/* ── أقسام التحليل (q-box, q-grid, dev-box) ─────────── */
html .section-h { color:#8b1a2a !important; border-color:#e5e5e5 !important; }
html .q-grid { background:transparent !important; }
html .q-box {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  color:#222222 !important;
}
html .q-box * { color:#222222 !important; }
html .dev-box {
  background:#fff5f5 !important;
  border-color:#f0d0d0 !important;
}
html .dev-box * { color:#222222 !important; }
html .info-row { color:#444444 !important; }
html .info-row span { color:#666666 !important; }

/* ── بطاقة الانحراف (dc-*) ───────────────────────────── */
html .dc-label { color:#555555 !important; }
html .dc-inp,
html .dc-sel {
  background:#f4f4f4 !important;
  color:#222222 !important;
  border-color:#e5e5e5 !important;
}
html .dc-inp:focus,
html .dc-sel:focus { border-color:#e8700a !important; }
html .dc-grid2 { background:transparent !important; }
html .dc-info {
  background:#f9f9f9 !important;
  border-color:#e5e5e5 !important;
}
html .dc-info * { color:#222222 !important; }

/* ── الكاردات الإحصائية الرئيسية ─────────────────────── */
html .stat-card:nth-child(1) { background:#f5a623 !important; border:none !important; }
html .stat-card:nth-child(2) { background:#e8700a !important; border:none !important; }
html .stat-card:nth-child(3) { background:#e67e22 !important; border:none !important; }
html .stat-card:nth-child(4) { background:#d45f00 !important; border:none !important; }
html .stat-card:nth-child(5) { background:#c0392b !important; border:none !important; }
html .stat-card:nth-child(6) { background:#a93226 !important; border:none !important; }
html .stat-card {
  box-shadow:0 4px 16px rgba(0,0,0,.12) !important;
}
html .stat-card *,
html .stat-card h3,
html .stat-card p { color:#ffffff !important; }

/* ── stat-box dashboard ───────────────────────────────── */
html .stat-box:nth-child(1) { background:#f5a623 !important; border:none !important; }
html .stat-box:nth-child(2) { background:#e8700a !important; border:none !important; }
html .stat-box:nth-child(3) { background:#e67e22 !important; border:none !important; }
html .stat-box:nth-child(4) { background:#c0392b !important; border:none !important; }
html .stat-box { box-shadow:0 4px 14px rgba(0,0,0,.1) !important; border:none !important; }
html .stat-box * { color:#ffffff !important; }

/* ── بطاقات ملخص الأداء العلوية ──────────────────────── */
html #sumPct   { color:#8b1a2a !important; font-weight:800 !important; }
html #sumExceeded { color:#27ae60 !important; }
html #sumAchieved { color:#8b1a2a !important; }
html #sumPartial  { color:#e8700a !important; }
html #sumFailed   { color:#c0392b !important; }
html #sumGoals, html #sumTotal { color:#222222 !important; }

/* بطاقات الملخص (border-top) */
html [style*="border-top:3px solid #059669"] { background:#f0fff8 !important; }
html [style*="border-top:3px solid var(--teal)"] { background:#fff5f7 !important; }
html [style*="border-top:3px solid var(--gold)"] { background:#fffbf0 !important; }
html [style*="border-top:3px solid var(--red)"]  { background:#fff5f5 !important; }
html [style*="border-top:3px solid var(--slate)"] { background:#f9f9f9 !important; }
html [style*="border-top:3px solid"] { color:#222222 !important; }

/* ── الجداول ──────────────────────────────────────────── */
html table,
html .tbl { background:#ffffff !important; color:#222222 !important; }
html .tbl thead th,
html table thead th {
  background:#fff5f7 !important;
  color:#8b1a2a !important;
  border-color:#f0e0dc !important;
}
html .tbl tbody tr:hover,
html table tbody tr:hover { background:#fef9f9 !important; }
html .tbl tbody td,
html table tbody td { color:#222222 !important; border-color:#f5f5f5 !important; }

/* ── بطاقات التنقل ────────────────────────────────────── */
html .path-btn {
  background:#ffffff !important;
  border:1px solid #e5e5e5 !important;
  color:#222222 !important;
  box-shadow:0 2px 8px rgba(0,0,0,.05) !important;
}
html .path-btn:hover {
  border-color:#e8700a !important;
  box-shadow:0 4px 14px rgba(232,112,10,.15) !important;
}
html .icon-box {
  background:linear-gradient(135deg,#c0392b,#e8700a) !important;
}
html .icon-box svg,
html .icon-box * { color:#ffffff !important; stroke:#ffffff !important; }

/* ── Chart containers ─────────────────────────────────── */
html .chart-container,
html .chart-wrap {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  box-shadow:0 2px 8px rgba(0,0,0,.05) !important;
}

/* ── Alert items ──────────────────────────────────────── */
html .alert-item {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  color:#222222 !important;
}
html .alert-item * { color:#222222 !important; }

/* ── إنذار مبكر خاص ──────────────────────────────────── */
html .sum-card {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  color:#222222 !important;
  box-shadow:0 2px 10px rgba(0,0,0,.06) !important;
}

/* ── Badges ───────────────────────────────────────────── */
html .badge { background:rgba(139,26,42,.08) !important; color:#8b1a2a !important; }
html .b-teal { background:rgba(139,26,42,.1) !important; color:#8b1a2a !important; }
html .b-gold { background:rgba(232,112,10,.1) !important; color:#e8700a !important; }
html .b-red  { background:rgba(192,57,43,.1) !important; color:#c0392b !important; }
html .b-gray { background:rgba(0,0,0,.06) !important; color:#666666 !important; }

/* ── أزرار عامة ───────────────────────────────────────── */
html .btn { color:#222222 !important; }
html .btn-teal,
html .btn-primary {
  background:#8b1a2a !important;
  color:#ffffff !important;
  border-color:#8b1a2a !important;
}
html .btn-ghost {
  background:transparent !important;
  color:#666666 !important;
  border-color:#e5e5e5 !important;
}
html .btn-ghost:hover { color:#8b1a2a !important; border-color:#8b1a2a !important; }

/* ── نصوص عامة ────────────────────────────────────────── */
html h1, html h2, html h3 { color:#8b1a2a !important; }
html p  { color:#444444 !important; }
html small, html .text-xs { color:#888888 !important; }
html .text-gray-400 { color:#888888 !important; }
html strong { color:#222222 !important; }

/* inline style overrides بـ var() */
html [style*="color:var(--text)"]   { color:#222222 !important; }
html [style*="color:var(--dim)"]    { color:#888888 !important; }
html [style*="color:var(--slate)"]  { color:#666666 !important; }
html [style*="color:var(--teal)"]   { color:#8b1a2a !important; }
html [style*="color:var(--cyan)"]   { color:#e8700a !important; }
html [style*="color:var(--gold)"]   { color:#f5a623 !important; }
html [style*="color:var(--red)"]    { color:#c0392b !important; }
html [style*="background:var(--card)"]  { background:#ffffff !important; }
html [style*="background:var(--card2)"] { background:#f4f4f4 !important; }
html [style*="background:var(--bg)"]    { background:#f9f9f9 !important; }

/* inline rgba backgrounds */
html [style*="rgba(139,26,58,.07)"]  { background:#fff5f7 !important; }
html [style*="rgba(139,26,58,.08)"]  { background:#fff5f7 !important; }
html [style*="rgba(139,26,58,.1)"]   { background:rgba(139,26,42,.08) !important; }
html [style*="rgba(139,26,58,.12)"]  { background:rgba(139,26,42,.1) !important; }
html [style*="rgba(139,26,58,.15)"]  { background:rgba(139,26,42,.12) !important; }
html [style*="rgba(196,162,70,.07)"] { background:#fffbf0 !important; }
html [style*="rgba(255,77,109,.07)"] { background:#fff5f5 !important; }
html [style*="rgba(255,77,109,.08)"] { background:#fff5f5 !important; }
html [style*="rgba(5,150,105,.08)"]  { background:#f0fff8 !important; }

/* ── Hardcoded dark colors في inline ─────────────────── */
html [style*="color:#07111f"] { color:#222222 !important; }
html [style*="background:#07111f"] { background:#f9f9f9 !important; }
html [style*="background:#0d1f33"] { background:#ffffff !important; }
html [style*="background:#0a1b2e"] { background:#f4f4f4 !important; }
html [style*="background:#1a3650"] { background:#e5e5e5 !important; }
html [style*="background:#1f4a6e"] { background:#8b1a2a !important; }

/* ── grid و wrap ──────────────────────────────────────── */
html .wrap { background:transparent !important; }
html .card-block,
html .card {
  background:#ffffff !important;
  border-color:#e5e5e5 !important;
  box-shadow:0 2px 8px rgba(0,0,0,.05) !important;
}

/* ── لوحة الإدارة dashboard خاص ──────────────────────── */
html .tab-btn { color:#666666 !important; border-color:#e5e5e5 !important; }
html .tab-btn.active { color:#8b1a2a !important; border-color:#8b1a2a !important; }
html .card .tbl thead th { background:#fff5f7 !important; }
html .inp { background:#f4f4f4 !important; color:#222222 !important; }
html .toggle-track { background:#cccccc !important; }
html .toggle-track.active { background:#8b1a2a !important; }

/* body لـ dashboard */
body {
  --bg:#f9f9f9; --card:#ffffff; --card2:#f4f4f4;
  --border:#e5e5e5; --bhi:#cccccc;
  --teal:#8b1a2a; --cyan:#e8700a; --gold:#f5a623;
  --red:#c0392b; --maroon:#8b1a2a;
  --text:#222222; --dim:#666666; --slate:#888888;
}


/* ══ أيقونات وبطاقات التنقل في وضع النهار ══════════════ */

/* tab-path-btn — بطاقات لوحة الإدارة */
html .tab-path-btn {
  background: #ffffff !important;
  border-color: #e5e5e5 !important;
  color: #222222 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,.05) !important;
}
html .tab-path-btn:hover {
  border-color: #e8700a !important;
  box-shadow: 0 6px 20px rgba(232,112,10,.15) !important;
  transform: translateY(-3px) !important;
}
html .tab-path-btn.active {
  border-color: #8b1a2a !important;
  box-shadow: 0 4px 16px rgba(139,26,42,.2) !important;
  background: #fff5f7 !important;
}

/* tab-path-icon — كل الأيقونات تصبح برتقالية */
html .tab-path-icon {
  background: rgba(232,112,10,.12) !important;
  color: #e8700a !important;
  border-color: rgba(232,112,10,.25) !important;
}
html .tab-path-btn.active .tab-path-icon {
  background: linear-gradient(135deg,#c0392b,#e8700a) !important;
  color: #ffffff !important;
  border-color: transparent !important;
}
html .tab-path-icon svg {
  stroke: currentColor !important;
}

/* tab-path-label و tab-path-desc */
html .tab-path-label { color: #222222 !important; }
html .tab-path-btn.active .tab-path-label { color: #8b1a2a !important; }
html .tab-path-desc { color: #888888 !important; }

/* إلغاء الألوان الـ inline على tab-path-label */
html .tab-path-label[style*="color:#8b1a3a"] { color: #8b1a2a !important; }
html .tab-path-label[style*="color:#c4a246"] { color: #e8700a !important; }
html .tab-path-label[style*="color:#059669"] { color: #27ae60 !important; }
html .tab-path-label[style*="color:#ff4d6d"] { color: #c0392b !important; }
html .tab-path-label[style*="color:#a78bfa"] { color: #8b1a2a !important; }
html .tab-path-label[style*="color:#d4af37"] { color: #e8700a !important; }

/* كل inline style على tab-path-icon */
html .tab-path-icon[style] {
  background: rgba(232,112,10,.12) !important;
  color: #e8700a !important;
  border-color: rgba(232,112,10,.25) !important;
}

/* path-btn بطاقات index.php */
html .path-btn {
  background: #ffffff !important;
  border: 1px solid #e5e5e5 !important;
  color: #222222 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,.05) !important;
}
html .path-btn:hover {
  border-color: #e8700a !important;
  box-shadow: 0 6px 18px rgba(232,112,10,.15) !important;
  transform: translateY(-4px) !important;
}
html .path-btn .icon-box,
html .icon-box {
  background: linear-gradient(135deg,#c0392b,#e8700a) !important;
  color: #ffffff !important;
}
html .path-btn .icon-box svg,
html .icon-box svg {
  stroke: #ffffff !important;
  color: #ffffff !important;
}
html .path-btn h3,
html .path-btn .font-bold { color: #8b1a2a !important; }
html .path-btn p,
html .path-btn .text-sm { color: #666666 !important; }

/* الأيقونات داخل stat-card و stat-box */
html .stat-card svg,
html .stat-box svg { stroke: #ffffff !important; color: #ffffff !important; }

/* كل SVG في الكاردات في وضع النهار */
html .kpi-card svg { stroke: var(--teal) !important; }
html .alert-item svg { stroke: #c0392b !important; }

/* inline style overrides للأيقونات */
html [style*="background:rgba(139,26,58,.12)"],
html [style*="background:rgba(139,26,58, .12)"] {
  background: rgba(232,112,10,.12) !important;
}
html [style*="background:rgba(196,162,70,.12)"] {
  background: rgba(232,112,10,.12) !important;
}
html [style*="background:rgba(5,150,105,.12)"] {
  background: rgba(39,174,96,.12) !important;
}
html [style*="background:rgba(255,77,109,.12)"] {
  background: rgba(192,57,43,.12) !important;
}
html [style*="background:rgba(167,139,250,.12)"] {
  background: rgba(139,26,42,.1) !important;
}
html [style*="background:rgba(212,175,55,.12)"] {
  background: rgba(232,112,10,.12) !important;
}
/* ألوان النص للأيقونات */
html [style*="color:#8b1a3a"],
html [style*="color: #8b1a3a"] { color: #8b1a2a !important; }
html [style*="color:#c4a246"] { color: #e8700a !important; }
html [style*="color:#d4af37"] { color: #e8700a !important; }
html [style*="color:#a78bfa"] { color: #8b1a2a !important; }
html [style*="color:#ff4d6d"] { color: #c0392b !important; }
html [style*="color:#059669"] { color: #27ae60 !important; }
html [style*="color:#64748b"] { color: #888888 !important; }
html [style*="color:#94a3b8"] { color: #888888 !important; }
html [style*="color:#e2eaf4"] { color: #222222 !important; }
@media (max-width: 900px) {
  .topbar { padding: .85rem 1rem; }
  .wrap { padding: 1rem; }
}
@media (max-width: 640px) {
  .topbar > div:first-child,
  .dept-header,
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .topbar > div:last-child {
    width: 100%;
  }
  .topbar > div:last-child .sel {
    flex: 1 1 calc(50% - .25rem);
    min-width: 0;
  }
  #pageDesc {
    max-width: none !important;
    padding: .75rem .85rem !important;
  }
  .kpi-row {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: .6rem;
  }
  .kpi-stat {
    flex: 1 1 calc(50% - .4rem);
    min-width: 120px;
    background: var(--card2);
    border-radius: .55rem;
    padding: .45rem .5rem;
  }
  #mainContent [style*="margin-right:auto"] {
    margin-right: 0 !important;
    width: 100%;
    flex-wrap: wrap;
  }
}

</style>
</head>
<body>

<header class="topbar">
  <div style="display:flex;align-items:center;gap:1rem">
    <a href="index.php" class="back">← الرئيسية</a>
    <div>
      <h1 style="font-size:1rem;font-weight:800;color:var(--cyan);display:flex;align-items:center;gap:.45rem"><svg viewBox="0 0 24 24" aria-hidden="true" style="width:1rem;height:1rem;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .37.21.72.6 1a1.7 1.7 0 0 1 0 2c-.39.28-.6.63-.6 1z"></path></svg><span>مسار الأداء التشغيلي</span></h1>
      <p style="font-size:.7rem;color:var(--dim)" id="pageSubTitle">جمعية الزاد 2026 · الربع الأول</p>
<div id="pageDesc" style="max-width:700px;margin:.75rem 0 0;padding:.9rem 1.1rem;background:rgba(139,26,42,.04);border-right:3px solid var(--teal);border-radius:0 .5rem .5rem 0">
  <p style="font-size:.78rem;color:var(--dim);line-height:1.8;margin-bottom:.6rem">يختص هذا المسار بقياس كفاءة التنفيذ التشغيلي للإدارات، من خلال متابعة الأهداف والمؤشرات ومقارنة المتحقق الفعلي بالمستهدف المعتمد، بما يُبرز أثر التنفيذ ويؤكد اتساقه مع المسار الاستراتيجي</p>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.35rem .9rem">
    <li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الهدف التشغيلي لكل إدارة أو قسم</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المؤشر التشغيلي المرتبط بالهدف</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>خط الأساس التشغيلي</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المستهدف المعتمد للفترة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المتحقق الفعلي</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>نسبة التحقق</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الجهة المالكة للمؤشر</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الربط بالمؤشر أو الهدف الاستراتيجي (عند وجوده)</li>
  </ul>
</div>
    </div>
  </div>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap">
    <select class="sel" id="fYear" onchange="load()"><option value="2026">2026</option>
<option value="2027">2027</option>
<option value="2028">2028</option>
<option value="2029">2029</option>
<option value="2030">2030</option>
<option value="2025">2025</option>
<option value="2024">2024</option></select>
    <select class="sel" id="fQ" onchange="load()">
      <option value="1">الربع الأول</option><option value="2">الربع الثاني</option>
      <option value="3">الربع الثالث</option><option value="4">الربع الرابع</option>
    </select>
	    <select class="sel" id="fDept" onchange="filterDept()">
	<option value="">كل الإدارات</option>
	</select>
  </div>
      
</header>

<div class="wrap">
  <!-- مقارنة ربع بربع -->
  <div class="card fade" style="margin-bottom:1.5rem">
    <h2 style="font-size:.88rem;font-weight:800;color:var(--slate);margin-bottom:1rem"> التحليل المقارن لأداء الإدارات</h2>
    <div style="height:200px"><canvas id="qChart"></canvas></div>
  </div>

  <!-- أداء الإدارات كنسب -->
  <div style="margin-bottom:1.5rem">
    <h2 style="font-size:.88rem;font-weight:800;color:var(--slate);margin-bottom:.85rem"> تحليل الأداء التشغيلي للإدارات</h2>
    <div id="deptSummary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.75rem"></div>
  </div>

  <!-- الهيكل التفصيلي: إدارة ← هدف ← مؤشرات -->
  <div id="mainContent">
    <div style="text-align:center;padding:4rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
  </div>
</div>

<script>
const API='api.php';
const QN=['','الأول','الثاني','الثالث','الرابع'];
const SC={exceeded:'#059669',achieved:'#8b1a3a',partial:'#d4af37',not_achieved:'#ff4d6d',pending:'#64748b'};
const SL={exceeded:'✅ متجاوز',achieved:'🟢 متحقق',partial:'🟡 جزئي',not_achieved:'🔴 غير متحقق',pending:'⏳ انتظار'};
const COLORS=['#8b1a3a','#c4a246','#d4af37','#a78bfa','#fb7185','#34d399'];
const jsonRequestCache = new Map();
let allKpis=[], qChartObj;

function fetchJsonCached(url, ttl = 30000){
  const now = Date.now();
  const cached = jsonRequestCache.get(url);
  if(cached?.data !== undefined && (now - cached.time) < ttl){
    return Promise.resolve(cached.data);
  }
  if(cached?.promise){
    return cached.promise;
  }
  const promise = fetch(url)
    .then(r=>r.json())
    .then(data=>{
      jsonRequestCache.set(url,{data,time:Date.now()});
      return data;
    })
    .catch(error=>{
      jsonRequestCache.delete(url);
      throw error;
    });
  jsonRequestCache.set(url,{promise,time:now});
  return promise;
}

function clearJsonCache(){
  jsonRequestCache.clear();
}

window.addEventListener('DOMContentLoaded',()=>{
  initQChart();
  load();
});

function initQChart(){
  qChartObj=new Chart(document.getElementById('qChart').getContext('2d'),{
    type:'bar',
    data:{labels:['الربع الأول','الربع الثاني','الربع الثالث','الربع الرابع','إدارة مرجعية'],datasets:[]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:true,position:'bottom',labels:{color:'#64748b',font:{size:10},padding:8}}},
      scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+'%',color:'#64748b'},grid:{color:'#e5e5e5'}},
              x:{ticks:{color:'#64748b'},grid:{color:'#e5e5e5'}}}}
  });
}

async function load(){
  const yr=document.getElementById('fYear').value;
  const q=document.getElementById('fQ').value;
  document.getElementById('pageSubTitle').textContent=`جمعية الزاد ${yr} · الربع ${QN[q]}`;
  try{
    allKpis=await fetchJsonCached(`${API}?endpoint=kpis&type=operational&year=${yr}&quarter=${q}`);
    buildDeptFilter();
    renderDeptSummary();
    renderContent();
    await loadQChart(yr);
  }catch(e){document.getElementById('mainContent').innerHTML='<div style="text-align:center;padding:3rem;color:var(--red)"> خطأ في التحميل</div>';}
}

function buildDeptFilter(){
  const depts=[...new Set(allKpis.map(k=>k.owner_dept||'غير محدد'))];
  const sel=document.getElementById('fDept');
  sel.innerHTML='<option value="">كل الإدارات</option>';
  depts.forEach(d=>sel.insertAdjacentHTML('beforeend',`<option value="${d}">${d}</option>`));
}

function renderDeptSummary(){
  const depts={};
  allKpis.forEach(k=>{
    const d=(k.owner_dept||'غير محدد').trim();
    if(!depts[d]) depts[d]={total:0,wd:0,sum:0};
    depts[d].total++;
    if(k.q_actual!==null&&k.q_target>0){depts[d].wd++;depts[d].sum+=Math.min(k.q_actual/k.q_target*100,100);}
  });
  const cont=document.getElementById('deptSummary');
  cont.innerHTML='';
  Object.entries(depts).forEach(([d,data],i)=>{
    const pct=data.wd?Math.round(data.sum/data.wd):0;
    const c=COLORS[i%COLORS.length];
    cont.insertAdjacentHTML('beforeend',`
      <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid ${c};border-radius:.85rem;padding:1rem;cursor:pointer"
           onclick="document.getElementById('fDept').value='${d}';filterDept()">
        <p style="font-size:.75rem;font-weight:800;color:${c};margin-bottom:.5rem">${d}</p>
        <p style="font-size:1.5rem;font-weight:800;margin-bottom:.35rem">${pct}%</p>
        <div class="prog"><div class="prog-fill" style="background:${c};width:${pct}%"></div></div>
        <p style="font-size:.65rem;color:var(--dim);margin-top:.3rem">${data.total} مؤشر</p>
      </div>`);
  });
}

function renderContent(){
  const fDept=document.getElementById('fDept').value;
  const yr=document.getElementById('fYear').value;
  const cont=document.getElementById('mainContent');
  cont.innerHTML='';

  // تجميع: إدارة ← هدف ← مؤشرات
  const deptMap={};
  allKpis.forEach(k=>{
    const d=(k.owner_dept||'غير محدد').trim();
    if(fDept&&d!==fDept) return;
    if(!deptMap[d]) deptMap[d]={};
    const g=k.goal_code||'عام';
    if(!deptMap[d][g]) deptMap[d][g]=[];
    deptMap[d][g].push(k);
  });

  if(!Object.keys(deptMap).length){
    cont.innerHTML='<div style="text-align:center;padding:3rem;color:var(--dim)">لا توجد بيانات للإدارة المحددة</div>';
    return;
  }

  Object.entries(deptMap).forEach(([dept,goals],di)=>{
    const c=COLORS[di%COLORS.length];
    const allInDept=Object.values(goals).flat();
    const wd=allInDept.filter(k=>k.q_actual!==null&&k.q_target>0);
    const dPct=wd.length?Math.round(wd.reduce((s,k)=>s+Math.min(k.q_actual/k.q_target*100,100),0)/wd.length):0;

    const dBlock=document.createElement('div');
    dBlock.className='dept-block fade';
    dBlock.dataset.dept=dept;
    dBlock.innerHTML=`
      <div class="dept-header" style="border-right:4px solid ${c}">
        <h2 style="font-size:.92rem;font-weight:800;color:${c}">المؤشرات التشغيلية لإدارة ${dept}</h2>
        <span style="font-size:1.2rem;font-weight:800;color:${c}">${dPct}%</span>
      </div>`;
    cont.appendChild(dBlock);

    Object.entries(goals).forEach(([goalCode,kpis])=>{
      const sc={exceeded:0,achieved:0,partial:0,not_achieved:0,pending:0};
      kpis.forEach(k=>sc[k.q_status||'pending']++);
      const gDiv=document.createElement('div');
      gDiv.className='goal-block';
      gDiv.style.borderRightColor=c+'50';
      gDiv.innerHTML=`
        <div class="goal-header">
          <span style="font-size:.7rem;font-weight:800;color:${c};background:${c}18;padding:.18rem .5rem;border-radius:.3rem">${goalCode}</span>
          <span style="font-size:.78rem;color:var(--slate)">${kpis.length} مؤشر</span>
          <div style="margin-right:auto;display:flex;gap:.3rem">
            ${Object.entries(sc).filter(([,v])=>v>0).map(([s,v])=>
              `<span style="font-size:.65rem;font-weight:700;color:${SC[s]};background:${SC[s]}15;padding:.12rem .4rem;border-radius:99px">${v} ${SL[s]}</span>`
            ).join('')}
          </div>
        </div>`;

      kpis.forEach((k,ki)=>{
        const pct=k.q_target>0&&k.q_actual!==null?Math.round(k.q_actual/k.q_target*100):null;
        const sc2=SC[k.q_status||'pending'];
        const row=document.createElement('div');
        row.className='kpi-row';
        row.innerHTML=`
          <div class="status-dot" style="background:${sc2}"></div>
          <span style="font-size:.68rem;font-weight:800;color:var(--slate);min-width:18px;text-align:center">${ki+1}</span>
          <span class="kpi-code">${k.code}</span>
          <div style="flex:1;min-width:0">
            <span class="kpi-name">${k.name.substring(0,45)}${k.name.length>45?'…':''}</span>
            ${k.description?`<div style="font-size:.67rem;color:var(--slate);margin-top:.2rem;line-height:1.4">${k.description.substring(0,100)}${k.description.length>100?'…':''}</div>`:''}
          </div>
          <div class="kpi-stat">
            <div class="kpi-stat-lbl">خط الاساس</div>
            <div class="kpi-stat-val">${fmt(k.baseline)}</div>
          </div>
          <div class="kpi-stat">
            <div class="kpi-stat-lbl">مستهدف ${yr}</div>
            <div class="kpi-stat-val">${fmt(k.annual_target)}</div>
          </div>
          <div class="kpi-stat">
            <div class="kpi-stat-lbl">المستهدف الربعي</div>
            <div class="kpi-stat-val">${fmt(k.q_target)}</div>
          </div>
          <div class="kpi-stat">
            <div class="kpi-stat-lbl">المتحقق الفعلي</div>
            <div class="kpi-stat-val" style="color:${sc2}">${k.q_actual!==null?fmt(k.q_actual):'—'}</div>
          </div>
          <div class="kpi-stat">
            <div class="kpi-stat-lbl">نسبة الإنجاز</div>
            <div class="kpi-stat-val" style="color:${sc2}">${pct!==null?pct+'%':'—'}</div>
          </div>
          ${k.strat_link ? `<div class="kpi-stat" style="border-right:2px solid var(--teal);padding-right:.55rem;margin-right:.3rem">
            <div class="kpi-stat-lbl" style="color:var(--teal);font-size:.62rem">ارتباط استراتيجي</div>
            <div class="kpi-stat-val" style="color:var(--teal);font-size:.68rem;font-weight:800">${k.strat_link}</div>
          </div>` : ''}`;
        gDiv.appendChild(row);
      });
      dBlock.appendChild(gDiv);
    });
  });
}

function filterDept(){renderContent();}

function getFeaturedDept(allDepts){
  return allDepts.find(d=>/الاداء|الأداء/u.test(d)) || allDepts[0] || '';
}

async function loadQChart(yr){
  try{
    const allDepts=[...new Set(allKpis.map(k=>(k.owner_dept||'').trim()).filter(Boolean))];
    const TARGET=getFeaturedDept(allDepts);
    const otherDepts=allDepts.filter(d=>d!==TARGET);
    const qs=await Promise.all([1,2,3,4].map(q=>fetchJsonCached(`${API}?endpoint=kpis&type=operational&year=${yr}&quarter=${q}`)));
    const datasets=[];
    otherDepts.forEach((d,i)=>{
      datasets.push({label:d,data:[...qs.map(qKpis=>{const dk=qKpis.filter(k=>(k.owner_dept||'').trim()===d&&k.q_actual!==null&&k.q_target>0);return dk.length?Math.round(dk.reduce((s,k)=>s+Math.min(k.q_actual/k.q_target*100,100),0)/dk.length):null;}),null],backgroundColor:COLORS[i%COLORS.length]+'BB',borderRadius:4});
    });
    if(TARGET){
      const perfIdx=allDepts.indexOf(TARGET);
      const perfColor=perfIdx>=0?COLORS[perfIdx%COLORS.length]:'#fb7185';
      const perfAll=qs.flatMap(q=>q).filter(k=>(k.owner_dept||'').trim()===TARGET&&k.q_actual!==null&&k.q_target>0);
      const perfAvg=perfAll.length?Math.round(perfAll.reduce((s,k)=>s+Math.min(k.q_actual/k.q_target*100,100),0)/perfAll.length):null;
      datasets.push({label:TARGET,data:[null,null,null,null,perfAvg],backgroundColor:perfColor+'DD',borderColor:perfColor,borderWidth:2,borderRadius:6});
    }
    qChartObj.data.datasets=datasets;
    qChartObj.update();
  }catch(e){console.warn(e);}
}

function fmt(n){if(n===null||n===undefined)return'—';const v=+n;if(isNaN(v))return n;if(v>=1000000)return(v/1000000).toFixed(1)+'م';if(v>=1000)return(v/1000).toFixed(1)+'ك';if(v>0&&v<1)return(v*100).toFixed(1)+'%';return v.toLocaleString('ar-SA',{maximumFractionDigits:1});}
</script>

<!-- Modal تعديل قيمة تشغيلي -->
<div id="operQuickModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto">
  <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:420px;padding:1.5rem;margin:1.5rem auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <div>
        <span id="oqCode" style="font-size:.7rem;font-weight:800;color:var(--cyan);background:rgba(196,162,70,.1);padding:.2rem .55rem;border-radius:.3rem"></span>
        <h3 id="oqName" style="font-size:.88rem;font-weight:800;margin-top:.3rem"></h3>
      </div>
      <button onclick="closeOperQuickEdit()" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .6rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.75rem">✕</button>
    </div>
    <input type="hidden" id="oqKpiId"><input type="hidden" id="oqYear"><input type="hidden" id="oqQ">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-bottom:.75rem">
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">المستهدف الربعي</label><input id="oqTarget" type="number" step="any" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none" placeholder="0"></div>
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">القيمة الفعلية *</label><input id="oqActual" type="number" step="any" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none" placeholder="0"></div>
    </div>
    <div style="margin-bottom:1rem"><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">ملاحظات</label><input id="oqNotes" type="text" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none" placeholder="اختياري…"></div>
    <div style="display:flex;gap:.65rem">
      <button onclick="closeOperQuickEdit()" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.8rem;cursor:pointer">إلغاء</button>
      <button onclick="saveOperQuick()" style="flex:2;background:var(--teal);color:#fff;border:none;border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer">💾 حفظ القيمة</button>
    </div>
  </div>
</div>
<div id="operToast" style="position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#0d1f33;border:1px solid var(--border);color:var(--text);padding:.65rem 1.4rem;border-radius:99px;font-size:.82rem;font-weight:700;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap"></div>
<script>
function openOperQuickEdit(kpiId,yr,q,code,name,target,actual){
  document.getElementById('operQuickModal').style.display='flex';
  document.getElementById('oqKpiId').value=kpiId;
  document.getElementById('oqYear').value=yr;
  document.getElementById('oqQ').value=q;
  document.getElementById('oqCode').textContent=code;
  document.getElementById('oqName').textContent=name;
  document.getElementById('oqTarget').value=target||'';
  document.getElementById('oqActual').value=actual||'';
  document.getElementById('oqNotes').value='';
}
function closeOperQuickEdit(){document.getElementById('operQuickModal').style.display='none';}
async function saveOperQuick(){
  const kpiId=document.getElementById('oqKpiId').value;
  const yr=document.getElementById('oqYear').value;
  const q=document.getElementById('oqQ').value;
  const target=document.getElementById('oqTarget').value;
  const actual=document.getElementById('oqActual').value;
  if(actual===''){alert('⚠️ أدخل القيمة الفعلية');return;}
  try{
    const r=await fetch('api.php?endpoint=kpi_values',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kpi_id:+kpiId,year:+yr,quarter:+q,target:+target,actual:+actual,notes:document.getElementById('oqNotes').value})});
    const d=await r.json();
    if(d.success){
      clearJsonCache();
      closeOperQuickEdit();
      const t=document.getElementById('operToast');
      t.textContent='✅ تم الحفظ · الإنجاز: '+(d.achievement??'—')+'%';
      t.style.opacity='1';setTimeout(()=>t.style.opacity='0',2500);
      load();
    }
  }catch(e){alert('❌ خطأ');}
}

// ── نظام الوضع النهاري/الليلي ──────────────────────────
function togglePageTheme(){}
</script>
</body>
</html>
