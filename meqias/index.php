<?php
// ═══════════════════════════════════════════
//  index.php — لوحة عرض الأداء التنفيذي (Executive View)
//  جمعية الزاد 2026
// ═══════════════════════════════════════════
session_start();
require_once __DIR__ . '/helpers.php';
$profile = readProfile();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>البوابة التنفيذية | منصة مِقياس</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root{
  --bg:#f6f7f4;--card:#ffffff;--card2:#f1f3ef;
  --border:#e2e5dd;--bhi:#c8cebf;
  --teal:#0f5132;--cyan:#157f6d;--gold:#c7a15a;
  --red:#c0392b;--maroon:#0b3d2e;--purple:#0f5132;
  --text:#1f2a2e;--dim:#5b6b73;--slate:#71808a;
}
  body { font-family: 'Almarai', sans-serif; background: var(--bg); color: var(--text); }


  #refreshBtn { display:inline-flex;align-items:center;justify-content:center; }

  /* ── Stat Cards ─────────────────────────────────────── */
  .stat-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1.5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    
  }
  .stat-card:hover { transform:translateY(-5px) scale(1.03); z-index:2; }


  /* top color bar */
  .stat-card p { }

  /* تأخير موجّه لكل كارد */







  /* ── Header ─────────────────────────────────────────── */
  header { }

  /* ── Path Buttons (بطاقات التنقل) ──────────────────── */
  .path-btn {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 1rem; transition: all 0.35s ease;
    display: flex; align-items: center; gap: 1rem;
    text-decoration: none; color: var(--text);
    box-shadow: 0 4px 20px rgba(0,0,0,.3);
  }
  .path-btn:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: var(--teal);
    box-shadow: 0 14px 30px rgba(139,26,58,.2);
  }
  .icon-box {
    width:3.5rem; height:3.5rem; border-radius:.75rem;
    display:flex; align-items:center; justify-content:center;
    font-size:1.75rem; transition:all .35s ease;
  }
  .icon-box svg{width:1.7rem;height:1.7rem;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  .chart-container {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 1rem; padding: 1.5rem; height: 320px;
    box-shadow: 0 4px 20px rgba(0,0,0,.3);
    transition: transform .3s ease, box-shadow .4s ease;
  }
  .chart-container:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(0,0,0,.4); }

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
  background: #e8700a;
  color: #ffffff;
  border: none;
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

.org-structure-card summary {
  list-style: none;
  cursor: pointer;
}

.org-structure-card summary::-webkit-details-marker {
  display: none;
}

.org-structure-chevron {
  transition: transform .2s ease;
}

.org-structure-card[open] .org-structure-chevron {
  transform: rotate(180deg);
}

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




/* icon-box فقط في النهار */
html .icon-box,
body .icon-box {
  background: #e8700a !important;
  color: #ffffff !important;
}
html .icon-box svg,
body .icon-box svg { stroke: #ffffff !important; }

/* مسار بطاقة إنحراف المؤشر — وضع النهار */
html #devCardsGrid > div > div {
  background: #ffffff !important;
  border-color: #e0d5cc !important;
}
html #devCardsGrid [style*="background:rgba(255,255,255,.04)"] {
  background: #f5f0eb !important;
}
html #devCardsGrid select {
  background: #ffffff !important;
  color: #1a0a0a !important;
  border-color: #e0d5cc !important;
}
html #devCardsGrid button {
  background: #ffffff !important;
  border-color: #e0d5cc !important;
}
@media (max-width: 768px) {
  body { padding: 1rem !important; }
  body > header { padding: 1rem !important; }
  body > header > div {
    flex-direction: column;
    align-items: flex-start !important;
  }
  body > header > div > div:last-child {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .stat-card,
  .chart-container { padding: 1rem; }
  .chart-container { min-height: 280px; height: auto; }
  .path-btn { padding: 1rem !important; }
  .org-structure-card summary { align-items: flex-start; }
}
@media (max-width: 640px) {
  body { padding: .75rem !important; }
  #executive-metrics { grid-template-columns: 1fr !important; }
  .path-btn {
    flex-direction: column;
    align-items: flex-start;
    gap: .75rem;
  }
  .icon-box {
    width: 3rem;
    height: 3rem;
    font-size: 1.35rem;
  }
  .chart-container .relative { height: 200px !important; }
  body > header h1 { font-size: 2rem !important; }
  #orgStructureMeta { width: 100%; }
}
</style>
</head>
<body class="min-h-screen flex flex-col p-6 lg:p-10">

  <header class="mb-8 bg-[#0d1f33] border border-[#1a3650] rounded-2xl shadow-lg" style="padding:.9rem 1.5rem">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem">

      <!-- يمين: اسم المنصة -->
      <div style="flex-shrink:0">
        <h1 class="text-3xl font-extrabold text-[#8b1a3a]" style="margin-bottom:.1rem">مِقياس</h1>
        <p style="font-size:.68rem;color:#64748b" id="dashSubtitle">حيثُ يُستعاد الإتساق بين الرؤية والتنفيذ عبر قياسٍ مُنضبط</p>
      </div>

      <!-- يسار: فلاتر + avatar + ثيم -->
      <div style="display:flex;align-items:center;gap:.6rem">

        <!-- Avatar + اسم -->
        <div style="display:flex;align-items:center;gap:.5rem">
          <div style="text-align:right;line-height:1.3">
            <p style="font-size:.78rem;font-weight:800;color:var(--text)"><?= htmlspecialchars($profile['name']) ?></p>
            <p style="font-size:.62rem;color:#c4a246"><?= htmlspecialchars($profile['title']) ?></p>
          </div>
          <div style="width:36px;height:36px;border-radius:50%;background:#1f4a6e;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1rem;border:2px solid #c4a246;flex-shrink:0">
            <?= htmlspecialchars($profile['avatar_text']) ?>
          </div>
        </div>

        <!-- فاصل -->
        <div style="width:1px;height:32px;background:#1a3650;flex-shrink:0"></div>

        <!-- فلاتر السنة والربع مضغوطة -->
        <div style="display:flex;align-items:center;gap:.35rem;background:rgba(0,0,0,.2);border:1px solid #1a3650;border-radius:.6rem;padding:.3rem .6rem">
          <select id="fYear" onchange="fetchExecutiveData()" style="background:transparent;border:none;color:var(--text);font-family:'Almarai',sans-serif;font-size:.78rem;font-weight:700;outline:none;cursor:pointer;width:46px">
            <option value="2026" style="background:#0d1f33">2026</option>
            <option value="2027" style="background:#0d1f33">2027</option>
            <option value="2028" style="background:#0d1f33">2028</option>
            <option value="2029" style="background:#0d1f33">2029</option>
            <option value="2030" style="background:#0d1f33">2030</option>
            <option value="2025" style="background:#0d1f33">2025</option>
            <option value="2024" style="background:#0d1f33">2024</option>
          </select>
          <span style="color:#334155;font-size:.65rem">|</span>
          <select id="fQ" onchange="fetchExecutiveData()" style="background:transparent;border:none;color:var(--text);font-family:'Almarai',sans-serif;font-size:.78rem;font-weight:700;outline:none;cursor:pointer;width:38px">
            <option value="1" style="background:#0d1f33">ق١</option>
            <option value="2" style="background:#0d1f33">ق٢</option>
            <option value="3" style="background:#0d1f33">ق٣</option>
            <option value="4" style="background:#0d1f33">ق٤</option>
          </select>
          <button onclick="fetchExecutiveData()" id="refreshBtn" title="تحديث" style="background:none;border:none;cursor:pointer;font-size:.82rem;color:#c4a246;padding:.05rem .15rem;line-height:1;transition:opacity .2s" onmouseover="this.style.opacity='.7'" onmouseout="this.style.opacity='1'">🔄</button>
          <span id="lastUpdate" style="font-size:.58rem;color:#475569;display:none;white-space:nowrap"></span>
        </div>

        <!-- زر الثيم -->
        

      </div>
    </div>
  </header>

  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.75rem;flex-wrap:wrap;gap:.5rem">
    <p style="font-size:.8rem;color:#94a3b8;font-weight:600" id="execSubTitle">جمعية الزاد 2026 · الربع الأول</p>
    <p style="font-size:.68rem;color:#475569">نظرة إجمالية على أداء المنصة</p>
  </div>
  <section class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8" id="executive-metrics">
    <div class="stat-card">
      <h3 class="text-xs text-gray-400 mb-2">الأداء الاستراتيجي</h3>
      <p class="text-3xl font-bold text-[#8b1a3a]" id="val-strat">--%</p>
    </div>
    <div class="stat-card">
      <h3 class="text-xs text-gray-400 mb-2">الأداء التشغيلي</h3>
      <p class="text-3xl font-bold text-[#c4a246]" id="val-oper">--%</p>
    </div>
    <div class="stat-card">
      <h3 class="text-xs text-gray-400 mb-2">مسار الحوكمة</h3>
      <p class="text-3xl font-bold text-[#d4af37]" id="val-gov">--%</p>
    </div>
    <div class="stat-card">
      <h3 class="text-xs text-gray-400 mb-2">المعرفة المؤسسية</h3>
      <p class="text-3xl font-bold text-[#a78bfa]" id="val-know">--%</p>
    </div>
    <div class="stat-card">
      <h3 class="text-xs text-gray-400 mb-2">مؤشرات الإنذار المبكر الفعالة</h3>
      <p class="text-3xl font-bold text-[#ff4d6d]" id="val-alerts">--</p>
    </div>
    <div class="stat-card">
      <h3 class="text-xs text-gray-400 mb-2">إجمالي المؤشرات المعتمدة</h3>
      <p class="text-3xl font-bold text-white" id="val-total">--</p>
    </div>
  </section>

  <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
    <div class="chart-container col-span-1">
      <h2 class="text-sm font-bold text-gray-300 mb-4 text-center">التوزيع النسبي للأداء</h2>
      <div class="relative h-[220px] w-full">
        <canvas id="doughnutChart"></canvas>
      </div>
    </div>
    <div class="chart-container col-span-2">
      <h2 class="text-sm font-bold text-gray-300 mb-4">مؤشر الأداء التراكمي للمسارات</h2>
      <div class="relative h-[220px] w-full">
        <canvas id="barChart"></canvas>
      </div>
    </div>
  </section>

  <section>
    <h2 class="text-xl font-bold mb-6 text-gray-300 border-b border-[#1a3650] pb-2">تفاصيل مسارات الأعمال (Drill-down)</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <a href="strategic.php" class="path-btn p-5 group">
        <div class="icon-box bg-[#8b1a3a]/10 text-[#8b1a3a] group-hover:bg-[#8b1a3a] group-hover:text-white"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M2 12h2M20 12h2"></path></svg></div>
        <div>
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#8b1a3a] transition-colors">مسار الأداء الاستراتيجي</h3>
          <p class="text-xs text-gray-400">يُعنى هذا المسار بقراءة تحقق الأهداف الاستراتيجية قراءةً واعية</p>
        </div>
      </a>

      <a href="operational.php" class="path-btn p-5 group">
        <div class="icon-box bg-[#c4a246]/10 text-[#c4a246] group-hover:bg-[#c4a246] group-hover:text-white"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .37.21.72.6 1a1.7 1.7 0 0 1 0 2c-.39.28-.6.63-.6 1z"></path></svg></div>
        <div>
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#8b1a3a] transition-colors">مسار الأداء التشغيلي</h3>
          <p class="text-xs text-gray-400">يختص هذا المسار بقياس كفاءة التنفيذ التشغيلي للإدارات</p>
        </div>
      </a>

      <a href="early_warning.php" class="path-btn p-5 group">
        <div class="icon-box bg-[#ff4d6d]/10 text-[#ff4d6d] group-hover:bg-[#ff4d6d] group-hover:text-white"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="M10.3 3.84 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.84a2 2 0 0 0-3.4 0z"></path></svg></div>
        <div>
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#ff4d6d] transition-colors">مسار الإنذار المبكر</h3>
          <p class="text-xs text-gray-400">يرتكز هذا المسار على الاستشعار المبكر لمؤشرات تدني الأداء</p>
        </div>
      </a>

      <a href="deviation.php" class="path-btn p-5 group">
        <div class="icon-box" style="background:#e8700a;color:#fff"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6"></path><path d="M10 12h4"></path><path d="M10 16h4"></path><path d="M8 3v3"></path><path d="M16 3v3"></path><rect x="5" y="5.5" width="14" height="15" rx="2"></rect></svg></div>
        <div>
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#e8700a] transition-colors">مسار بطاقة إنحراف المؤشر</h3>
          <p class="text-xs text-gray-400">يُعنى هذا المسار بتوثيق حالات عدم تحقق المستهدف بنهاية الفترة</p>
        </div>
      </a>

      <a href="governance.php" class="path-btn p-5 group">
        <div class="icon-box bg-[#d4af37]/10 text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-white"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4"></path><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"></path></svg></div>
        <div>
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#8b1a3a] transition-colors">مسار الحوكمة</h3>
          <p class="text-xs text-gray-400">قياس رقمي لمستوى الالتزام الحوكمي</p>
        </div>
      </a>

      <a href="knowledge.php" class="path-btn p-5 group">
        <div class="icon-box bg-[#a78bfa]/10 text-[#a78bfa] group-hover:bg-[#a78bfa] group-hover:text-white"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"></path><path d="M12 6v12"></path></svg></div>
        <div>
          <h3 class="font-bold text-lg mb-1 group-hover:text-[#a78bfa] transition-colors">مسار المعرفة</h3>
          <p class="text-xs text-gray-400">قياس رقمي لمستوى نضج إدارة المعرفة بالجمعية</p>
        </div>
      </a>

    </div>
  </section>

  <section style="margin-top:3rem">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
      <h2 class="text-xl font-bold text-gray-300 border-b border-[#1a3650] pb-2" style="margin:0">هيكل الإدارات والأقسام</h2>
      <p id="orgStructureMeta" style="font-size:.78rem;color:var(--dim)">جارٍ تحميل الهيكل التنظيمي…</p>
    </div>
    <div id="orgStructureGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="path-btn p-5" style="justify-content:center;min-height:120px">
        <p style="font-size:.82rem;color:var(--dim)">⏳ جارٍ تحميل الإدارات والأقسام…</p>
      </div>
    </div>
  </section>



  <script>
    Chart.defaults.color = '#666666';
    Chart.defaults.font.family = 'Almarai';

    let _doughnutInst=null, _barInst=null;
    const jsonRequestCache = new Map();

    function fetchJsonCached(url, ttl = 30000) {
      const now = Date.now();
      const cached = jsonRequestCache.get(url);
      if (cached?.data !== undefined && (now - cached.time) < ttl) {
        return Promise.resolve(cached.data);
      }
      if (cached?.promise) {
        return cached.promise;
      }
      const promise = fetch(url, {cache:'no-store'})
        .then(r => r.json())
        .then(data => {
          jsonRequestCache.set(url, {data, time: Date.now()});
          return data;
        })
        .catch(error => {
          jsonRequestCache.delete(url);
          throw error;
        });
      jsonRequestCache.set(url, {promise, time: now});
      return promise;
    }

    function clearHomeJsonCache() {
      jsonRequestCache.clear();
    }

    let homeRefreshTimer = null;
    function scheduleHomeRefresh() {
      if (document.hidden) return;
      if (homeRefreshTimer) clearTimeout(homeRefreshTimer);
      homeRefreshTimer = setTimeout(() => {
        clearHomeJsonCache();
        loadOrgStructure();
        fetchExecutiveData();
      }, 180);
    }

    
async function loadOrgStructure() {
      const grid = document.getElementById('orgStructureGrid');
      const meta = document.getElementById('orgStructureMeta');
      if (!grid) return;
      try {
        const rows = await fetchJsonCached('api.php?endpoint=departments', 60000);
        const departments = Array.isArray(rows) ? rows : [];
        const totalSections = departments.reduce((sum, dept) => sum + ((dept.sections || []).length), 0);

        if (meta) {
          meta.textContent = `${departments.length} إدارة · ${totalSections} قسم`;
        }

        if (!departments.length) {
          grid.innerHTML = `<div class="path-btn p-5" style="justify-content:center;min-height:120px"><p style="font-size:.82rem;color:var(--dim)">لا توجد إدارات أو أقسام مهيأة حالياً</p></div>`;
          return;
        }

        grid.innerHTML = departments.map((dept, index) => {
          const color = dept.color || '#8b1a2a';
          const sections = Array.isArray(dept.sections) ? dept.sections : [];
          const deptName = dept.dept_name || '—';
          const deptTitle = /^إدارة\s/u.test(deptName) ? deptName : `إدارة ${deptName}`;
          return `
            <details class="path-btn p-5 org-structure-card" style="display:block" ${index === 0 ? 'open' : ''}>
              <summary style="display:flex;align-items:center;justify-content:space-between;gap:.75rem">
                <div>
                  <h3 class="font-bold text-lg" style="margin-bottom:.2rem">${deptTitle}</h3>
                  <p style="font-size:.72rem;color:var(--dim)">رقم الإدارة: ${dept.dept_no ?? '—'} · ${sections.length} قسم</p>
                  <p style="font-size:.7rem;color:${color};font-weight:700;margin-top:.35rem">اضغط لعرض الأقسام</p>
                </div>
                <div style="display:flex;align-items:center;gap:.55rem;flex-shrink:0">
                  <span class="org-structure-chevron" style="font-size:1rem;color:${color};font-weight:800">⌄</span>
                  <span style="width:14px;height:14px;border-radius:999px;background:${color};display:inline-block"></span>
                </div>
              </summary>
              <div style="display:flex;flex-wrap:wrap;gap:.45rem;margin-top:1rem;padding-top:1rem;border-top:1px solid ${color}22">
                ${sections.length ? sections.map(section => `
                  <span style="font-size:.7rem;font-weight:700;background:${color}14;color:${color};border:1px solid ${color}33;border-radius:999px;padding:.28rem .65rem">
                    ${section.section_code ? `${section.section_code} · ` : ''}${section.section_name || '—'}
                  </span>
                `).join('') : `<span style="font-size:.74rem;color:var(--dim)">لا توجد أقسام مسجلة</span>`}
              </div>
            </details>
          `;
        }).join('');
      } catch (error) {
        if (meta) meta.textContent = 'تعذر تحميل الهيكل التنظيمي';
        grid.innerHTML = `<div class="path-btn p-5" style="justify-content:center;min-height:120px"><p style="font-size:.82rem;color:var(--red)">❌ تعذر تحميل الإدارات والأقسام</p></div>`;
      }
}

async function fetchExecutiveData() {
      const yr = document.getElementById('fYear')?.value || '2026';
      const q  = document.getElementById('fQ')?.value    || '1';
      const QN = {1:'الربع الأول',2:'الربع الثاني',3:'الربع الثالث',4:'الربع الرابع'};
      const sub = document.getElementById('execSubTitle');
      if(sub) sub.textContent = `جمعية الزاد ${yr} · ${QN[q]||'الربع الأول'}`;

      const clampPct = value => {
        const num = Number(value);
        if (!Number.isFinite(num)) return 0;
        return Math.max(0, Math.min(100, Math.round(num)));
      };
      const avgAchievementPct = rows => {
        const valid = (Array.isArray(rows) ? rows : []).filter(k => Number(k.q_target) > 0 && k.q_actual !== null);
        if (!valid.length) return 0;
        const total = valid.reduce((sum, k) => {
          const ratio = (Number(k.q_actual) / Number(k.q_target)) * 100;
          return sum + Math.max(0, Math.min(100, ratio));
        }, 0);
        return clampPct(total / valid.length);
      };

      // زر التحديث — أظهر أنه يعمل
      const btn = document.getElementById('refreshBtn');
      if(btn){ btn.style.animation='spin .6s linear infinite'; btn.disabled=true; }

      try {
        const [strat, oper, gov, know, dash] = await Promise.all([
          fetchJsonCached(`api.php?endpoint=kpis&type=strategic&year=${yr}&quarter=${q}`),
          fetchJsonCached(`api.php?endpoint=kpis&type=operational&year=${yr}&quarter=${q}`),
          fetchJsonCached(`api.php?endpoint=governance_summary&year=${yr}&quarter=${q}`),
          fetchJsonCached(`api.php?endpoint=knowledge&year=${yr}&quarter=${q}`),
          fetchJsonCached(`api.php?endpoint=dashboard&year=${yr}&quarter=${q}`),
        ]);

        // ── حسابات دقيقة من البيانات الفعلية ──────────────
        const stratValid = strat.filter(k => Number(k.q_target) > 0 && k.q_actual !== null);
        const operValid  = oper.filter(k  => Number(k.q_target) > 0 && k.q_actual !== null);
        const stratPct   = avgAchievementPct(strat);
        const operPct    = avgAchievementPct(oper);

        const govItems = gov.items || [];
        const govPct   = govItems.length
          ? clampPct(govItems.reduce((s,g)=>s+(+g.compliance_pct||0),0)/govItems.length) : 0;

        const knowArr    = Array.isArray(know) ? know : [];
        const knowActive = knowArr.filter(k => k.status === 'active').length;
        const knowPct    = knowArr.length ? clampPct((knowActive/knowArr.length)*100) : 0;

        const alerts    = (dash.alerts || []).length;
        const totalKpis = strat.length + oper.length;

        // ── تحديث الأرقام في الكاردات ──────────────────────
        const noData = stratValid.length === 0 && operValid.length === 0;
        const setVal = (id, val, animate=true) => {
          const el = document.getElementById(id);
          if(!el) return;
          if(animate && el.innerText !== String(val)){
            el.style.transform='scale(1.12)';
            el.style.transition='transform .22s ease';
            setTimeout(()=>el.style.transform='scale(1)', 220);
          }
          el.innerText = val;
        };
        setVal('val-strat',  noData ? '—' : stratPct + '%');
        setVal('val-oper',   noData ? '—' : operPct  + '%');
        // الحوكمة والمعرفة تظهر دائماً إذا كانت فيها بيانات
        setVal('val-gov',    govItems.length > 0 ? govPct + '%' : '—');
        setVal('val-know',   knowArr.length  > 0 ? knowPct + '%' : '—');
        setVal('val-alerts', noData ? '—' : alerts);
        setVal('val-total',  totalKpis);

        // تلوين البطاقات حسب وجود بيانات
        const stratEl = document.getElementById('val-strat');
        const operEl  = document.getElementById('val-oper');
        const govEl   = document.getElementById('val-gov');
        const knowEl  = document.getElementById('val-know');
        const altEl   = document.getElementById('val-alerts');
        const opacity = noData ? '.3' : '1';
        if(stratEl) stratEl.style.opacity = opacity;
        if(operEl)  operEl.style.opacity  = opacity;
        if(govEl)   govEl.style.opacity   = govItems.length > 0 ? '1' : '.3';
        if(knowEl)  knowEl.style.opacity  = knowArr.length  > 0 ? '1' : '.3';
        if(altEl)   altEl.style.opacity   = opacity;

        // رسالة توضيحية إذا لا توجد بيانات للسنة
        const existingNote = document.getElementById('no-data-note');
        if(noData && !existingNote){
          const note = document.createElement('div');
          note.id = 'no-data-note';
          note.style.cssText = 'text-align:center;padding:.5rem 1rem;background:rgba(196,162,70,.08);border:1px solid rgba(196,162,70,.2);border-radius:.75rem;font-size:.8rem;color:#c4a246;margin-bottom:.75rem';
          note.textContent = `⚠️ لا توجد بيانات مُدخَلة للسنة ${yr} — أدخل البيانات من لوحة الإدارة`;
          document.getElementById('executive-metrics')?.before(note);
        } else if(!noData && existingNote){
          existingNote.remove();
        }

        // ── آخر تحديث ──────────────────────────────────────
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'});
        const upEl = document.getElementById('lastUpdate');
        if(upEl){ upEl.textContent = `🕐 ${timeStr}`; upEl.style.display='inline'; }

        // ── إعادة رسم الرسوم البيانية ──────────────────────
        drawCharts(
          noData ? 0 : stratPct,
          noData ? 0 : operPct,
          noData ? 0 : govPct,
          noData ? 0 : knowPct,
          noData
        );

      } catch (error) {
        console.error("Error fetching data:", error);
        const upEl = document.getElementById('lastUpdate');
        if(upEl) upEl.textContent = '⚠️ خطأ في التحميل';
      } finally {
        if(btn){ btn.style.animation=''; btn.disabled=false; }
      }
    }

    function drawCharts(stratPct, operPct, govPct, knowPct, noData=false) {
      // أتلف الرسوم القديمة قبل إنشاء جديدة
      if(_doughnutInst){ _doughnutInst.destroy(); _doughnutInst=null; }
      if(_barInst){      _barInst.destroy();      _barInst=null; }

      // إذا لا توجد بيانات — أظهر الرسوم فارغة بلون رمادي
      const chartData = noData
        ? [1, 1, 1, 1]
        : [stratPct||0.01, operPct||0.01, govPct||0.01, knowPct||0.01];
      const chartColors = noData
        ? ['#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5']
        : ['#8b1a3a', '#c4a246', '#d4af37', '#a78bfa'];
      const barData = noData ? [0,0,0,0] : [stratPct, operPct, govPct, knowPct];

      // 1. الدونات شارت (Doughnut)
      _doughnutInst = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['الأداء الاستراتيجي', 'الأداء التشغيلي', 'الإمتثال الحوكمي', 'المعرفة المؤسسية'],
          datasets: [{
            data: chartData,
            backgroundColor: chartColors,
            borderWidth: 0,
            hoverOffset: noData ? 0 : 10
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '75%',
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, color: '#94a3b8', font: { family: 'Almarai', size: 11 }, filter: function() { return true; } } },
            tooltip: { enabled: !noData }
          }
        }
      });

      // 2. البار شارت (Bar)
      _barInst = new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['الأداء الاستراتيجي', 'الأداء التشغيلي', 'الإمتثال الحوكمي', 'المعرفة المؤسسية'],
          datasets: [{
            label: 'نسبة الإنجاز %',
            data: barData,
            backgroundColor: noData
              ? ['rgba(30,41,59,.4)','rgba(30,41,59,.4)','rgba(30,41,59,.4)','rgba(30,41,59,.4)']
              : ['rgba(139,26,58,.85)','rgba(196,162,70,.85)','rgba(212,175,55,.85)','rgba(167,139,250,.85)'],
            borderColor: noData
              ? ['#e5e5e5','#e5e5e5','#e5e5e5','#e5e5e5']
              : ['#8b1a3a','#c4a246','#d4af37','#a78bfa'],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 30
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: !noData } },
          scales: {
            y: {
              beginAtZero: true, max: 100,
              grid: { color: 'rgba(26, 54, 80, 0.6)' },
              ticks: { stepSize: 25, color: '#64748b', font: { family: 'Almarai' } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Almarai', size: 11 } }
            }
          },
          animation: { duration: 2000, easing: 'easeOutQuart' }
        }
      });
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadOrgStructure();
      fetchExecutiveData();
      window.addEventListener('focus', scheduleHomeRefresh);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleHomeRefresh();
      });
      // تحديث تلقائي كل 60 ثانية
      setInterval(fetchExecutiveData, 60000);
    });
  
function toggleTheme(){}

// ── مسار بطاقة إنحراف المؤشر — عرض فقط ────────────────────────
function fmtN(v){ if(v===null||v===undefined||v==='') return '—'; const n=parseFloat(v); return isNaN(n)?v:n.toLocaleString('ar-SA',{maximumFractionDigits:1}); }

async function loadDevCards() {
  const cont = document.getElementById('devCardsGrid');
  if (!cont) return;
  const year   = document.getElementById('dcYear')?.value   || '2026';
  const q      = document.getElementById('dcQ')?.value      || '';
  const status = document.getElementById('dcStatus')?.value || '';
  cont.innerHTML = '<div style="text-align:center;padding:2.5rem;color:var(--dim)"><div style="font-size:1.5rem">⏳</div><p style="font-size:.78rem;margin-top:.4rem">جارٍ التحميل…</p></div>';
  try {
    let url = `api.php?endpoint=deviation_cards&year=${year}`;
    if (q)      url += `&quarter=${q}`;
    if (status) url += `&status=${status}`;
    const r = await fetch(url);
    const d = await r.json();
    const cards = Array.isArray(d) ? d : [];
    if (!cards.length) {
      cont.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--dim)"><div style="font-size:2rem;margin-bottom:.5rem">📋</div><p style="font-size:.82rem">لا توجد بطاقات انحراف للفترة المحددة</p></div>';
      return;
    }
    const SC = {open:'var(--red)',in_progress:'#f97316',under_execution:'#60a5fa',pending_verify:'#fbbf24',closed:'var(--teal)'};
    const SL = {open:'🔴 مفتوحة',in_progress:'🟠 قيد المعالجة',under_execution:'🔵 تحت التنفيذ',pending_verify:'🟡 انتظار التحقق',closed:'✅ مغلقة'};
    const RL = {high:'⛔ مرتفع',medium:'⚠️ متوسط',low:'🟢 منخفض'};
    cont.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem">' +
      cards.map(c => {
        const sc  = SC[c.status] || 'var(--border)';
        const sl  = SL[c.status] || c.status;
        const dev = parseFloat(c.deviation_pct || 0);
        const dc  = dev < -30 ? 'var(--red)' : '#f97316';
        return `
        <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid ${sc};border-radius:1rem;padding:1.1rem">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem">
            <div>
              <span style="font-size:.7rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.18rem .5rem;border-radius:.3rem">${c.kpi_code||'—'}</span>
              <p style="font-size:.82rem;font-weight:700;color:var(--text);margin-top:.35rem;line-height:1.35">${(c.kpi_name||'').substring(0,50)}${(c.kpi_name||'').length>50?'…':''}</p>
            </div>
            <span style="font-size:.65rem;font-weight:700;white-space:nowrap;color:${sc};background:${sc}18;border:1px solid ${sc}35;padding:.2rem .5rem;border-radius:99px;flex-shrink:0;margin-right:.3rem">${sl}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.4rem;margin-bottom:.65rem">
            <div style="background:rgba(255,255,255,.04);border-radius:.5rem;padding:.45rem;text-align:center">
              <p style="font-size:.6rem;color:var(--slate);margin-bottom:.1rem">المستهدف</p>
              <p style="font-size:.82rem;font-weight:800;color:var(--text)">${fmtN(c.target)}</p>
            </div>
            <div style="background:rgba(255,255,255,.04);border-radius:.5rem;padding:.45rem;text-align:center">
              <p style="font-size:.6rem;color:var(--slate);margin-bottom:.1rem">الفعلي</p>
              <p style="font-size:.82rem;font-weight:800;color:${dc}">${fmtN(c.actual)}</p>
            </div>
            <div style="background:rgba(255,77,109,.06);border:1px solid rgba(255,77,109,.12);border-radius:.5rem;padding:.45rem;text-align:center">
              <p style="font-size:.6rem;color:var(--slate);margin-bottom:.1rem">الانحراف</p>
              <p style="font-size:.82rem;font-weight:800;color:${dc}">${dev.toFixed(1)}%</p>
            </div>
          </div>
          ${c.reason     ? `<p style="font-size:.72rem;color:var(--slate);margin-bottom:.25rem;line-height:1.4">📌 <strong>السبب:</strong> ${c.reason.substring(0,80)}${c.reason.length>80?'…':''}</p>` : ''}
          ${c.action     ? `<p style="font-size:.72rem;color:var(--slate);margin-bottom:.25rem;line-height:1.4">🔧 <strong>الإجراء:</strong> ${c.action.substring(0,80)}${c.action.length>80?'…':''}</p>` : ''}
          ${c.responsible? `<p style="font-size:.7rem;color:var(--dim);margin-bottom:.2rem">👤 ${c.responsible}</p>` : ''}
          ${c.due_date   ? `<p style="font-size:.7rem;color:var(--dim);margin-bottom:.2rem">📅 الإغلاق: ${c.due_date}</p>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.6rem;padding-top:.6rem;border-top:1px solid var(--border)">
            ${c.risk_level ? `<span style="font-size:.68rem;font-weight:700;background:rgba(255,77,109,.1);color:var(--red);border-radius:99px;padding:.15rem .55rem">${RL[c.risk_level]||c.risk_level}</span>` : '<span></span>'}
            <span style="font-size:.65rem;color:var(--dim)">ق${c.quarter||'—'} · ${c.year||'—'}</span>
          </div>
        </div>`;
      }).join('') + '</div>';
  } catch(e) {
    cont.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">❌ خطأ في التحميل</div>';
  }
}
// تحميل مسار بطاقة إنحراف المؤشر — مباشرة (الـ script في نهاية الصفحة)
loadDevCards();
</script>
</body>
</html>
