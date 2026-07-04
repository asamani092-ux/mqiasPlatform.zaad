<?php
// ═══════════════════════════════════════════
//  strategic.php — مسار الأداء الاستراتيجي
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
<title>الأداء الاستراتيجي | مِقياس</title>
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
.filters{display:flex;gap:.5rem;flex-wrap:wrap}
.sel{background:var(--card2);border:1px solid var(--border);color:var(--text);padding:.45rem .8rem;border-radius:.6rem;font-family:'Almarai',sans-serif;font-size:.78rem;font-weight:700;outline:none;cursor:pointer}
.wrap{max-width:1200px;margin:0 auto;padding:1.5rem}
#pageDesc{max-width:620px !important;margin:.4rem 0 0 !important;padding:.6rem .85rem !important;border-radius:0 .45rem .45rem 0 !important}
#pageDesc p{font-size:.72rem !important;line-height:1.65 !important;margin-bottom:.35rem !important}
#pageDesc ul{gap:.2rem .7rem !important}
#pageDesc li{font-size:.68rem !important}
.summary-cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:.75rem;margin-bottom:1rem}
.empty-notice{max-width:480px;margin:0 auto;padding:1rem 1.25rem;text-align:center;color:var(--dim);background:var(--card);border:1px dashed var(--border);border-radius:.95rem}
.chart-empty{display:flex;align-items:center;justify-content:center;min-height:120px;color:var(--dim);font-size:.84rem}
/* محور */
.axis-block{margin-bottom:2.5rem}
.axis-header{display:flex;justify-content:space-between;align-items:center;padding:.7rem 1.1rem;border-radius:.75rem;margin-bottom:1rem;background:var(--card)}
/* هدف */
.goal-block{margin-bottom:1.5rem;padding-right:1rem;border-right:2px solid var(--border)}
.goal-header{display:flex;align-items:center;gap:.6rem;margin-bottom:.85rem;padding:.5rem .85rem;background:var(--card2);border-radius:.65rem}
.goal-code{font-size:.7rem;font-weight:800;padding:.18rem .5rem;border-radius:.3rem}
/* بطاقة مؤشر */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:.85rem}
.kpi-card{background:var(--card);border:1px solid var(--border);border-radius:.95rem;padding:1.1rem;transition:border-color .2s}
.kpi-card:hover{border-color:var(--bhi)}
.kpi-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.65rem}
.kpi-code{font-size:.7rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.18rem .5rem;border-radius:.3rem}
.trend{font-size:1rem}
.kpi-name{font-size:.82rem;font-weight:700;line-height:1.4;margin-bottom:.75rem}
.kpi-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-bottom:.65rem}
.field{background:var(--card2);border-radius:.45rem;padding:.45rem .55rem;text-align:center}
.field-lbl{font-size:.62rem;color:var(--dim);margin-bottom:.15rem}
.field-val{font-size:.82rem;font-weight:800}
.prog{height:5px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden;margin-bottom:.5rem}
.prog-fill{height:100%;border-radius:99px;transition:width 1.3s ease}
.kpi-footer{display:flex;justify-content:space-between;align-items:center;padding-top:.6rem;border-top:1px solid var(--border)}
.status-badge{font-size:.7rem;font-weight:700;padding:.2rem .6rem;border-radius:99px}
.btn-analysis{background:var(--teal);color:#07111f;border:none;border-radius:.55rem;padding:.32rem .75rem;font-size:.72rem;font-weight:800;cursor:pointer;font-family:'Almarai',sans-serif;transition:opacity .2s}
.btn-analysis:hover{opacity:.85}
/* Modal التحليل */
.modal-wrap{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:1.4rem;width:100%;max-width:700px;max-height:92vh;overflow-y:auto;margin:auto}
.modal-head{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--card)}
.modal-body{padding:1.5rem}
.close-btn{background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.8rem}
.section-h{font-size:.82rem;font-weight:800;color:var(--slate);margin:1.25rem 0 .75rem;display:flex;align-items:center;gap:.4rem}
.q-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1rem}
.q-box{background:var(--card2);border-radius:.65rem;padding:.65rem;text-align:center}
.chart-wrap{background:var(--card2);border-radius:.75rem;padding:1rem;height:180px;margin-bottom:1rem}
.dev-box{background:rgba(255,77,109,.06);border:1px solid rgba(255,77,109,.2);border-radius:.75rem;padding:1rem;margin-bottom:1rem}
.info-row{display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid var(--border);font-size:.78rem}
.info-row:last-child{border-bottom:none}


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
  .topbar > div:first-child,
  .filters { width: 100%; }
}
@media (max-width: 640px) {
  .topbar > div:first-child,
  .axis-header,
  .goal-header,
  .kpi-row,
  .kpi-footer,
  .modal-head,
  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }
  .sel,
  #kpiSearch {
    width: 100% !important;
    min-width: 0;
  }
  #pageDesc {
    max-width: none !important;
    padding: .75rem .85rem !important;
  }
  .summary-cards-grid,
  .q-grid,
  .kpi-fields,
  .kpi-grid {
    grid-template-columns: 1fr;
  }
  .chart-wrap {
    height: 220px;
    padding: .75rem;
  }
  .modal-box {
    max-height: 94vh;
    border-radius: 1rem;
  }
  #mBody [style*="grid-template-columns:1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
}

</style>
</head>
<body>

<header class="topbar">
  <div style="display:flex;align-items:center;gap:1rem">
    <a href="index.php" class="back">← الرئيسية</a>
    <div>
      <h1 style="font-size:1rem;font-weight:800;color:var(--teal)"> مسار الأداء الاستراتيجي</h1>
      <p style="font-size:.7rem;color:var(--dim)" id="pageSubTitle">جمعية الزاد 2026 · الربع الأول</p>
<div id="pageDesc" style="max-width:700px;margin:.75rem 0 0;padding:.9rem 1.1rem;background:rgba(139,26,42,.04);border-right:3px solid var(--teal);border-radius:0 .5rem .5rem 0">
  <p style="font-size:.78rem;color:var(--dim);line-height:1.8;margin-bottom:.6rem">يُعنى هذا المسار بقراءة تحقق الأهداف الاستراتيجية قراءةً واعية، تُقاس فيها المؤشرات على ضوء خطوط الأساس والمستهدفات، لتتجلى صورة الأداء كما هي، واضحةً، دقيقةً، وقابلة للاحتكام المهني</p>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.35rem .9rem">
    <li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الهدف الاستراتيجي المعتمد</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المؤشر الاستراتيجي المرتبط بكل هدف</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>خط الأساس المعتمد للمؤشر</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المستهدف السنوي</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المستهدفات الربعية</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المتحقق الفعلي لكل فترة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>نسبة التحقق مقارنة بالمستهدف</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>حالة المؤشر وفق نتائج القياس</li>
  </ul>
</div>
    </div>
  </div>
  <div class="filters">
    <select class="sel" id="fYear" onchange="load()">
      <option value="2026">2026</option>
        <option value="2027">2027</option>
        <option value="2028">2028</option>
        <option value="2029">2029</option>
        <option value="2030">2030</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
    </select>
    <select class="sel" id="fQ" onchange="load()">
      <option value="1">الربع الأول</option>
      <option value="2">الربع الثاني</option>
      <option value="3">الربع الثالث</option>
      <option value="4">الربع الرابع</option>
    </select>
    <select class="sel" id="fStatus" onchange="applyFilter()">
      <option value="">كل الحالات</option>
      <option value="exceeded">متجاوز</option>
      <option value="achieved">متحقق</option>
      <option value="partial">جزئي</option>
      <option value="not_achieved">غير متحقق</option>
      <option value="pending">انتظار</option>
    </select>
  </div>
      
</header>

<div class="wrap" style="padding-bottom:0" id="summaryWrap">
  <div class="summary-cards-grid" id="stratSummary">
    <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid var(--teal);border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">نسبة الاداء الكلي</div><div style="font-size:1.9rem;font-weight:800;color:var(--teal)" id="sumPct">—</div></div>
    <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid var(--slate);border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">الاهداف</div><div style="font-size:1.9rem;font-weight:800;color:var(--text)" id="sumGoals">—</div></div>
    <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid var(--slate);border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">المؤشرات</div><div style="font-size:1.9rem;font-weight:800;color:var(--text)" id="sumTotal">—</div></div>
    <div style="background:rgba(5,150,105,.08);border:1px solid rgba(5,150,105,.3);border-top:3px solid #059669;border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">متجاوز</div><div style="font-size:1.9rem;font-weight:800;color:#059669" id="sumExceeded">—</div></div>
    <div style="background:rgba(139,26,58,.08);border:1px solid rgba(139,26,58,.25);border-top:3px solid var(--teal);border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">متحقق</div><div style="font-size:1.9rem;font-weight:800;color:var(--teal)" id="sumAchieved">—</div></div>
    <div style="background:rgba(196,162,70,.07);border:1px solid rgba(196,162,70,.25);border-top:3px solid var(--gold);border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">جزئي</div><div style="font-size:1.9rem;font-weight:800;color:var(--gold)" id="sumPartial">—</div></div>
    <div style="background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.25);border-top:3px solid var(--red);border-radius:.95rem;padding:1rem;text-align:center"><div style="font-size:.65rem;font-weight:700;color:var(--slate);margin-bottom:.3rem">غير متحقق</div><div style="font-size:1.9rem;font-weight:800;color:var(--red)" id="sumFailed">—</div></div>
  </div>
</div>
<div class="wrap" style="padding-bottom:0" id="chartSection">
  <div style="background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.25rem;margin-bottom:1rem">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem;flex-wrap:wrap;gap:.5rem">
      <h2 style="font-size:.88rem;font-weight:800;color:var(--slate)">مقارنة أداء المحاور الاستراتيجية</h2>
      <div id="deptLegend" style="display:flex;gap:.65rem;flex-wrap:wrap;font-size:.72rem"></div>
    </div>
    <div style="height:200px" id="deptChartHost"><canvas id="deptCompChart"></canvas></div>
  </div>
</div>
<div class="wrap" id="mainWrap">
  <div style="text-align:center;padding:4rem;color:var(--dim)">جاري التحميل...</div>
</div>

<!-- جدول المؤشرات الكامل -->
<div class="wrap" style="margin-top:1.5rem">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
    <h2 style="font-size:.95rem;font-weight:800;color:var(--teal)">📋 جميع المؤشرات الاستراتيجية</h2>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      <input id="kpiSearch" oninput="filterKpiTable()" placeholder="بحث..." style="background:var(--card2);border:1px solid var(--border);border-radius:.5rem;padding:.35rem .75rem;font-size:.75rem;color:var(--text);font-family:'Almarai',sans-serif;width:150px">
      <select id="axisFilter" onchange="filterKpiTable()" style="background:var(--card2);border:1px solid var(--border);border-radius:.5rem;padding:.35rem .75rem;font-size:.75rem;color:var(--text);font-family:'Almarai',sans-serif">
        <option value="">كل المحاور</option>
        <option value="ع">محور العملاء</option>
        <option value="م">المحور المالي</option>
        <option value="د">العمليات الداخلية</option>
        <option value="ن">التعلم والنمو</option>
      </select>
    </div>
  </div>
  <div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:.78rem" id="kpiFullTable">
      <thead>
        <tr style="background:var(--card2);text-align:right">
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">الرمز</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border);max-width:250px">المؤشر</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">المستهدف</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">الفعلي</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">الإنجاز</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">الانحراف</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">الحالة</th>
          <th style="padding:.6rem .75rem;font-weight:700;color:var(--slate);border-bottom:1px solid var(--border)">التحليل</th>
        </tr>
      </thead>
      <tbody id="kpiTableBody">
        <tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--dim)">جاري التحميل...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- Modal التحليل -->
<div class="modal-wrap" id="analysisModal">
  <div class="modal-box">
    <div class="modal-head">
      <div>
        <span id="mCode" style="font-size:.72rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.2rem .55rem;border-radius:.3rem"></span>
        <h3 id="mName" style="font-size:.95rem;font-weight:800;margin-top:.3rem"></h3>
      </div>
      <button class="close-btn" onclick="closeModal()">✕ إغلاق</button>
    </div>
    <div class="modal-body" id="mBody"></div>
  </div>
</div>

<script>
const API='api.php';
const QN=['','الأول','الثاني','الثالث','الرابع'];
const AXES={'ع':{n:'محور العملاء',c:'#8b1a3a',i:'◎'},'م':{n:'المحور المالي',c:'#d4af37',i:'◈'},'د':{n:'العمليات الداخلية',c:'#c4a246',i:'▣'},'ن':{n:'التعلم والنمو',c:'#a78bfa',i:'✦'}};
const SC={exceeded:'#059669',achieved:'#8b1a3a',partial:'#d4af37',not_achieved:'#ff4d6d',pending:'#64748b'};
const SL={exceeded:'✅ متجاوز المستهدف',achieved:'🟢 متحقق',partial:'🟡 متحقق جزئياً',not_achieved:'🔴 غير متحقق',pending:'⏳ انتظار'};
const jsonRequestCache = new Map();

let allKpis=[], allGoals=[];

function safeMetricPct(actual, target){
  const a = Number(actual);
  const t = Number(target);
  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0) return null;
  const pct = (a / t) * 100;
  return Math.max(0, Math.min(100, pct));
}

function avgMetricPct(rows){
  const valid = (Array.isArray(rows) ? rows : []).filter(k => safeMetricPct(k.q_actual, k.q_target) !== null);
  if(!valid.length) return 0;
  return Math.round(valid.reduce((sum, k) => sum + safeMetricPct(k.q_actual, k.q_target), 0) / valid.length);
}

let strategicRefreshTimer = null;
function scheduleStrategicRefresh(){
  if (document.hidden) return;
  if (strategicRefreshTimer) clearTimeout(strategicRefreshTimer);
  strategicRefreshTimer = setTimeout(() => {
    clearJsonCache();
    load();
  }, 180);
}

function fetchJsonCached(url, ttl = 30000){
  const now = Date.now();
  const cached = jsonRequestCache.get(url);
  if(cached?.data !== undefined && (now - cached.time) < ttl){
    return Promise.resolve(cached.data);
  }
  if(cached?.promise){
    return cached.promise;
  }
  const promise = fetch(url, {cache:'no-store'})
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

window.addEventListener('DOMContentLoaded', load);
window.addEventListener('focus', scheduleStrategicRefresh);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleStrategicRefresh();
});

async function load(){
  const yr=document.getElementById('fYear').value;
  const q=document.getElementById('fQ').value;
  document.getElementById('pageSubTitle').textContent=`جمعية الزاد ${yr} · الربع ${QN[q]}`;
  try{
    [allKpis, allGoals]=await Promise.all([
      fetchJsonCached(`${API}?endpoint=kpis&type=strategic&year=${yr}&quarter=${q}`),
      fetchJsonCached(`${API}?endpoint=strategic_goals`, 60000)
    ]);
    render();
    renderStrategicSummary();
    renderDeptChart();
    renderKpiTable();
  }catch(e){document.getElementById('mainWrap').innerHTML='<div style="text-align:center;padding:3rem;color:var(--red)"> خطأ في التحميل</div>';}
}

function toggleStrategicLayout(hasData){
  const chartSection=document.getElementById('chartSection');
  if(chartSection){
    chartSection.style.display=hasData?'':'none';
  }
}

function render(){
  const yr=document.getElementById('fYear').value;
  const q=+document.getElementById('fQ').value;
  const fStatus=document.getElementById('fStatus').value;
  const wrap=document.getElementById('mainWrap');
  wrap.innerHTML='';
  toggleStrategicLayout(allKpis.length>0);

  // بناء goalMap
  const goalMap={};
  allGoals.forEach(g=>goalMap[g.code]={...g,kpis:[]});
  allKpis.forEach(k=>{
    if(!goalMap[k.goal_code]) goalMap[k.goal_code]={code:k.goal_code,name:'هدف غير مُعرَّف',axis:k.goal_code?.[0]||'ع',kpis:[]};
    goalMap[k.goal_code].kpis.push(k);
  });

  Object.entries(AXES).forEach(([axisKey,axisInfo])=>{
    const axisGoals=Object.values(goalMap).filter(g=>(g.axis||g.code?.[0])===axisKey&&g.kpis.length);
    if(!axisGoals.length) return;

    const axisKpis=axisGoals.flatMap(g=>g.kpis);
    const axisPct=avgMetricPct(axisKpis);

    const aDiv=document.createElement('div');
    aDiv.className='axis-block fade';
    aDiv.innerHTML=`
      <div class="axis-header" style="border-right:4px solid ${axisInfo.c}">
        <div style="display:flex;align-items:center;gap:.6rem">
          <span style="font-size:1.2rem">${axisInfo.i}</span>
          <h2 style="font-size:.95rem;font-weight:800;color:${axisInfo.c}">${axisInfo.n}</h2>
          <span style="font-size:.7rem;color:var(--dim)">${axisKpis.length} مؤشر</span>
        </div>
        <span style="font-size:1.3rem;font-weight:800;color:${axisInfo.c}">${axisPct}%</span>
      </div>`;
    wrap.appendChild(aDiv);

    axisGoals.forEach(goal=>{
      const gDiv=document.createElement('div');
      gDiv.className='goal-block';
      gDiv.style.borderRightColor=axisInfo.c+'60';
      gDiv.innerHTML=`
        <div class="goal-header">
          <span class="goal-code" style="color:${axisInfo.c};background:${axisInfo.c}18">${goal.code}</span>
          <span style="font-size:.82rem;font-weight:700">${goal.name}</span>
          <span style="font-size:.7rem;color:var(--dim);margin-right:auto">${goal.kpis.length} مؤشر</span>
        </div>
        <div class="kpi-grid" id="g_${goal.code.replace(/[^a-zA-Z0-9]/g,'_')}"></div>`;
      aDiv.appendChild(gDiv);

      const grid=gDiv.querySelector(`#g_${goal.code.replace(/[^a-zA-Z0-9]/g,'_')}`);
      goal.kpis.forEach(k=>{
        if(fStatus && k.q_status!==fStatus) return;
        const rawPct=safeMetricPct(k.q_actual, k.q_target);
        const pct=rawPct!==null?Math.round(rawPct):null;
        const dev=k.q_target>0&&k.q_actual!==null?((k.q_actual-k.q_target)/k.q_target*100).toFixed(1):null;
        const sc=SC[k.q_status||'pending'];
        const sl=SL[k.q_status||'pending'];
        const trend=pct===null?'→':pct>=100?'':pct>=85?'→':'';
        const updatedAt=k.updated_at?k.updated_at.split(' ')[0]:'—';

        const card=document.createElement('div');
        card.className='kpi-card';
        card.dataset.status=k.q_status||'pending';
        card.innerHTML=`
          <div class="kpi-row">
            <span class="kpi-code">${k.code}</span>
            <span class="trend">${trend}</span>
          </div>
          <div class="kpi-name">${k.name}</div>
          ${k.description?`<div style="font-size:.7rem;color:var(--slate);margin-bottom:.6rem;line-height:1.5;border-right:2px solid var(--teal);padding-right:.5rem">${k.description.substring(0,120)}${k.description.length>120?'…':''}</div>`:''}
          <div class="kpi-fields">
            <div class="field">
              <div class="field-lbl">خط الاساس</div>
              <div class="field-val">${fmt(k.baseline)}</div>
            </div>
            <div class="field">
              <div class="field-lbl">مستهدف ${yr}</div>
              <div class="field-val">${fmt(k.annual_target)}</div>
            </div>
            <div class="field">
              <div class="field-lbl">المستهدف الربعي</div>
              <div class="field-val">${fmt(k.q_target)}</div>
            </div>
            <div class="field">
              <div class="field-lbl">المتحقق الفعلي</div>
              <div class="field-val" style="color:${sc}">${k.q_actual!==null?fmt(k.q_actual):'—'}</div>
            </div>
            <div class="field">
              <div class="field-lbl">نسبة الإنجاز</div>
              <div class="field-val" style="color:${sc}">${pct!==null?pct+'%':'—'}</div>
            </div>
            <div class="field">
              <div class="field-lbl">نسبة الانحراف</div>
              <div class="field-val" style="color:${dev!==null&&+dev<0?'var(--red)':'var(--teal)'}">${dev!==null?(+dev>0?'+':'')+dev+'%':'—'}</div>
            </div>
            <div class="field">
              <div class="field-lbl" style="visibility:hidden">-</div>
              <div class="field-val"></div>
            </div>
          </div>
          ${pct!==null?`<div class="prog"><div class="prog-fill" style="background:${sc};width:${Math.min(pct,100)}%"></div></div>`:''}
          <div class="kpi-footer">
            <div>
              <span class="status-badge" style="color:${sc};background:${sc}18;border:1px solid ${sc}35">${sl}</span>
              <div style="font-size:.65rem;color:var(--dim);margin-top:.3rem">الإدارة المالكة: ${k.owner_dept||'—'}</div>
              <div style="font-size:.65rem;color:var(--dim)">آخر تحديث: ${updatedAt}</div>
            </div>
            <div style="display:flex;gap:.45rem">
            <button class="btn-analysis" onclick="openAnalysis(${k.id})">📊 تحليل</button>
          </div>
          </div>`;
        grid.appendChild(card);
      });
    });
  });

  if(!wrap.children.length){
    wrap.innerHTML='<div class="empty-notice">لا توجد مؤشرات لهذه السنة أو الربع المحدد</div>';
  }
}

function applyFilter(){
  const fStatus=document.getElementById('fStatus').value;
  document.querySelectorAll('.kpi-card').forEach(c=>{
    c.style.display=(!fStatus||c.dataset.status===fStatus)?'':'none';
  });
  renderKpiTable();
}

function renderKpiTable(){
  const tb = document.getElementById('kpiTableBody');
  if(!tb) return;
  if(!allKpis.length){
    tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--dim)">لا توجد مؤشرات لهذه السنة أو الربع المحدد</td></tr>';
    return;
  }
  const fStatus = document.getElementById('fStatus')?.value || '';
  const rows = allKpis.filter(k => !fStatus || k.q_status === fStatus);
  if(!rows.length){
    tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--dim)">لا توجد مؤشرات</td></tr>';
    return;
  }
  tb.innerHTML = rows.map(k => {
  const rawPct = safeMetricPct(k.q_actual, k.q_target);
  const pct = rawPct!==null ? Math.round(rawPct) : null;
    const dev = k.q_target>0 && k.q_actual!==null ? ((k.q_actual-k.q_target)/k.q_target*100).toFixed(1) : null;
    const sc  = SC[k.q_status||'pending'];
    const sl  = SL[k.q_status||'pending'];
    const devColor = dev!==null && +dev<0 ? 'var(--red)' : 'var(--teal)';
    return `<tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseenter="this.style.background='var(--card2)'" onmouseleave="this.style.background=''">
      <td style="padding:.5rem .75rem;font-weight:800;color:var(--teal)">${k.code}</td>
      <td style="padding:.5rem .75rem;max-width:250px">
        <div style="font-weight:600;line-height:1.4">${k.name}</div>
        ${k.description?`<div style="font-size:.68rem;color:var(--slate);margin-top:.2rem;line-height:1.3">${k.description.substring(0,80)}…</div>`:''}
      </td>
      <td style="padding:.5rem .75rem;text-align:center;font-weight:700">${k.q_target!==null?fmt(k.q_target):'—'}</td>
      <td style="padding:.5rem .75rem;text-align:center;font-weight:700;color:${sc}">${k.q_actual!==null?fmt(k.q_actual):'—'}</td>
      <td style="padding:.5rem .75rem;text-align:center;font-weight:800;color:${sc}">${pct!==null?pct+'%':'—'}</td>
      <td style="padding:.5rem .75rem;text-align:center;font-weight:700;color:${devColor}">${dev!==null?(+dev>0?'+':'')+dev+'%':'—'}</td>
      <td style="padding:.5rem .75rem;text-align:center"><span style="font-size:.72rem;font-weight:700;color:${sc};background:${sc}18;border:1px solid ${sc}35;padding:.2rem .55rem;border-radius:99px;white-space:nowrap">${sl}</span></td>
      <td style="padding:.5rem .75rem;text-align:center">
        <button class="btn-analysis" type="button" onclick="openAnalysis(${k.id})" style="white-space:nowrap">📊 تحليل</button>
      </td>
    </tr>`;
  }).join('');
}

function filterKpiTable(){
  const search = (document.getElementById('kpiSearch')?.value||'').toLowerCase();
  const axis   = document.getElementById('axisFilter')?.value||'';
  const rows   = document.querySelectorAll('#kpiTableBody tr');
  rows.forEach(r=>{
    const code = r.querySelector('td')?.textContent||'';
    const name = r.querySelectorAll('td')[1]?.textContent||'';
    const matchAxis   = !axis || code.startsWith(axis);
    const matchSearch = !search || code.toLowerCase().includes(search) || name.toLowerCase().includes(search);
    r.style.display = matchAxis && matchSearch ? '' : 'none';
  });
}

async function openAnalysis(kpiId){
  const yr = document.getElementById('fYear').value || '2026';
  const q  = +document.getElementById('fQ').value  || 1;
  const kpi=allKpis.find(k=>k.id==kpiId);
  if(!kpi) return;

  document.getElementById('analysisModal').style.display='flex';
  document.getElementById('mCode').textContent=kpi.code;
  document.getElementById('mName').textContent=kpi.name;

  const rawPct=safeMetricPct(kpi.q_actual, kpi.q_target);
  const pct=rawPct!==null?Math.round(rawPct):null;
  const dev=kpi.q_target>0&&kpi.q_actual!==null?((kpi.q_actual-kpi.q_target)/kpi.q_target*100).toFixed(1):null;
  const sc=SC[kpi.q_status||'pending'];
  const sl=SL[kpi.q_status||'pending'];

  // جلب بيانات الأرباع الأربعة
  let qData=[];
  try{
    const qs=await Promise.all([1,2,3,4].map(qi=>fetchJsonCached(`${API}?endpoint=kpis&type=strategic&year=${yr}&quarter=${qi}`)));
    qData=qs.map((arr,i)=>{const found=arr.find(k=>k.id==kpiId);return{q:i+1,actual:found?.q_actual??null,target:found?.q_target??kpi.q_target};});
  }catch(e){}

  // جلب بطاقة الانحراف
  let devCard=null;
  try{
    const cards=await fetchJsonCached(`${API}?endpoint=deviation_cards&year=${yr}&quarter=${q}`);
    devCard=Array.isArray(cards)?cards.find(c=>c.kpi_id==kpiId):null;
  }catch(e){}

  const chartId='chart_'+kpiId+'_'+Date.now();
  document.getElementById('mBody').innerHTML=`
    <!-- 1. ملخص الهدف والمؤشر -->
    <div class="section-h"> ملخص المؤشر</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-bottom:1rem">
      <div class="field"><div class="field-lbl">خط الاساس</div><div class="field-val">${fmt(kpi.baseline)}</div></div>
      <div class="field"><div class="field-lbl">المستهدف السنوي</div><div class="field-val">${fmt(kpi.annual_target)}</div></div>
      <div class="field"><div class="field-lbl">المستهدف الربعي</div><div class="field-val">${fmt(kpi.q_target)}</div></div>
      <div class="field"><div class="field-lbl">المتحقق الفعلي</div><div class="field-val" style="color:${sc}">${kpi.q_actual!==null?fmt(kpi.q_actual):'—'}</div></div>
      <div class="field"><div class="field-lbl">نسبة الإنجاز</div><div class="field-val" style="color:${sc}">${pct!==null?pct+'%':'—'}</div></div>
      <div class="field"><div class="field-lbl">نسبة الانحراف</div><div class="field-val" style="color:${dev!==null&&+dev<0?'var(--red)':'var(--teal)'}">${dev!==null?(+dev>0?'+':'')+dev+'%':'—'}</div></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;background:${sc}15;border:1px solid ${sc}35;border-radius:.65rem;padding:.65rem 1rem;margin-bottom:1rem">
      <span style="font-weight:800;color:${sc}">${sl}</span>
      <span style="font-size:.75rem;color:var(--dim)">الإدارة المالكة: ${kpi.owner_dept||'—'}</span>
    </div>

    <!-- 2. رسم الاتجاه الزمني -->
    <div class="section-h"> تحليل اتجاه الأداء الزمني — ${yr}</div>
    <div class="chart-wrap"><canvas id="${chartId}"></canvas></div>

    <!-- 3. مقارنة الفترات -->
    <div class="section-h"> التحليل المقارن للأداء الربعي</div>
    <div class="q-grid">
      ${qData.map(qd=>{
        const qRawPct=safeMetricPct(qd.actual, qd.target);
        const qp=qRawPct!==null?Math.round(qRawPct):null;
        const qc=qp===null?'var(--dim)':qp>=100?'var(--teal)':qp>=85?'#22c55e':qp>=50?'var(--gold)':'var(--red)';
        return `<div class="q-box" style="${qd.q==q?'border:1px solid var(--teal)':''}">
          <div style="font-size:.65rem;color:var(--dim)">ربع ${QN[qd.q]}</div>
          <div style="font-size:1.1rem;font-weight:800;color:${qc}">${qp!==null?qp+'%':'—'}</div>
        </div>`;
      }).join('')}
    </div>

    <!-- 4. تفسير الحالة وأسباب الانحراف -->
    ${devCard?`
    <div class="section-h"> تفسير الحالة وأسباب الانحراف</div>
    <div class="dev-box">
      <div class="info-row"><span style="color:var(--dim)">سبب الانحراف</span><span style="font-weight:700">${devCard.reason||'لم يُحدد'}</span></div>
      <div class="info-row"><span style="color:var(--dim)">الإجراء التصحيحي</span><span style="font-weight:700">${devCard.action||'لم يُحدد'}</span></div>
      <div class="info-row"><span style="color:var(--dim)">المسؤول</span><span style="font-weight:700">${devCard.responsible||'—'}</span></div>
      <div class="info-row"><span style="color:var(--dim)">تاريخ الإغلاق</span><span style="font-weight:700">${devCard.due_date||'—'}</span></div>
      <div class="info-row"><span style="color:var(--dim)">حالة الإجراء</span>
        <span style="font-weight:700;color:${devCard.status==='closed'?'var(--teal)':devCard.status==='in_progress'?'var(--gold)':'var(--red)'}">
          ${devCard.status==='closed'?' مغلقة':devCard.status==='in_progress'?' قيد المعالجة':' مفتوحة'}
        </span>
      </div>
    </div>`:
    (dev!==null&&+dev<-14?`<div class="section-h">⚠ انحراف يستوجب إجراء</div>
    <div style="background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.2);border-radius:.65rem;padding:.85rem;margin-bottom:1rem">
      <span style="font-size:.78rem;color:var(--red)">⚠️ هذا المؤشر يحتاج بطاقة انحراف — يُنشأ من لوحة الإدارة</span>
    </div>`:'')
    }

    <!-- 7. تصدير PDF -->
    <div style="margin-top:1.25rem;display:flex;gap:.65rem">
      <button onclick="closeModal()" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.65rem;padding:.65rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer">إغلاق</button>
      <button onclick="window.print()" style="flex:1;background:var(--teal);color:#07111f;border:none;border-radius:.65rem;padding:.65rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer"> تصدير PDF</button>
    </div>`;

  // رسم الاتجاه الزمني
  setTimeout(()=>{
    const ctx=document.getElementById(chartId);
    if(!ctx) return;
    new Chart(ctx,{
      type:'line',
      data:{
        labels:['الربع الأول','الربع الثاني','الربع الثالث','الربع الرابع'],
        datasets:[
          {label:'الفعلي',data:qData.map(d=>d.actual),borderColor:'#8b1a3a',backgroundColor:'rgba(139,26,58,.1)',tension:.4,fill:true,pointRadius:5,pointBackgroundColor:'#8b1a3a'},
          {label:'المستهدف',data:qData.map(d=>d.target),borderColor:'#d4af37',borderDash:[5,5],backgroundColor:'transparent',tension:.4,fill:false,pointRadius:4,pointBackgroundColor:'#d4af37'}
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:true,position:'bottom',labels:{color:'#64748b',font:{size:10},padding:8}}},
        scales:{x:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#e5e5e5'}},y:{ticks:{color:'#64748b',font:{size:10}},grid:{color:'#e5e5e5'}}}}
    });
  },80);
}

async function createDevCard(kpiId,yr,q){
  try{
    const r=await fetch(`${API}?endpoint=deviation_cards`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kpi_id:kpiId,year:yr,quarter:q})});
    const d=await r.json();
    if(d.success){ clearJsonCache(); openAnalysis(kpiId); }
  }catch(e){}
}

function renderStrategicSummary(){
  const pct=avgMetricPct(allKpis);
  const goals=new Set(allKpis.map(k=>k.goal_code).filter(Boolean)).size;
  const el=id=>document.getElementById(id);
  if(el('sumPct'))el('sumPct').textContent=pct+'%';
  if(el('sumGoals'))el('sumGoals').textContent=goals;
  if(el('sumTotal'))el('sumTotal').textContent=allKpis.length;
  if(el('sumExceeded'))el('sumExceeded').textContent=allKpis.filter(k=>k.q_status==='exceeded').length;
  if(el('sumAchieved'))el('sumAchieved').textContent=allKpis.filter(k=>k.q_status==='achieved').length;
  if(el('sumPartial'))el('sumPartial').textContent=allKpis.filter(k=>k.q_status==='partial').length;
  if(el('sumFailed'))el('sumFailed').textContent=allKpis.filter(k=>k.q_status==='not_achieved').length;
}
let deptChartInst=null;
function renderDeptChart(){
  // ── محاور BSC الأربعة مع ألوانها وأسمائها ──
  const AXES = {
    'ع': { name: 'محور العملاء',        color: '#8b1a3a', border: '#6d1530' },
    'م': { name: 'المحور المالي',        color: '#d4af37', border: '#b8952a' },
    'د': { name: 'العمليات الداخلية',   color: '#c4a246', border: '#a88830' },
    'ن': { name: 'التعلم والنمو',        color: '#a78bfa', border: '#7c3aed' },
  };

  // ── احسب أداء كل محور فعلياً من المؤشرات ──
  const axisData = {};
  Object.keys(AXES).forEach(key => { axisData[key] = {sum:0, count:0}; });

  allKpis.forEach(k => {
    const axisKey = (k.goal_code || '').charAt(0);
    if (!axisData[axisKey]) return;
    const pct = safeMetricPct(k.q_actual, k.q_target);
    if (pct !== null) {
      axisData[axisKey].sum   += pct;
      axisData[axisKey].count += 1;
    }
  });

  const labels  = Object.keys(AXES).map(k => AXES[k].name);
  const values  = Object.keys(AXES).map(k =>
    axisData[k].count ? Math.round(axisData[k].sum / axisData[k].count) : 0
  );
  const colors  = Object.keys(AXES).map(k => AXES[k].color + 'CC');
  const borders = Object.keys(AXES).map(k => AXES[k].border);

  // ── عمود أداء الجمعية — متوسط كل المؤشرات ──
  const assocPct = avgMetricPct(allKpis);

  const finalLabels  = [...labels, 'أداء الجمعية'];
  const finalValues  = [...values, assocPct];
  const finalColors  = [...colors, '#38bdf8CC'];
  const finalBorders = [...borders,'#0ea5e9'];
  const finalRadii   = [...labels.map(()=>7), 9];

  // ── Legend ──
  const leg = document.getElementById('deptLegend');
  if(leg) leg.innerHTML = finalLabels.map((l,i) => {
    const isAssoc = i === finalLabels.length - 1;
    const col = isAssoc ? '#38bdf8' : Object.values(AXES)[i]?.color || '#94a3b8';
    const pct = finalValues[i];
    const bar = pct >= 85 ? '🟢' : pct >= 50 ? '🟡' : pct > 0 ? '🔴' : '⬜';
    return `<span style="display:inline-flex;align-items:center;gap:.3rem">
      <span style="width:10px;height:10px;border-radius:2px;background:${col};display:inline-block"></span>
      <span style="color:${col};font-weight:${isAssoc?'800':'600'}">${l} (${pct}%) ${bar}</span>
    </span>`;
  }).join('');

  const host = document.getElementById('deptChartHost');
  if(!host) return;
  if(deptChartInst){ deptChartInst.destroy(); deptChartInst=null; }
  if(!allKpis.length){
    if(leg) leg.innerHTML='';
    host.innerHTML='<div class="chart-empty">لا توجد بيانات كافية لعرض مقارنة المحاور</div>';
    return;
  }
  if(!host.querySelector('canvas')){
    host.innerHTML='<canvas id="deptCompChart"></canvas>';
  }
  const chartCanvas=document.getElementById('deptCompChart');
  if(!chartCanvas) return;

  // خطوط هدف المستهدف (85%)
  const targetLine = {
    id: 'targetLine',
    afterDraw(chart) {
      const {ctx:c2, chartArea:{left,right}, scales:{y}} = chart;
      const y85 = y.getPixelForValue(85);
      c2.save();
      c2.setLineDash([6,4]);
      c2.strokeStyle = 'rgba(255,77,109,0.45)';
      c2.lineWidth = 1.5;
      c2.beginPath(); c2.moveTo(left,y85); c2.lineTo(right,y85); c2.stroke();
      c2.fillStyle='rgba(255,77,109,0.7)';
      c2.font='9px Arial';
      c2.textAlign='right';
      c2.fillText('85% المستهدف', right-4, y85-4);
      c2.restore();
    }
  };

  deptChartInst = new Chart(chartCanvas, {
    type: 'bar',
    plugins: [targetLine],
    data: {
      labels: finalLabels,
      datasets: [{
        data:            finalValues,
        backgroundColor: finalColors,
        borderColor:     finalBorders,
        borderWidth:     finalLabels.map((_,i) => i===finalLabels.length-1 ? 2.5 : 1.5),
        borderRadius:    finalRadii,
        borderSkipped:   false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            title: ctx2 => ctx2[0].label,
            label: ctx2 => {
              const isAssoc = ctx2.dataIndex === finalLabels.length - 1;
              const pct = ctx2.parsed.y;
              const status = pct >= 100 ? 'متجاوز ✅' : pct >= 85 ? 'متحقق 🟢' : pct >= 50 ? 'جزئي 🟡' : 'غير متحقق 🔴';
              const base = ` الأداء: ${pct}% — ${status}`;
              return isAssoc ? base + ' (متوسط الجمعية)' : base;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: v => v + '%', color: '#64748b', stepSize: 25 },
          grid: { color: 'rgba(100,116,139,0.15)' }
        },
        x: {
          ticks: {
            color: (ctx2) => ctx2.index === finalLabels.length - 1 ? '#38bdf8' : '#94a3b8',
            font: (ctx2) => ctx2.index === finalLabels.length - 1
              ? { weight: 'bold', size: 11 }
              : { size: 10 }
          },
          grid: { display: false }
        }
      },
      animation: { duration: 900, easing: 'easeOutQuart' }
    }
  });
}

function closeModal(){document.getElementById('analysisModal').style.display='none';}
function fmt(n){if(n===null||n===undefined)return'—';const v=+n;if(isNaN(v))return n;if(v>=1000000)return(v/1000000).toFixed(1)+'م';if(v>=1000)return(v/1000).toFixed(1)+'ك';if(v>0&&v<1)return(v*100).toFixed(1)+'%';return v.toLocaleString('ar-SA',{maximumFractionDigits:1});}
</script>

<!-- Modal تعديل قيمة سريع -->
<div class="modal-wrap" id="quickEditModal" style="display:none;z-index:300">
  <div class="modal-box" style="max-width:420px">
    <div class="modal-head">
      <div>
        <span id="qeCode" style="font-size:.72rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.2rem .55rem;border-radius:.3rem"></span>
        <h3 id="qeName" style="font-size:.88rem;font-weight:800;margin-top:.3rem"></h3>
      </div>
      <button class="close-btn" onclick="closeQuickEdit()">✕</button>
    </div>
    <div style="padding:1.25rem">
      <input type="hidden" id="qeKpiId">
      <input type="hidden" id="qeYear">
      <input type="hidden" id="qeQ">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-bottom:.75rem">
        <div>
          <label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">المستهدف الربعي</label>
          <input id="qeTarget" type="number" step="any" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none" placeholder="0">
        </div>
        <div>
          <label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">القيمة الفعلية *</label>
          <input id="qeActual" type="number" step="any" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none" placeholder="0">
        </div>
      </div>
      <div style="margin-bottom:1rem">
        <label style="font-size:.7rem;color:var(--dim);display:block;margin-bottom:.25rem">ملاحظات</label>
        <input id="qeNotes" type="text" style="width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none" placeholder="ملاحظة اختيارية…">
      </div>
      <div style="display:flex;gap:.65rem">
        <button onclick="closeQuickEdit()" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.8rem;cursor:pointer">إلغاء</button>
        <button onclick="saveQuickEdit()" style="flex:2;background:var(--teal);color:#fff;border:none;border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer">💾 حفظ القيمة</button>
      </div>
    </div>
  </div>
</div>

<script>
function openQuickEdit(kpiId,yr,q,code,name,target,actual){
  document.getElementById('quickEditModal').style.display='flex';
  document.getElementById('qeKpiId').value=kpiId;
  document.getElementById('qeYear').value=yr;
  document.getElementById('qeQ').value=q;
  document.getElementById('qeCode').textContent=code;
  document.getElementById('qeName').textContent=name;
  document.getElementById('qeTarget').value=target||'';
  document.getElementById('qeActual').value=actual||'';
  document.getElementById('qeNotes').value='';
}
function closeQuickEdit(){document.getElementById('quickEditModal').style.display='none';}
async function saveQuickEdit(){
  const kpiId=document.getElementById('qeKpiId').value;
  const yr=+document.getElementById('qeYear').value;
  const q=+document.getElementById('qeQ').value;
  const target=document.getElementById('qeTarget').value;
  const actual=document.getElementById('qeActual').value;
  const notes=document.getElementById('qeNotes').value;
  if(actual===''){alert('⚠️ أدخل القيمة الفعلية');return;}
  try{
    const r=await fetch('api.php?endpoint=kpi_values',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kpi_id:+kpiId,year:yr,quarter:q,target:+target,actual:+actual,notes})});
    const d=await r.json();
    if(d.success){clearJsonCache();closeQuickEdit();load();}
    else alert('❌ '+(d.error||'خطأ'));
  }catch(e){alert('❌ خطأ في الاتصال');}
}
</script>
<!-- ═══ Modal بطاقة الانحراف ═══ -->
<div class="modal-wrap" id="devCardModal" style="display:none;z-index:400">
  <div class="modal-box" style="max-width:600px">
    <div class="modal-head">
      <div>
        <span id="dcBadge" style="font-size:.7rem;font-weight:800;color:var(--red);background:rgba(255,77,109,.12);padding:.2rem .55rem;border-radius:.3rem">📋 بطاقة الانحراف</span>
        <h3 id="dcTitle" style="font-size:.9rem;font-weight:800;margin-top:.3rem"></h3>
      </div>
      <button class="close-btn" onclick="closeDevCardModal()">✕ إغلاق</button>
    </div>
    <div style="padding:1.25rem" id="dcBody">
      <div style="text-align:center;padding:2rem;color:var(--dim)">جاري التحميل…</div>
    </div>
  </div>
</div>

<style>
.dc-label{font-size:.72rem;color:var(--dim);display:block;margin-bottom:.3rem;font-weight:700}
.dc-inp{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.6rem;padding:.55rem .75rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none;transition:border-color .2s}
.dc-inp:focus{border-color:var(--red)}
.dc-sel{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.6rem;padding:.55rem .75rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none;cursor:pointer}
.dc-grid2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem}
.dc-info{background:var(--card2);border-radius:.65rem;padding:.6rem .85rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}
@media (max-width:640px){
  .dc-grid2{grid-template-columns:1fr}
  .dc-info{flex-direction:column;align-items:flex-start;gap:.5rem}
}
</style>

<script>
let _dcKpiId=0, _dcYear=2026, _dcQ=1, _dcCardId=null;

async function openDevCardModal(kpiId, code, name, yr, q){
  _dcKpiId=kpiId; _dcYear=+yr; _dcQ=+q; _dcCardId=null;
  document.getElementById('devCardModal').style.display='flex';
  document.getElementById('dcTitle').textContent=`${code} · ${name}`;
  document.getElementById('dcBody').innerHTML='<div style="text-align:center;padding:2rem;color:var(--dim)">جاري التحميل…</div>';

  // اجلب البطاقة إن وجدت + بيانات المؤشر
  try{
    const [cards, kpiArr] = await Promise.all([
      fetchJsonCached(`${API}?endpoint=deviation_cards&year=${yr}&quarter=${q}`),
      fetchJsonCached(`${API}?endpoint=kpis&id=${kpiId}&year=${yr}&quarter=${q}`)
    ]);
    const existing = Array.isArray(cards) ? cards.find(c=>c.kpi_id==kpiId) : null;
    const kpi = Array.isArray(kpiArr) ? kpiArr.find(k=>k.id==kpiId) : kpiArr;
    renderDevCardForm(existing, kpi);
  } catch(e){
    document.getElementById('dcBody').innerHTML='<div style="color:var(--red);padding:1rem">❌ خطأ في التحميل</div>';
  }
}

function renderDevCardForm(card, kpi){
  _dcCardId = card?.id ?? null;
  const isEdit = !!card;
  const dev = card?.deviation_pct ?? (kpi?.q_target>0&&kpi?.q_actual!==null ? ((kpi.q_actual-kpi.q_target)/kpi.q_target*100).toFixed(1) : 0);
  const devColor = +dev < -30 ? 'var(--red)' : +dev < 0 ? 'var(--gold)' : '#059669';
  const statusMap = {open:'🔴 مفتوحة',in_progress:'🟠 قيد المعالجة',under_execution:'🔵 تحت التنفيذ',pending_verify:'🟡 انتظار التحقق',closed:'✅ مغلقة'};
  const riskMap   = {'مرتفع':'🔴 مرتفع','متوسط':'🟠 متوسط','منخفض':'🟢 منخفض'};

  document.getElementById('dcBody').innerHTML=`
    <!-- معلومات المؤشر -->
    <div class="dc-info">
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <span style="font-size:.75rem"><span style="color:var(--dim)">المستهدف: </span><strong>${fmt(kpi?.q_target)}</strong></span>
        <span style="font-size:.75rem"><span style="color:var(--dim)">الفعلي: </span><strong style="color:${devColor}">${fmt(kpi?.q_actual)}</strong></span>
        <span style="font-size:.75rem"><span style="color:var(--dim)">الانحراف: </span><strong style="color:${devColor}">${+dev>0?'+':''}${dev}%</strong></span>
      </div>
      ${isEdit?`<span style="font-size:.7rem;font-weight:700;color:${card.status==='closed'?'#059669':card.status==='in_progress'?'var(--gold)':'var(--red)'}">${statusMap[card.status]||card.status}</span>`:''}
    </div>

    <!-- النموذج -->
    <div class="dc-grid2">
      <div>
        <label class="dc-label">سبب الانحراف *</label>
        <textarea id="dc_reason" class="dc-inp" rows="3" placeholder="اذكر سبب الانحراف عن المستهدف…" style="resize:vertical">${card?.reason??''}</textarea>
      </div>
      <div>
        <label class="dc-label">الإجراء التصحيحي *</label>
        <textarea id="dc_action" class="dc-inp" rows="3" placeholder="ما الإجراء المتخذ أو المخطط؟" style="resize:vertical">${card?.action??''}</textarea>
      </div>
    </div>

    <div class="dc-grid2">
      <div>
        <label class="dc-label">الأثر المتوقع (عدم المعالجة)</label>
        <input id="dc_impact" class="dc-inp" type="text" placeholder="ما الأثر إن لم يُعالج؟" value="${card?.impact??''}">
      </div>
      <div>
        <label class="dc-label">المسؤول عن التنفيذ</label>
        <input id="dc_responsible" class="dc-inp" type="text" placeholder="اسم المسؤول أو الجهة" value="${card?.responsible??''}">
      </div>
    </div>

    <div class="dc-grid2">
      <div>
        <label class="dc-label">تاريخ الإغلاق المستهدف</label>
        <input id="dc_due_date" class="dc-inp" type="date" value="${card?.due_date??''}">
      </div>
      <div>
        <label class="dc-label">تاريخ إعادة القياس</label>
        <input id="dc_remeasure" class="dc-inp" type="date" value="${card?.remeasure_date??''}">
      </div>
    </div>

    <div class="dc-grid2">
      <div>
        <label class="dc-label">مستوى الخطورة</label>
        <select id="dc_risk" class="dc-sel">
          <option value="">-- اختر --</option>
          ${Object.entries(riskMap).map(([v,l])=>`<option value="${v}" ${card?.risk_level===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="dc-label">حالة البطاقة</label>
        <select id="dc_status" class="dc-sel">
          ${Object.entries(statusMap).map(([v,l])=>`<option value="${v}" ${(card?.status??'open')===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="dc-grid2" style="margin-bottom:1rem">
      <div>
        <label class="dc-label">قيمة التحسن المحققة</label>
        <input id="dc_imp_val" class="dc-inp" type="number" step="any" placeholder="0" value="${card?.improvement_value??''}">
      </div>
      <div>
        <label class="dc-label">نسبة التحسن %</label>
        <input id="dc_imp_pct" class="dc-inp" type="number" step="any" placeholder="0" value="${card?.improvement_pct??''}">
      </div>
    </div>

    <!-- أزرار الحفظ -->
    <div style="display:flex;gap:.65rem;margin-top:.5rem">
      <button onclick="closeDevCardModal()" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.65rem;padding:.65rem;font-family:'Almarai',sans-serif;font-size:.82rem;cursor:pointer">إلغاء</button>
      ${isEdit?`<button onclick="deleteDevCard(${card.id})" style="background:rgba(255,77,109,.12);color:var(--red);border:1px solid rgba(255,77,109,.3);border-radius:.65rem;padding:.65rem .85rem;font-family:'Almarai',sans-serif;font-size:.8rem;font-weight:700;cursor:pointer">🗑️ حذف</button>`:''}
      <button onclick="saveDevCard()" style="flex:2;background:var(--red);color:#fff;border:none;border-radius:.65rem;padding:.65rem;font-family:'Almarai',sans-serif;font-size:.85rem;font-weight:800;cursor:pointer">
        ${isEdit?'💾 حفظ التعديلات':'➕ إضافة البطاقة'}
      </button>
    </div>`;
}

async function saveDevCard(){
  const reason = document.getElementById('dc_reason').value.trim();
  const action = document.getElementById('dc_action').value.trim();
  if(!reason || !action){
    alert('⚠️ يرجى إدخال سبب الانحراف والإجراء التصحيحي على الأقل');
    return;
  }

  const payload = {
    kpi_id:      _dcKpiId,
    year:        _dcYear,
    quarter:     _dcQ,
    reason,
    action,
    impact:            document.getElementById('dc_impact').value.trim()      || null,
    responsible:       document.getElementById('dc_responsible').value.trim() || null,
    due_date:          document.getElementById('dc_due_date').value            || null,
    remeasure_date:    document.getElementById('dc_remeasure').value           || null,
    risk_level:        document.getElementById('dc_risk').value                || null,
    status:            document.getElementById('dc_status').value              || 'open',
    improvement_value: document.getElementById('dc_imp_val').value             || null,
    improvement_pct:   document.getElementById('dc_imp_pct').value             || null,
  };

  // زر الحفظ — تعطيل أثناء الإرسال
  const saveBtn = document.querySelector('#devCardModal button[onclick="saveDevCard()"]');
  if(saveBtn){ saveBtn.disabled=true; saveBtn.textContent='⏳ جارٍ الحفظ…'; }

  try{
    let url, method;
    if(_dcCardId){
      url    = `${API}?endpoint=deviation_cards&id=${_dcCardId}`;
      method = 'PUT';
    } else {
      url    = `${API}?endpoint=deviation_cards`;
      method = 'POST';
    }

    const r = await fetch(url, {
      method,
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    // تأكد أن الـ response JSON وليس HTML خطأ
    const text = await r.text();
    let d;
    try { d = JSON.parse(text); }
    catch(pe){ throw new Error('استجابة خاطئة من السيرفر: ' + text.substring(0,100)); }

    if(d.success || d.id !== undefined){
      clearJsonCache();
      closeDevCardModal();
      showToastDC(_dcCardId ? '✅ تم تحديث البطاقة' : '✅ تم إنشاء البطاقة بنجاح');
    } else {
      alert('❌ ' + (d.error || 'خطأ في الحفظ'));
    }
  } catch(e){
    alert('❌ خطأ في الاتصال: ' + e.message);
  } finally {
    if(saveBtn){ saveBtn.disabled=false; saveBtn.textContent=_dcCardId ? '💾 حفظ التعديلات' : '➕ إضافة البطاقة'; }
  }
}

async function deleteDevCard(cardId){
  if(!confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;
  try{
    const r = await fetch(`${API}?endpoint=deviation_cards&id=${cardId}`, {method:'DELETE'});
    const d = await r.json();
    if(d.success){ clearJsonCache(); closeDevCardModal(); showToastDC('🗑️ تم حذف البطاقة'); }
    else alert('❌ فشل الحذف');
  } catch(e){ alert('❌ خطأ'); }
}

function closeDevCardModal(){ document.getElementById('devCardModal').style.display='none'; }

function showToastDC(msg){
  let t = document.getElementById('toastDC');
  if(!t){
    t = document.createElement('div');
    t.id = 'toastDC';
    t.style.cssText='position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);color:var(--text);padding:.65rem 1.25rem;border-radius:.75rem;font-size:.82rem;font-weight:700;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none;font-family:"Almarai",sans-serif';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity='1';
  setTimeout(()=>t.style.opacity='0', 3000);
}

// ── نظام الوضع النهاري/الليلي ──────────────────────────
function togglePageTheme(){}
</script>

</body>
</html>
