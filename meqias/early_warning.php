<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>الإنذار المبكر | مِقياس</title>
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
.sel{background:var(--card2);border:1px solid var(--border);color:var(--text);padding:.45rem .8rem;border-radius:.6rem;font-family:'Almarai',sans-serif;font-size:.78rem;font-weight:700;outline:none;cursor:pointer}
.wrap{max-width:1000px;margin:0 auto;padding:1.5rem}
#pageDesc{max-width:620px !important;margin:.4rem 0 0 !important;padding:.6rem .85rem !important;border-radius:0 .45rem .45rem 0 !important}
#pageDesc p{font-size:.72rem !important;line-height:1.65 !important;margin-bottom:.35rem !important}
#pageDesc ul{gap:.2rem .7rem !important}
#pageDesc li{font-size:.68rem !important}
.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
.sum-card{background:var(--card);border:1px solid var(--border);border-radius:.95rem;padding:1.1rem;text-align:center}
.alert-item{border-radius:.9rem;padding:1.1rem;margin-bottom:.7rem;transition:transform .2s}
.alert-item:hover{transform:translateY(-1px)}
.alert-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin:.65rem 0}
.a-box{background:rgba(0,0,0,.15);border-radius:.4rem;padding:.4rem .5rem;text-align:center}
.prog{height:4px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin:.5rem 0}
.prog-fill{height:100%;border-radius:99px}
/* Modal */
.modal-wrap{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:200;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:1rem}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:1.3rem;width:100%;max-width:520px;max-height:88vh;overflow-y:auto}
.modal-head{padding:1.1rem 1.4rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--card)}
.modal-body{padding:1.25rem}
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
}
@media (max-width: 640px) {
  .topbar > div:first-child,
  .modal-head,
  .info-row {
    flex-direction: column;
    align-items: flex-start;
  }
  .topbar > div:last-child {
    width: 100%;
    flex-wrap: wrap;
  }
  #pageDesc {
    max-width: none !important;
    padding: .75rem .85rem !important;
  }
  .summary-grid,
  .alert-grid {
    grid-template-columns: 1fr;
  }
  .alert-item button {
    width: 100%;
    justify-content: center;
  }
  .modal-wrap { padding: .75rem; }
  .modal-box {
    max-width: none !important;
    width: 100% !important;
    border-radius: 1rem;
  }
  #devContent [style*="grid-template-columns:1fr 1fr"] {
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
      <h1 style="font-size:1rem;font-weight:800;color:var(--red)"> مسار الإنذار المبكر</h1>
      <p style="font-size:.7rem;color:var(--dim)" id="pageSubTitle">جمعية الزاد 2026 · الربع الأول</p>
<div id="pageDesc" style="max-width:700px;margin:.75rem 0 0;padding:.9rem 1.1rem;background:rgba(139,26,42,.04);border-right:3px solid var(--teal);border-radius:0 .5rem .5rem 0">
  <p style="font-size:.78rem;color:var(--dim);line-height:1.8;margin-bottom:.6rem">يرتكز هذا المسار على الاستشعار المبكر لمؤشرات تدني الأداء، عبر قراءة التقدم الزمني وتحليله في ضوء المستهدف المرحلي، وإشعار الجهات المعنية في الوقت الذي لا يزال فيه التصحيح ممكنًا</p>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.35rem .9rem">
    <li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>قراءة التقدم الزمني لكل مؤشر</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>مقارنة المتحقق الفعلي بالمستهدف المتوقع حتى تاريخ القراءة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>تحديد المؤشرات المعرضة لخطر عدم التحقق</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>معايير تفعيل التنبيه</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>توقيت التنبيه (بداية الشهر الثالث من كل ربع)</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>إرسال إشعار تلقائي إلى:</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>مدير الإدارة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>مدير القسم</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>سجل التنبيهات الصادرة وتواريخها</li>
  </ul>
</div>
    </div>
  </div>
  <div style="display:flex;gap:.5rem">
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
    <select class="sel" id="fRisk" onchange="applyFilter()">
      <option value="">كل المستويات</option>
      <option value="high"> خطر عالٍ</option>
      <option value="medium"> متوسط</option>
      <option value="low"> منخفض</option>
    </select>
  </div>
      
</header>

<div class="wrap">
  <div class="summary-grid">
    <div class="sum-card" style="border-top:3px solid var(--red)">
      <div class="pulse" style="font-size:1.3rem;margin-bottom:.3rem"></div>
      <div style="font-size:1.8rem;font-weight:800;color:var(--red)" id="cntHigh">—</div>
      <div style="font-size:.72rem;color:var(--slate)">مرتفع</div>
    </div>
    <div class="sum-card" style="border-top:3px solid var(--gold)">
      <div style="font-size:1.3rem;margin-bottom:.3rem"></div>
      <div style="font-size:1.8rem;font-weight:800;color:var(--gold)" id="cntMed">—</div>
      <div style="font-size:.72rem;color:var(--slate)">متوسط</div>
    </div>
    <div class="sum-card" style="border-top:3px solid #fbbf24">
      <div style="font-size:1.3rem;margin-bottom:.3rem"></div>
      <div style="font-size:1.8rem;font-weight:800;color:#fbbf24" id="cntLow">—</div>
      <div style="font-size:.72rem;color:var(--slate)">منخفض</div>
    </div>
  </div>
  <div id="alertsList">
    <div style="text-align:center;padding:4rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
  </div>
</div>

<!-- Modal بطاقة معالجة انحراف المؤشر -->
<div class="modal-wrap" id="devModal" style="align-items:flex-start;padding:1rem;overflow-y:auto">
  <div class="modal-box" style="max-width:680px;width:100%;margin:auto">
    <div class="modal-head">
      <h3 style="font-size:.95rem;font-weight:800;color:var(--red)">بطاقة معالجة انحراف المؤشر</h3>
      <button onclick="document.getElementById('devModal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.28rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.78rem">X اغلاق</button>
    </div>
    <div class="modal-body" id="devContent"></div>
  </div>
</div>

<script>
const API='api.php';
const QN=['','الأول','الثاني','الثالث','الرابع'];
const jsonRequestCache = new Map();
let alerts=[];

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

window.addEventListener('DOMContentLoaded',load);

async function load(){
  const yr=document.getElementById('fYear').value;
  const q=document.getElementById('fQ').value;
  document.getElementById('pageSubTitle').textContent=`الربع ${QN[q]} ${yr}`;
  try{
    const data=await fetchJsonCached(`${API}?endpoint=early_warning&year=${yr}&quarter=${q}`);
    alerts=(Array.isArray(data)?data:[]).sort((a,b)=>+a.deviation_pct-+b.deviation_pct);
    const high=alerts.filter(a=>+a.deviation_pct<-30);
    const med=alerts.filter(a=>+a.deviation_pct>=-30&&+a.deviation_pct<-15);
    const low=alerts.filter(a=>+a.deviation_pct>=-15);
    document.getElementById('cntHigh').textContent=high.length;
    document.getElementById('cntMed').textContent=med.length;
    document.getElementById('cntLow').textContent=low.length;
    render(alerts);
  }catch(e){document.getElementById('alertsList').innerHTML='<div style="text-align:center;padding:3rem;color:var(--red)"> خطأ</div>';}
}

function risk(dev){
  const d=+dev;
  if(d<-30) return{level:'high',label:'مرتفع',color:'var(--red)',bg:'rgba(255,77,109,.08)',border:'rgba(255,77,109,.25)'};
  if(d<-15) return{level:'medium',label:'متوسط',color:'var(--gold)',bg:'rgba(212,175,55,.07)',border:'rgba(212,175,55,.25)'};
  return{level:'low',label:'منخفض',color:'#fbbf24',bg:'rgba(251,191,36,.06)',border:'rgba(251,191,36,.2)'};
}

function render(list){
  const cont=document.getElementById('alertsList');
  if(!list.length){
    cont.innerHTML='<div style="text-align:center;padding:3rem;color:var(--dim)"><div style="font-size:2rem;margin-bottom:.5rem"></div><p>لا توجد انحرافات في هذا الربع</p></div>';
    return;
  }
  cont.innerHTML='';
  ['high','medium','low'].forEach(level=>{
    const group=list.filter(a=>risk(a.deviation_pct).level===level);
    if(!group.length) return;
    const r=risk(level==='high'?-40:level==='medium'?-20:-5);
    cont.insertAdjacentHTML('beforeend',`<h3 style="font-size:.82rem;font-weight:800;color:${r.color};margin-bottom:.65rem">${r.label} — ${group.length} مؤشر</h3>`);
    group.forEach(a=>{
      const r2=risk(a.deviation_pct);
      const dev=(+a.deviation_pct).toFixed(1);
      const pct=a.target>0&&a.actual!==null?Math.round(+a.actual/+a.target*100):null;
      const el=document.createElement('div');
      el.className='alert-item';
      el.dataset.risk=r2.level;
      el.style.cssText=`background:${r2.bg};border:1px solid ${r2.border}`;
      el.innerHTML=`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
          <div>
            <span style="font-size:.7rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.18rem .5rem;border-radius:.3rem">${a.code}</span>
            <p style="font-size:.84rem;font-weight:700;margin-top:.3rem">${a.name}</p>
            ${a.description?`<p style="font-size:.68rem;color:var(--slate);margin-top:.2rem;line-height:1.4">${a.description.substring(0,100)}…</p>`:''}
            <p style="font-size:.7rem;color:var(--dim);margin-top:.1rem">${a.owner_dept||''}</p>
          </div>
          <span style="font-size:1.3rem;font-weight:800;color:${r2.color};flex-shrink:0;margin-right:.5rem">${dev}%</span>
        </div>
        <div class="alert-grid">
          <div class="a-box"><div style="font-size:.62rem;color:var(--dim)">المستهدف الربعي</div><div style="font-size:.8rem;font-weight:800">${fmt(a.target)}</div></div>
          <div class="a-box"><div style="font-size:.62rem;color:var(--dim)">المتحقق الفعلي</div><div style="font-size:.8rem;font-weight:800;color:${r2.color}">${a.actual!==null?fmt(a.actual):'—'}</div></div>
          <div class="a-box"><div style="font-size:.62rem;color:var(--dim)">نسبة الإنجاز</div><div style="font-size:.8rem;font-weight:800;color:${r2.color}">${pct!==null?pct+'%':'—'}</div></div>
        </div>
        ${pct!==null?`<div class="prog"><div class="prog-fill" style="background:${r2.color};width:${Math.min(pct,100)}%"></div></div>`:''}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:.75rem;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
            <span style="font-size:.72rem;font-weight:700;color:${r2.color}">${r2.label}</span>
            <span style="font-size:.68rem;color:var(--dim)">إدارة بطاقة الانحراف ومسار المعالجة</span>
          </div>
          <div style="display:flex;gap:.45rem;flex-wrap:wrap">
            <button type="button" onclick="event.stopPropagation();openDevCard('${String(a.code).replace(/'/g, "\\'")}', ${a.kpi_id})" style="background:transparent;border:1px solid ${r2.border};color:${r2.color};border-radius:.55rem;padding:.32rem .75rem;font-size:.72rem;font-weight:800;cursor:pointer;font-family:'Almarai',sans-serif">
              ${a.deviation_card_id ? '📋 بطاقة الانحراف' : '📝 إنشاء البطاقة'}
            </button>
          </div>
        </div>`;
      cont.appendChild(el);
    });
  });
}

function applyFilter(){
  const f=document.getElementById('fRisk').value;
  document.querySelectorAll('.alert-item').forEach(el=>{el.style.display=(!f||el.dataset.risk===f)?'':'none';});
}

async function openDevCard(code, kpiId){
  document.getElementById('devModal').style.display='flex';
  document.getElementById('devContent').innerHTML='<div style="text-align:center;padding:2rem;color:var(--dim)">جاري التحميل...</div>';
  const yr=document.getElementById('fYear').value;
  const q=document.getElementById('fQ').value;
  try{
    const [cards, kpiData]=await Promise.all([
      fetchJsonCached(`${API}?endpoint=deviation_cards&year=${yr}&quarter=${q}`),
      fetchJsonCached(`${API}?endpoint=kpis&id=${kpiId}&year=${yr}&quarter=${q}`),
    ]);
    const card=Array.isArray(cards)?cards.find(c=>c.kpi_id==kpiId):null;
    const kpi=Array.isArray(kpiData)?kpiData.find(k=>k.id==kpiId):kpiData;
    const alert=alerts.find(a=>a.code===code);
    const riskLevel=card?.risk_level||(alert?(+alert.deviation_pct<-30?'مرتفع':+alert.deviation_pct<-15?'متوسط':'منخفض'):'منخفض');
    const riskColor=riskLevel==='مرتفع'?'var(--red)':riskLevel==='متوسط'?'var(--gold)':'#fbbf24';
    document.getElementById('devContent').innerHTML=`
      <div style="background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.2);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem">
          <div><span style="font-size:.7rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.18rem .5rem;border-radius:.3rem">${code}</span>
          <p style="font-size:.88rem;font-weight:800;margin-top:.35rem">${kpi?.name||alert?.name||''}</p>
          ${kpi?.description?`<p style="font-size:.7rem;color:var(--slate);margin-top:.25rem;line-height:1.4">${kpi.description.substring(0,120)}…</p>`:''}</div>
          <span style="font-size:1.4rem;font-weight:800;color:var(--red)">${alert?(+alert.deviation_pct).toFixed(1)+'%':''}</span>
        </div>
      </div>
      <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
        <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem">بيانات المؤشر</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
          <div><span style="font-size:.68rem;color:var(--dim)">1. اسم المؤشر</span><p style="font-size:.78rem;font-weight:700">${kpi?.name||''}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">2. رمز المؤشر</span><p style="font-size:.78rem;font-weight:700;color:var(--teal)">${code}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">3. الادارة المالكة</span><p style="font-size:.78rem;font-weight:700">${kpi?.owner_dept||''}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">4. المستهدف الربعي</span><p style="font-size:.78rem;font-weight:700">${alert?.target||''}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">5. المتحقق الفعلي</span><p style="font-size:.78rem;font-weight:700;color:var(--red)">${alert?.actual||''}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">6. قيمة الانحراف</span><p style="font-size:.78rem;font-weight:700;color:var(--red)">${alert&&alert.actual&&alert.target?((+alert.actual)-(+alert.target)).toFixed(1):''}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">7. نسبة الانحراف</span><p style="font-size:.82rem;font-weight:800;color:var(--red)">${alert?(+alert.deviation_pct).toFixed(1)+'%':''}</p></div>
          <div><span style="font-size:.68rem;color:var(--dim)">8. مستوى المخاطر</span><p style="font-size:.82rem;font-weight:800;color:${riskColor}">${riskLevel}</p></div>
        </div>
      </div>
      <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
        <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem">التحليل والاجراء</p>
        <div style="margin-bottom:.75rem"><label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">9. تحليل اسباب الانحراف</label>
          <textarea id="devReason" rows="3" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.6rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem;resize:vertical" placeholder="تحليل موضوعي مدعوم ببيانات...">${card?.reason||''}</textarea></div>
        <div style="margin-bottom:.75rem"><label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">10. الاثر المتوقع في حال عدم المعالجة</label>
          <textarea id="devImpact" rows="2" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.6rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem;resize:vertical" placeholder="تشغيلي / مالي / تنظيمي...">${card?.impact||''}</textarea></div>
        <div><label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">11. خطة الاجراء التصحيحي</label>
          <textarea id="devAction" rows="3" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.6rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem;resize:vertical" placeholder="خطوات واضحة قابلة للقياس...">${card?.action||''}</textarea></div>
      </div>
      <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
        <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem">متابعة المعالجة</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
          <div><label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">المسؤول عن التصحيح</label>
            <input id="devResponsible" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem" placeholder="الادارة او الشخص المسؤول" value="${card?.responsible||''}"></div>
          <div><label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">12. تاريخ الاغلاق المستهدف</label>
            <input id="devDueDate" type="date" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem" value="${card?.due_date||''}"></div>
        </div>
        <div><label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">13. حالة المعالجة</label>
          <select id="devStatus" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem">
            <option value="open" ${!card||card.status==='open'?'selected':''}>مفتوحة</option>
            <option value="in_progress" ${card?.status==='in_progress'?'selected':''}>قيد المعالجة</option>
            <option value="under_execution" ${card?.status==='under_execution'?'selected':''}>تحت التنفيذ</option>
            <option value="pending_verify" ${card?.status==='pending_verify'?'selected':''}>مكتملة بانتظار التحقق</option>
            <option value="closed" ${card?.status==='closed'?'selected':''}>مغلقة بعد التحقق والمعالجة</option>
          </select></div>
      </div>
      <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
        <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem">14. نتائج المعالجة بعد التنفيذ</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.65rem">
          <div><label style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:.25rem">قيمة التحسن</label>
            <input id="devImprovVal" type="number" step="any" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.78rem" value="${card?.improvement_value||''}" placeholder=""></div>
          <div><label style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:.25rem">نسبة التحسن %</label>
            <input id="devImprovPct" type="number" step="any" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.78rem" value="${card?.improvement_pct||''}" placeholder=""></div>
          <div><label style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:.25rem">اعادة القياس</label>
            <input id="devRemeasure" type="date" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.78rem" value="${card?.remeasure_date||''}"></div>
        </div>
      </div>
      <div style="display:flex;gap:.65rem">
        <button onclick="document.getElementById('devModal').style.display='none'" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.8rem;cursor:pointer">الغاء</button>
        <button onclick="saveDevCard(${kpiId},${yr},${q})" style="flex:2;background:var(--teal);color:#fff;border:none;border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer">حفظ البطاقة</button>
      </div>`;
  }catch(e){document.getElementById('devContent').innerHTML='<p style="color:var(--red);padding:1rem">خطأ في التحميل</p>';}
}

async function saveDevCard(kpiId, yr, q){
  const data={
    kpi_id:kpiId, year:+yr, quarter:+q,
    reason:document.getElementById('devReason')?.value||'',
    impact:document.getElementById('devImpact')?.value||'',
    action:document.getElementById('devAction')?.value||'',
    responsible:document.getElementById('devResponsible')?.value||'',
    due_date:document.getElementById('devDueDate')?.value||null,
    status:document.getElementById('devStatus')?.value||'open',
    risk_level:document.getElementById('devRiskLevel')?.value||'مرتفع',
    improvement_value:document.getElementById('devImprovVal')?.value||null,
    improvement_pct:document.getElementById('devImprovPct')?.value||null,
    remeasure_date:document.getElementById('devRemeasure')?.value||null,
  };
  try{
    const r=await fetch(`${API}?endpoint=deviation_cards`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const d=await r.json();
    if(d.success){clearJsonCache();document.getElementById('devModal').style.display='none';showToast('تم حفظ بطاقة الانحراف');load();}
    else showToast('خطأ: '+(d.error||''),'red');
  }catch(e){showToast('خطأ في الاتصال','red');}
}

function showToast(msg,type='teal'){
  const t=document.createElement('div');
  t.style.cssText=`position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:var(--${type==='red'?'red':'teal'});color:#fff;padding:.65rem 1.25rem;border-radius:.75rem;font-size:.82rem;font-weight:700;z-index:9999;font-family:'Almarai',sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.4)`;
  t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3000);
}

function fmt(n){if(n===null||n===undefined)return'—';const v=+n;if(isNaN(v))return n;if(v>=1000000)return(v/1000000).toFixed(1)+'م';if(v>=1000)return(v/1000).toFixed(1)+'ك';if(v>0&&v<1)return(v*100).toFixed(1)+'%';return v.toLocaleString('ar-SA',{maximumFractionDigits:1});}

// ── نظام الوضع النهاري/الليلي ──────────────────────────
function togglePageTheme(){}
</script>
</body>
</html>
