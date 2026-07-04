<?php
// knowledge.php — مسار إدارة المعرفة مع CRUD كامل
session_start();
require_once __DIR__ . '/helpers.php';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>مسار المعرفة | مِقياس</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet">
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
.btn{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .9rem;border-radius:.6rem;font-size:.78rem;font-weight:700;border:none;cursor:pointer;font-family:'Almarai',sans-serif;transition:all .2s}
.btn-teal{background:var(--teal);color:#fff}.btn-teal:hover{opacity:.88}
.btn-ghost{background:transparent;color:var(--slate);border:1px solid var(--border)}.btn-ghost:hover{border-color:var(--bhi);color:var(--text)}
.btn-red{background:rgba(255,77,109,.12);color:var(--red);border:1px solid rgba(255,77,109,.25)}.btn-red:hover{background:rgba(255,77,109,.22)}
.btn-sm{padding:.28rem .6rem;font-size:.7rem}
.wrap{max-width:1100px;margin:0 auto;padding:1.5rem}
#pageDesc{max-width:620px !important;margin:.4rem 0 0 !important;padding:.6rem .85rem !important;border-radius:0 .45rem .45rem 0 !important}
#pageDesc p{font-size:.72rem !important;line-height:1.65 !important;margin-bottom:.35rem !important}
#pageDesc ul{gap:.2rem .7rem !important}
#pageDesc li{font-size:.68rem !important}
.card{background:var(--card);border:1px solid var(--border);border-radius:1.1rem;padding:1.5rem}
.metric-card{background:var(--card);border:1px solid var(--border);border-radius:.95rem;padding:1.1rem;text-align:center}
.asset-card{background:var(--card2);border:1px solid var(--border);border-radius:.8rem;padding:.9rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.5rem;transition:border-color .2s}
.asset-card:hover{border-color:var(--bhi)}
.inp{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none}
.inp:focus{border-color:var(--bhi)}
.modal-wrap{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:560px;padding:1.5rem;margin:1rem auto}
.toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#0d1f33;border:1px solid var(--border);color:var(--text);padding:.65rem 1.4rem;border-radius:99px;font-size:.82rem;font-weight:700;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
.toast.show{opacity:1}


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
@media (max-width: 640px) {
  .topbar { padding: .85rem 1rem; }
  .topbar > div:first-child,
  .topbar > div:last-child,
  .asset-card {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
  .wrap { padding: 1rem; }
  #pageDesc {
    max-width: none !important;
    padding: .75rem .85rem !important;
  }
  .card,
  .modal-box {
    padding: 1rem;
  }
  .toast {
    max-width: calc(100vw - 2rem);
    white-space: normal;
    text-align: center;
  }
  [style*="grid-template-columns:1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
}

</style>
</head>
<body>
<div class="toast" id="toast"></div>
<header class="topbar">
  <div style="display:flex;align-items:center;gap:1rem">
    <a href="index.php" class="back">← الرئيسية</a>
    <div>
      <h1 style="font-size:1rem;font-weight:800;color:var(--gold)">📚 مسار المعرفة</h1>
      <p style="font-size:.7rem;color:var(--dim)">جمعية الزاد 2026 · الربع الأول</p>
<div id="pageDesc" style="max-width:700px;margin:.75rem 0 0;padding:.9rem 1.1rem;background:rgba(139,26,42,.04);border-right:3px solid var(--teal);border-radius:0 .5rem .5rem 0">
  <p style="font-size:.78rem;color:var(--dim);line-height:1.8;margin-bottom:.6rem">قياس رقمي لمستوى نضج إدارة المعرفة بالجمعية</p>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.35rem .9rem">
    <li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدد أصول المعرفة خلال الربع</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>نسبة الأصول المعتمدة (%)</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>نسبة الأصول المستخدمة (%)</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>معدل نمو المعرفة مقارنة بالربع السابق (%)</li>
  </ul>
</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:.75rem">
    <span id="memoryRate" style="font-size:.82rem;font-weight:800;color:var(--gold)">—</span>
  </div>
      
</header>
<div class="wrap">
  <!-- مؤشرات المعرفة -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem;margin-bottom:1.5rem">
    <div class="metric-card fade" style="border-top:3px solid var(--gold)"><div style="font-size:1.8rem;font-weight:800;color:var(--gold)" id="mTotal">—</div><div style="font-size:.72rem;color:var(--slate);margin-top:.25rem">إجمالي الأصول المعرفية</div></div>
    <div class="metric-card fade" style="border-top:3px solid var(--teal);animation-delay:.05s"><div style="font-size:1.8rem;font-weight:800;color:var(--teal)" id="mActive">—</div><div style="font-size:.72rem;color:var(--slate);margin-top:.25rem">نسبة الأصول المعتمدة</div></div>
    <div class="metric-card fade" style="border-top:3px solid var(--cyan);animation-delay:.1s"><div style="font-size:1.8rem;font-weight:800;color:var(--cyan)" id="mLinked">—</div><div style="font-size:.72rem;color:var(--slate);margin-top:.25rem">نسبة الأصول المستخدمة</div></div>
    <div class="metric-card fade" style="border-top:3px solid var(--purple);animation-delay:.15s"><div style="font-size:1.8rem;font-weight:800;color:var(--purple)" id="mDecision">—</div><div style="font-size:.72rem;color:var(--slate);margin-top:.25rem">مرتبطة بمؤشرات أداء</div></div>
  </div>
  <!-- فلاتر -->
  <div style="display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
    <select class="sel" id="kYear" onchange="load()" style="padding:.38rem .75rem;font-size:.78rem">
      <option value="2026">2026</option>
      <option value="2025">2025</option>
      <option value="2027">2027</option>
    </select>
    <select class="sel" id="kQ" onchange="load()" style="padding:.38rem .75rem;font-size:.78rem">
      <option value="1">الربع الأول</option>
      <option value="2">الربع الثاني</option>
      <option value="3">الربع الثالث</option>
      <option value="4">الربع الرابع</option>
    </select>
    <select class="inp" id="filterType" onchange="renderList()" style="width:auto;padding:.4rem .8rem;font-size:.78rem">
      <option value="">كل الأنواع</option>
      <option value="policy">سياسة</option>
      <option value="procedure">إجراء</option>
      <option value="lesson">درس مستفاد</option>
      <option value="best_practice">أفضل ممارسة</option>
      <option value="report">تقرير</option>
      <option value="template">نموذج</option>
      <option value="other">أخرى</option>
    </select>
    <select class="inp" id="filterStatus" onchange="renderList()" style="width:auto;padding:.4rem .8rem;font-size:.78rem">
      <option value="">كل الحالات</option>
      <option value="active">نشط</option>
      <option value="draft">مسودة</option>
      <option value="under_review">قيد المراجعة</option>
      <option value="archived">مؤرشف</option>
    </select>
    <button class="btn btn-ghost" style="padding:.4rem .8rem;font-size:.78rem" onclick="load()">🔄 تحديث</button>
  </div>
  <!-- قائمة الأصول -->
  <div id="assetsList"><div style="text-align:center;padding:3rem;color:var(--dim)">⏳ جارٍ التحميل…</div></div>
</div>
<!-- Modal -->
<div class="modal-wrap" id="knowModal">
  <div class="modal-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
      <h3 id="modalTitle" style="font-size:.95rem;font-weight:800;color:var(--gold)">＋ إضافة أصل معرفي</h3>
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
    </div>
    <input type="hidden" id="knowId">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الرمز *</label><input class="inp" id="knowCode" placeholder="KA-009"></div>
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">النوع</label>
        <select class="inp" id="knowType">
          <option value="policy">سياسة</option><option value="procedure">إجراء</option>
          <option value="lesson">درس مستفاد</option><option value="best_practice">أفضل ممارسة</option>
          <option value="report">تقرير</option><option value="template">نموذج</option><option value="other">أخرى</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:.75rem"><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">العنوان *</label><input class="inp" id="knowTitle" placeholder="عنوان الأصل المعرفي…"></div>
    <div style="margin-bottom:.75rem"><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الوصف</label><textarea class="inp" id="knowDesc" rows="2" style="resize:none" placeholder="وصف مختصر…"></textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الجهة المالكة</label><input class="inp" id="knowOwner" list="deptOptions" placeholder="اختر أو اكتب الجهة"></div>
      <datalist id="deptOptions"></datalist>
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الحالة</label>
        <select class="inp" id="knowStatus">
          <option value="draft">مسودة</option><option value="active">نشط</option>
          <option value="under_review">قيد المراجعة</option><option value="archived">مؤرشف</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:.75rem"><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">معتمد من</label><input class="inp" id="knowApproved" placeholder="اسم المعتمِد"></div>
    <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:1.25rem;background:var(--card2);border-radius:.55rem;padding:.65rem .85rem">
      <input type="checkbox" id="knowUsed" style="width:16px;height:16px;cursor:pointer">
      <label for="knowUsed" style="font-size:.8rem;cursor:pointer">هذا الأصل استُخدم في اتخاذ قرار مؤسسي</label>
    </div>
    <div style="display:flex;gap:.65rem">
      <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="closeModal()">إلغاء</button>
      <button class="btn btn-teal" style="flex:2;justify-content:center" onclick="saveKnow()">💾 حفظ الأصل المعرفي</button>
    </div>
  </div>
</div>
<script>
const API='api.php';
let allAssets=[];
let deptOptionsPromise=null;
const TYPE_LABELS={policy:'📋 سياسة',procedure:'⚙️ إجراء',lesson:'💡 درس مستفاد',best_practice:'⭐ أفضل ممارسة',report:'📊 تقرير',template:'📄 نموذج',other:'📁 أخرى'};
const TYPE_COLORS={policy:'#8b1a3a',procedure:'#c4a246',lesson:'#a78bfa',best_practice:'#fbbf24',report:'#d4af37',template:'#94a3b8',other:'#64748b'};
const STATUS_C={draft:'#64748b',active:'#8b1a3a',under_review:'#d4af37',archived:'#94a3b8'};
const STATUS_L={draft:'مسودة',active:'✅ نشط',under_review:'🔄 قيد المراجعة',archived:'📦 مؤرشف'};
window.addEventListener('DOMContentLoaded',load);
async function loadDeptOptions(){
  if(deptOptionsPromise) return deptOptionsPromise;
  deptOptionsPromise=fetch(`${API}?endpoint=departments`).then(r=>r.json()).then(rows=>{
    const names=[];
    (Array.isArray(rows)?rows:[]).forEach(dept=>{
      const deptName=(dept.dept_name||'').trim();
      if(deptName) names.push(deptName);
      (Array.isArray(dept.sections)?dept.sections:[]).forEach(section=>{
        const sectionName=(section.section_name||'').trim();
        if(sectionName) names.push(sectionName);
      });
    });
    const list=document.getElementById('deptOptions');
    if(list){
      list.innerHTML='';
      [...new Set(names)].sort((a,b)=>a.localeCompare(b,'ar')).forEach(name=>{
        const option=document.createElement('option');
        option.value=name;
        list.appendChild(option);
      });
    }
    return names;
  }).catch(()=>[]);
  return deptOptionsPromise;
}
async function load(){
  try{
    await loadDeptOptions();
    const yr=document.getElementById('kYear')?.value||2026;
    const q=document.getElementById('kQ')?.value||1;
    const QNK={1:'الربع الأول',2:'الربع الثاني',3:'الربع الثالث',4:'الربع الرابع'};
    const _subK=document.getElementById('pageSubTitle'); if(_subK) _subK.textContent=`جمعية الزاد ${yr} · ${QNK[q]||'كل الأرباع'}`;
    const all=await fetch(`${API}?endpoint=knowledge&year=${yr}&quarter=${q}`).then(r=>r.json());
    allAssets=Array.isArray(all)?all:[];
    renderMetrics();renderList();
  }catch(e){showToast('❌ خطأ في التحميل','red');}
}
function renderMetrics(){
  const a=allAssets;
  const total=a.length;
  const approved=a.filter(k=>k.status==='active').length;
  const used=a.filter(k=>k.used_in_decision).length;
  // مقاييس الملف: عدد أصول المعرفة، نسبة المعتمدة، نسبة المستخدمة
  document.getElementById('mTotal').textContent=total;
  document.getElementById('mActive').textContent=total?Math.round(approved/total*100)+'%':'—';
  document.getElementById('mLinked').textContent=total?Math.round(used/total*100)+'%':'—';
  document.getElementById('mDecision').textContent=a.filter(k=>k.kpi_id).length;
  const rate=total?Math.round(approved/total*100):0;
  document.getElementById('memoryRate').textContent='معدل النشاط: '+rate+'%';
}
function renderList(){
  const ft=document.getElementById('filterType').value;
  const fs=document.getElementById('filterStatus').value;
  let items=allAssets;
  if(ft) items=items.filter(k=>k.type===ft);
  if(fs) items=items.filter(k=>k.status===fs);
  const cont=document.getElementById('assetsList');
  if(!items.length){cont.innerHTML='<div style="text-align:center;padding:2rem;color:var(--dim)">لا توجد أصول معرفية</div>';return;}
  cont.innerHTML=items.map(k=>{
    const tc=TYPE_COLORS[k.type]||'#64748b';
    const sc=STATUS_C[k.status]||'#64748b';
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:.85rem;padding:1rem;margin-bottom:.5rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;transition:border-color .2s" onmouseover="this.style.borderColor='var(--bhi)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.4rem">
          <span style="font-size:.68rem;font-weight:700;padding:.18rem .5rem;border-radius:99px;color:${tc};background:${tc}15;border:1px solid ${tc}30">${TYPE_LABELS[k.type]||k.type}</span>
          <span style="font-size:.68rem;font-weight:800;color:var(--dim)">${k.code}</span>
          ${k.used_in_decision?'<span style="font-size:.62rem;background:rgba(139,26,58,.1);color:var(--teal);border:1px solid rgba(139,26,58,.2);padding:.1rem .4rem;border-radius:99px">🎯 قرار</span>':''}
          ${k.kpi_id?'<span style="font-size:.62rem;background:rgba(196,162,70,.1);color:var(--cyan);border:1px solid rgba(196,162,70,.2);padding:.1rem .4rem;border-radius:99px">📈 مؤشر</span>':''}
        </div>
        <p style="font-size:.85rem;font-weight:700;margin-bottom:.25rem">${k.title}</p>
        <p style="font-size:.7rem;color:var(--dim)">${k.owner||'—'}${k.approved_by?'  ·  معتمد من: '+k.approved_by:''}</p>
        ${k.description?`<p style="font-size:.72rem;color:var(--slate);margin-top:.3rem">${k.description}</p>`:''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;flex-shrink:0">
        <span style="font-size:.7rem;font-weight:700;padding:.2rem .55rem;border-radius:99px;color:${sc};background:${sc}15;border:1px solid ${sc}25">${STATUS_L[k.status]||k.status}</span>

      </div>
    </div>`;
  }).join('');
}
function openModal(item){
  document.getElementById('knowModal').style.display='flex';
  document.getElementById('knowId').value=item?.id||'';
  document.getElementById('knowCode').value=item?.code||'';
  document.getElementById('knowTitle').value=item?.title||'';
  document.getElementById('knowDesc').value=item?.description||'';
  document.getElementById('knowOwner').value=item?.owner||'';
  document.getElementById('knowType').value=item?.type||'other';
  document.getElementById('knowStatus').value=item?.status||'draft';
  document.getElementById('knowApproved').value=item?.approved_by||'';
  document.getElementById('knowUsed').checked=!!(item?.used_in_decision);
  document.getElementById('modalTitle').textContent=item?'✏️ تعديل أصل معرفي':'＋ إضافة أصل معرفي';
}
function closeModal(){document.getElementById('knowModal').style.display='none';}
async function saveKnow(){
  const id=document.getElementById('knowId').value;
  const data={code:document.getElementById('knowCode').value.trim(),title:document.getElementById('knowTitle').value.trim(),description:document.getElementById('knowDesc').value,owner:document.getElementById('knowOwner').value.trim(),type:document.getElementById('knowType').value,status:document.getElementById('knowStatus').value,approved_by:document.getElementById('knowApproved').value.trim(),used_in_decision:document.getElementById('knowUsed').checked?1:0};
  if(!data.code||!data.title){showToast('⚠️ الرمز والعنوان مطلوبان','gold');return;}
  try{
    const url=id?`${API}?endpoint=knowledge&id=${id}`:`${API}?endpoint=knowledge`;
    const r=await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const d=await r.json();
    if(d.success){showToast(id?'✅ تم التحديث':'✅ تمت الإضافة');closeModal();load();}
    else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ في الاتصال','red');}
}
async function deleteKnow(id){
  if(!confirm('هل تريد حذف هذا الأصل المعرفي؟')) return;
  try{
    const r=await fetch(`${API}?endpoint=knowledge&id=${id}`,{method:'DELETE'});
    const d=await r.json();
    if(d.success){showToast('🗑️ تم الحذف');load();}
    else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ','red');}
}
function showToast(msg,type='teal'){
  const t=document.getElementById('toast');t.textContent=msg;
  t.style.borderColor=type==='red'?'rgba(255,77,109,.4)':type==='gold'?'rgba(212,175,55,.4)':'rgba(139,26,58,.4)';
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);
}

// ── نظام الوضع النهاري/الليلي ──────────────────────────
function togglePageTheme(){}
</script>
</body>
</html>
