<?php
// governance.php — مسار الحوكمة مع CRUD كامل
session_start();
require_once __DIR__ . '/helpers.php';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>الحوكمة | مِقياس</title>
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
.prog{height:8px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden}
.prog-fill{height:100%;border-radius:99px;transition:width 1.4s ease}
.card{background:var(--card);border:1px solid var(--border);border-radius:1.1rem;padding:1.5rem}
.inp{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none}
.inp:focus{border-color:var(--bhi)}
.modal-wrap{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:560px;padding:1.5rem;margin:1rem auto}
.toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#0d1f33;border:1px solid var(--border);color:var(--text);padding:.65rem 1.4rem;border-radius:99px;font-size:.82rem;font-weight:700;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
.toast.show{opacity:1}
.item-row{display:flex;justify-content:space-between;align-items:center;padding:.65rem .85rem;border-bottom:1px solid var(--border);font-size:.8rem;transition:background .15s}
.item-row:last-child{border-bottom:none}
.item-row:hover{background:rgba(255,255,255,.02)}


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
  .item-row {
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
      <h1 style="font-size:1rem;font-weight:800;color:var(--purple)">🏛️ مسار الحوكمة</h1>
      <p style="font-size:.7rem;color:var(--dim)">جمعية الزاد 2026 · الربع الأول</p>
<div id="pageDesc" style="max-width:700px;margin:.75rem 0 0;padding:.9rem 1.1rem;background:rgba(139,26,42,.04);border-right:3px solid var(--teal);border-radius:0 .5rem .5rem 0">
  <p style="font-size:.78rem;color:var(--dim);line-height:1.8;margin-bottom:.6rem">قياس رقمي لمستوى الالتزام الحوكمي</p>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.35rem .9rem">
    <li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدد متطلبات الامتثال المعتمدة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدد المتطلبات المطبقة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>نسبة الامتثال (%)</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدد المتطلبات غير المكتملة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدد الملاحظات القائمة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدد الملاحظات المغلقة خلال الربع</li>
  </ul>
</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:.75rem">
    <span id="overallPct" style="font-size:.92rem;font-weight:800;color:var(--purple)">—</span>
  </div>
      
</header>
<div class="wrap">
  <!-- ملخص الجاهزية -->
  <div class="card fade" style="border-top:3px solid var(--purple);margin-bottom:1.5rem">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem">
      <h2 style="font-size:.92rem;font-weight:800;color:var(--purple)">درجة جاهزية الحوكمة الكلية</h2>
      <span id="totalPct" style="font-size:1.8rem;font-weight:800;color:var(--purple)">—</span>
    </div>
    <div class="prog"><div class="prog-fill" id="totalBar" style="background:var(--purple);width:0%"></div></div>
    <div id="totalStats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:1.1rem"></div>
  </div>
  <!-- فلاتر -->
  <div style="display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
    <select class="sel" id="gYear" onchange="load()" style="padding:.38rem .75rem;font-size:.78rem">
      <option value="2026">2026</option>
      <option value="2025">2025</option>
      <option value="2027">2027</option>
    </select>
    <select class="sel" id="gQ" onchange="load()" style="padding:.38rem .75rem;font-size:.78rem">
      <option value="1">الربع الأول</option>
      <option value="2">الربع الثاني</option>
      <option value="3">الربع الثالث</option>
      <option value="4">الربع الرابع</option>
    </select>
    <select class="inp" id="filterCat" onchange="renderTable()" style="width:auto;padding:.4rem .8rem;font-size:.78rem">
      <option value="">كل التصنيفات</option>
      <option value="policies">سياسات</option>
      <option value="procedures">إجراءات</option>
      <option value="committees">لجان</option>
      <option value="reports">تقارير</option>
      <option value="compliance">امتثال</option>
    </select>
    <select class="inp" id="filterStatus" onchange="renderTable()" style="width:auto;padding:.4rem .8rem;font-size:.78rem">
      <option value="">كل الحالات</option>
      <option value="compliant">ملتزم</option>
      <option value="partial">جزئي</option>
      <option value="non_compliant">غير ملتزم</option>
      <option value="pending">انتظار</option>
    </select>
    <button class="btn btn-ghost" style="padding:.4rem .8rem;font-size:.78rem" onclick="load()">🔄 تحديث</button>
  </div>
  <!-- الجدول -->
  <div class="card fade" style="padding:0;overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:.8rem">
      <thead>
        <tr style="background:var(--card2)">
          <th style="padding:.7rem 1rem;text-align:right;color:var(--slate);font-weight:700">الرمز</th>
          <th style="padding:.7rem 1rem;text-align:right;color:var(--slate);font-weight:700">المعيار</th>
          <th style="padding:.7rem 1rem;text-align:right;color:var(--slate);font-weight:700">التصنيف</th>
          <th style="padding:.7rem 1rem;text-align:right;color:var(--slate);font-weight:700">الجهة</th>
          <th style="padding:.7rem 1rem;text-align:center;color:var(--slate);font-weight:700">الالتزام</th>
          <th style="padding:.7rem 1rem;text-align:center;color:var(--slate);font-weight:700">الحالة</th>
          <th style="padding:.7rem 1rem;text-align:center;color:var(--slate);font-weight:700">إجراء</th>
        </tr>
      </thead>
      <tbody id="govTableBody">
        <tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--dim)">⏳ جارٍ التحميل…</td></tr>
      </tbody>
    </table>
  </div>
</div>
<!-- Modal -->
<div class="modal-wrap" id="govModal">
  <div class="modal-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
      <h3 id="modalTitle" style="font-size:.95rem;font-weight:800;color:var(--purple)">＋ إضافة معيار جديد</h3>
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button>
    </div>
    <input type="hidden" id="govId">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الرمز *</label><input class="inp" id="govCode" placeholder="GOV-11"></div>
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">التصنيف</label>
        <select class="inp" id="govCategory">
          <option value="compliance">امتثال</option><option value="policies">سياسات</option>
          <option value="procedures">إجراءات</option><option value="committees">لجان</option><option value="reports">تقارير</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:.75rem"><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">اسم المعيار *</label><input class="inp" id="govName" placeholder="أدخل اسم المعيار…"></div>
    <div style="margin-bottom:.75rem"><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الجهة المسؤولة</label><input class="inp" id="govOwner" list="deptOptions" placeholder="اختر أو اكتب الجهة"></div>
    <datalist id="deptOptions"></datalist>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">الحالة</label>
        <select class="inp" id="govStatus">
          <option value="pending">انتظار</option><option value="partial">جزئي</option>
          <option value="compliant">ملتزم</option><option value="non_compliant">غير ملتزم</option>
        </select>
      </div>
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">نسبة الالتزام %</label><input class="inp" id="govPct" type="number" min="0" max="100" placeholder="0"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.25rem">
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">آخر مراجعة</label><input class="inp" id="govLastReview" type="date"></div>
      <div><label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">المراجعة القادمة</label><input class="inp" id="govNextReview" type="date"></div>
    </div>
    <div style="display:flex;gap:.65rem">
      <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="closeModal()">إلغاء</button>
      <button class="btn btn-teal" style="flex:2;justify-content:center" onclick="saveGov()">💾 حفظ المعيار</button>
    </div>
  </div>
</div>
<script>
const API='api.php';
let allItems=[];
let deptOptionsPromise=null;
const CAT_L={policies:'سياسات',procedures:'إجراءات',committees:'لجان',reports:'تقارير',compliance:'امتثال'};
const SC={compliant:'var(--teal)',partial:'var(--gold)',non_compliant:'var(--red)',pending:'var(--dim)'};
const SL={compliant:'✅ ملتزم',partial:'🟡 جزئي',non_compliant:'🔴 غير ملتزم',pending:'⏳ انتظار'};
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
    const yr=document.getElementById('gYear')?.value||2026;
    const q=document.getElementById('gQ')?.value||1;
    const QNG={1:'الربع الأول',2:'الربع الثاني',3:'الربع الثالث',4:'الربع الرابع'};
    const _subG=document.getElementById('pageSubTitle'); if(_subG) _subG.textContent=`جمعية الزاد ${yr} · ${QNG[q]||'كل الأرباع'}`;
    const d=await fetch(`${API}?endpoint=governance&year=${yr}&quarter=${q}`).then(r=>r.json());
    allItems=d.items||[];
    renderSummary();renderTable();
  }catch(e){showToast('❌ خطأ في التحميل','red');}
}
function renderSummary(){
  const items=allItems;
  const avg=items.length?Math.round(items.reduce((s,i)=>s+(+i.compliance_pct||0),0)/items.length):0;
  const ok=items.filter(i=>i.status==='compliant').length;
  const par=items.filter(i=>i.status==='partial').length;
  const no=items.filter(i=>['non_compliant','pending'].includes(i.status)).length;
  document.getElementById('totalPct').textContent=avg+'%';
  document.getElementById('totalBar').style.width=avg+'%';
  document.getElementById('overallPct').textContent='الجاهزية: '+avg+'%';
  document.getElementById('totalStats').innerHTML=`
    <div style="background:rgba(139,26,58,.07);border:1px solid rgba(139,26,58,.2);border-radius:.75rem;padding:.9rem;text-align:center"><p style="font-size:1.5rem;font-weight:800;color:var(--teal)">${ok}</p><p style="font-size:.7rem;color:var(--slate)">مستوفى بالكامل</p></div>
    <div style="background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2);border-radius:.75rem;padding:.9rem;text-align:center"><p style="font-size:1.5rem;font-weight:800;color:var(--gold)">${par}</p><p style="font-size:.7rem;color:var(--slate)">جزئي</p></div>
    <div style="background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.2);border-radius:.75rem;padding:.9rem;text-align:center"><p style="font-size:1.5rem;font-weight:800;color:var(--red)">${no}</p><p style="font-size:.7rem;color:var(--slate)">غير مستوفى</p></div>`;
}
function renderTable(){
  const cat=document.getElementById('filterCat').value;
  const st=document.getElementById('filterStatus').value;
  let items=allItems;
  if(cat) items=items.filter(i=>i.category===cat);
  if(st)  items=items.filter(i=>i.status===st);
  const tbody=document.getElementById('govTableBody');
  if(!items.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--dim)">لا توجد بيانات</td></tr>';return;}
  tbody.innerHTML=items.map(item=>{
    const sc=SC[item.status]||'var(--dim)';
    const pct=+item.compliance_pct||0;
    const bc=pct>=85?'#059669':pct>=60?'var(--gold)':'var(--red)';
    return `<tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.02)'" onmouseout="this.style.background=''">
      <td style="padding:.65rem 1rem;font-weight:800;color:var(--teal)">${item.code}</td>
      <td style="padding:.65rem 1rem;max-width:260px">${item.name}</td>
      <td style="padding:.65rem 1rem"><span style="font-size:.68rem;font-weight:700;padding:.18rem .5rem;border-radius:99px;background:rgba(167,139,250,.1);color:var(--purple)">${CAT_L[item.category]||item.category}</span></td>
      <td style="padding:.65rem 1rem;color:var(--slate);font-size:.75rem">${item.owner||'—'}</td>
      <td style="padding:.65rem 1rem;text-align:center">
        <div style="display:flex;align-items:center;gap:.5rem;justify-content:center">
          <div style="width:70px;height:5px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${bc};border-radius:99px"></div></div>
          <span style="font-size:.75rem;font-weight:800;color:${bc}">${pct}%</span>
        </div>
      </td>
      <td style="padding:.65rem 1rem;text-align:center"><span style="font-size:.7rem;font-weight:700;padding:.2rem .6rem;border-radius:99px;color:${sc};background:${sc}18;border:1px solid ${sc}30">${SL[item.status]||item.status}</span></td>
    </tr>`;
  }).join('');
}
function openModal(item){
  document.getElementById('govModal').style.display='flex';
  document.getElementById('govId').value=item?.id||'';
  document.getElementById('govCode').value=item?.code||'';
  document.getElementById('govName').value=item?.name||'';
  document.getElementById('govOwner').value=item?.owner||'';
  document.getElementById('govCategory').value=item?.category||'compliance';
  document.getElementById('govStatus').value=item?.status||'pending';
  document.getElementById('govPct').value=item?.compliance_pct||0;
  document.getElementById('govLastReview').value=item?.last_reviewed||'';
  document.getElementById('govNextReview').value=item?.next_review||'';
  document.getElementById('modalTitle').textContent=item?'✏️ تعديل معيار':'＋ إضافة معيار جديد';
}
function closeModal(){document.getElementById('govModal').style.display='none';}
async function saveGov(){
  const id=document.getElementById('govId').value;
  const data={code:document.getElementById('govCode').value.trim(),name:document.getElementById('govName').value.trim(),owner:document.getElementById('govOwner').value.trim(),category:document.getElementById('govCategory').value,status:document.getElementById('govStatus').value,compliance_pct:parseFloat(document.getElementById('govPct').value)||0,last_reviewed:document.getElementById('govLastReview').value||null,next_review:document.getElementById('govNextReview').value||null};
  if(!data.code||!data.name){showToast('⚠️ الرمز والاسم مطلوبان','gold');return;}
  try{
    const url=id?`${API}?endpoint=governance&id=${id}`:`${API}?endpoint=governance`;
    const r=await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const d=await r.json();
    if(d.success){showToast(id?'✅ تم التحديث':'✅ تمت الإضافة');closeModal();load();}
    else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ في الاتصال','red');}
}
async function deleteGov(id){
  if(!confirm('هل تريد حذف هذا المعيار؟')) return;
  try{
    const r=await fetch(`${API}?endpoint=governance&id=${id}`,{method:'DELETE'});
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
