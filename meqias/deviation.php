<?php
// deviation.php — مسار بطاقات الانحراف (عرض فقط)
session_start();
require_once __DIR__ . '/helpers.php';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>مسار بطاقة إنحراف المؤشر | مِقياس</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f9f9f9;--card:#ffffff;--card2:#f4f4f4;
  --border:#e5e5e5;--bhi:#cccccc;
  --teal:#8b1a2a;--cyan:#e8700a;--gold:#f5a623;
  --red:#c0392b;--maroon:#8b1a2a;--purple:#8b1a2a;
  --text:#222222;--dim:#666666;--slate:#888888;
}
body{font-family:'Almarai',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.topbar{background:var(--card);border-bottom:1px solid var(--border);padding:.65rem 1.25rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap;position:static;z-index:50}
.back{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .9rem;border-radius:.6rem;font-size:.78rem;font-weight:700;text-decoration:none;color:var(--slate);border:1px solid var(--border);font-family:'Almarai',sans-serif;transition:all .2s}
.back:hover{border-color:var(--bhi);color:var(--text)}
.wrap{max-width:1200px;margin:0 auto;padding:1.5rem}
#pageDesc{max-width:620px !important;margin:.4rem 0 0 !important;padding:.6rem .85rem !important;border-radius:0 .45rem .45rem 0 !important}
#pageDesc p{font-size:.72rem !important;line-height:1.65 !important;margin-bottom:.35rem !important}
#pageDesc ul{gap:.2rem .7rem !important}
#pageDesc li{font-size:.68rem !important}
.card{background:var(--card);border:1px solid var(--border);border-radius:1.1rem;padding:1.5rem}
.inp{width:100%;background:var(--card2);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.82rem;outline:none}
.inp:focus{border-color:var(--bhi)}
.prog{height:8px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden}
.prog-fill{height:100%;border-radius:99px;transition:width 1.4s ease}
.toast{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#0d1f33;border:1px solid var(--border);color:var(--text);padding:.65rem 1.4rem;border-radius:99px;font-size:.82rem;font-weight:700;z-index:999;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
.toast.show{opacity:1}
.dev-card{background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.25rem;transition:box-shadow .2s}
.dev-card:hover{box-shadow:0 4px 24px rgba(0,0,0,.35)}
.stat-pill{display:inline-flex;align-items:center;gap:.35rem;padding:.35rem .85rem;border-radius:99px;font-size:.75rem;font-weight:700}

/* ══ Light mode ══════════════════════════════════════════ */
html{
  --bg:#f6f7f4;--card:#ffffff;--card2:#f1f3ef;--border:#e2e5dd;--bhi:#c8cebf;
  --teal:#0f5132;--cyan:#157f6d;--gold:#c7a15a;--red:#c0392b;--maroon:#0b3d2e;
  --purple:#0f5132;--text:#1f2a2e;--dim:#5b6b73;--slate:#71808a;
}
html body{background:#f7f3f0}
html .topbar{background:#fff;border-color:#e0d5cc}
html .back{color:#666;border-color:#e0d5cc}
html .back:hover{color:#8b1a2a;border-color:#8b1a2a}
html .card,html .dev-card{background:#fff;border-color:#e0d5cc}
html .inp{background:#f5f0eb;border-color:#e0d5cc;color:#1a0a0a}
html select.inp option{background:#fff;color:#1a0a0a}
html h1,html h2{color:#8b1a2a !important}
html [style*="color:var(--text)"]{color:#1a0a0a !important}
html [style*="color:var(--slate)"]{color:#888 !important}
html [style*="color:var(--dim)"]{color:#666 !important}
html [style*="background:rgba(255,255,255,.04)"]{background:#f5f0eb !important}
html [style*="background:var(--card2)"]{background:#f5f0eb !important}
html [style*="background:rgba(255,77,109,.06)"]{background:rgba(192,57,43,.06) !important}
html [style*="border:1px solid var(--border)"]{border-color:#e0d5cc !important}
@media (max-width: 640px) {
  .topbar,
  .wrap { padding: 1rem; }
  .topbar > div:first-child,
  .topbar > div:last-child {
    width: 100%;
    flex-wrap: wrap;
  }
  .topbar > div:first-child {
    flex-direction: column;
    align-items: flex-start;
    gap: .75rem !important;
  }
  #pageDesc {
    max-width: none !important;
    padding: .75rem .85rem !important;
  }
  .card,
  .dev-card {
    padding: 1rem;
  }
  .toast {
    max-width: calc(100vw - 2rem);
    white-space: normal;
    text-align: center;
  }
  #detailModal > div {
    width: 100% !important;
    margin: .5rem auto !important;
    padding: 1rem !important;
  }
}
</style>
</head>
<body>
<div class="toast" id="toast"></div>

<!-- ══ Topbar ══════════════════════════════════════════════ -->
<header class="topbar">
  <div style="display:flex;align-items:center;gap:1rem">
    <a href="index.php" class="back">← الرئيسية</a>
    <div>
      <h1 style="font-size:1rem;font-weight:800;color:var(--red)">📋 مسار بطاقة إنحراف المؤشر</h1>
      <p style="font-size:.7rem;color:var(--dim)">جمعية الزاد 2026 · الربع الأول</p>
<div id="pageDesc" style="max-width:700px;margin:.75rem 0 0;padding:.9rem 1.1rem;background:rgba(139,26,42,.04);border-right:3px solid var(--teal);border-radius:0 .5rem .5rem 0">
  <p style="font-size:.78rem;color:var(--dim);line-height:1.8;margin-bottom:.6rem">يُعنى هذا المسار بتوثيق حالات عدم تحقق المستهدف بنهاية الفترة، وتحليل أسباب الانحراف وتحديد الإجراءات التصحيحية والمسؤوليات المرتبطة بها، في إطار مهني يعزز التحسين المستمر واستدامة النتائج</p>
  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:.35rem .9rem">
    <li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>انتهاء الربع</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>عدم تحقق المستهدف المعتمد</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>بيانات المؤشر</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المستهدف المعتمد</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>المتحقق الفعلي</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>نسبة الانحراف</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>سبب أو أسباب الانحراف</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الإجراء التصحيحي المقترح</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الجهة والمسؤول عن التنفيذ</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>الإطار الزمني للمعالجة</li>
<li style="font-size:.72rem;color:var(--slate);display:flex;align-items:center;gap:.3rem"><span style="color:var(--teal)">•</span>حالة البطاقة (مفتوحة – قيد المعالجة – مغلقة)</li>
  </ul>
</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
    <!-- إحصائيات سريعة -->
    <div style="display:flex;gap:.55rem;flex-wrap:wrap" id="summaryPills"></div>
    <!-- زر الثيم -->
    
  </div>
</header>

<div class="wrap">

  <!-- ══ بطاقة الملخص الإجمالي ══════════════════════════ -->
  <div class="card" style="border-top:3px solid var(--red);margin-bottom:1.5rem">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.75rem">
      <h2 style="font-size:.92rem;font-weight:800;color:var(--red)">ملخص مسار بطاقة إنحراف المؤشر</h2>
      <span id="totalCount" style="font-size:1.6rem;font-weight:800;color:var(--red)">—</span>
    </div>
    <div id="summaryGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.75rem"></div>
  </div>

  <!-- ══ الفلاتر ══════════════════════════════════════════ -->
  <div style="display:flex;gap:.65rem;flex-wrap:wrap;margin-bottom:1.25rem;align-items:center">
    <select class="inp" id="fYear" onchange="load()" style="width:auto;padding:.42rem .8rem;font-size:.78rem">
      <?php for($y=2024;$y<=2030;$y++) echo "<option value='$y'".($y==2026?' selected':'').">$y</option>"; ?>
    </select>
    <select class="inp" id="fQ" onchange="load()" style="width:auto;padding:.42rem .8rem;font-size:.78rem">
      <option value="">كل الأرباع</option>
      <option value="1">الربع الأول</option>
      <option value="2">الربع الثاني</option>
      <option value="3">الربع الثالث</option>
      <option value="4">الربع الرابع</option>
    </select>
    <select class="inp" id="fStatus" onchange="load()" style="width:auto;padding:.42rem .8rem;font-size:.78rem">
      <option value="">كل الحالات</option>
      <option value="open">🔴 مفتوحة</option>
      <option value="in_progress">🟠 قيد المعالجة</option>
      <option value="under_execution">🔵 تحت التنفيذ</option>
      <option value="pending_verify">🟡 انتظار التحقق</option>
      <option value="closed">✅ مغلقة</option>
    </select>
    <select class="inp" id="fRisk" onchange="load()" style="width:auto;padding:.42rem .8rem;font-size:.78rem">
      <option value="">كل مستويات الخطورة</option>
      <option value="high">⛔ مرتفع</option>
      <option value="medium">⚠️ متوسط</option>
      <option value="low">🟢 منخفض</option>
    </select>
    <button onclick="load()" style="background:var(--card);border:1px solid var(--border);color:var(--cyan);border-radius:.55rem;padding:.42rem .75rem;font-size:.85rem;cursor:pointer;line-height:1" title="تحديث">🔄</button>
    <span id="cardCount" style="font-size:.75rem;color:var(--dim);margin-right:.25rem"></span>
  </div>

  <!-- ══ شبكة البطاقات ════════════════════════════════════ -->
  <div id="cardsGrid">
    <div style="text-align:center;padding:4rem;color:var(--dim)">
      <div style="font-size:2rem;margin-bottom:.5rem">⏳</div>
      <p style="font-size:.82rem">جارٍ التحميل…</p>
    </div>
  </div>

  <!-- ══ modal تفاصيل البطاقة ════════════════════════════ -->
  <div id="detailModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:600px;padding:1.5rem;margin:1rem auto;position:relative">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem">
        <h3 style="font-size:.95rem;font-weight:800;color:var(--red)">📋 تفاصيل بطاقة الانحراف</h3>
        <button onclick="closeDetail()" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.45rem;padding:.3rem .7rem;font-size:.8rem;cursor:pointer;font-family:'Almarai',sans-serif">✕ إغلاق</button>
      </div>
      <div id="detailBody"></div>
    </div>
  </div>

</div><!-- /wrap -->

<script>
const API = 'api.php';
const SC  = {open:'#ff4d6d',in_progress:'#f97316',under_execution:'#60a5fa',pending_verify:'#fbbf24',closed:'#10b981'};
const SL  = {open:'🔴 مفتوحة',in_progress:'🟠 قيد المعالجة',under_execution:'🔵 تحت التنفيذ',pending_verify:'🟡 انتظار التحقق',closed:'✅ مغلقة'};
const RL  = {high:'⛔ مرتفع',medium:'⚠️ متوسط',low:'🟢 منخفض'};
const RLC = {high:'#ff4d6d',medium:'#f97316',low:'#10b981'};

function fmtN(v){ if(v===null||v===undefined||v==='') return '—'; const n=parseFloat(v); return isNaN(n)?v:n.toLocaleString('ar-SA',{maximumFractionDigits:1}); }
function fmtPct(v){ const n=parseFloat(v); return isNaN(n)?'—':n.toFixed(1)+'%'; }

// ── تحميل البيانات ───────────────────────────────────────
async function load() {
  const grid = document.getElementById('cardsGrid');
  const year   = document.getElementById('fYear').value   || '2026';
  const q      = document.getElementById('fQ').value      || '';
  const status = document.getElementById('fStatus').value || '';
  const risk   = document.getElementById('fRisk').value   || '';
  const QND={1:'الربع الأول',2:'الربع الثاني',3:'الربع الثالث',4:'الربع الرابع'};
  const _subD=document.getElementById('pageSubTitle'); if(_subD) _subD.textContent=`جمعية الزاد ${year} · ${QND[q]||'كل الأرباع'}`;

  grid.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--dim)"><div style="font-size:1.8rem">⏳</div><p style="font-size:.78rem;margin-top:.4rem">جارٍ التحميل…</p></div>';

  try {
    let url = `${API}?endpoint=deviation_cards&year=${year}`;
    if (q)      url += `&quarter=${q}`;
    if (status) url += `&status=${status}`;
    const r = await fetch(url);
    const d = await r.json();
    let cards = Array.isArray(d) ? d : [];

    // فلتر الخطورة محلياً (API لا يدعمه مباشرة)
    if (risk) cards = cards.filter(c => c.risk_level === risk);

    // تحديث عداد
    document.getElementById('cardCount').textContent = cards.length ? `${cards.length} بطاقة` : '';

    renderSummary(cards);

    if (!cards.length) {
      grid.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--dim)"><div style="font-size:2.5rem;margin-bottom:.75rem">📋</div><p style="font-size:.88rem;font-weight:700">لا توجد بطاقات انحراف للفترة المحددة</p><p style="font-size:.75rem;margin-top:.4rem">يمكن إنشاء البطاقات من لوحة الإدارة</p></div>';
      return;
    }

    grid.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem">' +
      cards.map(c => renderCard(c)).join('') + '</div>';

  } catch(e) {
    grid.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--red)">❌ خطأ في الاتصال بقاعدة البيانات</div>';
  }
}

// ── رسم ملخص الإحصائيات ─────────────────────────────────
function renderSummary(cards) {
  const total = cards.length;
  document.getElementById('totalCount').textContent = total + ' بطاقة';

  // إحصاء الحالات
  const counts = {open:0,in_progress:0,under_execution:0,pending_verify:0,closed:0};
  let totalDev = 0, highRisk = 0;
  cards.forEach(c => {
    if (counts[c.status] !== undefined) counts[c.status]++;
    totalDev += Math.abs(parseFloat(c.deviation_pct||0));
    if (c.risk_level === 'high') highRisk++;
  });

  document.getElementById('summaryGrid').innerHTML = [
    {label:'مفتوحة',       val:counts.open,          color:'#ff4d6d'},
    {label:'قيد المعالجة', val:counts.in_progress,   color:'#f97316'},
    {label:'تحت التنفيذ',  val:counts.under_execution,color:'#60a5fa'},
    {label:'انتظار التحقق',val:counts.pending_verify, color:'#fbbf24'},
    {label:'مغلقة',        val:counts.closed,         color:'#10b981'},
    {label:'خطورة مرتفعة', val:highRisk,              color:'#ff4d6d'},
    {label:'متوسط الانحراف',val: total ? (totalDev/total).toFixed(1)+'%' : '—', color:'var(--gold)'},
  ].map(s => `
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:.65rem;padding:.65rem .85rem;text-align:center">
      <p style="font-size:1.25rem;font-weight:800;color:${s.color}">${s.val}</p>
      <p style="font-size:.65rem;color:var(--dim);margin-top:.15rem">${s.label}</p>
    </div>`).join('');

  // Pills في الهيدر
  document.getElementById('summaryPills').innerHTML =
    `<span class="stat-pill" style="background:rgba(255,77,109,.12);color:#ff4d6d">🔴 ${counts.open} مفتوحة</span>` +
    `<span class="stat-pill" style="background:rgba(16,185,129,.1);color:#10b981">✅ ${counts.closed} مغلقة</span>`;
}

// ── رسم كارد واحدة ──────────────────────────────────────
function renderCard(c) {
  const sc  = SC[c.status]  || 'var(--border)';
  const sl  = SL[c.status]  || c.status;
  const dev = parseFloat(c.deviation_pct || 0);
  const dc  = Math.abs(dev) > 30 ? '#ff4d6d' : '#f97316';
  const rl  = c.risk_level ? RL[c.risk_level]||c.risk_level : null;
  const rlc = c.risk_level ? RLC[c.risk_level]||'var(--dim)' : 'var(--dim)';
  const safeId = c.id;

  return `
  <div class="dev-card" style="border-top:3px solid ${sc};cursor:pointer" onclick="openDetail(${safeId})">
    <!-- رأس البطاقة -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.8rem">
      <div style="flex:1;min-width:0">
        <span style="font-size:.68rem;font-weight:800;color:var(--cyan);background:rgba(139,26,58,.12);padding:.15rem .5rem;border-radius:.3rem;display:inline-block;margin-bottom:.3rem">${c.kpi_code||'—'}</span>
        <p style="font-size:.84rem;font-weight:700;color:var(--text);line-height:1.35;word-break:break-word">${(c.kpi_name||'').substring(0,55)}${(c.kpi_name||'').length>55?'…':''}</p>
        ${c.kpi_description?`<p style="font-size:.68rem;color:var(--slate);margin-top:.2rem;line-height:1.4">${c.kpi_description.substring(0,100)}…</p>`:''}
      </div>
      <span style="font-size:.65rem;font-weight:700;white-space:nowrap;color:${sc};background:${sc}18;border:1px solid ${sc}35;padding:.18rem .5rem;border-radius:99px;flex-shrink:0;margin-right:.4rem">${sl}</span>
    </div>
    <!-- أرقام المستهدف / الفعلي / الانحراف -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.4rem;margin-bottom:.7rem">
      <div style="background:rgba(255,255,255,.04);border-radius:.5rem;padding:.45rem;text-align:center">
        <p style="font-size:.58rem;color:var(--slate);margin-bottom:.1rem">المستهدف</p>
        <p style="font-size:.85rem;font-weight:800;color:var(--text)">${fmtN(c.target)}</p>
      </div>
      <div style="background:rgba(255,255,255,.04);border-radius:.5rem;padding:.45rem;text-align:center">
        <p style="font-size:.58rem;color:var(--slate);margin-bottom:.1rem">الفعلي</p>
        <p style="font-size:.85rem;font-weight:800;color:${dc}">${fmtN(c.actual)}</p>
      </div>
      <div style="background:rgba(255,77,109,.06);border:1px solid rgba(255,77,109,.12);border-radius:.5rem;padding:.45rem;text-align:center">
        <p style="font-size:.58rem;color:var(--slate);margin-bottom:.1rem">الانحراف</p>
        <p style="font-size:.85rem;font-weight:800;color:${dc}">${fmtPct(dev)}</p>
      </div>
    </div>
    <!-- السبب مختصر -->
    ${c.reason ? `<p style="font-size:.72rem;color:var(--slate);line-height:1.4;margin-bottom:.3rem">📌 ${c.reason.substring(0,75)}${c.reason.length>75?'…':''}</p>` : ''}
    <!-- Footer -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding-top:.55rem;border-top:1px solid var(--border);margin-top:.4rem">
      <div style="display:flex;align-items:center;gap:.4rem">
        ${rl ? `<span style="font-size:.65rem;font-weight:700;color:${rlc};background:${rlc}18;border-radius:99px;padding:.15rem .5rem">${rl}</span>` : ''}
        ${c.responsible ? `<span style="font-size:.65rem;color:var(--dim)">👤 ${c.responsible.substring(0,18)}</span>` : ''}
      </div>
      <span style="font-size:.63rem;color:var(--dim)">ق${c.quarter||'—'} · ${c.year||'—'}</span>
    </div>
  </div>`;
}

// ── modal التفاصيل الكاملة ───────────────────────────────
async function openDetail(id) {
  document.getElementById('detailModal').style.display = 'flex';
  document.getElementById('detailBody').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--dim)">⏳ جارٍ التحميل…</div>';
  try {
    const r = await fetch(`${API}?endpoint=deviation_cards&id=${id}`);
    const c = await r.json();
    if (c.error) { document.getElementById('detailBody').innerHTML = '<p style="color:var(--red)">❌ لم يُعثر على البطاقة</p>'; return; }

    const sc  = SC[c.status]  || 'var(--border)';
    const sl  = SL[c.status]  || c.status;
    const dev = parseFloat(c.deviation_pct || 0);
    const dc  = Math.abs(dev) > 30 ? '#ff4d6d' : '#f97316';
    const rl  = c.risk_level ? RL[c.risk_level]||c.risk_level : '—';
    const rlc = c.risk_level ? RLC[c.risk_level]||'var(--dim)' : 'var(--dim)';

    const row = (icon, label, val, color='') => val
      ? `<div style="display:flex;gap:.75rem;padding:.55rem 0;border-bottom:1px solid var(--border)">
           <span style="font-size:.8rem;flex-shrink:0">${icon}</span>
           <div>
             <p style="font-size:.65rem;color:var(--dim);margin-bottom:.15rem">${label}</p>
             <p style="font-size:.8rem;font-weight:700;color:${color||'var(--text)'}">${val}</p>
           </div>
         </div>` : '';

    document.getElementById('detailBody').innerHTML = `
      <!-- هوية المؤشر -->
      <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
        <span style="font-size:.72rem;font-weight:800;color:var(--cyan);background:rgba(139,26,58,.12);padding:.2rem .6rem;border-radius:.3rem">${c.kpi_code||'—'}</span>
        <p style="font-size:.9rem;font-weight:800;color:var(--text);margin-top:.4rem;line-height:1.4">${c.kpi_name||'—'}</p>
        ${c.kpi_description?`<p style="font-size:.72rem;color:var(--slate);margin-top:.3rem;line-height:1.5;border-right:2px solid var(--cyan);padding-right:.5rem">${c.kpi_description.substring(0,150)}${c.kpi_description.length>150?'…':''}</p>`:''}
        <div style="display:flex;align-items:center;gap:.5rem;margin-top:.5rem">
          <span style="font-size:.7rem;font-weight:700;color:${sc};background:${sc}18;border:1px solid ${sc}35;padding:.2rem .55rem;border-radius:99px">${sl}</span>
          <span style="font-size:.7rem;color:var(--dim)">ق${c.quarter||'—'} · ${c.year||'—'}</span>
        </div>
      </div>
      <!-- الأرقام -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.5rem;margin-bottom:1rem">
        <div style="background:rgba(255,255,255,.04);border-radius:.6rem;padding:.65rem;text-align:center">
          <p style="font-size:.6rem;color:var(--slate);margin-bottom:.2rem">المستهدف</p>
          <p style="font-size:1.1rem;font-weight:800;color:var(--text)">${fmtN(c.target)}</p>
        </div>
        <div style="background:rgba(255,255,255,.04);border-radius:.6rem;padding:.65rem;text-align:center">
          <p style="font-size:.6rem;color:var(--slate);margin-bottom:.2rem">الفعلي</p>
          <p style="font-size:1.1rem;font-weight:800;color:${dc}">${fmtN(c.actual)}</p>
        </div>
        <div style="background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.15);border-radius:.6rem;padding:.65rem;text-align:center">
          <p style="font-size:.6rem;color:var(--slate);margin-bottom:.2rem">الانحراف</p>
          <p style="font-size:1.1rem;font-weight:800;color:${dc}">${fmtPct(dev)}</p>
        </div>
      </div>
      <!-- التفاصيل -->
      <div style="margin-bottom:.75rem">
        ${row('📌','سبب الانحراف',       c.reason)}
        ${row('🔧','الإجراء التصحيحي',   c.action)}
        ${row('💡','الأثر المتوقع',       c.impact)}
        ${row('👤','المسؤول عن التنفيذ', c.responsible)}
        ${row('📅','تاريخ الإغلاق',      c.due_date)}
        ${row('🔁','تاريخ إعادة القياس', c.remeasure_date)}
        ${row('⚠️','مستوى الخطورة',      rl, rlc)}
        ${c.improvement_value ? row('📈','قيمة التحسن', fmtN(c.improvement_value)+' ('+fmtPct(c.improvement_pct)+')') : ''}
      </div>
      <div style="text-align:center;padding-top:.5rem">
        <button onclick="closeDetail()" style="background:var(--card2);border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem 2rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer">إغلاق</button>
      </div>`;
  } catch(e) {
    document.getElementById('detailBody').innerHTML = '<p style="color:var(--red);text-align:center">❌ خطأ في التحميل</p>';
  }
}

function closeDetail() {
  document.getElementById('detailModal').style.display = 'none';
}

// إغلاق modal عند الضغط خارجه
document.getElementById('detailModal').addEventListener('click', function(e) {
  if (e.target === this) closeDetail();
});

// ── Theme ────────────────────────────────────────────────
function togglePageTheme(){}
// ── تشغيل عند فتح الصفحة ────────────────────────────────
load();
</script>
</body>
</html>
