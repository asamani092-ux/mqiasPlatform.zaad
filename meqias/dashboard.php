<!DOCTYPE html>
<?php
// ═══════════════════════════════════════════════════
//  dashboard.php — لوحة الإدارة والإدخال
//  جمعية الزاد · منصة مِقياس 2026
// ═══════════════════════════════════════════════════
session_start();
require_once __DIR__ . '/helpers.php';

// ══════════════════════════════════════════════════════════
//  حماية لوحة الإدارة — كلمة المرور
//  لتغيير كلمة المرور: عدّل القيمة في DASHBOARD_PASS أدناه
// ══════════════════════════════════════════════════════════
define('DASHBOARD_PASS', 'Miqyas@2026');   // ← غيّر كلمة المرور هنا

// تسجيل الخروج
if (isset($_GET['logout'])) {
    unset($_SESSION['dashboard_auth']);
    header('Location: dashboard.php');
    exit;
}

// معالجة تسجيل الدخول
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['dash_password'])) {
    if ($_POST['dash_password'] === DASHBOARD_PASS) {
        $_SESSION['dashboard_auth'] = true;
        header('Location: dashboard.php');
        exit;
    } else {
        $loginError = 'كلمة المرور غير صحيحة';
    }
}

// التحقق من الجلسة
if (empty($_SESSION['dashboard_auth'])) {
    // عرض شاشة تسجيل الدخول
    $err = $loginError ?? '';
    $err_html = $err ? "<div class=\"err-box\"><svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg> {$err}</div>" : '';
    echo <<<HTML
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>لوحة الإدارة — مِقياس</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Almarai',sans-serif;background:#07111f;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;position:relative;overflow:hidden}

/* خلفية مزخرفة */
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 50%,rgba(139,26,58,.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 50%,rgba(196,162,70,.1) 0%,transparent 60%);pointer-events:none}
body::after{content:'';position:fixed;top:-40%;left:-20%;width:600px;height:600px;border-radius:50%;background:rgba(139,26,58,.06);filter:blur(80px);pointer-events:none}

/* البطاقة الرئيسية */
.card{position:relative;background:linear-gradient(145deg,#0d1f33,#0a1828);border:1px solid rgba(196,162,70,.2);border-radius:24px;padding:3rem 2.5rem 2.5rem;width:100%;max-width:420px;box-shadow:0 32px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04) inset}

/* شريط علوي ملون */
.card-bar{position:absolute;top:0;right:0;left:0;height:3px;border-radius:24px 24px 0 0;background:linear-gradient(90deg,#8b1a3a,#c4a246,#8b1a3a);background-size:200% 100%}

/* الشعار */
.brand{display:flex;flex-direction:column;align-items:center;margin-bottom:2.25rem}
.brand-icon{width:64px;height:64px;background:linear-gradient(135deg,rgba(139,26,58,.3),rgba(196,162,70,.2));border:1px solid rgba(196,162,70,.3);border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;box-shadow:0 8px 32px rgba(139,26,58,.2)}
.brand-name{font-size:2rem;font-weight:800;color:#c4a246;letter-spacing:.04em;line-height:1}
.brand-sub{font-size:.78rem;color:#475569;margin-top:.35rem;font-weight:400}
.brand-divider{width:40px;height:2px;background:linear-gradient(90deg,transparent,rgba(196,162,70,.5),transparent);margin:.85rem auto 0}

/* الحقل */
.field-wrap{margin-bottom:1.5rem}
.field-label{display:flex;align-items:center;gap:.4rem;font-size:.75rem;font-weight:700;color:#94a3b8;margin-bottom:.55rem}
.field-label svg{opacity:.6}
.inp-wrap{position:relative}
.inp{width:100%;background:rgba(7,17,31,.7);border:1.5px solid rgba(255,255,255,.08);border-radius:12px;padding:.85rem 1.1rem .85rem 3rem;color:#e2eaf4;font-family:'Almarai',sans-serif;font-size:.92rem;outline:none;transition:border-color .2s,box-shadow .2s;direction:rtl}
.inp:focus{border-color:rgba(139,26,58,.7);box-shadow:0 0 0 3px rgba(139,26,58,.12)}
.inp::placeholder{color:#334155;font-size:.85rem}
.inp-icon{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);color:#334155;pointer-events:none;transition:color .2s}
.inp:focus ~ .inp-icon{color:#8b1a3a}
.eye-btn{position:absolute;right:.85rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#334155;padding:.2rem;display:flex;align-items:center;transition:color .2s}
.eye-btn:hover{color:#c4a246}

/* زر الدخول */
.btn{width:100%;background:linear-gradient(135deg,#8b1a3a 0%,#a02040 50%,#c4a246 100%);color:#fff;border:none;border-radius:12px;padding:1rem;font-family:'Almarai',sans-serif;font-size:.95rem;font-weight:800;cursor:pointer;transition:all .25s;letter-spacing:.03em;box-shadow:0 4px 24px rgba(139,26,58,.35);position:relative;overflow:hidden}
.btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.12),transparent);opacity:0;transition:opacity .2s}
.btn:hover{transform:translateY(-1px);box-shadow:0 8px 32px rgba(139,26,58,.45)}
.btn:hover::after{opacity:1}
.btn:active{transform:translateY(0)}
.btn-inner{display:flex;align-items:center;justify-content:center;gap:.55rem}

/* خط فاصل */
.divider{display:flex;align-items:center;gap:.75rem;margin:1.5rem 0 1.25rem;color:#1e3a5f;font-size:.72rem}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}

/* رابط الرجوع */
.back{display:flex;align-items:center;justify-content:center;gap:.4rem;color:#334155;font-size:.75rem;text-decoration:none;transition:color .2s;font-weight:600}
.back:hover{color:#c4a246}
.back svg{transition:transform .2s}
.back:hover svg{transform:translateX(3px)}

/* رسالة الخطأ */
.err-box{display:flex;align-items:center;gap:.5rem;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-right:3px solid #ef4444;color:#fca5a5;border-radius:10px;padding:.75rem 1rem;font-size:.8rem;margin-bottom:1.25rem;text-align:right}

/* شارة الأمان */
.secure-badge{display:flex;align-items:center;justify-content:center;gap:.4rem;font-size:.68rem;color:#1e3a5f;margin-top:1.5rem}
.secure-badge svg{color:#1e3a5f}

.tab-path-icon,.tab-path-btn .tab-path-icon{background:linear-gradient(135deg,#c0392b,#e8700a)!important;color:#fff!important;border:none!important;}
.tab-path-icon svg{stroke:#fff!important;}
</style>
</head>
<body>
<div class="card">
  <div class="card-bar"></div>

  <!-- الشعار -->
  <div class="brand">
    <div class="brand-icon">
      <!-- شعار جمعية الزاد مصغّر -->
      <svg width="36" height="36" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M108 12 C108 12 178 18 188 35 C198 52 195 118 182 138 C169 158 138 174 108 178 L108 12Z" fill="#8b1a3a"/>
        <g fill="white"><ellipse cx="153" cy="58" rx="7" ry="13" transform="rotate(-8,153,58)"/><ellipse cx="143" cy="78" rx="6" ry="11" transform="rotate(-14,143,78)"/><ellipse cx="163" cy="77" rx="6" ry="11" transform="rotate(-2,163,77)"/><ellipse cx="136" cy="97" rx="5.5" ry="9" transform="rotate(-18,136,97)"/><ellipse cx="158" cy="96" rx="5.5" ry="9" transform="rotate(4,158,96)"/><line x1="150" y1="52" x2="147" y2="132" stroke="white" stroke-width="2.5"/></g>
        <path d="M108 178 C138 174 169 158 182 138 C165 148 138 158 108 178Z" fill="#d4af37"/>
        <path d="M95 175 C68 162 42 140 32 112 C22 84 28 52 45 35 C62 18 85 12 108 12 C95 30 90 60 90 100 C90 140 95 175 95 175Z" fill="#8b1a3a" opacity="0.25"/>
      </svg>
    </div>
    <div class="brand-name">مِقياس</div>
    <div class="brand-sub">منصة قياس الأداء المؤسسي · جمعية الزاد</div>
    <div class="brand-divider"></div>
  </div>

  {$err_html}

  <!-- النموذج -->
  <form method="post" autocomplete="off" onsubmit="handleSubmit(this)">
    <div class="field-wrap">
      <label class="field-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        كلمة المرور
      </label>
      <div class="inp-wrap">
        <input class="inp" type="password" id="passInp" name="dash_password" placeholder="••••••••••••" autofocus required>
        <svg class="inp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <button type="button" class="eye-btn" onclick="togglePass()" title="إظهار/إخفاء">
          <svg id="eyeIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>

    <button class="btn" type="submit" id="loginBtn">
      <span class="btn-inner" id="btnInner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        دخول إلى لوحة الإدارة
      </span>
    </button>
  </form>

  <div class="divider">أو</div>

  <a href="index.php" class="back">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
    العودة إلى الصفحة الرئيسية
  </a>

  <div class="secure-badge">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    اتصال آمن · جلسة مشفّرة
  </div>
</div>

<script>
function togglePass(){
  const inp=document.getElementById('passInp');
  const icon=document.getElementById('eyeIcon');
  if(inp.type==='password'){
    inp.type='text';
    icon.innerHTML='<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    inp.type='password';
    icon.innerHTML='<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}
function handleSubmit(form){
  const btn=document.getElementById('loginBtn');
  const inner=document.getElementById('btnInner');
  btn.disabled=true;
  inner.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> جارٍ التحقق…';
  return true;
}
</script>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
</body>
</html>
HTML;
    exit;
}
// ── نهاية الحماية ────────────────────────────────────────

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

// ── قراءة/حفظ بيانات الملف الشخصي ──────────────────
$profile = readProfile();

// معالجة حفظ الملف الشخصي
if (isset($_POST['action']) && $_POST['action'] === 'save_profile') {
    $profile['name']         = trim($_POST['prof_name']     ?? $profile['name']);
    $profile['title']        = trim($_POST['prof_title']    ?? $profile['title']);
    $profile['avatar_type']  = $_POST['avatar_type']        ?? 'initials';
    $profile['avatar_text']  = trim(mb_substr($_POST['prof_initials'] ?? '', 0, 2));
    $profile['show_on_index']= isset($_POST['show_on_index']);

    // معالجة رفع الصورة
    if (!empty($_FILES['avatar_img']['tmp_name'])) {
        $ext = strtolower(pathinfo($_FILES['avatar_img']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg','jpeg','png','webp','gif'])) {
            ensureWritable(__DIR__ . '/uploads/avatars/');
            $imgDir  = __DIR__ . '/uploads/avatars/';
            $imgName = 'avatar_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['avatar_img']['tmp_name'], $imgDir . $imgName)) {
                // احذف الصورة القديمة
                if ($profile['avatar_img'] && file_exists(__DIR__ . '/' . $profile['avatar_img'])) {
                    @unlink(__DIR__ . '/' . $profile['avatar_img']);
                }
                $profile['avatar_img']  = 'uploads/avatars/' . $imgName;
                $profile['avatar_type'] = 'image';
            }
        }
    }

    // حذف الصورة
    if (isset($_POST['delete_avatar'])) {
        if ($profile['avatar_img'] && file_exists(__DIR__ . '/' . $profile['avatar_img'])) {
            @unlink(__DIR__ . '/' . $profile['avatar_img']);
        }
        $profile['avatar_img']  = '';
        $profile['avatar_type'] = 'initials';
    }

    // حفظ آمن عبر helpers.php
    $saveResult = saveProfile($profile);
    if ($saveResult['ok']) {
        $profileMsg = ['type'=>'success', 'text'=>' تم حفظ بيانات الملف الشخصي · سيظهر في الواجهة الرئيسية فوراً'];
    } else {
        $profileMsg = ['type'=>'error', 'text'=>' ' . $saveResult['error']];
    }
}
$profileMsg = $profileMsg ?? null;

// ── معالجة تغيير إعدادات قاعدة البيانات ────────────
$dbMsg = '';
if (isset($_POST['action']) && $_POST['action'] === 'save_db') {
    $cfg = [
        'host' => trim($_POST['db_host'] ?? 'localhost'),
        'name' => trim($_POST['db_name'] ?? ''),
        'user' => trim($_POST['db_user'] ?? ''),
        'pass' => $_POST['db_pass'] ?? '',
    ];
    if ($cfg['name'] && $cfg['user']) {
        $configContent = "<?php
define('DB_HOST',    '{$cfg['host']}');
define('DB_NAME',    '{$cfg['name']}');
define('DB_USER',    '{$cfg['user']}');
define('DB_PASS',    '{$cfg['pass']}');
define('DB_CHARSET', 'utf8mb4');

function getDB(): PDO {
    static \$pdo = null;
    if (\$pdo === null) {
        \$dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
        \$options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            \$pdo = new PDO(\$dsn, DB_USER, DB_PASS, \$options);
        } catch (PDOException \$e) {
            http_response_code(500);
            die(json_encode(['error' => 'فشل الاتصال: ' . \$e->getMessage()], JSON_UNESCAPED_UNICODE));
        }
    }
    return \$pdo;
}
if (!function_exists('jsonResponse')) {
function jsonResponse(mixed \$data, int \$status = 200): void {
    http_response_code(\$status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode(\$data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
}
if (!function_exists('getInput')) {
function getInput(): array {
    \$raw = file_get_contents('php://input');
    return json_decode(\$raw, true) ?? \$_POST;
}
}
";
        $r = safeFilePut(__DIR__ . '/config.php', $configContent);

        // اختبر الاتصال
        if (!$r['ok']) {
            $dbMsg = ['type'=>'error', 'text'=>'فشل حفظ config.php: ' . ($r['error']??'')];
        } else try {
            $pdo = new PDO("mysql:host={$cfg['host']};dbname={$cfg['name']};charset=utf8mb4", $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $dbMsg = ['type'=>'success', 'text'=>' تم حفظ الإعدادات والاتصال بقاعدة البيانات بنجاح!'];
        } catch (PDOException $e) {
            $dbMsg = ['type'=>'error', 'text'=>'⚠️ تم حفظ الإعدادات لكن الاتصال فشل: ' . $e->getMessage()];
        }
    } else {
        $dbMsg = ['type'=>'error', 'text'=>' اسم قاعدة البيانات والمستخدم مطلوبان'];
    }
}

// ── قراءة الإعدادات الحالية ──────────────────────────
$currentCfg = ['host'=>'localhost','name'=>'miqyas_db','user'=>'miqyas_user','pass'=>''];
if (file_exists(__DIR__ . '/config.php')) {
    $cfgContent = file_get_contents(__DIR__ . '/config.php');
    preg_match("/define\('DB_HOST',\s*'([^']*)'\)/", $cfgContent, $m); if($m) $currentCfg['host'] = $m[1];
    preg_match("/define\('DB_NAME',\s*'([^']*)'\)/", $cfgContent, $m); if($m) $currentCfg['name'] = $m[1];
    preg_match("/define\('DB_USER',\s*'([^']*)'\)/", $cfgContent, $m); if($m) $currentCfg['user'] = $m[1];
    preg_match("/define\('DB_PASS',\s*'([^']*)'\)/", $cfgContent, $m); if($m) $currentCfg['pass'] = $m[1];
}

// ── معالجة رفع Excel ─────────────────────────────────
$uploadMsg = '';
// قراءة رسالة من session (بعد redirect)
if (!empty($_SESSION['upload_msg'])) {
    $uploadMsg = ['type'=>'success', 'text'=>$_SESSION['upload_msg']];
    unset($_SESSION['upload_msg']);
}
if (isset($_FILES['excel_file'])) {
    // إذا كان الطلب AJAX — أرجع JSON بدون redirect
    $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) ||
              strpos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false ||
              isset($_POST['ajax_upload']);

    $fileError = $_FILES['excel_file']['error'];
    if ($fileError === 0) {
        $ext = strtolower(pathinfo($_FILES['excel_file']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['xlsx','xls','csv'])) {
            ensureWritable(__DIR__ . '/uploads/');
            $uploadDir = __DIR__ . '/uploads/';
            $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $_FILES['excel_file']['name']);
            $newName  = date('Ymd_His') . '_' . $safeName;
            if (move_uploaded_file($_FILES['excel_file']['tmp_name'], $uploadDir . $newName)) {
                chmod($uploadDir . $newName, 0644);
                $_SESSION['last_upload'] = $newName;
                if ($isAjax) {
                    // AJAX: أرجع JSON بدون redirect
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode(['success' => true, 'filename' => $newName], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                $_SESSION['upload_msg'] = " تم رفع الملف بنجاح: {$newName}";
                header('Location: ' . $_SERVER['PHP_SELF'] . '?tab=excel&uploaded=1');
                exit;
            } else {
                if ($isAjax) {
                    header('Content-Type: application/json; charset=utf-8');
                    echo json_encode(['error' => 'فشل رفع الملف - تحقق من صلاحيات مجلد uploads/'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                $uploadMsg = ['type'=>'error', 'text'=>' فشل رفع الملف - تحقق من صلاحيات مجلد uploads/'];
            }
        } else {
            if ($isAjax) {
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['error' => "نوع الملف غير مدعوم: .{$ext}"], JSON_UNESCAPED_UNICODE);
                exit;
            }
            $uploadMsg = ['type'=>'error', 'text'=>" نوع الملف غير مدعوم: .{$ext} — يُسمح فقط xlsx, xls, csv"];
        }
    } elseif ($fileError === 4) {
        // لم يُختر ملف — تجاهل
    } else {
        $phpErrors = [1=>'الملف أكبر من الحد المسموح به',2=>'الملف أكبر من الحد المسموح به',3=>'رُفع الملف جزئياً',6=>'لا يوجد مجلد مؤقت',7=>'فشل الكتابة على القرص'];
        $uploadMsg = ['type'=>'error', 'text'=>' خطأ في الرفع: ' . ($phpErrors[$fileError] ?? "كود الخطأ: {$fileError}")];
    }
}

// ── قراءة الملفات المرفوعة ───────────────────────────
$uploadedFiles = [];
$uploadDir = __DIR__ . '/uploads/';
if (is_dir($uploadDir)) {
    $files = scandir($uploadDir);
    foreach ($files as $f) {
        if ($f !== '.' && $f !== '..' && preg_match('/\.(xlsx|xls|csv)$/i', $f)) {
            $uploadedFiles[] = ['name'=>$f, 'size'=>filesize($uploadDir.$f), 'time'=>filemtime($uploadDir.$f)];
        }
    }
    usort($uploadedFiles, fn($a,$b) => $b['time'] - $a['time']);
}

// ── اتصال قاعدة البيانات ───────────────────────────
$dbConnected = false;
$dbStats = ['total'=>0,'strategic'=>0,'operational'=>0,'pending'=>0];
try {
    if (file_exists(__DIR__ . '/config.php')) {
        require_once __DIR__ . '/config.php';
        $pdo = getDB();
        $dbConnected = true;
        $r = $pdo->query("SELECT type, COUNT(*) c FROM kpis WHERE status='active' GROUP BY type")->fetchAll();
        foreach ($r as $row) { $dbStats[$row['type']] = $row['c']; $dbStats['total'] += $row['c']; }
        $dbStats['pending'] = (int)$pdo->query("SELECT COUNT(*) FROM kpi_values WHERE actual IS NULL AND year=2026 AND quarter=1")->fetchColumn();
    }
} catch (Exception $e) { $dbConnected = false; }
?>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="<?= htmlspecialchars($csrfToken) ?>">
<title>لوحة الإدارة | منصة مِقياس</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing:border-box; margin:0; padding:0; }
:root{
  --bg:#f9f9f9;--card:#ffffff;--card2:#f4f4f4;
  --border:#e5e5e5;--bhi:#cccccc;
  --teal:#8b1a2a;--cyan:#e8700a;--gold:#f5a623;
  --red:#c0392b;--maroon:#8b1a2a;--purple:#8b1a2a;
  --text:#222222;--dim:#666666;--slate:#888888;
}
body { font-family:'Almarai',sans-serif; background:var(--bg); color:var(--text); min-height:100vh;
  background-image: radial-gradient(ellipse 80% 50% at 15% -5%,rgba(139,26,58,.08) 0%,transparent 55%),
    radial-gradient(ellipse 60% 50% at 85% 105%,rgba(212,175,55,.06) 0%,transparent 55%); }
.wrap { max-width:1400px; margin:0 auto; padding:1.5rem 2rem; }
.card { background:var(--card); border:1px solid var(--border); border-radius:1.25rem; padding:1.5rem; }
.card2{ background:var(--card2); border:1px solid var(--border); border-radius:1rem; padding:1rem 1.25rem; }

/* Tabs */
.tab-nav { display:flex; gap:.25rem; background:var(--card2); border:1px solid var(--border); padding:.3rem; border-radius:.85rem; overflow-x:auto; flex-wrap:nowrap; scrollbar-width:thin; scrollbar-color:var(--border) transparent; -webkit-overflow-scrolling:touch; }
.tab-nav::-webkit-scrollbar{height:3px}
.tab-nav::-webkit-scrollbar-track{background:transparent}
.tab-nav::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
.tab-nav-btn { flex:0 0 auto; padding:.45rem .75rem; border-radius:.6rem; font-size:.74rem; font-weight:700; color:var(--slate); white-space:nowrap;
               cursor:pointer; transition:all .2s; background:transparent; border:none; font-family:'Almarai',sans-serif; text-align:center; }
.tab-nav-btn.active { background:var(--maroon); color:#fff; box-shadow:0 2px 8px rgba(139,26,58,.3); }
.tab-panel { display:none; } .tab-panel.active { display:block; }

/* Inputs */
.inp { width:100%; background:var(--card2); border:1px solid var(--border); border-radius:.65rem;
       padding:.65rem .9rem; color:var(--text); font-family:'Almarai',sans-serif; font-size:.85rem; outline:none; transition:border-color .2s; }
.inp:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(139,26,58,.1); }
select.inp option { background:var(--card); }
.lbl { display:block; font-size:.72rem; font-weight:700; color:var(--slate); margin-bottom:.35rem; }

/* Buttons */
.btn { display:inline-flex; align-items:center; gap:.4rem; padding:.6rem 1.25rem; border-radius:.65rem;
       font-size:.82rem; font-weight:700; cursor:pointer; border:none; font-family:'Almarai',sans-serif; transition:all .2s; }
.btn-maroon { background:var(--maroon); color:#fff; } .btn-maroon:hover { opacity:.88; }
.btn-teal   { background:var(--teal); color:#07111f; } .btn-teal:hover { opacity:.88; }
.btn-gold   { background:var(--gold); color:#07111f; } .btn-gold:hover { opacity:.88; }
.btn-ghost  { background:transparent; color:var(--slate); border:1px solid var(--border); }
.btn-ghost:hover { border-color:var(--bhi); color:var(--text); }
.btn-red    { background:rgba(255,77,109,.12); color:var(--red); border:1px solid rgba(255,77,109,.3); }

/* Stat cards */
.stat-box { background:var(--card2); border:1px solid var(--border); border-radius:1rem; padding:1.1rem 1.25rem;
            position:relative; overflow:hidden; }
.stat-box::before { content:''; position:absolute; right:0; top:0; bottom:0; width:4px; background:var(--accent,var(--teal)); border-radius:0 1rem 1rem 0; }

/* Progress */
.prog { width:100%; height:7px; background:var(--card2); border-radius:99px; overflow:hidden; margin-top:.4rem; }
.prog-fill { height:100%; border-radius:99px; transition:width .8s ease; }

/* Badge */
.badge { padding:.2rem .65rem; border-radius:99px; font-size:.68rem; font-weight:700; }
.b-teal  { background:rgba(139,26,58,.12); color:var(--teal); border:1px solid rgba(139,26,58,.2); }
.b-gold  { background:rgba(212,175,55,.12); color:var(--gold); border:1px solid rgba(212,175,55,.2); }
.b-red   { background:rgba(255,77,109,.12); color:var(--red);  border:1px solid rgba(255,77,109,.2); }
.b-gray  { background:rgba(148,163,184,.1); color:var(--slate);border:1px solid rgba(148,163,184,.2); }

/* Table */
.tbl { width:100%; border-collapse:separate; border-spacing:0 .35rem; font-size:.8rem; }
.tbl thead th { background:var(--card2); color:var(--dim); font-weight:700; padding:.7rem 1rem; text-align:right; }
.tbl thead th:first-child { border-radius:0 .6rem .6rem 0; }
.tbl thead th:last-child  { border-radius:.6rem 0 0 .6rem; }
.tbl tbody tr td { background:var(--card); border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:.75rem 1rem; }
.tbl tbody tr td:first-child { border-right:1px solid var(--border); border-radius:0 .6rem .6rem 0; }
.tbl tbody tr td:last-child  { border-left:1px solid var(--border);  border-radius:.6rem 0 0 .6rem; }
.tbl tbody tr:hover td { background:var(--card2); }

/* Upload zone */
.upload-zone { border:2px dashed var(--border); border-radius:1rem; padding:2.5rem; text-align:center;
               transition:all .25s; cursor:pointer; }
.upload-zone:hover, .upload-zone.dragover { border-color:var(--teal); background:rgba(139,26,58,.04); }

/* Status dot */
.dot { width:10px; height:10px; border-radius:50%; display:inline-block; flex-shrink:0; }
.dot-green  { background:#10b981; box-shadow:0 0 6px #10b981; }
.dot-red    { background:var(--red); }

/* Theme toggle */
.theme-toggle { display:flex; align-items:center; gap:.5rem; background:var(--card); border:1px solid var(--border);
                border-radius:99px; padding:.3rem .4rem .3rem .8rem; cursor:pointer; transition:all .25s; }
.toggle-track { width:40px; height:22px; border-radius:99px; background:var(--border); position:relative; transition:background .3s; }
body .toggle-track { background:var(--teal); }
.toggle-thumb { position:absolute; top:3px; right:3px; width:16px; height:16px; border-radius:50%;
                background:#fff; transition:all .3s; font-size:.65rem; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,.25); }
body .toggle-thumb { right:21px; }

/* Clock */
.clock-time { font-size:1.4rem; font-weight:800; letter-spacing:-1px; font-variant-numeric:tabular-nums; }

/* Alert/success boxes */
.alert-box { border-radius:.75rem; padding:.85rem 1.1rem; font-size:.82rem; font-weight:700; display:flex; align-items:center; gap:.6rem; }
.alert-success { background:rgba(139,26,58,.1); border:1px solid rgba(139,26,58,.3); color:var(--teal); }
.alert-error   { background:rgba(255,77,109,.1); border:1px solid rgba(255,77,109,.3); color:var(--red); }
.alert-info    { background:rgba(212,175,55,.1);  border:1px solid rgba(212,175,55,.3);  color:var(--gold); }

/* Preview bar */
.preview-box { background:rgba(139,26,58,.06); border:1px solid rgba(139,26,58,.2); border-radius:.75rem; padding:.9rem; }

/* Scrollbar */
::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:var(--bg); } ::-webkit-scrollbar-thumb { background:var(--bhi); border-radius:3px; }

/* Animations */
.fu { }
.fu1{animation-delay:.05s}.fu2{animation-delay:.1s}.fu3{animation-delay:.15s}

/* Toast */
.toast { position:fixed; bottom:1.5rem; left:50%; transform:translateX(-50%) translateY(80px);
         background:var(--card); border:1px solid var(--teal); border-radius:.85rem; padding:.75rem 1.5rem;
         font-size:.82rem; font-weight:700; color:var(--teal); z-index:200; transition:transform .3s;
         box-shadow:0 8px 32px rgba(0,0,0,.4); }
.toast.show { transform:translateX(-50%) translateY(0); }
body .card .tbl thead th { background:#f1f5f9; }
body .inp { background:#f8fafc; color:#0f172a; }
body select.inp option { background:#fff; }

/* ── Tab Grid Cards ─────────────────────────────── */

/* ── Tab Grid — مطابق لـ index.php ──────────────────── */
.tab-grid-wrap { margin-bottom:1.5rem }
.tab-path-btn {
  background:var(--card);
  border:1px solid var(--border);
  border-radius:1rem;
  transition:all .3s ease;
  display:flex;
  align-items:center;
  gap:1rem;
  text-decoration:none;
  color:var(--text);
  width:100%;
  cursor:pointer;
  font-family:'Almarai',sans-serif;
  padding:1.1rem;
  text-align:right;
}
.tab-path-btn:hover { transform:translateY(-4px); box-shadow:0 10px 25px rgba(0,0,0,.3); }
.tab-path-btn.active { border-color:var(--active-color,var(--teal)); box-shadow:0 4px 18px rgba(var(--active-rgba,139,26,58),.2); }
.tab-path-icon {
  width:3.2rem; height:3.2rem;
  border-radius:.75rem;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; transition:all .3s ease;
}
.tab-path-icon svg { width:1.5rem;height:1.5rem;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round }
.tab-path-btn.active .tab-path-icon { filter:brightness(1.2) }
.tab-path-label { font-weight:800; font-size:.85rem; margin-bottom:.18rem; }
.tab-path-desc  { font-size:.68rem; color:var(--dim); }

  @keyframes spin { to { transform: rotate(360deg); } }

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
  --bg:#f6f7f4; --card:#ffffff; --card2:#f1f3ef;
  --border:#e2e5dd; --bhi:#c8cebf;
  --teal:#0f5132; --cyan:#157f6d; --gold:#c7a15a;
  --red:#c0392b; --maroon:#0b3d2e; --purple:#0f5132;
  --text:#1f2a2e; --dim:#5b6b73; --slate:#71808a;
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
body .tab-path-btn {
  background: #ffffff !important;
  border-color: #e5e5e5 !important;
  color: #222222 !important;
  box-shadow: 0 2px 8px rgba(0,0,0,.05) !important;
}
body .tab-path-btn:hover {
  border-color: #e8700a !important;
  box-shadow: 0 6px 20px rgba(232,112,10,.15) !important;
  transform: translateY(-3px) !important;
}
body .tab-path-btn.active {
  border-color: #8b1a2a !important;
  box-shadow: 0 4px 16px rgba(139,26,42,.2) !important;
  background: #fff5f7 !important;
}

/* tab-path-icon — كل الأيقونات تصبح برتقالية */
body .tab-path-icon {
  background: #e8700a !important;
  color: #ffffff !important;
  border: none !important;
}
body .tab-path-btn.active .tab-path-icon {
  background: linear-gradient(135deg,#c0392b,#e8700a) !important;
  color: #ffffff !important;
  border: none !important;
}
body .tab-path-icon svg {
  stroke: currentColor !important;
}

/* tab-path-label و tab-path-desc */
body .tab-path-label { color: #222222 !important; }
body .tab-path-btn.active .tab-path-label { color: #8b1a2a !important; }
body .tab-path-desc { color: #888888 !important; }

/* إلغاء الألوان الـ inline على tab-path-label */
body .tab-path-label[style] { color: #222222 !important; }

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
  .wrap { padding: 1rem; }
  .card { padding: 1.15rem; }
}
@media (max-width: 640px) {
  body { background-attachment: scroll; }
  .wrap { padding: .75rem; }
  .card { padding: 1rem; border-radius: 1rem; }
  header.fu1 > div:first-child,
  header.fu1 > div:last-child {
    width: 100%;
  }
  header.fu1 > div:first-child {
    align-items: flex-start;
    gap: .75rem !important;
  }
  header.fu1 h1 { font-size: 1.3rem !important; }
  .tab-grid-wrap > div {
    grid-template-columns: 1fr !important;
  }
  .tab-path-btn {
    padding: .95rem;
    align-items: flex-start;
  }
  .tab-path-icon {
    width: 2.8rem;
    height: 2.8rem;
  }
  .tab-path-label { font-size: .82rem; }
  .tab-path-desc { font-size: .68rem; }
  .tbl { min-width: 720px; }
  .upload-zone { padding: 1.25rem; }
  .tab-panel [style*="grid-template-columns:1fr 1fr 1fr"],
  .tab-panel [style*="grid-template-columns:1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
}

</style>
</head>
<div id="toast" class="toast"></div>
<body>
<div class="wrap space-y-6">

<!-- ══ HEADER ════════════════════════════════════════ -->
<header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fu fu1">
  <div class="flex items-center gap-4">
    <!-- شعار جمعية الزاد -->
    <div style="width:52px;height:52px;flex-shrink:0">
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M108 12 C108 12 178 18 188 35 C198 52 195 118 182 138 C169 158 138 174 108 178 L108 12Z" fill="#8b1a3a"/>
        <g fill="white"><ellipse cx="153" cy="58" rx="7" ry="13" transform="rotate(-8,153,58)"/><ellipse cx="143" cy="78" rx="6" ry="11" transform="rotate(-14,143,78)"/><ellipse cx="163" cy="77" rx="6" ry="11" transform="rotate(-2,163,77)"/><ellipse cx="136" cy="97" rx="5.5" ry="9" transform="rotate(-18,136,97)"/><ellipse cx="158" cy="96" rx="5.5" ry="9" transform="rotate(4,158,96)"/><line x1="150" y1="52" x2="147" y2="132" stroke="white" stroke-width="2.5"/></g>
        <path d="M108 178 C138 174 169 158 182 138 C165 148 138 158 108 178Z" fill="#d4af37"/>
        <path d="M95 175 C68 162 42 140 32 112 C22 84 28 52 45 35 C62 18 85 12 108 12 C95 30 90 60 90 100 C90 140 95 175 95 175Z" fill="#8b1a3a" opacity="0.2"/>
      </svg>
    </div>
    <div>
      <h1 style="font-size:1.65rem;font-weight:800;letter-spacing:-.5px;line-height:1">لوحة الإدارة</h1>
      <p style="font-size:.73rem;color:var(--slate);margin-top:.2rem">جمعية الزاد · منصة <span style="color:var(--teal);font-weight:700">مِقياس</span> · إدخال البيانات والإعدادات</p>
    </div>
  </div>

  <div style="display:flex;align-items:center;gap:.85rem;flex-wrap:wrap">
    <!-- DB status -->
    <div style="display:flex;align-items:center;gap:.5rem;background:var(--card);border:1px solid var(--border);padding:.45rem .9rem;border-radius:.75rem">
      <span class="dot <?= $dbConnected ? 'dot-green' : 'dot-red' ?>"></span>
      <span style="font-size:.73rem;font-weight:700;color:var(--slate)"><?= $dbConnected ? 'قاعدة البيانات متصلة' : 'غير متصل' ?></span>
    </div>
    <!-- Theme -->
    <div class="theme-toggle" onclick="toggleTheme()">
      <span style="font-size:.72rem;font-weight:700;color:var(--slate)" id="themeLabel"> ليلي</span>
      <div class="toggle-track"><div class="toggle-thumb" id="themeThumb"></div></div>
    </div>
    <!-- Clock -->
    <div style="background:var(--card);border:1px solid var(--border);padding:.45rem .9rem;border-radius:.75rem;text-align:center">
      <div class="clock-time" id="clockTime">00:00:00</div>
      <div style="font-size:.65rem;color:var(--teal)" id="clockHijri"></div>
    </div>
    <!-- Links — المسارات -->
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">
      <a href="index.php" target="_blank"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;background:var(--maroon);color:#fff;font-family:'Almarai',sans-serif;transition:opacity .2s"
         onmouseover="this.style.opacity='.82'" onmouseout="this.style.opacity='1'">
         🏠 الرئيسية
      </a>
      <a href="strategic.php" target="_blank"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--teal);border:1px solid rgba(139,26,58,.3);background:rgba(139,26,58,.08);font-family:'Almarai',sans-serif;transition:all .2s"
         onmouseover="this.style.background='rgba(139,26,58,.18)'" onmouseout="this.style.background='rgba(139,26,58,.08)'">
         🎯 مسار الأداء الاستراتيجي
      </a>
      <a href="operational.php" target="_blank"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--cyan);border:1px solid rgba(196,162,70,.3);background:rgba(196,162,70,.08);font-family:'Almarai',sans-serif;transition:all .2s"
         onmouseover="this.style.background='rgba(196,162,70,.18)'" onmouseout="this.style.background='rgba(196,162,70,.08)'">
        ⚙️ مسار الأداء التشغيلي
      </a>
      <a href="early_warning.php" target="_blank"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--red);border:1px solid rgba(255,77,109,.3);background:rgba(255,77,109,.08);font-family:'Almarai',sans-serif;transition:all .2s"
         onmouseover="this.style.background='rgba(255,77,109,.18)'" onmouseout="this.style.background='rgba(255,77,109,.08)'">
         🚨 مسار الإنذار المبكر
      </a>
      <button onclick="switchTab('tab-deviation',document.getElementById('nav-tab-deviation'));document.getElementById('nav-tab-deviation')?.scrollIntoView({behavior:'smooth',block:'center'});"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--red);border:1px solid rgba(255,77,109,.3);background:rgba(255,77,109,.08);font-family:'Almarai',sans-serif;transition:all .2s;cursor:pointer"
         onmouseover="this.style.background='rgba(255,77,109,.18)'" onmouseout="this.style.background='rgba(255,77,109,.08)'">
         📋 مسار بطاقة إنحراف المؤشر
      </button>
      <a href="governance.php" target="_blank"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:#a78bfa;border:1px solid rgba(167,139,250,.3);background:rgba(167,139,250,.08);font-family:'Almarai',sans-serif;transition:all .2s"
         onmouseover="this.style.background='rgba(167,139,250,.18)'" onmouseout="this.style.background='rgba(167,139,250,.08)'">
        🏛️ مسار الحوكمة
      </a>
      <a href="knowledge.php" target="_blank"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--gold);border:1px solid rgba(212,175,55,.3);background:rgba(212,175,55,.08);font-family:'Almarai',sans-serif;transition:all .2s"
         onmouseover="this.style.background='rgba(212,175,55,.18)'" onmouseout="this.style.background='rgba(212,175,55,.08)'">
         📚 مسار المعرفة
      </a>
      <!-- زر تسجيل الخروج -->
      <a href="dashboard.php?logout=1"
         onclick="return confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')"
         style="display:inline-flex;align-items:center;gap:.3rem;padding:.42rem .85rem;border-radius:.6rem;font-size:.75rem;font-weight:700;text-decoration:none;color:#fff;background:rgba(100,116,139,.25);border:1px solid rgba(100,116,139,.4);font-family:'Almarai',sans-serif;transition:all .2s"
         onmouseover="this.style.background='rgba(239,68,68,.25)'" onmouseout="this.style.background='rgba(100,116,139,.25)'"
         title="تسجيل الخروج من لوحة الإدارة">
         🚪 خروج
      </a>
    </div>
  </div>
</header>

<!-- ══ QUICK STATS ════════════════════════════════════ -->
<section class="grid grid-cols-2 md:grid-cols-4 gap-4 fu fu2">
  <div class="stat-box" style="--accent:var(--teal)">
    <p style="font-size:.72rem;color:var(--slate);font-weight:700">📊 إجمالي المؤشرات</p>
    <p style="font-size:2.5rem;font-weight:800;margin:.3rem 0;line-height:1"><?= $dbStats['total'] ?: '—' ?></p>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap">
      <span class="badge b-teal"><?= $dbStats['strategic'] ?> استراتيجي</span>
      <span class="badge b-gold"><?= $dbStats['operational'] ?> تشغيلي</span>
    </div>
  </div>
  <div class="stat-box" style="--accent:var(--gold)">
    <p style="font-size:.72rem;color:var(--slate);font-weight:700">⏳ في انتظار الإدخال</p>
    <p style="font-size:2.5rem;font-weight:800;color:var(--gold);margin:.3rem 0;line-height:1" id="headerPendingCount"><?= $dbStats['pending'] ?: '—' ?></p>
    <span class="badge b-gold" id="headerPendingLabel">الربع الأول 2026</span>
  </div>
  <div class="stat-box" style="--accent:var(--maroon)">
    <p style="font-size:.72rem;color:var(--slate);font-weight:700">📁 الملفات المرفوعة</p>
    <p style="font-size:2.5rem;font-weight:800;color:var(--maroon);margin:.3rem 0;line-height:1"><?= count($uploadedFiles) ?></p>
    <span class="badge b-gray">Excel & CSV</span>
  </div>
  <div class="stat-box" style="--accent:<?= $dbConnected ? 'var(--teal)' : 'var(--red)' ?>">
    <p style="font-size:.72rem;color:var(--slate);font-weight:700">🗄️ حالة قاعدة البيانات</p>
    <p style="font-size:1.3rem;font-weight:800;margin:.4rem 0"><?= $dbConnected ? ' متصلة' : ' غير متصلة' ?></p>
    <span style="font-size:.7rem;color:var(--dim)"><?= htmlspecialchars($currentCfg['name']) ?></span>
  </div>
</section>

<!-- ══ TAB NAVIGATION ═════════════════════════════════ -->
<div class="tab-grid-wrap">
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.85rem">
    <button id="nav-tab-data" onclick="switchTab('tab-data',this)" class="tab-path-btn active" style="--active-color:#8b1a3a;--active-rgba:139,26,58;border-color:#8b1a3a;box-shadow:0 4px 18px rgba(139,26,58,.25)">
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
      <div>
        <div class="tab-path-label">إدخال البيانات</div>
        <div class="tab-path-desc">أدخل قيم المؤشرات الربعية</div>
      </div>
    </button>
    <button id="nav-tab-kpis" onclick="switchTab('tab-kpis',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
      <div>
        <div class="tab-path-label">إدارة المؤشرات</div>
        <div class="tab-path-desc">أضف وعدّل وحذف المؤشرات</div>
      </div>
    </button>
    <button id="nav-tab-excel" onclick="switchTab('tab-excel',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
      <div>
        <div class="tab-path-label">رفع Excel</div>
        <div class="tab-path-desc">استورد البيانات من ملفات Excel</div>
      </div>
    </button>
    <button id="nav-tab-strategic" onclick="switchTab('tab-strategic',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg></div>
      <div>
        <div class="tab-path-label">مسار الأداء الاستراتيجي</div>
        <div class="tab-path-desc">قراءة واعية لتحقق الأهداف الاستراتيجية</div>
      </div>
    </button>
    <button id="nav-tab-operational" onclick="switchTab('tab-operational',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
      <div>
        <div class="tab-path-label">مسار الأداء التشغيلي</div>
        <div class="tab-path-desc">قياس كفاءة التنفيذ التشغيلي للإدارات</div>
      </div>
    </button>
    <button id="nav-tab-alerts" onclick="switchTab('tab-alerts',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg></div>
      <div>
        <div class="tab-path-label">مسار الإنذار المبكر</div>
        <div class="tab-path-desc">الاستشعار المبكر لمؤشرات تدني الأداء</div>
      </div>
    </button>
    <button id="nav-tab-deviation" onclick="switchTab('tab-deviation',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M9 3h6"/><path d="M10 12h4"/><path d="M10 16h4"/><path d="M8 3v3"/><path d="M16 3v3"/><rect x="5" y="5.5" width="14" height="15" rx="2"/></svg></div>
      <div>
        <div class="tab-path-label">مسار بطاقة إنحراف المؤشر</div>
        <div class="tab-path-desc">توثيق عدم تحقق المستهدف والإجراءات</div>
      </div>
    </button>
    <button id="nav-tab-governance" onclick="switchTab('tab-governance',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/></svg></div>
      <div>
        <div class="tab-path-label">مسار الحوكمة</div>
        <div class="tab-path-desc">قياس رقمي لمستوى الالتزام الحوكمي</div>
      </div>
    </button>
    <button id="nav-tab-knowledge" onclick="switchTab('tab-knowledge',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
      <div>
        <div class="tab-path-label">مسار المعرفة</div>
        <div class="tab-path-desc">قياس رقمي لمستوى نضج إدارة المعرفة</div>
      </div>
    </button>
    <button id="nav-tab-email" onclick="switchTab('tab-email',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
      <div>
        <div class="tab-path-label">إعدادات البريد</div>
        <div class="tab-path-desc">تهيئة التنبيهات والتقارير</div>
      </div>
    </button>
    <button id="nav-tab-profile" onclick="switchTab('tab-profile',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
      <div>
        <div class="tab-path-label">الملف الشخصي</div>
        <div class="tab-path-desc">بياناتك واسمك وصورتك</div>
      </div>
    </button>
    <button id="nav-tab-db" onclick="switchTab('tab-db',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
      <div>
        <div class="tab-path-label">قاعدة البيانات</div>
        <div class="tab-path-desc">إعدادات الاتصال والبيانات</div>
      </div>
    </button>
    <button id="nav-tab-setup" onclick="switchTab('tab-setup',this)" class="tab-path-btn" >
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#ffffff;border:none"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
      <div>
        <div class="tab-path-label">الإعداد الأولي</div>
        <div class="tab-path-desc">تهيئة الجداول والبيانات</div>
      </div>
    </button>
    <button id="nav-tab-password" onclick="switchTab('tab-password',this)" class="tab-path-btn">
      <div class="tab-path-icon" style="background:linear-gradient(135deg,#c0392b,#e8700a);color:#fff;border:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
      <div><div class="tab-path-label">كلمة المرور</div><div class="tab-path-desc">تغيير كلمة دخول الإدارة</div></div>
    </button>
  </div>
</div>


<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 1 — إدخال البيانات                            -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-password">
  <div style="max-width:460px;margin:0 auto"><div class="card" style="border-top:3px solid #8b1a3a">
    <h2 style="font-size:1rem;font-weight:800;color:#8b1a3a;margin-bottom:1.25rem">🔐 تغيير كلمة المرور</h2>
    <div id="passChangeMsg" style="display:none;padding:.7rem 1rem;border-radius:.6rem;font-size:.82rem;font-weight:700;margin-bottom:1rem;text-align:center"></div>
    <div style="display:flex;flex-direction:column;gap:.85rem">
      <div><label style="font-size:.75rem;color:var(--dim);margin-bottom:.35rem;display:block">كلمة المرور الحالية</label><input class="inp" type="password" id="curPass" placeholder="••••••••"></div>
      <div><label style="font-size:.75rem;color:var(--dim);margin-bottom:.35rem;display:block">كلمة المرور الجديدة</label><input class="inp" type="password" id="newPass" placeholder="6 أحرف+"></div>
      <div><label style="font-size:.75rem;color:var(--dim);margin-bottom:.35rem;display:block">تأكيد كلمة المرور</label><input class="inp" type="password" id="confPass" placeholder="••••••••"></div>
      <button onclick="doChangePassword()" class="btn btn-teal" style="width:100%;justify-content:center;padding:.85rem">💾 حفظ كلمة المرور</button>
    </div>
  </div></div>
</div>
<div class="tab-panel active" id="tab-data">
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

    <!-- فورم الإدخال -->
    <div class="card md:col-span-1">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem;color:var(--gold)">✅ إدخال قيمة مؤشر</h2>

      <!-- الربع والسنة -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-bottom:.9rem">
        <div><label class="lbl">السنة</label>
          <select class="inp" id="entryYear" onchange="handleEntryPeriodChange()"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option><option value="2030">2030</option><option value="2025">2025</option><option value="2024">2024</option></select></div>
        <div><label class="lbl">الربع</label>
          <select class="inp" id="entryQuarter" onchange="handleEntryPeriodChange()">
            <option value="1">الربع الأول</option><option value="2">الربع الثاني</option>
            <option value="3">الربع الثالث</option><option value="4">الربع الرابع</option>
          </select></div>
      </div>

      <!-- نوع المؤشر -->
      <div style="margin-bottom:.9rem">
        <label class="lbl">نوع المؤشر</label>
        <select class="inp" id="kpiTypeFilter" onchange="loadKpiSelect()">
          <option value="">الكل</option>
          <option value="strategic">استراتيجي</option>
          <option value="operational">تشغيلي</option>
        </select>
      </div>

      <!-- اختيار المؤشر -->
      <div style="margin-bottom:.9rem">
        <label class="lbl">المؤشر</label>
        <select class="inp" id="entryKpiSel" onchange="onKpiSelect()">
          <option value="">-- اختر مؤشراً --</option>
        </select>
      </div>

      <!-- معلومات المؤشر -->
      <div id="kpiInfo" style="display:none;background:var(--card2);border:1px solid var(--border);border-radius:.75rem;padding:.85rem;margin-bottom:.9rem">
        <p style="font-size:.82rem;font-weight:800" id="kpiInfoName"></p>
        <p style="font-size:.7rem;color:var(--teal);margin-top:.2rem" id="kpiInfoCode"></p>
        <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap" id="kpiInfoBadges"></div>
      </div>

      <!-- القيم -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-bottom:.9rem">
        <div><label class="lbl">المستهدف</label><input class="inp" type="number" id="entryTarget" placeholder="0"></div>
        <div><label class="lbl" style="color:var(--gold)">✅ الفعلي</label>
          <input class="inp" type="number" id="entryActual" placeholder="0" style="border-color:var(--gold);background:rgba(212,175,55,.04)" oninput="updatePreview()"></div>
      </div>

      <!-- ملاحظات -->
      <div style="margin-bottom:.9rem">
        <label class="lbl">ملاحظات</label>
        <textarea class="inp" id="entryNotes" rows="2" placeholder="ملاحظات اختيارية…" style="resize:vertical"></textarea>
      </div>

      <!-- معاينة فورية -->
      <div class="preview-box" id="previewBox" style="display:none;margin-bottom:.9rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
          <span style="font-size:.75rem;color:var(--slate)">نسبة الإنجاز المتوقعة</span>
          <span style="font-size:1.6rem;font-weight:800;color:var(--teal)" id="previewPct">—</span>
        </div>
        <div style="width:100%;height:8px;background:var(--card2);border-radius:99px;overflow:hidden">
          <div id="previewBar" style="height:100%;border-radius:99px;background:var(--teal);width:0%;transition:width .5s ease"></div>
        </div>
        <p style="font-size:.72rem;font-weight:700;margin-top:.4rem" id="previewStatus"></p>
      </div>

      <button class="btn btn-teal" style="width:100%;justify-content:center;font-size:.88rem" onclick="saveEntry()">
         💾 حفظ وتحديث العدادات
      </button>
    </div>

    <!-- قائمة المؤشرات في انتظار الإدخال -->
    <div class="card md:col-span-2">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem">
        <h2 style="font-size:1.1rem;font-weight:800">⏳ المؤشرات التي تنتظر الإدخال</h2>
        <div style="display:flex;gap:.4rem">
          <button class="btn btn-ghost" style="padding:.35rem .75rem;font-size:.75rem" onclick="loadPendingKpis()">🔄 تحديث</button>
          <span class="badge b-gold" id="pendingCount">—</span>
        </div>
      </div>

      <!-- فلتر الربع للقائمة -->
      <div style="display:flex;gap:.4rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-ghost active" style="padding:.3rem .8rem;font-size:.74rem" onclick="filterPending('all',this)">الكل</button>
        <button class="btn btn-ghost" style="padding:.3rem .8rem;font-size:.74rem" onclick="filterPending('strategic',this)">استراتيجي</button>
        <button class="btn btn-ghost" style="padding:.3rem .8rem;font-size:.74rem" onclick="filterPending('operational',this)">تشغيلي</button>
      </div>

      <div id="pendingList" style="display:flex;flex-direction:column;gap:.35rem;max-height:500px;overflow-y:auto">
        <p style="text-align:center;color:var(--dim);padding:2rem;font-size:.82rem">جارٍ التحميل…</p>
      </div>
    </div>
  </div>

  <!-- جدول القيم المُدخَلة -->
  <div class="card" style="margin-top:1.5rem">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.1rem;flex-wrap:wrap;gap:.5rem">
      <h2 style="font-size:1.1rem;font-weight:800"> القيم المُدخَلة</h2>
      <button class="btn btn-ghost" style="padding:.35rem .75rem;font-size:.75rem" onclick="loadEnteredValues()">🔄 تحديث</button>
    </div>
    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr>
          <th>الرمز</th><th>المؤشر</th><th>الربع</th><th>المستهدف</th><th>الفعلي</th><th>نسبة الإنجاز</th><th>الحالة</th><th style="text-align:left">حذف</th>
        </tr></thead>
        <tbody id="enteredTable"><tr><td colspan="8" style="text-align:center;color:var(--dim);padding:1.5rem">جارٍ التحميل…</td></tr></tbody>
      </table>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 2 — إدارة المؤشرات                           -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-kpis">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.5rem">
      <h2 style="font-size:1.1rem;font-weight:800"> جميع المؤشرات</h2>
      <button class="btn btn-maroon" onclick="openAddKpi()">＋ إضافة مؤشر جديد</button>
    </div>

    <!-- فلاتر -->
    <div style="display:flex;gap:.4rem;margin-bottom:1rem;flex-wrap:wrap">
      <button class="btn btn-ghost" style="padding:.3rem .8rem;font-size:.74rem" onclick="loadKpisTable('all',this)">الكل</button>
      <button class="btn btn-ghost" style="padding:.3rem .8rem;font-size:.74rem" onclick="loadKpisTable('strategic',this)">استراتيجي</button>
      <button class="btn btn-ghost" style="padding:.3rem .8rem;font-size:.74rem" onclick="loadKpisTable('operational',this)">تشغيلي</button>
    </div>

    <div style="overflow-x:auto">
      <table class="tbl">
        <thead><tr>
          <th>الرمز</th><th>الاسم</th><th>الوصف</th><th>النوع</th><th>الإدارة</th><th>المستهدف السنوي</th><th>الوحدة</th><th style="text-align:left">إجراءات</th>
        </tr></thead>
        <tbody id="kpisTable"><tr><td colspan="7" style="text-align:center;color:var(--dim);padding:1.5rem">جارٍ التحميل…</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- Modal إضافة/تعديل مؤشر (inline) -->
  <div id="kpiFormBox" style="display:none;margin-top:1.25rem">
    <div class="card" style="border-color:var(--teal)">
      <h3 style="font-size:1rem;font-weight:800;margin-bottom:1.1rem;color:var(--teal)" id="kpiFormTitle">＋ إضافة مؤشر جديد</h3>
      <input type="hidden" id="kpiFormId">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.85rem">
        <div><label class="lbl">الرمز</label><input class="inp" id="fCode" placeholder="ع1-1"></div>
        <div><label class="lbl">كود الهدف</label><input class="inp" id="fGoal" placeholder="ع1"></div>
        <div><label class="lbl">النوع</label><select class="inp" id="fType"><option value="strategic">استراتيجي</option><option value="operational">تشغيلي</option></select></div>
        <div style="grid-column:1/-1"><label class="lbl">الاسم</label><input class="inp" id="fName" placeholder="اسم المؤشر الكامل…"></div>
        <div style="grid-column:1/-1"><label class="lbl">الوصف</label><textarea class="inp" id="fDesc" rows="3" placeholder="وصف المؤشر وطريقة حسابه…" style="resize:vertical;min-height:70px"></textarea></div>
        <div><label class="lbl">وحدة القياس</label><input class="inp" id="fUnit" placeholder="ريال، نسبة…"></div>
        <div><label class="lbl">المستهدف السنوي</label><input class="inp" type="number" id="fTarget"></div>
        <div><label class="lbl">خط الاساس</label><input class="inp" type="number" id="fBaseline" step="any" placeholder="القيمة الابتدائية"></div>
        <div style="grid-column:1/-1"><label class="lbl">الإدارة المالكة</label><input class="inp" id="fDept" placeholder="اسم الإدارة"></div>
      </div>
      <div style="display:flex;gap:.65rem;margin-top:1rem;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="document.getElementById('kpiFormBox').style.display='none'">إلغاء</button>
        <button class="btn btn-teal" onclick="saveKpi()">💾 حفظ المؤشر</button>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 3 — رفع Excel                                 -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-excel">

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="margin-bottom:1.5rem">

    <!-- ── رفع ملف ── -->
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem">📁 رفع ملف Excel / CSV</h2>

      <?php if ($uploadMsg): ?>
        <div class="alert-box <?= $uploadMsg['type']==='success' ? 'alert-success' : 'alert-error' ?>" style="margin-bottom:1rem">
          <?= htmlspecialchars($uploadMsg['text']) ?>
        </div>
      <?php endif; ?>

      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="handleDrop(event)">
        <div style="font-size:2.5rem;margin-bottom:.75rem">📊</div>
        <p style="font-weight:700;color:var(--text);margin-bottom:.3rem">اسحب الملف هنا أو اضغط للاختيار</p>
        <p style="font-size:.78rem;color:var(--dim)">xlsx · xls · csv (ملفات Microsoft Excel)</p>
        <input type="file" id="fileInput" name="excel_file" accept=".xlsx,.xls,.csv" style="display:none" onchange="uploadFileAjax(this.files[0])">
        <div id="selectedFileName" style="margin-top:.75rem;font-size:.78rem;color:var(--teal);font-weight:700"></div>
      </div>

      <!-- قائمة الملفات المرفوعة -->
      <div style="margin-top:1.25rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.65rem">
          <h3 style="font-size:.82rem;font-weight:800;color:var(--slate)">📂 الملفات المرفوعة
            <span id="excelFilesCount" style="background:var(--teal);color:#fff;font-size:.65rem;border-radius:99px;padding:.1rem .45rem;margin-right:.35rem">0</span>
          </h3>
          <button onclick="loadExcelFilesList()" style="background:none;border:none;cursor:pointer;color:var(--dim);font-size:.8rem;font-family:'Almarai',sans-serif">🔄</button>
        </div>
        <div id="excelFilesList" style="display:flex;flex-direction:column;gap:.4rem;max-height:200px;overflow-y:auto">
          <div style="text-align:center;color:var(--dim);font-size:.78rem;padding:.75rem">⏳ جارٍ التحميل…</div>
        </div>
      </div>
    </div>

    <!-- ── إعدادات الاستيراد ── -->
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem">⚙️ إعدادات الاستيراد</h2>

      <div style="display:flex;flex-direction:column;gap:.85rem">
        <!-- اختيار الملف -->
        <div>
          <label class="lbl">📂 الملف المختار للاستيراد</label>
          <select class="inp" id="importFileSelect" style="font-size:.8rem">
            <option value="">— اختر ملفاً من القائمة —</option>
            <?php foreach ($uploadedFiles as $f): ?>
            <option value="<?= htmlspecialchars($f['name']) ?>"><?= htmlspecialchars($f['name']) ?></option>
            <?php endforeach; ?>
          </select>
        </div>

        <!-- المسار -->
        <div>
          <label class="lbl">🎯 المسار / نوع البيانات</label>
          <select class="inp" id="importDataType" onchange="updateImportHint()">
            <option value="kpi_strategic">🎯 مسار الأداء الاستراتيجي</option>
            <option value="kpi_operational">⚙️ مسار الأداء التشغيلي</option>
            <option value="governance">🏛️ مسار الحوكمة</option>
            <option value="knowledge">📚 مسار المعرفة</option>
          </select>
        </div>

        <!-- السنة والربع -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem">
          <div id="importYearDiv">
            <label class="lbl">📅 السنة</label>
            <select class="inp" id="importYear">
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div id="importQuarterDiv">
            <label class="lbl">📆 الربع</label>
            <select class="inp" id="importQuarter">
              <option value="1">الأول</option>
              <option value="2">الثاني</option>
              <option value="3">الثالث</option>
              <option value="4">الرابع</option>
            </select>
          </div>
        </div>

        <!-- تلميح بنية الملف -->
        <div style="background:rgba(196,162,70,.07);border:1px solid rgba(196,162,70,.2);border-radius:.75rem;padding:.85rem">
          <p style="font-size:.7rem;font-weight:800;color:var(--gold);margin-bottom:.35rem">📋 بنية الأعمدة المطلوبة:</p>
          <p id="importHintText" style="font-size:.72rem;color:var(--cyan);line-height:1.6">
            🎯 رمز المؤشر · المستهدف · الفعلي · ملاحظات
          </p>
        </div>

        <!-- أزرار -->
        <div style="display:flex;gap:.65rem">
          <button class="btn btn-teal" style="flex:2;justify-content:center" onclick="previewExcel()">
            🔍 معاينة وتحقق
          </button>
          <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:.75rem" onclick="downloadTemplate()">
            📥 نموذج
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── بطاقة المعاينة ── -->
  <div id="previewCard" style="display:none" class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.5rem">
      <h2 id="previewTitle" style="font-size:1rem;font-weight:800;color:var(--teal)">📊 معاينة البيانات</h2>
      <div id="importActions" style="display:none;gap:.65rem">
        <button id="importBtn" class="btn btn-maroon" style="justify-content:center" onclick="importExcel()">
          ✅ استيراد وحفظ في قاعدة البيانات
        </button>
        <button class="btn btn-ghost" style="justify-content:center;font-size:.78rem"
                onclick="document.getElementById('previewCard').style.display='none'">
          ✕ إغلاق
        </button>
      </div>
    </div>

    <!-- إحصائيات سريعة -->
    <div id="previewStats" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:.75rem;margin-bottom:1.25rem"></div>

    <!-- تحذيرات -->
    <div id="previewWarnings" style="display:none;margin-bottom:1rem"></div>

    <!-- جدول النتائج -->
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:separate;border-spacing:0 .35rem;font-size:.8rem">
        <thead>
          <tr>
            <th style="padding:.5rem .8rem;text-align:right;color:var(--slate);font-size:.72rem;font-weight:700">الرمز / المسار</th>
            <th style="padding:.5rem .8rem;text-align:right;color:var(--slate);font-size:.72rem;font-weight:700">المؤشر</th>
            <th style="padding:.5rem .8rem;text-align:center;color:var(--slate);font-size:.72rem;font-weight:700">المستهدف</th>
            <th style="padding:.5rem .8rem;text-align:center;color:var(--gold);font-size:.72rem;font-weight:700">الفعلي</th>
            <th style="padding:.5rem .8rem;text-align:center;color:var(--slate);font-size:.72rem;font-weight:700">الحالة</th>
          </tr>
        </thead>
        <tbody id="previewTableBody"></tbody>
      </table>
    </div>
  </div>

</div>

<div class="tab-panel" id="tab-setup">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem"> الإعداد الأولي لقاعدة البيانات</h2>
      <div class="alert-box alert-info" style="margin-bottom:1.25rem">
        ⚠️ تحذير: سيحذف هذا الإعداد جميع البيانات الحالية ويعيد إنشاء الجداول من الصفر
      </div>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <button class="btn btn-teal" style="justify-content:center" onclick="runSetup()">
         ⚙️   تشغيل الإعداد الأولي (إنشاء الجداول + استيراد بيانات الإكسل)
        </button>
        <button class="btn btn-ghost" style="justify-content:center" onclick="testDb()">
         🔌   اختبار الاتصال بقاعدة البيانات
        </button>
      </div>
      <div id="setupResult" style="display:none;margin-top:1.25rem"></div>
    </div>
    <div class="card">
      <h3 style="font-size:.9rem;font-weight:800;margin-bottom:.9rem"> الخطوات الموصى بها</h3>
      <?php foreach([
        ['1','تأكد من إعدادات قاعدة البيانات في تبويب "⚙️ الإعدادات"','maroon'],
        ['2','اضغط "تشغيل الإعداد الأولي" لإنشاء الجداول واستيراد بيانات الإكسل تلقائياً','teal'],
        ['3','شغّل add_admin_user.sql على قاعدة البيانات لإنشاء حساب المدير','cyan'],
        ['4','ابدأ بإدخال البيانات الفعلية من تبويب "إدخال البيانات"','gold'],
      ] as [$n,$t,$c]): ?>
      <div style="display:flex;align-items:flex-start;gap:.75rem;padding:.65rem 0;border-bottom:1px solid var(--border)">
        <span style="width:24px;height:24px;border-radius:50%;background:var(--<?=$c?>);color:#07111f;font-size:.75rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0"><?=$n?></span>
        <span style="font-size:.8rem;color:var(--text)"><?=$t?></span>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 6 — الملف الشخصي                             -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-profile">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

    <!-- فورم تعديل البيانات -->
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem"> تعديل بيانات المدير</h2>

      <?php if ($profileMsg): ?>
        <div class="alert-box <?= $profileMsg['type']==='success' ? 'alert-success' : 'alert-error' ?>" style="margin-bottom:1.25rem">
          <?= htmlspecialchars($profileMsg['text']) ?>
        </div>
      <?php endif; ?>

      <form method="POST" enctype="multipart/form-data" id="profileForm">
        <input type="hidden" name="action" value="save_profile">
        <div style="display:flex;flex-direction:column;gap:.9rem">

          <!-- الاسم -->
          <div>
            <label class="lbl">الاسم الكامل</label>
            <input class="inp" type="text" name="prof_name" value="<?= htmlspecialchars($profile['name']) ?>" placeholder="اسم المدير" required>
          </div>

          <!-- المسمى الوظيفي -->
          <div>
            <label class="lbl">المسمى الوظيفي</label>
            <input class="inp" type="text" name="prof_title" value="<?= htmlspecialchars($profile['title']) ?>" placeholder="مثال: مدير الإدارة">
          </div>

          <!-- نوع الصورة الرمزية -->
          <div>
            <label class="lbl">نوع الصورة الرمزية</label>
            <div style="display:flex;gap:.5rem">
              <label style="flex:1;background:var(--card2);border:1px solid var(--border);border-radius:.65rem;padding:.7rem;cursor:pointer;display:flex;align-items:center;gap:.5rem;font-size:.8rem;font-weight:700;transition:border-color .2s" id="lblInitials">
                <input type="radio" name="avatar_type" value="initials" <?= $profile['avatar_type']==='initials'?'checked':'' ?> onchange="switchAvatarType('initials')" style="accent-color:var(--teal)">
                 حروف أولية
              </label>
              <label style="flex:1;background:var(--card2);border:1px solid var(--border);border-radius:.65rem;padding:.7rem;cursor:pointer;display:flex;align-items:center;gap:.5rem;font-size:.8rem;font-weight:700;transition:border-color .2s" id="lblImage">
                <input type="radio" name="avatar_type" value="image" <?= $profile['avatar_type']==='image'?'checked':'' ?> onchange="switchAvatarType('image')" style="accent-color:var(--teal)">
                🖼️ صورة
              </label>
            </div>
          </div>

          <!-- الحروف الأولية -->
          <div id="sectionInitials" style="display:<?= $profile['avatar_type']==='initials'?'block':'none' ?>">
            <label class="lbl">الحروف الأولية (حرف أو حرفان)</label>
            <input class="inp" type="text" name="prof_initials" value="<?= htmlspecialchars($profile['avatar_text']) ?>" placeholder="مثال: ع أو عز" maxlength="2" style="font-size:1.5rem;text-align:center;font-weight:800">
          </div>

          <!-- رفع صورة -->
          <div id="sectionImage" style="display:<?= $profile['avatar_type']==='image'?'block':'none' ?>">
            <label class="lbl">رفع صورة شخصية</label>
            <?php if ($profile['avatar_img'] && file_exists(__DIR__ . '/' . $profile['avatar_img'])): ?>
            <div style="display:flex;align-items:center;gap:1rem;background:var(--card2);border:1px solid var(--border);border-radius:.75rem;padding:.9rem;margin-bottom:.75rem">
              <img src="<?= htmlspecialchars($profile['avatar_img']) ?>" alt="الصورة الحالية"
                   style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid var(--teal)">
              <div>
                <p style="font-size:.8rem;font-weight:700;color:var(--text)">الصورة الحالية</p>
                <p style="font-size:.7rem;color:var(--slate)"><?= basename($profile['avatar_img']) ?></p>
              </div>
              <button type="submit" name="delete_avatar" value="1"
                      style="margin-right:auto;background:rgba(255,77,109,.1);color:var(--red);border:1px solid rgba(255,77,109,.3);border-radius:.5rem;padding:.35rem .75rem;font-size:.72rem;font-weight:700;cursor:pointer;font-family:'Almarai',sans-serif"
                      onclick="return confirm('حذف الصورة؟')">🗑️ حذف</button>
            </div>
            <?php endif; ?>
            <div class="upload-zone" style="padding:1.5rem" onclick="document.getElementById('avatarInput').click()">
              <div style="font-size:2rem;margin-bottom:.5rem">🖼️</div>
              <p style="font-weight:700;font-size:.82rem">اضغط لاختيار صورة</p>
              <p style="font-size:.72rem;color:var(--dim)">JPG, PNG, WebP · مربعة أفضل</p>
              <input type="file" id="avatarInput" name="avatar_img" accept="image/*" style="display:none"
                     onchange="previewAvatar(this)">
              <div id="avatarPreviewWrap" style="margin-top:.75rem;display:none">
                <img id="avatarPreview" src="" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--teal);margin:auto">
                <p id="avatarFileName" style="font-size:.72rem;color:var(--teal);margin-top:.35rem;font-weight:700"></p>
              </div>
            </div>
          </div>

          <!-- الظهور في الواجهة -->
          <label style="display:flex;align-items:center;gap:.6rem;cursor:pointer;font-size:.82rem;font-weight:700;color:var(--text)">
            <input type="checkbox" name="show_on_index" <?= $profile['show_on_index'] ? 'checked' : '' ?>
                   style="width:16px;height:16px;accent-color:var(--teal)">
            إظهار بيانات المدير في الواجهة الرئيسية
          </label>

          <button type="submit" class="btn btn-maroon" style="justify-content:center">💾 حفظ بيانات الملف الشخصي</button>
        </div>
      </form>
    </div>

    <!-- معاينة مباشرة -->
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem">🖥️ معاينة في الواجهة الرئيسية</h2>

      <!-- بطاقة المعاينة -->
      <div style="background:var(--bg-base,var(--bg));border:1px solid var(--border);border-radius:1rem;padding:1.1rem;margin-bottom:1.5rem">
        <div style="font-size:.7rem;color:var(--dim);margin-bottom:.75rem">معاينة بطاقة المدير في الهيدر</div>
        <div style="display:flex;align-items:center;gap:.8rem;background:var(--card);border:1px solid var(--border);padding:.65rem 1rem;border-radius:.85rem;width:fit-content">

          <!-- الصورة الرمزية -->
          <?php if ($profile['avatar_type']==='image' && $profile['avatar_img'] && file_exists(__DIR__.'/'.$profile['avatar_img'])): ?>
          <img src="<?= htmlspecialchars($profile['avatar_img']) ?>" alt="avatar"
               id="previewAvatarImg"
               style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)">
          <?php else: ?>
          <div id="previewAvatarDiv"
               style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#8b1a3a,#d4af37);display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:800;color:#fff;border:2px solid var(--gold)">
            <span id="previewInitialsText"><?= htmlspecialchars($profile['avatar_text'] ?: mb_substr($profile['name'],0,1)) ?></span>
          </div>
          <?php endif; ?>

          <div>
            <p style="font-weight:800;font-size:.88rem" id="previewName"><?= htmlspecialchars($profile['name']) ?></p>
            <p style="font-size:.7rem;color:var(--teal)" id="previewTitle"><?= htmlspecialchars($profile['title']) ?></p>
          </div>
          <span style="color:var(--dim);font-size:.85rem;margin-right:.25rem">⏻</span>
        </div>
      </div>

      <!-- البيانات الحالية -->
      <h3 style="font-size:.88rem;font-weight:800;margin-bottom:.85rem;color:var(--slate)"> البيانات المحفوظة حالياً</h3>
      <div style="display:flex;flex-direction:column;gap:.45rem">
        <?php foreach([
          ['الاسم',           $profile['name']],
          ['المسمى الوظيفي',  $profile['title']],
          ['نوع الصورة',      $profile['avatar_type']==='image'?'صورة مرفوعة':'حروف أولية'],
          ['الحروف الأولية',   $profile['avatar_text']],
          ['الظهور في الواجهة', $profile['show_on_index'] ? 'مُفعَّل' : 'مُعطَّل'],
        ] as [$lbl,$val]): ?>
        <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border)">
          <span style="font-size:.78rem;color:var(--slate)"><?= $lbl ?></span>
          <span style="font-size:.82rem;font-weight:700"><?= htmlspecialchars($val??'—') ?></span>
        </div>
        <?php endforeach; ?>
      </div>

      <!-- زر تحديث الواجهة -->
      <div style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--border)">
        <p style="font-size:.75rem;color:var(--slate);margin-bottom:.75rem">بعد الحفظ، ستظهر التغييرات في الواجهة الرئيسية مباشرة.</p>
        <a href="index.php" target="_blank" class="btn btn-maroon" style="width:100%;justify-content:center">🔗 فتح الواجهة الرئيسية للتحقق ←</a>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 7 — إعدادات البريد الإلكتروني                -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-email">

  <!-- ── قسم 1: إعدادات SMTP + بريد الاستقبال الموحد ─────────── -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="margin-bottom:1.5rem">

    <!-- إعدادات SMTP -->
    <div class="card">
      <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:1rem">✉️ إعدادات البريد الإلكتروني</h2>

      <!-- اختيار مزود البريد -->
      <div style="margin-bottom:1rem">
        <label class="lbl">مزود البريد</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
          <label id="lblGmail" onclick="selectProvider('gmail')"
            style="background:var(--card2);border:2px solid rgba(139,26,58,.5);border-radius:.65rem;padding:.65rem;cursor:pointer;display:flex;align-items:center;gap:.5rem;font-size:.8rem;font-weight:700;transition:all .2s">
            <span style="font-size:1.2rem">📧</span>
            <div><div>Gmail</div><div style="font-size:.65rem;color:var(--dim);font-weight:400">App Password</div></div>
          </label>
          <label id="lblMicrosoft" onclick="selectProvider('microsoft')"
            style="background:var(--card2);border:2px solid var(--border);border-radius:.65rem;padding:.65rem;cursor:pointer;display:flex;align-items:center;gap:.5rem;font-size:.8rem;font-weight:700;transition:all .2s">
            <span style="font-size:1.2rem">🪟</span>
            <div><div>Microsoft</div><div style="font-size:.65rem;color:var(--dim);font-weight:400">Outlook / Office365</div></div>
          </label>
        </div>
      </div>

      <!-- تعليمات مزود مخفية -->
      <div id="hintGmail" style="background:rgba(196,162,70,.07);border:1px solid rgba(196,162,70,.2);border-radius:.75rem;padding:.85rem;margin-bottom:1rem;font-size:.75rem;color:var(--cyan);line-height:1.7">
        🔑 <strong>Gmail:</strong> حساب Google ← الأمان ← التحقق بخطوتين ← كلمات مرور التطبيقات ← أنشئ كلمة مرور جديدة
      </div>
      <div id="hintMicrosoft" style="display:none;background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.2);border-radius:.75rem;padding:.85rem;margin-bottom:1rem;font-size:.75rem;color:#60a5fa;line-height:1.7">
        🪟 <strong>Microsoft:</strong> استخدم بريد Outlook أو Office365 مع كلمة المرور العادية أو <a href="https://account.microsoft.com/security" target="_blank" style="color:#60a5fa;font-weight:700">App Password</a> إذا كان MFA مُفعَّلاً
      </div>

      <div id="emailSaveMsg"></div>
      <input type="hidden" id="smtpProvider" value="gmail">

      <div style="display:flex;flex-direction:column;gap:.85rem">
        <div>
          <label class="lbl" id="lblSmtpFrom">📮 بريد المُرسِل (Gmail)</label>
          <input class="inp" type="email" id="smtpFrom" placeholder="miqyas@gmail.com">
        </div>
        <div>
          <label class="lbl">🔐 كلمة مرور التطبيق (App Password)</label>
          <div style="position:relative">
            <input class="inp" type="password" id="smtpPass" placeholder="xxxx xxxx xxxx xxxx">
            <button type="button"
              onclick="const i=document.getElementById('smtpPass');i.type=i.type==='password'?'text':'password'"
              style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--dim);font-size:.85rem">✏️</button>
          </div>
        </div>
        <div>
          <label class="lbl">✅ اسم المُرسِل</label>
          <input class="inp" type="text" id="smtpName" value="منصة مِقياس | جمعية الزاد">
        </div>
        <div>
          <label class="lbl">⚠️ حد الإنذار المبكر (%)</label>
          <input class="inp" type="number" id="alertThreshold" value="15" min="5" max="50">
          <p style="font-size:.69rem;color:var(--dim);margin-top:.3rem">يُرسل إيميل إنذار تلقائياً عند انحراف أكبر من هذه النسبة</p>
        </div>
        <div style="display:flex;gap:.65rem">
          <button class="btn btn-teal" style="flex:1;justify-content:center" onclick="saveEmailSettings()">💾 حفظ</button>
          <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="testEmail()">📧 تجريبي</button>
        </div>
      </div>
    </div>

    <!-- بريد الاستقبال الموحد -->
    <div class="card">
      <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:1rem">📮 بريد الاستقبال الموحد</h2>
      <div style="display:flex;flex-direction:column;gap:.85rem">
        <div>
          <label class="lbl">البريد الذي ستصل إليه جميع الرسائل</label>
          <div style="display:flex;gap:.5rem;align-items:center">
            <span style="font-size:1rem">👤</span>
            <input class="inp" type="email" id="primaryRecipient" placeholder="manager@alzad.org.sa" style="flex:1">
          </div>
          <p style="font-size:.68rem;color:var(--dim);margin-top:.35rem">هذا البريد سيستقبل البريد التجريبي، إنذارات الانحراف، والتقارير الدورية. ويمكن تغييره في أي وقت من هذا الحقل.</p>
        </div>
        <div>
          <label class="lbl">📅 يوم إرسال التقرير الأسبوعي</label>
          <select class="inp" id="weeklyDay">
            <option value="0">الأحد</option>
            <option value="1">الاثنين</option>
            <option value="2">الثلاثاء</option>
            <option value="3">الأربعاء</option>
            <option value="4">الخميس</option>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- ── قسم 2: حالة الاتصال ─────────────────────── -->
  <div class="card" style="margin-bottom:1.5rem" id="emailStatusCard">
    <h2 style="font-size:1rem;font-weight:800;margin-bottom:1rem">📊 حالة إعدادات البريد</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:.75rem" id="emailStatusGrid">
      <div style="text-align:center;color:var(--dim);padding:1rem">⏳ جارٍ التحميل…</div>
    </div>
  </div>

  <!-- ── قسم 3: التقرير الأسبوعي + إرسال يدوي ────── -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6" style="margin-bottom:1.5rem">
    <div class="card">
      <h2 style="font-size:1rem;font-weight:800;margin-bottom:.75rem">📤 إرسال التقرير الشهري/الأسبوعي</h2>
      <p style="font-size:.78rem;color:var(--slate);margin-bottom:.85rem">إرسال ملخص أداء المؤشرات الاستراتيجية والتشغيلية</p>

      <div style="margin-bottom:.85rem;background:var(--card2);border:1px solid var(--border);border-radius:.9rem;padding:1rem">
        <p style="font-size:.76rem;font-weight:800;color:var(--text);margin:0 0 .35rem">📧 بريد التقرير المعتمد</p>
        <p id="weeklyRecipientHint" style="font-size:.8rem;color:var(--teal);font-weight:700;margin:0">سيُرسَل إلى بريد الاستقبال الموحد</p>
        <p style="font-size:.68rem;color:var(--dim);margin:.45rem 0 0">يعتمد هذا القسم على نفس البريد الموحد المحدد في الأعلى، ولا يحتاج إلى حقول منفصلة.</p>
      </div>

      <button class="btn btn-maroon" style="width:100%;justify-content:center" onclick="sendWeeklyReport()">
        📤 إرسال التقرير الآن
      </button>
    </div>
    <div class="card">
      <h2 style="font-size:1rem;font-weight:800;margin-bottom:.75rem">📋 سجل الإرسال</h2>
      <button class="btn btn-ghost" style="padding:.3rem .75rem;font-size:.73rem;margin-bottom:.75rem" onclick="loadEmailSettings()">🔄 تحديث</button>
      <div id="emailLog" style="font-size:.75rem">
        <div style="text-align:center;color:var(--dim);padding:1rem">⏳ جارٍ التحميل…</div>
      </div>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════ -->
  <!-- ── قسم 4: الإنذار التلقائي (مخصص ومنفصل) ────────── -->
  <!-- ══════════════════════════════════════════════════════ -->
  <div style="border:2px solid rgba(255,77,109,.35);border-radius:1.25rem;padding:1.5rem;background:rgba(255,77,109,.04);position:relative;overflow:hidden">

    <!-- خلفية زخرفية -->
    <div style="position:absolute;top:-20px;left:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,77,109,.06);pointer-events:none"></div>
    <div style="position:absolute;bottom:-30px;right:-30px;width:160px;height:160px;border-radius:50%;background:rgba(255,77,109,.04);pointer-events:none"></div>

    <!-- العنوان -->
    <div style="display:flex;align-items:center;gap:.85rem;margin-bottom:1.5rem">
      <div style="width:3rem;height:3rem;border-radius:.75rem;background:rgba(255,77,109,.15);border:1px solid rgba(255,77,109,.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">🚨</div>
      <div>
        <h2 style="font-size:1.05rem;font-weight:800;color:var(--red);margin:0">نظام الإنذار المبكر التلقائي</h2>
        <p style="font-size:.75rem;color:var(--slate);margin:.2rem 0 0">يُرسل إيميل فوري عند انحراف المؤشرات عن المستهدف</p>
      </div>
      <div id="alertSystemStatus" style="margin-right:auto;padding:.3rem .85rem;border-radius:99px;font-size:.72rem;font-weight:700;background:rgba(255,77,109,.1);color:var(--red);border:1px solid rgba(255,77,109,.25)">
        ⏳ جارٍ التحقق…
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" style="margin-bottom:1.25rem">

      <!-- ── الحد ─── -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.1rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
          <span style="font-size:1.1rem">📉</span>
          <span style="font-size:.82rem;font-weight:800;color:var(--text)">حد الإنذار</span>
        </div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
          <input type="number" id="alertThreshold2" min="5" max="80" value="15"
            style="width:70px;background:var(--card2);border:1px solid rgba(255,77,109,.4);border-radius:.5rem;padding:.4rem .6rem;color:var(--red);font-weight:800;font-size:1.1rem;text-align:center;font-family:'Almarai',sans-serif">
          <span style="font-size:1rem;color:var(--slate);font-weight:700">%</span>
        </div>
        <p style="font-size:.68rem;color:var(--dim);line-height:1.5">
          يُرسل إنذار عندما ينحرف المؤشر بأكثر من هذه النسبة عن المستهدف
        </p>
      </div>

      <!-- ── متى يُرسَل ─── -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.1rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
          <span style="font-size:1.1rem">⚡</span>
          <span style="font-size:.82rem;font-weight:800;color:var(--text)">متى يُرسَل؟</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:.45rem">
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.78rem">
            <input type="checkbox" id="alertOnEntry" checked style="accent-color:var(--red);width:14px;height:14px">
            <span>عند إدخال قيمة مؤشر يدوياً</span>
          </label>
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.78rem">
            <input type="checkbox" id="alertOnExcel" checked style="accent-color:var(--red);width:14px;height:14px">
            <span>عند استيراد ملف Excel</span>
          </label>
          <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.78rem">
            <input type="checkbox" id="alertEnabled" checked style="accent-color:var(--red);width:14px;height:14px">
            <span style="font-weight:700;color:var(--red)">تفعيل الإنذار التلقائي</span>
          </label>
        </div>
      </div>

      <!-- ── آخر إنذار ─── -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1.1rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem">
          <span style="font-size:1.1rem">📊</span>
          <span style="font-size:.82rem;font-weight:800;color:var(--text)">إحصائيات الإنذار</span>
        </div>
        <div id="alertStats" style="display:flex;flex-direction:column;gap:.4rem">
          <div style="text-align:center;color:var(--dim);font-size:.75rem;padding:.5rem">⏳ جارٍ التحميل…</div>
        </div>
      </div>
    </div>

    <!-- ── بريد الإنذار المعتمد ── -->
    <div style="background:var(--card);border:1px solid rgba(255,77,109,.25);border-radius:1rem;padding:1.1rem;margin-top:.85rem">
      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.85rem">
        <span style="font-size:1.1rem">📧</span>
        <div>
          <span style="font-size:.82rem;font-weight:800;color:var(--text)">بريد استلام الإنذارات</span>
          <p style="font-size:.68rem;color:var(--dim);margin:.15rem 0 0">يعتمد الإنذار المبكر على بريد الاستقبال الموحد نفسه</p>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.55rem">
        <div style="background:rgba(255,77,109,.06);border:1px solid rgba(255,77,109,.15);border-radius:.75rem;padding:.8rem .9rem">
          <p style="font-size:.72rem;color:var(--dim);margin:0 0 .3rem">📮 البريد المعتمد حالياً</p>
          <p id="alertRecipientHint" style="font-size:.82rem;font-weight:800;color:var(--red);margin:0">سيُرسَل إلى بريد الاستقبال الموحد</p>
        </div>
        <p style="font-size:.68rem;color:var(--dim);line-height:1.5;padding:.5rem;background:rgba(255,77,109,.06);border-radius:.5rem;border:1px solid rgba(255,77,109,.15)">
          أي تغيير على بريد الاستقبال الموحد في أعلى الصفحة سيتم تطبيقه تلقائياً على الإنذارات والتقارير والبريد التجريبي.
        </p>
      </div>
    </div>

    <!-- زر الحفظ + اختبار -->
    <div style="display:flex;gap:.75rem;align-items:center">
      <button onclick="saveAlertSettings()"
        style="background:var(--red);color:#fff;border:none;border-radius:.7rem;padding:.65rem 1.5rem;font-family:'Almarai',sans-serif;font-size:.85rem;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:.4rem;transition:opacity .2s"
        onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
        💾 حفظ إعدادات الإنذار
      </button>
      <button onclick="testAlertEmail()"
        style="background:transparent;color:var(--red);border:1px solid rgba(255,77,109,.4);border-radius:.7rem;padding:.65rem 1.2rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s"
        onmouseover="this.style.background='rgba(255,77,109,.08)'" onmouseout="this.style.background='transparent'">
        🧪 اختبار الإنذار
      </button>
      <span id="alertSaveMsg" style="font-size:.78rem;color:var(--teal)"></span>
    </div>

  </div>

</div>

<div class="tab-panel" id="tab-deviation">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.65rem">
    <div>
      <h2 style="font-size:1.1rem;font-weight:800">📋 بطاقات الانحراف</h2>
      <p style="font-size:.75rem;color:var(--slate);margin-top:.25rem">تُنشأ تلقائياً عند تجاوز حد الانحراف · يمكن تعديلها وإغلاقها</p>
    </div>
    <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
      <select class="inp" id="devFilterYear" onchange="loadDeviationCards()" style="font-size:.78rem;padding:.4rem .75rem">
        <option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option><option value="2030">2030</option><option value="2025">2025</option><option value="2024">2024</option>
      </select>
      <select class="inp" id="devFilterQ" onchange="loadDeviationCards()" style="font-size:.78rem;padding:.4rem .75rem">
        <option value="1">الربع الأول</option>
        <option value="2">الربع الثاني</option>
        <option value="3">الربع الثالث</option>
        <option value="4">الربع الرابع</option>
      </select>
      <select class="inp" id="devFilterStatus" onchange="loadDeviationCards()" style="font-size:.78rem;padding:.4rem .75rem">
        <option value="">كل الحالات</option>
        <option value="open">🔴 مفتوحة</option>
        <option value="in_progress">🟠 قيد المعالجة</option>
        <option value="under_execution">🔵 تحت التنفيذ</option>
        <option value="pending_verify">🟡 انتظار التحقق</option>
        <option value="closed">✅ مغلقة</option>
      </select>
      <button class="btn btn-teal" onclick="loadDeviationCards()">🔄 تحديث</button>
    </div>
  </div>
  <div id="deviationCardsContainer">
    <div style="text-align:center;padding:3rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 9 — الحوكمة                                   -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-governance">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
    <div>
      <h2 style="font-size:1.1rem;font-weight:800">🏛️ معايير الحوكمة</h2>
      <p style="font-size:.75rem;color:var(--slate);margin-top:.25rem">اللوائح والسياسات والإجراءات والتقارير</p>
    </div>
    <button class="btn btn-teal" onclick="openGovModal()">＋ إضافة معيار</button>
  </div>
  <div id="govSummary" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem"></div>
  <div id="govContainer">
    <div style="text-align:center;padding:3rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 10 — إدارة المعرفة                            -->
<!-- ══════════════════════════════════════════════════ -->
<div class="tab-panel" id="tab-knowledge">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
    <div>
      <h2 style="font-size:1.1rem;font-weight:800">📚 إدارة المعرفة المؤسسية</h2>
      <p style="font-size:.75rem;color:var(--slate);margin-top:.25rem">السياسات والإجراءات والدروس المستفادة وأفضل الممارسات</p>
    </div>
    <button class="btn btn-teal" onclick="openKnowModal()">＋ إضافة أصل معرفي</button>
  </div>
  <div style="display:flex;gap:.65rem;margin-bottom:1.25rem;flex-wrap:wrap">
    <select class="inp" id="knowFilterType" onchange="loadKnowledge()" style="font-size:.78rem;padding:.4rem .75rem;width:auto">
      <option value="">كل الأنواع</option>
      <option value="policy">سياسة</option>
      <option value="procedure">إجراء</option>
      <option value="lesson">درس مستفاد</option>
      <option value="best_practice">أفضل ممارسة</option>
      <option value="report">تقرير</option>
      <option value="template">نموذج</option>
    </select>
    <select class="inp" id="knowFilterStatus" onchange="loadKnowledge()" style="font-size:.78rem;padding:.4rem .75rem;width:auto">
      <option value="">كل الحالات</option>
      <option value="active">نشط</option>
      <option value="draft">مسودة</option>
      <option value="archived">مؤرشف</option>
    </select>
  </div>
  <div id="knowledgeContainer">
    <div style="text-align:center;padding:3rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════ -->
<!-- TAB 11 — الأداء الاستراتيجي -->
<div class="tab-panel" id="tab-strategic">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
      <h2 style="font-size:1rem;font-weight:800;color:var(--teal)">🎯 مسار الأداء الاستراتيجي</h2>
      <p style="font-size:.75rem;color:var(--slate);margin-top:.2rem" id="stratSubTitle">جمعية الزاد 2026 · الربع الأول</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <select class="inp" id="stratYear" style="width:90px;padding:.4rem .65rem;font-size:.78rem" onchange="loadStrategicTab()"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option><option value="2030">2030</option><option value="2025">2025</option><option value="2024">2024</option></select>
        <select class="inp" id="stratQ" style="width:110px;padding:.4rem .65rem;font-size:.78rem" onchange="loadStrategicTab()">
          <option value="1">الربع الأول</option><option value="2">الربع الثاني</option><option value="3">الربع الثالث</option><option value="4">الربع الرابع</option>
        </select>
        <select class="inp" id="stratStatusFilter" style="width:120px;padding:.4rem .65rem;font-size:.78rem" onchange="filterStrategicTab()">
          <option value="">كل الحالات</option><option value="exceeded">متجاوز</option><option value="achieved">متحقق</option><option value="partial">جزئي</option><option value="not_achieved">غير متحقق</option>
        </select>
        <button class="btn btn-teal" onclick="loadStrategicTab()" style="font-size:.78rem;padding:.4rem .75rem">🔄</button>
      </div>
    </div>
    <!-- ملخص 7 عناصر -->
    <div id="stratSummaryTab" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.65rem;margin-bottom:1.25rem"></div>
    <!-- جدول المؤشرات -->
    <div id="stratTableContainer" style="overflow-x:auto">
      <div style="text-align:center;padding:2rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
    </div>
  </div>
</div>

<!-- TAB 12 — الأداء التشغيلي -->
<div class="tab-panel" id="tab-operational">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
      <h2 style="font-size:1rem;font-weight:800;color:var(--cyan)">⚙️ مسار الأداء التشغيلي</h2>
      <p style="font-size:.75rem;color:var(--slate);margin-top:.2rem" id="operSubTitle">جمعية الزاد 2026 · الربع الأول</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <select class="inp" id="operYear" style="width:90px;padding:.4rem .65rem;font-size:.78rem" onchange="loadOperationalTab()"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option><option value="2030">2030</option><option value="2025">2025</option><option value="2024">2024</option></select>
        <select class="inp" id="operQ" style="width:110px;padding:.4rem .65rem;font-size:.78rem" onchange="loadOperationalTab()">
          <option value="1">الربع الأول</option><option value="2">الربع الثاني</option><option value="3">الربع الثالث</option><option value="4">الربع الرابع</option>
        </select>
        <select class="inp" id="operDeptFilter" style="width:130px;padding:.4rem .65rem;font-size:.78rem" onchange="filterOperTab()"><option value="">كل الإدارات</option></select>
        <button class="btn btn-teal" onclick="loadOperationalTab()" style="font-size:.8rem;padding:.4rem .85rem">🔄 تحديث</button>
      </div>
    </div>
    <div id="operDeptSummary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.65rem;margin-bottom:1.25rem"></div>
    <div id="operTableContainer" style="overflow-x:auto">
      <div style="text-align:center;padding:2rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
    </div>
  </div>
</div>

<!-- TAB 13 — الإنذار المبكر -->
<div class="tab-panel" id="tab-alerts">
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem">
      <h2 style="font-size:1rem;font-weight:800;color:var(--red)">🚨 مسار الإنذار المبكر</h2>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <select class="inp" id="alertYear" style="width:90px;padding:.4rem .65rem;font-size:.78rem" onchange="loadAlertsTab()"><option value="2026">2026</option><option value="2027">2027</option><option value="2028">2028</option><option value="2029">2029</option><option value="2030">2030</option><option value="2025">2025</option><option value="2024">2024</option></select>
        <select class="inp" id="alertQ" style="width:110px;padding:.4rem .65rem;font-size:.78rem" onchange="loadAlertsTab()">
          <option value="1">الربع الأول</option><option value="2">الربع الثاني</option><option value="3">الربع الثالث</option><option value="4">الربع الرابع</option>
        </select>
        <select class="inp" id="alertRisk" style="width:120px;padding:.4rem .65rem;font-size:.78rem" onchange="filterAlertsTab()">
          <option value="">كل المستويات</option><option value="high"> عالٍ</option><option value="medium"> متوسط</option><option value="low"> منخفض</option>
        </select>
        <button class="btn btn-teal" onclick="loadAlertsTab()" style="font-size:.8rem;padding:.4rem .85rem">🔄 تحديث</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:1.25rem">
      <div style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.25);border-radius:.85rem;padding:.9rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--red)" id="alertCntHigh">—</div>
        <div style="font-size:.72rem;color:var(--slate)"> خطر عالٍ</div>
      </div>
      <div style="background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.25);border-radius:.85rem;padding:.9rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--gold)" id="alertCntMed">—</div>
        <div style="font-size:.72rem;color:var(--slate)"> تحذير</div>
      </div>
      <div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:.85rem;padding:.9rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:#fbbf24" id="alertCntLow">—</div>
        <div style="font-size:.72rem;color:var(--slate)"> منخفض</div>
      </div>
    </div>
    <div id="alertsTabContainer" style="overflow-x:auto">
      <div style="text-align:center;padding:2rem;color:var(--dim)">⏳ جارٍ التحميل…</div>
    </div>
  </div>
</div>

<!-- Modal بطاقة معالجة انحراف المؤشر -->


<script>
const API = 'api.php';
let allPendingKpis = [];
let pendingFilter  = 'all';

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  loadDepartmentOptions();
  // تفعيل البطاقة الأولى
  setTimeout(()=>{const fb=document.getElementById('nav-tab-data');if(fb)switchTab('tab-data',fb);},100);

  // فتح تبويب Excel تلقائياً إذا جاء بعد رفع ملف
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam) {
    // دعم كلا الصيغتين: tab=deviation أو tab=tab-deviation
    // تأخير 300ms لضمان تحميل الصفحة والبطاقات كاملاً أولاً
    setTimeout(() => {
      const fullTabId = tabParam.startsWith('tab-') ? tabParam : 'tab-' + tabParam;
      const tabBtn = document.getElementById(`nav-${fullTabId}`);
      if (tabBtn) {
        switchTab(fullTabId, tabBtn);
        setTimeout(() => tabBtn.scrollIntoView({behavior:'smooth', block:'center'}), 150);
      }
    }, 300);
  } else if (urlParams.get('uploaded')) {
    const excelBtn = document.getElementById('nav-tab-excel');
    if (excelBtn) { switchTab('tab-excel', excelBtn); }
  }
  applyTheme();
  startClock();
  loadKpiSelect();
  loadPendingKpis();
  loadEnteredValues();
  loadKpisTable('all');
  updateImportHint();
  document.getElementById('fileInput').addEventListener('change', function(){
    if(this.files[0]) document.getElementById('selectedFileName').textContent = ' ' + this.files[0].name;
  });
});

let departmentOptionsPromise = null;
async function loadDepartmentOptions() {
  if (departmentOptionsPromise) return departmentOptionsPromise;
  departmentOptionsPromise = fetch(`${API}?endpoint=departments`).then(r=>r.json()).then(rows => {
    const names = [];
    (Array.isArray(rows) ? rows : []).forEach(dept => {
      const deptName = (dept.dept_name || '').trim();
      if (deptName) names.push(deptName);
      (Array.isArray(dept.sections) ? dept.sections : []).forEach(section => {
        const sectionName = (section.section_name || '').trim();
        if (sectionName) names.push(sectionName);
      });
    });
    const list = document.getElementById('sharedDeptOptions');
    if (list) {
      list.innerHTML = '';
      [...new Set(names)].sort((a,b)=>a.localeCompare(b,'ar')).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        list.appendChild(option);
      });
    }
    return names;
  }).catch(() => []);
  return departmentOptionsPromise;
}

// ── Clock ──
function startClock(){
  function tick(){
    const n=new Date();
    document.getElementById('clockTime').textContent=`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
    try{ document.getElementById('clockHijri').textContent=new Intl.DateTimeFormat('ar-SA-u-ca-islamic',{day:'numeric',month:'long',year:'numeric'}).format(n); }catch(e){}
  }
  tick(); setInterval(tick,1000);
}

// ── Theme ──
function toggleTheme(){}
function applyTheme(){}

// ── Tabs ──
const TAB_COLORS={
  "tab-data":        ["139,26,58",   "#8b1a3a"],
  "tab-kpis":        ["196,162,70",  "#c4a246"],
  "tab-excel":       ["5,150,105",   "#059669"],
  "tab-strategic":   ["139,26,58",   "#8b1a3a"],
  "tab-operational": ["196,162,70",  "#c4a246"],
  "tab-alerts":      ["255,77,109",  "#ff4d6d"],
  "tab-deviation":   ["255,77,109",  "#ff4d6d"],
  "tab-governance":  ["167,139,250", "#a78bfa"],
  "tab-knowledge":   ["212,175,55",  "#d4af37"],
  "tab-email":       ["96,165,250",  "#60a5fa"],
  "tab-profile":     ["52,211,153",  "#34d399"],
  "tab-db":          ["251,113,133", "#fb7185"],
  "tab-setup":       ["148,163,184", "#94a3b8"],
  "tab-password":    ["139,26,58","#8b1a3a"],
};
function switchTab(id, btn){
  // إزالة التفعيل من الـ panels
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');

  // إعادة تصميم جميع البطاقات للحالة العادية
  document.querySelectorAll('.tab-path-btn').forEach(b=>{
    b.classList.remove('active');
    b.style.borderColor='var(--border)';
    b.style.boxShadow='none';
    const lbl=b.querySelector('.tab-path-label');
    if(lbl) lbl.style.color='var(--text)';
  });

  // تفعيل البطاقة المختارة
  const activeBtn = document.getElementById('nav-'+id) || btn;
  if(activeBtn){
    const colors = TAB_COLORS[id];
    if(colors){
      const [rgba, hex] = colors;
      activeBtn.classList.add('active');
      activeBtn.style.cssText += `;--active-color:${hex};--active-rgba:${rgba};border-color:${hex};box-shadow:0 4px 18px rgba(${rgba},.25)`;
      const lbl = activeBtn.querySelector('.tab-path-label');
      if(lbl) lbl.style.color = hex;
    }
  }

  // تحميل بيانات التبويب تلقائياً
  const loaders = {
    'tab-deviation':   loadDeviationCards,
    'tab-governance':  loadGovernance,
    'tab-knowledge':   loadKnowledge,
    'tab-strategic':   loadStrategicTab,
    'tab-operational': loadOperationalTab,
    'tab-alerts':      loadAlertsTab,
    'tab-data':        loadPendingKpis,
    'tab-email':       () => { loadEmailSettings(); loadAlertSettings(); },
    'tab-excel':       loadExcelFilesList,
  };
  if(loaders[id]) setTimeout(()=>loaders[id](), 80);
}

// ── Load KPI select ──
async function loadKpiSelect(){
  const type = document.getElementById('kpiTypeFilter')?.value || '';
  try{
    const yr_sel=document.getElementById('entryYear')?.value||'2026';
    const r = await fetch(`${API}?endpoint=kpis&year=${yr_sel}&quarter=${document.getElementById('entryQuarter').value}${type?'&type='+type:''}`);
    const kpis = await r.json();
    const sel = document.getElementById('entryKpiSel');
    sel.innerHTML = '<option value="">-- اختر مؤشراً --</option>';
    kpis.forEach(k=>{
      sel.insertAdjacentHTML('beforeend',
        `<option value="${k.id}" data-name="${k.name}" data-code="${k.code}" data-t="${k.q_target||''}" data-unit="${k.unit||''}" data-type="${k.type}">${k.code} · ${k.name.substring(0,40)}</option>`);
    });
  }catch(e){}
}

// ── On KPI select ──
function onKpiSelect(){
  const sel = document.getElementById('entryKpiSel');
  const opt = sel.options[sel.selectedIndex];
  if(!sel.value){ document.getElementById('kpiInfo').style.display='none'; return; }
  document.getElementById('kpiInfo').style.display='block';
  document.getElementById('kpiInfoName').textContent = opt.dataset.name;
  document.getElementById('kpiInfoCode').textContent = opt.dataset.code;
  document.getElementById('kpiInfoBadges').innerHTML =
    `<span class="badge ${opt.dataset.type==='strategic'?'b-teal':'b-gold'}">${opt.dataset.type==='strategic'?'استراتيجي':'تشغيلي'}</span>` +
    (opt.dataset.unit ? `<span class="badge b-gray">وحدة: ${opt.dataset.unit}</span>` : '');
  document.getElementById('entryTarget').value = opt.dataset.t || '';
  document.getElementById('entryActual').value = '';
  document.getElementById('previewBox').style.display = 'none';
}

// ── Preview ──
function updatePreview(){
  const t=parseFloat(document.getElementById('entryTarget').value);
  const a=parseFloat(document.getElementById('entryActual').value);
  if(!isNaN(t)&&!isNaN(a)&&t>0){
    const r=a/t; const pct=Math.min(r*100,100);
    const st=r>=1?' متجاوز':r>=.85?' متحقق':r>=.5?' متحقق جزئياً':' غير متحقق';
    document.getElementById('previewPct').textContent = Math.round(r*100)+'%';
    document.getElementById('previewBar').style.width = pct+'%';
    document.getElementById('previewBar').style.background = r>=1?'var(--teal)':r>=.85?'var(--cyan)':r>=.5?'var(--gold)':'var(--red)';
    document.getElementById('previewStatus').textContent = st;
    document.getElementById('previewStatus').style.color = r>=1?'var(--teal)':r>=.85?'var(--cyan)':r>=.5?'var(--gold)':'var(--red)';
    document.getElementById('previewBox').style.display = 'block';
  }
}

// ── Save entry ──
async function saveEntry(){
  const id=document.getElementById('entryKpiSel').value;
  const y=document.getElementById('entryYear').value;
  const q=document.getElementById('entryQuarter').value;
  const t=document.getElementById('entryTarget').value;
  const a=document.getElementById('entryActual').value;
  const n=document.getElementById('entryNotes').value;
  if(!id){showToast('⚠️ اختر مؤشراً','gold');return;}
  if(a===''){showToast('⚠️ أدخل القيمة الفعلية','gold');return;}
  try{
    const r=await fetch(`${API}?endpoint=kpi_values`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kpi_id:+id,year:+y,quarter:+q,target:+t,actual:+a,notes:n})});
    const d=await r.json();
    if(d.success){
      const emailMsg = d.email_sent ? ' · 📧 تنبيه أُرسل' : '';
      showToast(`✅ تم الحفظ · الإنجاز: ${d.achievement??'—'}%${emailMsg}`);
      document.getElementById('entryActual').value='';
      document.getElementById('previewBox').style.display='none';
      await loadPendingKpis();
      await loadEnteredValues();
    } else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ في الاتصال','red');}
}

function handleEntryPeriodChange(){
  onKpiChange();
  loadPendingKpis();
  loadKpiSelect();
  loadEnteredValues();
}

// ── Pending KPIs ──
async function loadPendingKpis(){
  try{
    const q=document.getElementById('entryQuarter').value||1;
    const yr_p=document.getElementById('entryYear')?.value||'2026';
    const r=await fetch(`${API}?endpoint=kpis&year=${yr_p}&quarter=${q}`);
    allPendingKpis=await r.json();
    const filtered=pendingFilter==='all'?allPendingKpis:allPendingKpis.filter(k=>k.type===pendingFilter);
    renderPendingList(filtered);
  }catch(e){}
}
function filterPending(type,btn){
  pendingFilter=type;
  document.querySelectorAll('#tab-data .btn-ghost').forEach(b=>b.style.fontWeight='');
  btn.style.fontWeight='800';
  const filtered=type==='all'?allPendingKpis:allPendingKpis.filter(k=>k.type===type);
  renderPendingList(filtered);
}
function renderPendingList(kpis){
  const pending=kpis.filter(k=>k.q_actual===null);
  document.getElementById('pendingCount').textContent=pending.length;
  // تحديث بطاقة الهيدر أيضاً
  const hpc=document.getElementById('headerPendingCount');
  const hpl=document.getElementById('headerPendingLabel');
  const yr_h=document.getElementById('entryYear')?.value||'2026';
  const q_h=document.getElementById('entryQuarter')?.value||'1';
  const qNames=['','الأول','الثاني','الثالث','الرابع'];
  if(hpc) hpc.textContent=pending.length;
  if(hpl) hpl.textContent=`الربع ${qNames[+q_h]} ${yr_h}`;
  if(!pending.length){
    document.getElementById('pendingList').innerHTML='<p style="text-align:center;color:var(--teal);padding:1.5rem;font-size:.82rem"> جميع المؤشرات مُدخَلة لهذا الربع</p>';
    return;
  }
  document.getElementById('pendingList').innerHTML=pending.map(k=>`
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:.65rem;padding:.75rem 1rem;
                display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all .2s"
         onmouseenter="this.style.borderColor='var(--bhi)'" onmouseleave="this.style.borderColor='var(--border)'"
         onclick="quickFill(${k.id},'${k.name.replace(/'/g,"\\'")}','${k.code}','${k.q_target||''}','${k.unit||''}','${k.type}')">
      <div>
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem">
          <span style="font-size:.72rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.1rem .45rem;border-radius:.3rem">${k.code}</span>
          <span class="badge ${k.type==='strategic'?'b-teal':'b-gold'}" style="font-size:.62rem">${k.type==='strategic'?'استراتيجي':'تشغيلي'}</span>
        </div>
        <p style="font-size:.8rem;font-weight:600;color:var(--text)">${k.name.substring(0,55)}${k.name.length>55?'…':''}</p>
        ${k.description?`<p style="font-size:.68rem;color:var(--slate);margin-top:.2rem;line-height:1.4">${k.description.substring(0,80)}…</p>`:''}
      </div>
      <div style="text-align:left;flex-shrink:0;margin-right:.5rem">
        <p style="font-size:.68rem;color:var(--slate)">المستهدف</p>
        <p style="font-size:.82rem;font-weight:800;color:var(--text)">${k.q_target!==null?fmtN(k.q_target):'—'}</p>
      </div>
    </div>`).join('');
}
function quickFill(id,name,code,target,unit,type){
  document.getElementById('entryKpiSel').value=id;
  document.getElementById('kpiInfo').style.display='block';
  document.getElementById('kpiInfoName').textContent=name;
  document.getElementById('kpiInfoCode').textContent=code;
  document.getElementById('kpiInfoBadges').innerHTML=`<span class="badge ${type==='strategic'?'b-teal':'b-gold'}">${type==='strategic'?'استراتيجي':'تشغيلي'}</span>${unit?`<span class="badge b-gray">وحدة: ${unit}</span>`:''}`;
  document.getElementById('entryTarget').value=target;
  document.getElementById('entryActual').value='';
  document.getElementById('previewBox').style.display='none';
  document.getElementById('entryActual').focus();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ── Entered values ──
async function loadEnteredValues(){
  try{
    const yr_ev=document.getElementById('entryYear')?.value||'2026';
    const r=await fetch(`${API}?endpoint=kpis&year=${yr_ev}&quarter=${document.getElementById('entryQuarter').value||1}`);
    const kpis=await r.json();
    const entered=kpis.filter(k=>k.q_actual!==null);
    const tb=document.getElementById('enteredTable');
    if(!entered.length){tb.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--dim);padding:1.5rem">لم يتم إدخال أي بيانات بعد لهذا الربع</td></tr>';return;}
    tb.innerHTML=entered.map(k=>{
      const r2=k.q_target>0?k.q_actual/k.q_target:0;
      // نسبة الإنجاز الحقيقية (محدودة بـ 150% للعرض المعقول)
      const pct=k.q_target>0?Math.round(Math.min(r2,1.5)*100):0;
      const pctDisplay=k.q_target>0?Math.round(r2*100):0;
      const stC=r2>=1?'var(--teal)':r2>=.85?'var(--cyan)':r2>=.5?'var(--gold)':'var(--red)';
      const stT=r2>=1?' متجاوز':r2>=.85?' متحقق':r2>=.5?' جزئي':' غير متحقق';
      return `<tr>
        <td style="font-weight:800;color:var(--text)">${k.code}</td>
        <td style="max-width:200px;font-size:.78rem">${k.name.substring(0,40)}…</td>
        <td style="color:var(--slate)">${document.getElementById('entryQuarter').value||1}</td>
        <td>${fmtN(k.q_target)}</td>
        <td style="font-weight:700;color:var(--text)">${fmtN(k.q_actual)}</td>
        <td><div style="display:flex;align-items:center;gap:.5rem">
          <div style="width:60px;height:6px;background:var(--card2);border-radius:99px;overflow:hidden">
            <div style="height:100%;background:${stC};width:${Math.min(pct,100)}%;border-radius:99px"></div>
          </div>
          <span style="font-size:.75rem;font-weight:700;color:${stC}">${pct}%</span>
        </div></td>
        <td><span style="font-size:.72rem;font-weight:700;color:${stC}">${stT}</span></td>
        <td style="text-align:left"><button class="btn btn-red" style="padding:.3rem .65rem;font-size:.7rem" onclick="deleteEntry(${k.val_id})">🗑️</button></td>
      </tr>`;
    }).join('');
  }catch(e){}
}

// ── حذف قيمة مؤشر (ربع محدد) ───────────────────────
async function deleteKpiValue(kpiId, yr, q, code) {
  if (!confirm(`حذف قيمة ${code} — الربع ${q} من ${yr}؟`)) return;
  try {
    const r = await fetch(`${API}?endpoint=kpi_values&kpi_id=${kpiId}&year=${yr}&quarter=${q}`, {
      method: 'DELETE'
    });
    const d = await r.json();
    if (d.success) {
      showToast(`🗑️ تم حذف قيمة ${code}`);
      // تحديث الجدول المناسب
      if (document.getElementById('tab-strategic')?.classList.contains('active'))  loadStrategicTab();
      else if (document.getElementById('tab-operational')?.classList.contains('active')) loadOperationalTab();
    } else {
      showToast('❌ ' + (d.error || 'فشل الحذف'), 'red');
    }
  } catch(e) { showToast('❌ خطأ: ' + e.message, 'red'); }
}

async function deleteEntry(valId){
  if(!confirm('هل تريد حذف هذه القيمة؟')) return;
  const row=allPendingKpis.find(k=>k.val_id==valId);
  if(!row){
    showToast('⚠️ تعذر تحديد القيمة المطلوب حذفها','gold');
    return;
  }
  try{
    const r=await fetch(`${API}?endpoint=kpi_values&kpi_id=${row.id}&year=${row.year}&quarter=${row.quarter}`,{
      method:'DELETE'
    });
    const d=await r.json();
    if(d.success){
      showToast('🗑️ تم حذف القيمة','gold');
      await loadEnteredValues();
      await loadPendingKpis();
    } else {
      showToast('❌ '+(d.error||'فشل الحذف'),'red');
    }
  }catch(e){
    showToast('❌ خطأ في الحذف','red');
  }
}

// ── KPIs table ──
async function loadKpisTable(type='all', btn){
  if(btn) document.querySelectorAll('#tab-kpis .btn-ghost').forEach(b=>b.style.fontWeight=''); 
  if(btn) btn.style.fontWeight='800';
  try{
    const yr_kl=document.getElementById('entryYear')?.value||'2026';
  const q_kl=document.getElementById('entryQuarter')?.value||'1';
  const url=`${API}?endpoint=kpis&year=${yr_kl}&quarter=${q_kl}${type!=='all'?'&type='+type:''}`;
    const r=await fetch(url); const kpis=await r.json();
    const tb=document.getElementById('kpisTable');
    if(!kpis.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--dim);padding:1.5rem">لا توجد مؤشرات</td></tr>';return;}
    tb.innerHTML=kpis.map(k=>`<tr>
      <td style="font-weight:800">${k.code}</td>
      <td style="max-width:220px;font-size:.78rem">${k.name.substring(0,45)}${k.name.length>45?'…':''}</td>
      <td style="max-width:250px;font-size:.7rem;color:var(--slate)">${k.description?k.description.substring(0,60)+'…':'—'}</td>
      <td><span class="badge ${k.type==='strategic'?'b-teal':'b-gold'}">${k.type==='strategic'?'استراتيجي':'تشغيلي'}</span></td>
      <td style="font-size:.75rem;color:var(--slate)">${k.owner_dept||'—'}</td>
      <td>${fmtN(k.annual_target)}</td>
      <td style="color:var(--slate)">${k.unit||'—'}</td>
      <td style="text-align:left;display:flex;gap:.35rem">
        <button class="btn btn-ghost" style="padding:.3rem .65rem;font-size:.7rem" onclick='editKpi(${JSON.stringify(k)})'>✏️ تعديل</button>
        <button class="btn btn-red"   style="padding:.3rem .65rem;font-size:.7rem" onclick="deleteKpi(${k.id})">🗑️ حذف</button>
      </td>
    </tr>`).join('');
  }catch(e){}
}
function openAddKpi(){
  ['fCode','fGoal','fName','fDesc','fUnit','fDept','fTarget'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('kpiFormId').value='';
  document.getElementById('fType').value='strategic';
  document.getElementById('kpiFormTitle').textContent='＋ إضافة مؤشر جديد';
  document.getElementById('kpiFormBox').style.display='block';
  document.getElementById('kpiFormBox').scrollIntoView({behavior:'smooth'});
}
function editKpi(kpi){
  document.getElementById('kpiFormId').value=kpi.id;
  document.getElementById('fCode').value=kpi.code||'';
  document.getElementById('fGoal').value=kpi.goal_code||'';
  document.getElementById('fName').value=kpi.name||'';
  document.getElementById('fDesc').value=kpi.description||'';
  document.getElementById('fUnit').value=kpi.unit||'';
  document.getElementById('fDept').value=kpi.owner_dept||'';
  document.getElementById('fTarget').value=kpi.annual_target||'';
  document.getElementById('fType').value=kpi.type||'strategic';
  document.getElementById('kpiFormTitle').textContent='✏️ تعديل المؤشر';
  document.getElementById('kpiFormBox').style.display='block';
  document.getElementById('kpiFormBox').scrollIntoView({behavior:'smooth'});
}
async function saveKpi(){
  const id=document.getElementById('kpiFormId').value;
  const data={code:document.getElementById('fCode').value,goal_code:document.getElementById('fGoal').value,name:document.getElementById('fName').value,description:document.getElementById('fDesc').value,unit:document.getElementById('fUnit').value,type:document.getElementById('fType').value,owner_dept:document.getElementById('fDept').value,annual_target:document.getElementById('fTarget').value};
  if(!data.name||!data.code){showToast('⚠️ الرمز والاسم مطلوبان','gold');return;}
  try{
    const r=await fetch(id?`${API}?endpoint=kpis&id=${id}`:`${API}?endpoint=kpis`,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const d=await r.json();
    if(d.success||d.id){showToast(id?' تم التحديث':' تم الإضافة');document.getElementById('kpiFormBox').style.display='none';await loadKpisTable();}
    else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ','red');}
}
async function deleteKpi(id){
  if(!confirm('حذف المؤشر؟')) return;
  await fetch(`${API}?endpoint=kpis&id=${id}`,{method:'DELETE'});
  showToast('🗑️ تم الحذف','gold'); await loadKpisTable();
}

// ── Setup ──
async function runSetup(){
  document.getElementById('setupResult').style.display='none';
  showToast('⏳ جارٍ الإعداد…','gold');
  try{
    const r=await fetch(`${API}?endpoint=setup`);
    const d=await r.json();
    const box=document.getElementById('setupResult');
    box.style.display='block';
    const counts = d.counts
      ? `<div style="margin-top:.55rem;font-size:.8rem;line-height:1.9">
          الإدارات: ${d.counts.departments||0} | الأهداف الاستراتيجية: ${d.counts.strategic_goals||0} | الأهداف التشغيلية: ${d.counts.operational_goals||0}<br>
          المؤشرات: ${d.counts.kpis||0} | قياسات الأرباع: ${d.counts.kpi_values||0}
        </div>`
      : '';
    const source = d.data_source==='workbook' && d.workbook
      ? `<div style="margin-top:.45rem;font-size:.78rem;opacity:.9">مصدر البيانات: ${d.workbook}</div>`
      : '';
    const warning = d.warning
      ? `<div style="margin-top:.5rem;font-size:.76rem;opacity:.85">ملاحظة: ${d.warning}</div>`
      : '';
    box.innerHTML=`<div class="alert-box ${d.success?'alert-success':'alert-error'}">${d.message||d.error}${source}${counts}${warning}</div>`;
    if(d.success) showToast('✅ تم الإعداد بنجاح!');
    else showToast('❌ فشل الإعداد','red');
  }catch(e){showToast('❌ خطأ في الاتصال','red');}
}
async function testDb(){
  try{
    const yr_ds=document.getElementById('entryYear')?.value||'2026';
    const q_ds=document.getElementById('entryQuarter')?.value||'1';
    const r=await fetch(`${API}?endpoint=dashboard&year=${yr_ds}&quarter=${q_ds}`);
    const d=await r.json();
    showToast(d.summary?'✅ الاتصال ناجح!':'⚠️ البيانات غير مكتملة','gold');
  }catch(e){showToast('❌ فشل الاتصال','red');}
}

// ══ Excel Import ════════════════════════════════════

function selectFileForImport(name) {
  document.getElementById('importFileSelect').value = name;
  showToast('📂 تم اختيار: ' + name.substring(0,40));
}

async function previewExcel() {
  const file    = document.getElementById('importFileSelect').value;
  const year    = document.getElementById('importYear').value;
  const quarter = document.getElementById('importQuarter').value;
  const selectedType = getImportDataType();
  const typeMeta = getImportTypeMeta(selectedType);

  if (!file) { showToast('⚠️ اختر ملفاً أولاً', 'gold'); return; }

  showToast('⏳ جارٍ قراءة الملف…', 'gold');

  try {
    const r = await fetch('process_excel.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({action:'preview', filename:file, year:+year, quarter:+quarter, data_type: selectedType})
    });
    const rawText = await r.text();
    let d;
    try { d = JSON.parse(rawText); }
    catch(e) {
      // السيرفر أرجع HTML بدلاً من JSON — نسخة قديمة على السيرفر
      const htmlErr = rawText.match(/Fatal error[^<]*/i) || rawText.match(/Warning[^<]*/i);
      showToast('❌ خطأ في السيرفر: ' + (htmlErr ? htmlErr[0].trim() : 'تأكد من رفع الملفات الجديدة على السيرفر'), 'red');
      console.error('Server returned HTML instead of JSON:', rawText.substring(0, 500));
      return;
    }

    if (d.error) { showToast('❌ ' + d.error, 'red'); return; }

    // عرض بطاقة المعاينة
    const card = document.getElementById('previewCard');
    card.style.display = 'block';
    document.getElementById('previewTitle').textContent = `معاينة: ${typeMeta.label} • ${file}`;

    // إحصائيات
    document.getElementById('previewStats').innerHTML = `
      <div style="background:var(--card2);border:1px solid var(--border);border-radius:.65rem;padding:.75rem;text-align:center">
        <p style="font-size:1.5rem;font-weight:800;color:var(--text)">${d.total}</p>
        <p style="font-size:.7rem;color:var(--slate)">إجمالي الصفوف</p>
      </div>
      <div style="background:rgba(139,26,58,.08);border:1px solid rgba(139,26,58,.2);border-radius:.65rem;padding:.75rem;text-align:center">
        <p style="font-size:1.5rem;font-weight:800;color:var(--teal)">${d.found}</p>
        <p style="font-size:.7rem;color:var(--slate)">مطابقة للمسار المختار</p>
      </div>
      <div style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);border-radius:.65rem;padding:.75rem;text-align:center">
        <p style="font-size:1.5rem;font-weight:800;color:var(--red)">${d.not_found}</p>
        <p style="font-size:.7rem;color:var(--slate)">غير مطابقة أو غير موجودة</p>
      </div>
    `;

    // تحذيرات
    if (d.warnings && d.warnings.length > 0) {
      document.getElementById('previewWarnings').style.display = 'block';
      document.getElementById('previewWarnings').innerHTML =
        d.warnings.map(w => `<div style="font-size:.75rem;color:var(--gold);background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2);border-radius:.5rem;padding:.4rem .75rem;margin-bottom:.3rem">✅ ${w}</div>`).join('');
    }

    // جدول المعاينة
    const tbody = document.getElementById('previewTableBody');
    tbody.innerHTML = d.rows.map(row => {
      const found   = row.found;
      const isGov   = row.kpi_type === 'governance';
      const isKnow  = row.kpi_type === 'knowledge';
      const isSpecial = isGov || isKnow;

      // حساب الحالة
      let stC, stT;
      if (!found) {
        stC = 'var(--red)'; stT = '❌ غير موجود';
      } else if (isKnow) {
        const sMap = {active:'🟢 نشط',archived:'📦 مؤرشف',under_review:'🔵 قيد المراجعة',draft:'⏳ مسودة'};
        stC = 'var(--teal)'; stT = sMap[row.notes] || row.notes || '⏳ انتظار';
      } else if (isGov) {
        const pct = row.actual !== null ? +row.actual : null;
        stC = pct === null ? 'var(--dim)' : pct >= 90 ? 'var(--teal)' : pct >= 50 ? 'var(--gold)' : 'var(--red)';
        stT = pct === null ? '⏳ انتظار' : pct >= 90 ? '✅ ممتثل' : pct >= 50 ? '🟡 جزئي' : '🔴 غير ممتثل';
      } else {
        const pct = row.target > 0 && row.actual !== null ? Math.round(row.actual / row.target * 100) : null;
        stC = pct === null ? 'var(--dim)' : pct >= 100 ? 'var(--teal)' : pct >= 85 ? 'var(--cyan)' : pct >= 50 ? 'var(--gold)' : 'var(--red)';
        stT = pct === null ? '⏳ بدون قيمة' : pct >= 100 ? '✅ متجاوز' : pct >= 85 ? '🟢 متحقق' : pct >= 50 ? '🟡 جزئي' : '🔴 غير متحقق';
      }

      const typeLabelMap = {
        strategic:   '<span style="font-size:.65rem;background:rgba(139,26,58,.12);color:#8b1a3a;border:1px solid rgba(139,26,58,.25);border-radius:99px;padding:.1rem .4rem">🎯 استراتيجي</span>',
        operational: '<span style="font-size:.65rem;background:rgba(196,162,70,.12);color:#c4a246;border:1px solid rgba(196,162,70,.25);border-radius:99px;padding:.1rem .4rem">⚙️ تشغيلي</span>',
        governance:  '<span style="font-size:.65rem;background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.25);border-radius:99px;padding:.1rem .4rem">🏛️ حوكمة</span>',
        knowledge:   '<span style="font-size:.65rem;background:rgba(212,175,55,.12);color:#d4af37;border:1px solid rgba(212,175,55,.25);border-radius:99px;padding:.1rem .4rem">📚 معرفة</span>',
      };
      const typeLabel = typeLabelMap[row.kpi_type] || '';

      const targetCell = isSpecial ? (isGov ? (row.actual !== null ? row.actual + '%' : '—') : '—') : fmtN(row.current_target ?? row.target);
      const actualCell = isKnow ? (row.notes || '—') : (row.actual !== null ? fmtN(row.actual) : '—');

      return `<tr>
        <td style="background:var(--card);padding:.55rem .8rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);border-right:1px solid var(--border);border-radius:0 .5rem .5rem 0;font-weight:800;color:var(--text)">${row.code} ${typeLabel}</td>
        <td style="background:var(--card);padding:.55rem .8rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);font-size:.75rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${row.kpi_name||''}">${row.kpi_name || '—'}</td>
        <td style="background:var(--card);padding:.55rem .8rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);color:var(--slate);text-align:center">${targetCell}</td>
        <td style="background:var(--card);padding:.55rem .8rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);font-weight:800;color:var(--gold);text-align:center">${actualCell}</td>
        <td style="background:var(--card);padding:.55rem .8rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);border-left:1px solid var(--border);border-radius:.5rem 0 0 .5rem;font-weight:700;color:${stC}">${stT}</td>
      </tr>`;
    }).join('');

    // إظهار أزرار الاستيراد فقط إذا في بيانات
    const actDiv = document.getElementById('importActions');
    actDiv.style.display = d.found > 0 ? 'flex' : 'none';

    card.scrollIntoView({behavior:'smooth', block:'start'});
    showToast(`✅ تمت القراءة · ${d.found} ${typeMeta.itemLabel} جاهز للاستيراد`);

  } catch(e) {
    showToast('❌ خطأ: ' + e.message, 'red');
  }
}

function getImportDataType() {
  const sel = document.getElementById('importDataType');
  return sel?.value || 'kpi_strategic';
}

function getImportTypeMeta(type) {
  const map = {
    kpi_strategic: {
      label: 'مسار الأداء الاستراتيجي',
      shortLabel: 'استراتيجي',
      itemLabel: 'مؤشر استراتيجي',
    },
    kpi_operational: {
      label: 'مسار الأداء التشغيلي',
      shortLabel: 'تشغيلي',
      itemLabel: 'مؤشر تشغيلي',
    },
    governance: {
      label: 'مسار الحوكمة',
      shortLabel: 'الحوكمة',
      itemLabel: 'معيار حوكمة',
    },
    knowledge: {
      label: 'مسار المعرفة',
      shortLabel: 'المعرفة',
      itemLabel: 'أصل معرفي',
    },
  };
  return map[type] || map.kpi_strategic;
}

function updateImportHint() {
  const val = document.getElementById('importDataType')?.value;
  const hints = {
    'kpi_strategic':   '🎯 رمز المؤشر · المستهدف · الفعلي · ملاحظات (للمؤشرات الاستراتيجية)',
    'kpi_operational': '⚙️ رمز المؤشر · المستهدف · الفعلي · ملاحظات (للمؤشرات التشغيلية)',
    'governance':      'رمز المعيار · نسبة الاستيفاء % (مثل: 85) · الحالة',
    'knowledge':       'رمز الأصل · الحالة (active/archived/under_review)',
  };
  const el = document.getElementById('importHintText');
  if (el) el.textContent = hints[val] || hints['kpi_strategic'];

  // إخفاء/إظهار حقلي السنة والربع (غير مطلوبان للحوكمة والمعرفة)
  const needsPeriod = val === 'kpi_strategic' || val === 'kpi_operational';
  const yearEl = document.getElementById('importYear')?.closest('div');
  const qEl    = document.getElementById('importQuarter')?.closest('div');
  if (yearEl) yearEl.style.opacity = needsPeriod ? '1' : '.4';
  if (qEl)    qEl.style.opacity    = needsPeriod ? '1' : '.4';
}

async function importExcel() {
  const file    = document.getElementById('importFileSelect').value;
  const year    = document.getElementById('importYear').value;
  const quarter = document.getElementById('importQuarter').value;
  const selectedType = getImportDataType();
  const typeMeta = getImportTypeMeta(selectedType);

  if (!file) { showToast('⚠️ اختر ملفاً', 'gold'); return; }

  const btn = document.getElementById('importBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ جارٍ الاستيراد…'; }

  try {
    const r = await fetch('process_excel.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        action:    'import',
        filename:  file,
        year:      +year,
        quarter:   +quarter,
        data_type: selectedType,
      })
    });
    const rawText2 = await r.text();
    let d;
    try { d = JSON.parse(rawText2); }
    catch(e) {
      if (btn) { btn.disabled = false; btn.textContent = '✅ استيراد وحفظ في قاعدة البيانات'; }
      const htmlErr = rawText2.match(/Fatal error[^<]*/i) || rawText2.match(/Warning[^<]*/i);
      showToast('❌ خطأ في السيرفر: ' + (htmlErr ? htmlErr[0].trim() : 'تأكد من رفع الملفات الجديدة على السيرفر'), 'red');
      console.error('Server returned HTML instead of JSON:', rawText2.substring(0, 500));
      return;
    }

    if (btn) { btn.disabled = false; btn.textContent = '✅ استيراد وحفظ في قاعدة البيانات'; }
    if (d.error) { showToast('❌ ' + d.error, 'red'); return; }

    const importedCount = d.imported ?? d.saved ?? 0;
    const skippedCount  = d.skipped ?? 0;

    // تحديث إحصائيات آخر استيراد
    const lastEl = document.getElementById('lastImportStats');
    if (lastEl) lastEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:.35rem">
        <div style="color:var(--teal);font-weight:700">✅ تم استيراد ${importedCount} ${typeMeta.itemLabel}</div>
        <div style="color:var(--dim)">المسار: ${typeMeta.label}${selectedType.startsWith('kpi_') ? ' · السنة: ' + (d.year ?? year) + ' · الربع: ' + (d.quarter ?? quarter) : ''}</div>
        ${skippedCount > 0 ? '<div style="color:var(--gold)">⏭️ تم تجاهل ' + skippedCount + ' صف غير مطابق للمسار أو غير موجود</div>' : ''}
        ${d.email_sent ? '<div style="color:#60a5fa">📧 تم إرسال إيميل الإنذار</div>' : ''}
      </div>`;

    document.getElementById('previewTitle').textContent = `✅ نتائج الاستيراد • ${typeMeta.label}`;
    document.getElementById('importActions').style.display = 'none';
    showToast('✅ ' + (d.message || 'تم الاستيراد بنجاح'));

    // ── تحديث الأقسام بعد الاستيراد ──
    setTimeout(async () => {
      try {
        if (selectedType === 'governance' || selectedType === 'knowledge') {
          const statsEl = document.getElementById('previewStats');
          if (statsEl) statsEl.innerHTML = `
            <div style="background:rgba(139,26,58,.1);border:1px solid rgba(139,26,58,.3);border-radius:.75rem;padding:.9rem;text-align:center">
              <p style="font-size:1.8rem;font-weight:800;color:var(--teal)">${importedCount}</p>
              <p style="font-size:.7rem;color:var(--slate)">✅ ${typeMeta.itemLabel}</p>
            </div>
            <div style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);border-radius:.75rem;padding:.9rem;text-align:center">
              <p style="font-size:1.8rem;font-weight:800;color:var(--red)">${skippedCount}</p>
              <p style="font-size:.7rem;color:var(--slate)">⏭️ غير مطابق/غير موجود</p>
            </div>
            <div style="background:rgba(196,162,70,.08);border:1px solid rgba(196,162,70,.2);border-radius:.75rem;padding:.9rem;text-align:center">
              <p style="font-size:1rem;font-weight:800;color:var(--gold)">${typeMeta.label}</p>
              <p style="font-size:.7rem;color:var(--slate)">🎯 المسار المعتمد</p>
            </div>`;

          if (document.getElementById('tab-governance')?.classList.contains('active')) loadGovernance();
          if (document.getElementById('tab-knowledge')?.classList.contains('active')) loadKnowledge();
          showToast(`✅ تم تحديث ${typeMeta.shortLabel} بنجاح`);
          return;
        }

        const yr = +year; const q = +quarter;
        const stratData = await dashboardFetchJson(`api.php?endpoint=kpis&type=strategic&year=${yr}&quarter=${q}`);
        const strat = Array.isArray(stratData) ? stratData : [];
        const stratPct = dashboardAvgMetricPct(strat);

        const operData = await dashboardFetchJson(`api.php?endpoint=kpis&type=operational&year=${yr}&quarter=${q}`);
        const oper = Array.isArray(operData) ? operData : [];
        const operPct = dashboardAvgMetricPct(oper);

        const dash2Data = await dashboardFetchJson(`api.php?endpoint=dashboard&year=${yr}&quarter=${q}`);
        const dash2 = dash2Data && typeof dash2Data === 'object' ? dash2Data : {};
        const alertCnt = (dash2.alerts||[]).length;

        const pendingEl = document.getElementById('pendingCount');
        if (pendingEl) pendingEl.textContent = strat.filter(k=>k.q_actual===null).length + oper.filter(k=>k.q_actual===null).length;

        const statsEl = document.getElementById('previewStats');
        if (statsEl) statsEl.innerHTML = `
          <div style="background:rgba(139,26,58,.1);border:1px solid rgba(139,26,58,.3);border-radius:.75rem;padding:.9rem;text-align:center">
            <p style="font-size:1.8rem;font-weight:800;color:var(--teal)">${importedCount}</p>
            <p style="font-size:.7rem;color:var(--slate)">✅ ${typeMeta.itemLabel}</p>
          </div>
          <div style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);border-radius:.75rem;padding:.9rem;text-align:center">
            <p style="font-size:1.8rem;font-weight:800;color:var(--red)">${skippedCount}</p>
            <p style="font-size:.7rem;color:var(--slate)">⏭️ غير مطابق/غير موجود</p>
          </div>
          <div style="background:rgba(196,162,70,.08);border:1px solid rgba(196,162,70,.2);border-radius:.75rem;padding:.9rem;text-align:center">
            <p style="font-size:1.3rem;font-weight:800;color:var(--gold)">${stratPct}%</p>
            <p style="font-size:.7rem;color:var(--slate)">🎯 استراتيجي</p>
          </div>
          <div style="background:rgba(196,162,70,.08);border:1px solid rgba(196,162,70,.2);border-radius:.75rem;padding:.9rem;text-align:center">
            <p style="font-size:1.3rem;font-weight:800;color:var(--cyan)">${operPct}%</p>
            <p style="font-size:.7rem;color:var(--slate)">⚙️ تشغيلي</p>
          </div>`;

        if (document.getElementById('tab-strategic')?.classList.contains('active')) loadStrategicTab();
        if (document.getElementById('tab-operational')?.classList.contains('active')) loadOperationalTab();
        if (document.getElementById('tab-alerts')?.classList.contains('active')) loadAlertsTab();

        showToast(`✅ الاستراتيجي ${stratPct}% · التشغيلي ${operPct}% · إنذارات ${alertCnt}`);
      } catch(e2) {
        showToast('✅ تم الاستيراد', 'gold');
      }
    }, 1200);

  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = '✅ استيراد وحفظ في قاعدة البيانات'; }
    showToast('❌ خطأ: ' + e.message, 'red');
  }
}


// ── Excel Files List ──────────────────────────────
async function loadExcelFilesList() {
  const listEl  = document.getElementById('excelFilesList');
  const countEl = document.getElementById('excelFilesCount');
  const sel     = document.getElementById('importFileSelect');
  if (!listEl) return;

  try {
    const r = await fetch('api.php?endpoint=list_files');
    const d = await r.json();
    if (!d.success) return;

    const files = d.files || [];

    // حدّث العداد
    if (countEl) countEl.textContent = files.length;

    // حدّث الـ select
    if (sel) {
      const currentVal = sel.value;
      // احتفظ بالخيار الأول الفارغ
      while (sel.options.length > 1) sel.remove(1);
      files.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.name;
        opt.textContent = f.name;
        sel.appendChild(opt);
      });
      if (currentVal) sel.value = currentVal;
    }

    // حدّث القائمة المرئية
    if (!files.length) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--dim);font-size:.78rem;padding:.75rem">لا توجد ملفات مرفوعة</div>';
      return;
    }

    listEl.innerHTML = files.map(f => {
      const ext  = f.name.split('.').pop().toLowerCase();
      const icon = ext === 'csv' ? '📄' : '📊';
      const size = f.size > 1024*1024
        ? (f.size/1024/1024).toFixed(1) + ' MB'
        : Math.round(f.size/1024) + ' KB';
      return `
        <div data-filename="${f.name}" style="display:flex;align-items:center;gap:.6rem;background:var(--card2);border:1px solid var(--border);border-radius:.6rem;padding:.55rem .75rem;transition:border-color .2s"
             onmouseover="this.style.borderColor='var(--teal)'" onmouseout="this.style.borderColor='var(--border)'">
          <span style="font-size:1.2rem">${icon}</span>
          <div style="flex:1;min-width:0">
            <p style="font-size:.75rem;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</p>
            <p style="font-size:.65rem;color:var(--dim)">${size}</p>
          </div>
          <button onclick="document.getElementById('importFileSelect').value='${f.name}';showToast('✅ تم اختيار الملف','gold')"
                  style="background:var(--teal);color:#fff;border:none;border-radius:.4rem;padding:.25rem .55rem;font-size:.68rem;font-family:'Almarai',sans-serif;cursor:pointer">اختيار</button>
          <button onclick="deleteFile('${f.name}')"
                  style="background:rgba(239,68,68,.12);color:var(--red);border:1px solid rgba(239,68,68,.2);border-radius:.4rem;padding:.25rem .5rem;font-size:.75rem;cursor:pointer">🗑️</button>
        </div>`;
    }).join('');

  } catch(e) {
    console.error('loadExcelFilesList error:', e);
  }
}

// ── Download Template ─────────────────────────────
function downloadTemplate() {
  const type = document.getElementById('importDataType')?.value || 'kpi_strategic';
  const templates = {
    kpi_strategic:   [['رمز المؤشر','القيمة الفعلية','المستهدف الربعي','ملاحظات'],
                      ['ع1-1','15000','20000','تم التحقق'],['م1-1','85','100','']],
    kpi_operational: [['رمز المؤشر','القيمة الفعلية','المستهدف الربعي','ملاحظات'],
                      ['EXP-01-KPI-01','3','5',''],['FIN-01-KPI-01','92','90','']],
    governance:      [['رمز المعيار','نسبة الاستيفاء','الحالة'],
                      ['GOV-01','85','compliant'],['GOV-02','60','partial']],
    knowledge:       [['رمز الأصل','الحالة'],
                      ['KA-001','active'],['KA-002','under_review']],
  };
  const rows = templates[type] || templates.kpi_strategic;
  let csv = rows.map(r => r.join(',')).join('\n');
  // إضافة BOM للعربية
  const bom = '﻿';
  const blob = new Blob([bom + csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `نموذج_${type}.csv`;
  a.click();
  showToast('✅ تم تنزيل النموذج');
}

// ── File delete ──
// ── متغير لاسم الملف المراد حذفه ──
let _fileToDelete = '';

function closeDeleteFileModal() {
  const modal = document.getElementById('deleteFileModal');
  const checkbox = document.getElementById('deleteWithData');
  const meta = document.getElementById('deleteFileMeta');
  const ext = document.getElementById('deleteFileExt');
  if (modal) modal.style.display = 'none';
  if (checkbox) checkbox.checked = false;
  if (meta) meta.textContent = '';
  if (ext) ext.textContent = 'FILE';
  document.body.style.overflow = '';
  _fileToDelete = '';
}

function deleteFile(name) {
  _fileToDelete = name;
  const modal = document.getElementById('deleteFileModal');
  const nameEl = document.getElementById('deleteFileName');
  const meta = document.getElementById('deleteFileMeta');
  const checkbox = document.getElementById('deleteWithData');
  const extBadge = document.getElementById('deleteFileExt');
  const ext = (name.split('.').pop() || '').toUpperCase();
  if (checkbox) checkbox.checked = false;
  if (nameEl) nameEl.textContent = name;
  if (meta) meta.textContent = ext ? `نوع الملف: ${ext} • سيتم حذف الملف من قائمة الملفات المرفوعة` : 'ملف مرفوع • سيتم حذف الملف من قائمة الملفات المرفوعة';
  if (extBadge) extBadge.textContent = ext || 'FILE';
  document.body.style.overflow = 'hidden';
  if (modal) modal.style.display = 'flex';
}

async function confirmDeleteFile(deleteData) {
  const name = _fileToDelete;
  closeDeleteFileModal();
  if (!name) return;

  showToast('⏳ جارٍ الحذف…', 'gold');

  try {
    const r = await fetch('api.php?endpoint=delete_file', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({filename: name, delete_data: deleteData})
    });
    const d = await r.json();
    if (d.success) {
      // احذف من القائمة المرئية
      document.querySelectorAll('#excelFilesList > div[data-filename]').forEach(item => {
        if (item.dataset.filename === name) item.remove();
      });
      // احذف من الـ select
      const sel = document.getElementById('importFileSelect');
      if (sel) {
        Array.from(sel.options).forEach(opt => {
          if (opt.value === name) opt.remove();
        });
      }
      // تحديث العداد
      const remainingCount = document.querySelectorAll('#excelFilesList > div[data-filename]').length;
      const badge = document.getElementById('excelFilesCount');
      if (badge) badge.textContent = remainingCount;
      // إعادة ضبط الاختيار إذا كان الملف المحذوف هو المختار
      if (document.getElementById('importFileSelect')?.value === name) {
        document.getElementById('importFileSelect').value = '';
      }
      const remaining = document.querySelectorAll('#excelFilesList > div');
      if (remaining.length === 0) {
        document.getElementById('excelFilesList').innerHTML =
          '<div style="text-align:center;padding:2.5rem;color:var(--dim)"><div style="font-size:2rem;margin-bottom:.5rem"></div><p style="font-size:.82rem">لا توجد ملفات مرفوعة بعد</p></div>';
      }
      // تحقق أن السيرفر يشغّل النسخة الجديدة
      if (deleteData && !d.api_version) {
        showToast('⚠️ السيرفر يشغّل نسخة قديمة — ارفع api.php الجديد', 'red');
        return;
      }
      let msg;
      if (!deleteData) {
        msg = '🗑️ تم حذف الملف — البيانات اليدوية محفوظة';
      } else if ((d.deleted_values||0) === 0) {
        msg = '🗑️ تم حذف الملف — لا توجد بيانات مرتبطة به، البيانات اليدوية محفوظة';
      } else {
        msg = `🗑️ تم حذف الملف و ${d.deleted_values} قيمة مرتبطة به — البيانات اليدوية محفوظة`;
      }
      showToast(msg);
    } else {
      showToast('❌ فشل الحذف: ' + (d.error||'خطأ'), 'red');
    }
  } catch(e) {
    showToast('❌ خطأ في الاتصال', 'red');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('deleteFileModal');
    if (modal && modal.style.display === 'flex') {
      closeDeleteFileModal();
    }
  }
});

// ── Drag & drop ──
// ── رفع الملف بـ AJAX بدون reload ──
async function uploadFileAjax(file) {
  if (!file) return;

  const allowed = ['xlsx','xls','csv'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showToast('⚠️ يُسمح فقط بملفات xlsx, xls, csv', 'red');
    return;
  }

  // أظهر اسم الملف المختار
  document.getElementById('selectedFileName').textContent = '📄 ' + file.name;

  const formData = new FormData();
  formData.append('excel_file', file);

  showToast('⏳ جارٍ رفع الملف…', 'gold');

  // أضف حقل ajax_upload لتمييز الطلب
  formData.append('ajax_upload', '1');

  try {
    const r = await fetch(window.location.pathname, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: formData
    });

    const text = await r.text();
    let d;
    try { d = JSON.parse(text); } catch(e) { d = null; }

    if (d && d.success) {
      showToast('✅ تم رفع الملف: ' + d.filename);
    } else if (d && d.error) {
      showToast('❌ ' + d.error, 'red');
    } else {
      showToast('✅ تم رفع الملف: ' + file.name);
    }

    document.getElementById('selectedFileName').textContent = '';
    document.getElementById('fileInput').value = '';

    // حدّث قائمة الملفات بدون reload
    await loadExcelFilesList();

    const uploadedName = (d && d.filename) ? d.filename : file.name;
    const importSel = document.getElementById('importFileSelect');
    if (importSel) {
      importSel.value = uploadedName;
    }

  } catch(e) {
    showToast('❌ فشل رفع الملف', 'red');
  }
}

function handleDrop(e){
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if(!file) return;
  const allowed = ['xlsx','xls','csv'];
  const ext = file.name.split('.').pop().toLowerCase();
  if(!allowed.includes(ext)){
    showToast('⚠️ يُسمح فقط بملفات xlsx, xls, csv', 'red');
    return;
  }
  const dt = new DataTransfer();
  dt.items.add(file);
  document.getElementById('fileInput').files = dt.files;
  document.getElementById('selectedFileName').textContent = ' ' + file.name;
  uploadFileAjax(file);
}

// ── Profile ──
function switchAvatarType(type){
  document.getElementById('sectionInitials').style.display = type==='initials'?'block':'none';
  document.getElementById('sectionImage').style.display    = type==='image'   ?'block':'none';
}
function previewAvatar(input){
  if(!input.files||!input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('avatarPreview').src = e.target.result;
    document.getElementById('avatarFileName').textContent = ' ' + file.name;
    document.getElementById('avatarPreviewWrap').style.display = 'block';
    // تحديث المعاينة
    updatePreviewCard(null, e.target.result, null, null);
  };
  reader.readAsDataURL(file);
}
function updatePreviewCard(name, imgSrc, initials, title){
  if(name  !== null) document.getElementById('previewName').textContent  = name;
  if(title !== null) document.getElementById('previewTitle').textContent = title;
  const divEl = document.getElementById('previewAvatarDiv');
  const imgEl = document.getElementById('previewAvatarImg');
  const txtEl = document.getElementById('previewInitialsText');
  if(imgSrc && divEl){
    // أنشئ img إذا لم يكن موجوداً
    if(!imgEl){
      const img = document.createElement('img');
      img.id='previewAvatarImg';
      img.style.cssText='width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid var(--gold)';
      divEl.parentNode.insertBefore(img, divEl);
      divEl.style.display='none';
      img.src = imgSrc;
    } else { imgEl.src=imgSrc; divEl.style.display='none'; if(imgEl) imgEl.style.display='block'; }
  }
  if(initials && txtEl) txtEl.textContent = initials;
}
// تحديث المعاينة عند الكتابة
document.addEventListener('input', e=>{
  if(e.target.name==='prof_name')     updatePreviewCard(e.target.value,null,null,null);
  if(e.target.name==='prof_title')    updatePreviewCard(null,null,null,e.target.value);
  if(e.target.name==='prof_initials') updatePreviewCard(null,null,e.target.value,null);
});

// ── Reset/Delete DB ──
function confirmResetDb(){
  document.getElementById('resetDbModal').style.display='flex';
}
function doResetDb(){
  // امسح الحقول واغلق المودال
  document.getElementById('resetDbModal').style.display='none';
  document.querySelector('input[name="db_host"]').value='localhost';
  document.querySelector('input[name="db_name"]').value='';
  document.querySelector('input[name="db_user"]').value='';
  document.getElementById('dbPassInput').value='';
  document.querySelector('input[name="db_name"]').focus();
  showToast('✅ أدخل بيانات قاعدة البيانات الجديدة ثم احفظ','gold');
}
function confirmDeleteDb(){
  document.getElementById('deleteDbModal').style.display='flex';
}
async function doDeleteDb(){
  const inp = document.getElementById('deleteConfirmInput').value.trim();
  if(inp !== 'احذف'){
    showToast('✅ اكتب كلمة "احذف" للتأكيد','gold');
    return;
  }
  try{
    // امسح config.php من محتواه
    const r = await fetch('api.php?endpoint=reset_config', {method:'POST'});
    const d = await r.json();
    document.getElementById('deleteDbModal').style.display='none';
    document.getElementById('deleteConfirmInput').value='';
    if(d.success){
      showToast('✅ تم حذف الإعدادات');
      // امسح الحقول
      document.querySelector('input[name="db_host"]').value='localhost';
      document.querySelector('input[name="db_name"]').value='';
      document.querySelector('input[name="db_user"]').value='';
      document.getElementById('dbPassInput').value='';
      setTimeout(()=>location.reload(),1500);
    } else showToast('❌ '+(d.error||'فشل الحذف'),'red');
  }catch(e){
    // fallback: امسح الحقول محلياً
    document.getElementById('deleteDbModal').style.display='none';
    document.getElementById('deleteConfirmInput').value='';
    document.querySelector('input[name="db_host"]').value='localhost';
    document.querySelector('input[name="db_name"]').value='';
    document.querySelector('input[name="db_user"]').value='';
    document.getElementById('dbPassInput').value='';
    showToast('✅ تم مسح الحقول — أدخل الإعدادات الجديدة','gold');
  }
}

// ── Toggle password ──
function togglePassVis(){
  const inp=document.getElementById('dbPassInput');
  inp.type=inp.type==='password'?'text':'password';
}

async function doChangePassword(){
  const current=document.getElementById('curPass')?.value||'';
  const newpass=document.getElementById('newPass')?.value||'';
  const confirmPass=document.getElementById('confPass')?.value||'';
  const box=document.getElementById('passChangeMsg');

  const showMsg=(text,type='success')=>{
    if(!box) return;
    box.style.display='block';
    box.textContent=text;
    box.style.background=type==='success'?'rgba(5,150,105,.08)':'rgba(255,77,109,.08)';
    box.style.border='1px solid '+(type==='success'?'rgba(5,150,105,.25)':'rgba(255,77,109,.25)');
    box.style.color=type==='success'?'#059669':'#ff4d6d';
  };

  if(!current||!newpass||!confirmPass){
    showMsg('أدخل جميع الحقول أولاً','error');
    return;
  }
  if(newpass.length<6){
    showMsg('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل','error');
    return;
  }
  if(newpass!==confirmPass){
    showMsg('تأكيد كلمة المرور غير مطابق','error');
    return;
  }
  if(current===newpass){
    showMsg('اختر كلمة مرور جديدة مختلفة عن الحالية','error');
    return;
  }

  try{
    const r=await fetch(`${API}?endpoint=change_password`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({current,newpass})
    });
    const d=await r.json();
    if(d.success){
      showMsg('تم تغيير كلمة المرور بنجاح');
      document.getElementById('curPass').value='';
      document.getElementById('newPass').value='';
      document.getElementById('confPass').value='';
      showToast('✅ تم تحديث كلمة المرور');
    } else {
      showMsg(d.error||'فشل تغيير كلمة المرور','error');
    }
  }catch(e){
    showMsg('تعذر الاتصال أثناء تغيير كلمة المرور','error');
  }
}

// ── Helpers ──
function fmtN(n){if(n===null||n===undefined)return'—';const v=+n;if(isNaN(v))return n;if(v>=1000000)return(v/1000000).toFixed(1)+'م';if(v>=1000)return(v/1000).toFixed(1)+'ك';if(v>0&&v<1)return(v*100).toFixed(1)+'%';return v.toLocaleString('ar-SA',{maximumFractionDigits:1});}
// ══ Email Settings ════════════════════════════════════

// email loader handled in switchTab

function dashboardMetricPct(actual, target, max = 100){
  const a = Number(actual);
  const t = Number(target);
  if (!Number.isFinite(a) || !Number.isFinite(t) || t <= 0) return null;
  return Math.max(0, Math.min(max, (a / t) * 100));
}

function dashboardAvgMetricPct(rows){
  const valid = (Array.isArray(rows) ? rows : []).filter(k => dashboardMetricPct(k.q_actual, k.q_target) !== null);
  if (!valid.length) return 0;
  return Math.round(valid.reduce((sum, k) => sum + dashboardMetricPct(k.q_actual, k.q_target), 0) / valid.length);
}

function dashboardFetchJson(url){
  const sep = url.includes('?') ? '&' : '?';
  return fetch(`${url}${sep}cacheBust=${Date.now()}`, {cache:'no-store'}).then(r => r.json());
}

function dashboardSafeText(value){
  return value === null || value === undefined ? '' : String(value);
}


// ══ Alert Settings ════════════════════════════════════
async function loadAlertSettings() {
  try {
    const r = await fetch(`api.php?endpoint=email_settings&cacheBust=${Date.now()}`, {cache:'no-store'});
    const d = await r.json();
    const s = d.settings || {};

    // حد الإنذار
    const th2 = document.getElementById('alertThreshold2');
    if (th2) th2.value = s.alert_threshold || 15;

    // checkboxes
    const ae = document.getElementById('alertEnabled');
    const aEntry = document.getElementById('alertOnEntry');
    const aExcel = document.getElementById('alertOnExcel');
    if (ae) ae.checked = s.alert_enabled !== false;
    if (aEntry) aEntry.checked = s.alert_on_entry !== false;
    if (aExcel) aExcel.checked = s.alert_on_excel !== false;

    const unifiedEmail = (s.recipients && s.recipients[0])
      || (s.weekly_recipients && s.weekly_recipients[0])
      || (s.alert_recipients && s.alert_recipients[0])
      || '';
    const alertHint = document.getElementById('alertRecipientHint');
    const weeklyHint = document.getElementById('weeklyRecipientHint');
    if (alertHint) {
      alertHint.textContent = unifiedEmail || 'سيُرسَل إلى بريد الاستقبال الموحد';
    }
    if (weeklyHint) {
      weeklyHint.textContent = unifiedEmail || 'سيُرسَل إلى بريد الاستقبال الموحد';
    }

    // حالة النظام
    const statusEl = document.getElementById('alertSystemStatus');
    if (statusEl) {
      const active = s.alert_enabled !== false && s.smtp_from && s.smtp_pass;
      statusEl.textContent  = active ? '✅ نشط' : '⏸️ غير نشط';
      statusEl.style.background = active ? 'rgba(5,150,105,.12)' : 'rgba(255,77,109,.1)';
      statusEl.style.color      = active ? 'var(--teal)' : 'var(--red)';
      statusEl.style.borderColor = active ? 'rgba(5,150,105,.3)' : 'rgba(255,77,109,.25)';
    }

    // إحصائيات الإنذار
    const statsEl = document.getElementById('alertStats');
    if (statsEl && d.log) {
      const alertLogs = d.log.filter(l => l.type && l.type.includes('إنذار'));
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = alertLogs.filter(l => l.sent_at && l.sent_at.startsWith(today));
      statsEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid var(--border)">
          <span style="font-size:.75rem;color:var(--dim)">إجمالي الإنذارات</span>
          <span style="font-size:.78rem;font-weight:700;color:var(--red)">${alertLogs.length}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid var(--border)">
          <span style="font-size:.75rem;color:var(--dim)">اليوم</span>
          <span style="font-size:.78rem;font-weight:700;color:var(--gold)">${todayLogs.length}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.3rem 0">
          <span style="font-size:.75rem;color:var(--dim)">الحد المُضبَط</span>
          <span style="font-size:.78rem;font-weight:700;color:var(--red)">&gt; ${s.alert_threshold || 15}%</span>
        </div>`;
    }
  } catch(e) { console.warn(e); }
}

function buildEmailSettingsPayload() {
  const pass = document.getElementById('smtpPass')?.value || '';
  const smtpFrom = document.getElementById('smtpFrom')?.value.trim() || '';
  const selectedProvider = document.getElementById('smtpProvider')?.value || 'gmail';
  const primaryRecipient = document.getElementById('primaryRecipient')?.value.trim() || '';
  const recipients = primaryRecipient ? [primaryRecipient] : [];

  let normalizedProvider = selectedProvider;
  const lowerEmail = smtpFrom.toLowerCase();
  if (lowerEmail.endsWith('@gmail.com') || lowerEmail.endsWith('@googlemail.com')) {
    normalizedProvider = 'gmail';
  } else if (
    lowerEmail.endsWith('@outlook.com') ||
    lowerEmail.endsWith('@hotmail.com') ||
    lowerEmail.endsWith('@live.com') ||
    lowerEmail.endsWith('@msn.com')
  ) {
    normalizedProvider = 'microsoft';
  }

  if (normalizedProvider !== selectedProvider) {
    selectProvider(normalizedProvider, false);
  }

  const data = {
    smtp_provider:      normalizedProvider,
    smtp_from:          smtpFrom,
    smtp_name:          document.getElementById('smtpName')?.value.trim() || 'منصة مِقياس | جمعية الزاد',
    recipients,
    weekly_recipients:  recipients,
    alert_threshold:    parseInt(document.getElementById('alertThreshold')?.value || document.getElementById('alertThreshold2')?.value) || 15,
    weekly_day:         parseInt(document.getElementById('weeklyDay')?.value) || 0,
    alert_enabled:      document.getElementById('alertEnabled')?.checked ?? true,
    alert_on_entry:     document.getElementById('alertOnEntry')?.checked ?? true,
    alert_on_excel:     document.getElementById('alertOnExcel')?.checked ?? true,
    alert_recipients:   recipients,
  };

  if (pass && !pass.includes('•')) data.smtp_pass = pass;
  return data;
}

async function persistEmailSettingsSilently() {
  const data = buildEmailSettingsPayload();
  const r = await fetch('api.php?endpoint=email_settings', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  return r.json();
}

async function saveAlertSettings() {
  try {
    const d = await persistEmailSettingsSilently();
    if (d.success) {
      showToast('✅ تم حفظ إعدادات الإنذار');
      // تحديث حد الإنذار الرئيسي أيضاً
      const mainTh = document.getElementById('alertThreshold');
      const sideTh = document.getElementById('alertThreshold2');
      if (mainTh && sideTh) mainTh.value = sideTh.value;
      await loadAlertSettings();
      await loadEmailSettings();
    } else {
      showToast('❌ '+(d.error||'خطأ في الحفظ'), 'red');
    }
  } catch(e) { showToast('❌ خطأ في الاتصال', 'red'); }
}

async function testAlertEmail() {
  showToast('⏳ جارٍ إرسال بريد اختبار إنذار…', 'gold');
  try {
    const saveResult = await persistEmailSettingsSilently();
    if (!saveResult.success) {
      showToast('❌ ' + (saveResult.error || 'تعذر حفظ الإعدادات الحالية'), 'red');
      return;
    }
    const r = await fetch('api.php?endpoint=send_email', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({type:'alert_test'})
    });
    const d = await r.json();
    if (d.success) {
      showToast('✅ تم إرسال بريد اختبار الإنذار!');
    } else {
      showToast('❌ '+(d.error||'فشل الإرسال'), 'red');
    }
  } catch(e) { showToast('❌ خطأ', 'red'); }
}


function selectProvider(prov, save=true) {
  const isMs = prov === 'microsoft';
  document.getElementById('smtpProvider').value = prov;

  // تحديث الأزرار
  const lblG = document.getElementById('lblGmail');
  const lblM = document.getElementById('lblMicrosoft');
  if (lblG) {
    lblG.style.borderColor = !isMs ? 'rgba(139,26,58,.6)' : 'var(--border)';
    lblG.style.boxShadow   = !isMs ? '0 0 12px rgba(139,26,58,.2)' : 'none';
  }
  if (lblM) {
    lblM.style.borderColor = isMs ? 'rgba(96,165,250,.6)' : 'var(--border)';
    lblM.style.boxShadow   = isMs ? '0 0 12px rgba(96,165,250,.2)' : 'none';
  }

  // تعليمات + placeholder
  const hG = document.getElementById('hintGmail');
  const hM = document.getElementById('hintMicrosoft');
  const lbl = document.getElementById('lblSmtpFrom');
  const inp = document.getElementById('smtpFrom');
  if (hG) hG.style.display = !isMs ? 'block' : 'none';
  if (hM) hM.style.display = isMs ? 'block' : 'none';
  if (lbl) lbl.textContent = isMs ? '📮 بريد المُرسِل (Outlook / Office365)' : '📮 بريد المُرسِل (Gmail)';
  if (inp) inp.placeholder = isMs ? 'miqyas@alzad.org.sa' : 'miqyas@gmail.com';
}
async function loadEmailSettings() {
  try {
    const r = await fetch(`api.php?endpoint=email_settings&cacheBust=${Date.now()}`, {cache:'no-store'});
    const d = await r.json();
    if (!d.settings) return;
    const s = d.settings;

    // إعدادات SMTP
    document.getElementById('smtpFrom').value       = s.smtp_from || '';
    document.getElementById('smtpPass').value       = s.smtp_pass ? '••••••••••••' : '';
    document.getElementById('smtpName').value       = s.smtp_name || 'منصة مِقياس | جمعية الزاد';
    document.getElementById('alertThreshold').value = s.alert_threshold || 15;
    document.getElementById('weeklyDay').value      = s.weekly_day ?? 0;

    // مزود البريد
    const prov = s.smtp_provider || 'gmail';
    document.getElementById('smtpProvider').value = prov;
    selectProvider(prov, false);

    const unifiedEmail = (s.recipients && s.recipients[0])
      || (s.weekly_recipients && s.weekly_recipients[0])
      || (s.alert_recipients && s.alert_recipients[0])
      || '';
    const primaryRecipient = document.getElementById('primaryRecipient');
    if (primaryRecipient) primaryRecipient.value = unifiedEmail;
    const weeklyHint = document.getElementById('weeklyRecipientHint');
    const alertHint = document.getElementById('alertRecipientHint');
    if (weeklyHint) weeklyHint.textContent = unifiedEmail || 'سيُرسَل إلى بريد الاستقبال الموحد';
    if (alertHint) alertHint.textContent = unifiedEmail || 'سيُرسَل إلى بريد الاستقبال الموحد';

    // حالة الإعدادات
    const days = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const provLabel = prov === 'microsoft' ? '🪟 Microsoft' : '📧 Gmail';
    const statusGrid = document.getElementById('emailStatusGrid');
    if (statusGrid) {
      statusGrid.innerHTML = `
        <div style="background:var(--card2);border-radius:.75rem;padding:.9rem;text-align:center">
          <p style="font-size:.7rem;color:var(--dim);margin-bottom:.4rem">🏢 مزود البريد</p>
          <span style="color:var(--teal);font-weight:700">${provLabel}</span>
        </div>
        <div style="background:var(--card2);border-radius:.75rem;padding:.9rem;text-align:center">
          <p style="font-size:.7rem;color:var(--dim);margin-bottom:.4rem">📮 بريد المُرسِل</p>
          <span style="color:var(--teal);font-weight:700;font-size:.72rem">${s.smtp_from || '—'}</span>
        </div>
        <div style="background:var(--card2);border-radius:.75rem;padding:.9rem;text-align:center">
          <p style="font-size:.7rem;color:var(--dim);margin-bottom:.4rem">🔐 كلمة المرور</p>
          <span style="color:${s.smtp_pass ? 'var(--teal)' : 'var(--red)'};font-weight:700">${s.smtp_pass ? '✅ مُعيَّن' : '❌ غير مُعيَّن'}</span>
        </div>
        <div style="background:var(--card2);border-radius:.75rem;padding:.9rem;text-align:center">
          <p style="font-size:.7rem;color:var(--dim);margin-bottom:.4rem">📮 بريد الاستقبال</p>
          <span style="color:var(--gold);font-weight:700;font-size:.72rem">${unifiedEmail || '—'}</span>
        </div>
        <div style="background:var(--card2);border-radius:.75rem;padding:.9rem;text-align:center">
          <p style="font-size:.7rem;color:var(--dim);margin-bottom:.4rem">⚠️ حد الإنذار</p>
          <span style="color:var(--red);font-weight:700">> ${s.alert_threshold || 15}%</span>
        </div>
        <div style="background:var(--card2);border-radius:.75rem;padding:.9rem;text-align:center">
          <p style="font-size:.7rem;color:var(--dim);margin-bottom:.4rem">📅 يوم أسبوعي</p>
          <span style="color:var(--gold);font-weight:700">${days[s.weekly_day || 0]}</span>
        </div>`;
    }

    // سجل الإرسال
    const logEl = document.getElementById('emailLog');
    if (logEl) {
      logEl.innerHTML = d.log && d.log.length > 0
        ? d.log.map(l => `
          <div style="background:var(--card2);border:1px solid var(--border);border-radius:.6rem;padding:.6rem .85rem;display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
            <div>
              <span style="font-size:.75rem;font-weight:700;color:${l.status==='success'?'var(--teal)':'var(--red)'}">${l.status==='success'?'✅':'❌'} ${l.type}</span>
              <p style="font-size:.68rem;color:var(--slate);margin-top:.15rem">${l.message || ''}</p>
            </div>
            <span style="font-size:.68rem;color:var(--dim);flex-shrink:0;margin-right:.5rem">${l.sent_at}</span>
          </div>`).join('')
        : '<p style="font-size:.78rem;color:var(--dim);text-align:center;padding:1rem">لا توجد سجلات إرسال بعد</p>';
    }
  } catch(e) { console.warn('Email settings error:', e); }
}

async function saveEmailSettings() {
  const data = buildEmailSettingsPayload();
  const rcpts = data.recipients || [];

  if (!data.smtp_from) {
    showToast('⚠️ أدخل بريد المُرسِل', 'gold'); return;
  }
  if (rcpts.length === 0) {
    showToast('⚠️ أضف مستلماً واحداً على الأقل', 'gold'); return;
  }

  try {
    const d = await persistEmailSettingsSilently();
    if (d.success) {
      showToast('✅ تم حفظ إعدادات البريد بنجاح');
      loadEmailSettings();
      loadAlertSettings();
    } else showToast('❌ ' + (d.error || 'خطأ'), 'red');
  } catch(e) { showToast('❌ خطأ في الاتصال', 'red'); }
}

async function testEmail() {
  showToast('⏳ جارٍ إرسال بريد تجريبي…', 'gold');
  try {
    const saveResult = await persistEmailSettingsSilently();
    if (!saveResult.success) {
      showToast('❌ ' + (saveResult.error || 'تعذر حفظ الإعدادات الحالية'), 'red');
      return;
    }
    const r = await fetch('api.php?endpoint=send_email', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'test'})
    });
    const d = await r.json();
    if (d.success) {
      showToast('✅ تم إرسال البريد التجريبي بنجاح!');
      loadEmailSettings();
    } else showToast('❌ ' + (d.error || 'تحقق من الإعدادات'), 'red');
  } catch(e) { showToast('❌ خطأ', 'red'); }
}

async function sendWeeklyReport() {
  showToast('⏳ جارٍ إنشاء التقرير وإرساله…', 'gold');
  try {
    const saveResult = await persistEmailSettingsSilently();
    if (!saveResult.success) {
      showToast('❌ ' + (saveResult.error || 'تعذر حفظ الإعدادات الحالية'), 'red');
      return;
    }
    const r = await fetch('api.php?endpoint=send_email', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({type:'weekly'})
    });
    const d = await r.json();
    if (d.success) {
      showToast('✅ تم إرسال التقرير الأسبوعي بنجاح!');
      loadEmailSettings();
    } else showToast('❌ ' + (d.error || 'تحقق من إعدادات البريد'), 'red');
  } catch(e) { showToast('❌ خطأ', 'red'); }
}

// ══ Deviation Cards ══════════════════════════════════

async function loadDeviationCards() {
  const status = document.getElementById('devFilterStatus')?.value || '';
  const year   = parseInt(document.getElementById('devFilterYear')?.value)   || 2026;
  const q      = parseInt(document.getElementById('devFilterQ')?.value)      || 1;
  const cont   = document.getElementById('deviationCardsContainer');
  if (cont) cont.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--dim)">⏳ جارٍ التحميل…</div>';

  try {
    const r = await fetch(`api.php?endpoint=deviation_cards&year=${year}&quarter=${q}${status?'&status='+status:''}`);
    const d = await r.json();
    const cards = Array.isArray(d) ? d : [];

    if (!cards.length) {
      cont.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--dim)"><div style="font-size:2rem;margin-bottom:.5rem">📋</div><p style="font-size:.82rem">لا توجد بطاقات انحراف في هذا الربع</p></div>';
      return;
    }

    const statusColors = {open:'var(--red)',in_progress:'var(--gold)',under_execution:'#60a5fa',pending_verify:'#fbbf24',closed:'var(--teal)'};
    const statusLabels = {open:'🔴 مفتوحة',in_progress:'🟠 قيد المعالجة',under_execution:'🔵 تحت التنفيذ',pending_verify:'🟡 انتظار التحقق',closed:'✅ مغلقة'};

    cont.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem">' +
      cards.map(c => {
        const sc = statusColors[c.status] || 'var(--border)';
        const sl = statusLabels[c.status] || c.status;
        const dev = parseFloat(c.deviation_pct || 0);
        const devColor = dev < -30 ? 'var(--red)' : 'var(--gold)';
        const safeCard = JSON.stringify(c).replace(/"/g,'&quot;');
        return `
        <div style="background:var(--card);border:1px solid var(--border);border-top:3px solid ${sc};border-radius:1rem;padding:1.1rem;transition:all .2s" onmouseover="this.style.borderColor='${sc}'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem">
            <div>
              <span style="font-size:.72rem;font-weight:800;color:var(--teal);background:rgba(139,26,58,.1);padding:.18rem .5rem;border-radius:.3rem">${c.kpi_code||'—'}</span>
              <p style="font-size:.82rem;font-weight:700;color:var(--text);margin-top:.35rem;line-height:1.35">${(c.kpi_name||'').substring(0,50)}${(c.kpi_name||'').length>50?'…':''}</p>
            </div>
            <span style="font-size:.68rem;font-weight:700;color:${sc};white-space:nowrap;background:${sc}18;border:1px solid ${sc}35;padding:.2rem .5rem;border-radius:99px">${sl}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.45rem;margin-bottom:.7rem">
            <div style="background:var(--card2);border-radius:.5rem;padding:.5rem;text-align:center">
              <p style="font-size:.62rem;color:var(--slate);margin-bottom:.15rem">المستهدف</p>
              <p style="font-size:.85rem;font-weight:800">${fmtN(c.target)}</p>
            </div>
            <div style="background:var(--card2);border-radius:.5rem;padding:.5rem;text-align:center">
              <p style="font-size:.62rem;color:var(--slate);margin-bottom:.15rem">الفعلي</p>
              <p style="font-size:.85rem;font-weight:800;color:${devColor}">${fmtN(c.actual)}</p>
            </div>
            <div style="background:rgba(255,77,109,.07);border:1px solid rgba(255,77,109,.15);border-radius:.5rem;padding:.5rem;text-align:center">
              <p style="font-size:.62rem;color:var(--slate);margin-bottom:.15rem">الانحراف</p>
              <p style="font-size:.85rem;font-weight:800;color:${devColor}">${dev.toFixed(1)}%</p>
            </div>
          </div>
          ${c.reason ? `<p style="font-size:.72rem;color:var(--slate);margin-bottom:.3rem">📌 السبب: ${c.reason.substring(0,70)}${c.reason.length>70?'…':''}</p>` : ''}
          ${c.responsible ? `<p style="font-size:.72rem;color:var(--dim);margin-bottom:.3rem">👤 المسؤول: ${c.responsible}</p>` : ''}
          ${c.due_date ? `<p style="font-size:.72rem;color:var(--dim)">📅 الإغلاق: ${c.due_date}</p>` : ''}
          ${c.risk_level ? `<p style="font-size:.7rem;margin-top:.35rem"><span style="background:rgba(255,77,109,.1);color:var(--red);border-radius:99px;padding:.15rem .55rem;font-weight:700">⚠ ${c.risk_level}</span></p>` : ''}
          <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:.75rem;font-size:.75rem"
                  onclick="openDevCard(${safeCard})">✏️ تعديل البطاقة</button>
        </div>`;
      }).join('') + '</div>';
  } catch(e) {
    console.warn('loadDeviationCards error:', e);
    if (cont) cont.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--red)">❌ خطأ في التحميل</div>';
  }
}

function openDevCard(card) {
  const modal = document.getElementById('devCardModal');
  modal.style.display = 'flex';
  document.getElementById('devCardId').value       = card.id || '';
  document.getElementById('devReason').value       = card.reason || '';
  document.getElementById('devAction').value       = card.action || '';
  document.getElementById('devImpact').value       = card.impact || '';
  document.getElementById('devResponsible').value  = card.responsible || '';
  document.getElementById('devDueDate').value      = card.due_date || '';
  document.getElementById('devStatus').value       = card.status || 'open';
  document.getElementById('devImprovVal').value    = card.improvement_value || '';
  document.getElementById('devImprovPct').value    = card.improvement_pct || '';
  document.getElementById('devRemeasure').value    = card.remeasure_date || '';
  document.getElementById('devRiskLevel').value    = card.risk_level || 'مرتفع';
  // بيانات المؤشر
  document.getElementById('dcKpiName').textContent = card.kpi_name || '—';
  document.getElementById('dcKpiCode').textContent = card.kpi_code || '—';
  document.getElementById('dcDept').textContent    = card.owner_dept || '—';
  document.getElementById('dcTarget').textContent  = card.target ? (+card.target).toLocaleString('ar-SA',{maximumFractionDigits:1}) : '—';
  document.getElementById('dcActual').textContent  = card.actual!=null ? (+card.actual).toLocaleString('ar-SA',{maximumFractionDigits:1}) : '—';
  const devVal = card.actual!=null && card.target ? ((+card.actual)-(+card.target)) : null;
  document.getElementById('dcDevVal').textContent  = devVal!=null ? devVal.toLocaleString('ar-SA',{maximumFractionDigits:1}) : '—';
  document.getElementById('dcDevPct').textContent  = card.deviation_pct ? (+card.deviation_pct).toFixed(1)+'%' : '—';
}

async function saveDevCardDash() {
  const id = document.getElementById('devCardId').value;
  if (!id) { showToast('❌ معرّف البطاقة مفقود', 'red'); return; }

  const data = {
    reason:            document.getElementById('devReason').value.trim()      || null,
    impact:            document.getElementById('devImpact').value.trim()      || null,
    action:            document.getElementById('devAction').value.trim()      || null,
    responsible:       document.getElementById('devResponsible').value.trim() || null,
    due_date:          document.getElementById('devDueDate').value             || null,
    status:            document.getElementById('devStatus').value              || 'open',
    risk_level:        document.getElementById('devRiskLevel').value           || null,
    improvement_value: document.getElementById('devImprovVal').value           || null,
    improvement_pct:   document.getElementById('devImprovPct').value           || null,
    remeasure_date:    document.getElementById('devRemeasure').value           || null,
  };

  try {
    const r = await fetch(`${API}?endpoint=deviation_cards&id=${id}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const text = await r.text();
    let d;
    try { d = JSON.parse(text); } catch(pe){ throw new Error('استجابة خاطئة: ' + text.substring(0,80)); }

    if(d.success){
      showToast('✅ تم حفظ البطاقة');
      document.getElementById('devCardModal').style.display='none';
      loadDeviationCards();
    } else {
      showToast('❌ '+(d.error||'خطأ في الحفظ'),'red');
    }
  } catch(e){ showToast('❌ '+e.message,'red'); }
}


// saveDevCard — handled by saveDevCardDash()

// تحميل تلقائي عند فتح التبويب
// deviation loader handled in switchTab

// ══ Governance ════════════════════════════════════════

async function loadGovernance() {
  try {
    const r = await fetch('api.php?endpoint=governance');
    const d = await r.json();
    const items   = d.items   || [];
    const summary = d.summary || {};

    // Summary cards
    document.getElementById('govSummary').innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1rem;text-align:center">
        <p style="font-size:1.8rem;font-weight:800;color:var(--text)">${summary.total||0}</p>
        <p style="font-size:.75rem;color:var(--slate)">إجمالي المعايير</p>
      </div>
      <div style="background:rgba(139,26,58,.07);border:1px solid rgba(139,26,58,.2);border-radius:1rem;padding:1rem;text-align:center">
        <p style="font-size:1.8rem;font-weight:800;color:var(--teal)">${summary.compliant||0}</p>
        <p style="font-size:.75rem;color:var(--slate)">ملتزم تماماً</p>
      </div>
      <div style="background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2);border-radius:1rem;padding:1rem;text-align:center">
        <p style="font-size:1.8rem;font-weight:800;color:var(--gold)">${summary.avg_pct||0}%</p>
        <p style="font-size:.75rem;color:var(--slate)">متوسط الالتزام</p>
      </div>`;

    const stC = {compliant:'var(--teal)',partial:'var(--gold)',non_compliant:'var(--red)',pending:'var(--dim)'};
    const stL = {compliant:' ملتزم',partial:' جزئي',non_compliant:' غير ملتزم',pending:'⏳ انتظار'};
    const catL = {policies:'سياسة',procedures:'إجراء',committees:'لجنة',reports:'تقرير',compliance:'امتثال'};

    document.getElementById('govContainer').innerHTML = items.length === 0
      ? '<div style="text-align:center;padding:3rem;color:var(--dim)">لا توجد معايير</div>'
      : `<div style="overflow-x:auto"><table style="width:100%;border-collapse:separate;border-spacing:0 .3rem;font-size:.82rem">
          <thead><tr>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:right;color:var(--slate);font-weight:700;border-radius:0 .5rem .5rem 0">الرمز</th>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:right;color:var(--slate);font-weight:700">المعيار</th>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:right;color:var(--slate);font-weight:700">التصنيف</th>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:right;color:var(--slate);font-weight:700">الجهة</th>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:center;color:var(--slate);font-weight:700">الالتزام</th>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:center;color:var(--slate);font-weight:700">الحالة</th>
            <th style="background:var(--card2);padding:.65rem .9rem;text-align:center;color:var(--slate);font-weight:700;border-radius:.5rem 0 0 .5rem">إجراء</th>
          </tr></thead>
          <tbody>` + items.map(g => `
          <tr>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);border-right:1px solid var(--border);border-radius:0 .5rem .5rem 0;font-weight:800;color:var(--teal)">${g.code}</td>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">${g.name.substring(0,50)}</td>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);color:var(--slate)">${catL[g.category]||g.category}</td>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);font-size:.75rem">${g.owner||'—'}</td>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);text-align:center">
              <div style="display:flex;align-items:center;gap:.4rem;justify-content:center">
                <div style="width:50px;height:5px;background:var(--border);border-radius:99px;overflow:hidden">
                  <div style="height:100%;width:${g.compliance_pct}%;background:${stC[g.status]||'var(--dim)'};border-radius:99px"></div>
                </div>
                <span style="font-weight:700;color:${stC[g.status]||'var(--dim)'}">${g.compliance_pct}%</span>
              </div>
            </td>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);text-align:center;font-size:.72rem;font-weight:700;color:${stC[g.status]||'var(--dim)'}">${stL[g.status]||g.status}</td>
            <td style="background:var(--card);padding:.65rem .9rem;border-top:1px solid var(--border);border-bottom:1px solid var(--border);border-left:1px solid var(--border);border-radius:.5rem 0 0 .5rem;text-align:center">
              <button class="btn btn-ghost" style="padding:.25rem .6rem;font-size:.7rem" onclick="openGovModal(${JSON.stringify(g).replace(/"/g,'&quot;')})">✏️ تعديل</button>
              <button class="btn btn-red"   style="padding:.25rem .6rem;font-size:.7rem" onclick="deleteGovItem(${g.id})">🗑️</button>
            </td>
          </tr>`).join('') + `</tbody></table></div>`;
  } catch(e) { console.warn(e); }
}

function openGovModal(item) {
  loadDepartmentOptions();
  document.getElementById('govModal').style.display = 'flex';
  document.getElementById('govItemId').value   = item?.id   || '';
  document.getElementById('govCode').value     = item?.code || '';
  document.getElementById('govName').value     = item?.name || '';
  document.getElementById('govOwner').value    = item?.owner|| '';
  document.getElementById('govCategory').value = item?.category || 'compliance';
  document.getElementById('govStatus').value   = item?.status   || 'pending';
  document.getElementById('govPct').value      = item?.compliance_pct || 0;
  document.getElementById('govModalTitle').textContent = item ? '✏️ تعديل معيار' : '＋ إضافة معيار جديد';
}

async function saveGovItem() {
  const id = document.getElementById('govItemId').value;
  const data = {
    code: document.getElementById('govCode').value.trim(),
    name: document.getElementById('govName').value.trim(),
    owner: document.getElementById('govOwner').value.trim(),
    category: document.getElementById('govCategory').value,
    status: document.getElementById('govStatus').value,
    compliance_pct: parseFloat(document.getElementById('govPct').value)||0,
  };
  if (!data.code||!data.name){showToast('⚠️ الرمز والاسم مطلوبان','gold');return;}
  try {
    const url = id ? `api.php?endpoint=governance&id=${id}` : 'api.php?endpoint=governance';
    const r = await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const d = await r.json();
    if(d.success){showToast(id?'✅ تم التحديث':'✅ تمت الإضافة');document.getElementById('govModal').style.display='none';loadGovernance();}
    else showToast('❌ '+(d.error||'خطأ'),'red');
  } catch(e){showToast('❌ خطأ','red');}
}

async function deleteGovItem(id) {
  if(!confirm('حذف هذا المعيار؟')) return;
  const r = await fetch(`api.php?endpoint=governance&id=${id}`,{method:'DELETE'});
  const d = await r.json();
  if(d.success){showToast('🗑️ تم الحذف');loadGovernance();}
  else showToast('❌ '+(d.error||'خطأ'),'red');
}

// governance loader handled in switchTab

// ══ Knowledge ═════════════════════════════════════════

async function loadKnowledge() {
  const type   = document.getElementById('knowFilterType')?.value   || '';
  const status = document.getElementById('knowFilterStatus')?.value || '';
  try {
    const r = await fetch(`api.php?endpoint=knowledge${type?'&type='+type:''}${status?'&status='+status:''}`);
    const items = await r.json();
    const typeL = {policy:' سياسة',procedure:' إجراء',lesson:' درس',best_practice:'⭐ أفضل ممارسة',report:' تقرير',template:' نموذج',other:' أخرى'};
    const stC   = {draft:'var(--dim)',active:'var(--teal)',under_review:'var(--gold)',archived:'var(--slate)'};
    const stL   = {draft:'مسودة',active:' نشط',under_review:' مراجعة',archived:' مؤرشف'};

    document.getElementById('knowledgeContainer').innerHTML = !items.length
      ? '<div style="text-align:center;padding:3rem;color:var(--dim)">لا توجد أصول معرفية</div>'
      : `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem">` +
        items.map(k => `
          <div style="background:var(--card);border:1px solid var(--border);border-radius:1rem;padding:1rem;transition:border-color .2s"
               onmouseenter="this.style.borderColor='var(--bhi)'" onmouseleave="this.style.borderColor='var(--border)'">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.6rem">
              <span style="font-size:.7rem;color:var(--slate)">${typeL[k.type]||k.type}</span>
              <span style="font-size:.7rem;font-weight:700;color:${stC[k.status]}">${stL[k.status]||k.status}</span>
            </div>
            <p style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:.35rem">${k.title.substring(0,50)}${k.title.length>50?'…':''}</p>
            <p style="font-size:.72rem;color:var(--dim);margin-bottom:.6rem">${k.owner||'—'}</p>
            ${k.used_in_decision ? '<span style="font-size:.68rem;background:rgba(139,26,58,.1);color:var(--teal);border:1px solid rgba(139,26,58,.2);padding:.15rem .5rem;border-radius:99px"> استُخدم في قرار</span>' : ''}
            ${k.kpi_code ? `<span style="font-size:.68rem;background:rgba(196,162,70,.1);color:var(--cyan);border:1px solid rgba(196,162,70,.2);padding:.15rem .5rem;border-radius:99px;margin-right:.3rem"> ${k.kpi_code}</span>` : ''}
            <div style="display:flex;gap:.4rem;margin-top:.75rem">
              <button class="btn btn-ghost" style="flex:1;justify-content:center;font-size:.72rem" onclick="openKnowModal(${JSON.stringify(k).replace(/"/g,'&quot;')})">✏️ تعديل</button>
              <button class="btn btn-red"   style="padding:.3rem .6rem;font-size:.72rem"         onclick="deleteKnowItem(${k.id})">🗑️</button>
            </div>
          </div>`).join('') + '</div>';
  } catch(e){ console.warn(e); }
}

function openKnowModal(item) {
  loadDepartmentOptions();
  document.getElementById('knowModal').style.display = 'flex';
  document.getElementById('knowItemId').value = item?.id    || '';
  document.getElementById('knowCode').value   = item?.code  || '';
  document.getElementById('knowTitle').value  = item?.title || '';
  document.getElementById('knowOwner').value  = item?.owner || '';
  document.getElementById('knowDesc').value   = item?.description || '';
  document.getElementById('knowType').value   = item?.type   || 'other';
  document.getElementById('knowStatus').value = item?.status || 'draft';
  document.getElementById('knowUsed').checked = !!(item?.used_in_decision);
  document.getElementById('knowModalTitle').textContent = item ? '✏️ تعديل أصل معرفي' : '＋ إضافة أصل معرفي';
}

async function saveKnowItem() {
  const id = document.getElementById('knowItemId').value;
  const data = {
    code:  document.getElementById('knowCode').value.trim(),
    title: document.getElementById('knowTitle').value.trim(),
    owner: document.getElementById('knowOwner').value.trim(),
    description: document.getElementById('knowDesc').value,
    type:   document.getElementById('knowType').value,
    status: document.getElementById('knowStatus').value,
    used_in_decision: document.getElementById('knowUsed').checked ? 1 : 0,
  };
  if(!data.code||!data.title){showToast('⚠️ الرمز والعنوان مطلوبان','gold');return;}
  try {
    const url = id ? `api.php?endpoint=knowledge&id=${id}` : 'api.php?endpoint=knowledge';
    const r = await fetch(url,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const d = await r.json();
    if(d.success){showToast(id?'✅ تم التحديث':'✅ تمت الإضافة');document.getElementById('knowModal').style.display='none';loadKnowledge();}
    else showToast('❌ '+(d.error||'خطأ'),'red');
  } catch(e){showToast('❌ خطأ','red');}
}

async function deleteKnowItem(id) {
  if(!confirm('حذف هذا الأصل المعرفي؟')) return;
  const r = await fetch(`api.php?endpoint=knowledge&id=${id}`,{method:'DELETE'});
  const d = await r.json();
  if(d.success){showToast('🗑️ تم الحذف');loadKnowledge();}
  else showToast('❌ '+(d.error||'خطأ'),'red');
}

// knowledge loader handled in switchTab

function showToast(msg,type){const t=document.getElementById('toast');t.textContent=msg;t.style.borderColor=type==='red'?'var(--red)':type==='gold'?'var(--gold)':'var(--teal)';t.style.color=type==='red'?'var(--red)':type==='gold'?'var(--gold)':'var(--teal)';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3200);}

// ═══════════════════════════════════════════════════
//  TAB: الأداء الاستراتيجي — عرض + تعديل
// ═══════════════════════════════════════════════════
let stratKpis = [];
async function loadStrategicTab(){
  const yr=document.getElementById('stratYear').value;
  const q=document.getElementById('stratQ').value;
  const QN={1:'الربع الأول',2:'الربع الثاني',3:'الربع الثالث',4:'الربع الرابع'};
  const sub=document.getElementById('stratSubTitle');
  if(sub) sub.textContent=`جمعية الزاد ${yr} · ${QN[q]||'الربع الأول'}`;
  const SC={exceeded:'#059669',achieved:'#8b1a3a',partial:'#d4af37',not_achieved:'#ff4d6d',pending:'#64748b'};
  const SL={exceeded:'✅ متجاوز',achieved:'🟢 متحقق',partial:'🟡 جزئي',not_achieved:'🔴 غير متحقق',pending:'⏳ انتظار'};
  try{
    const data = await dashboardFetchJson(`${API}?endpoint=kpis&type=strategic&year=${yr}&quarter=${q}`);
    if (!Array.isArray(data)) throw new Error(data?.error || 'تعذر تحميل بيانات المسار');
    stratKpis = data;
    const pct = dashboardAvgMetricPct(stratKpis);
    const exc=stratKpis.filter(k=>k.q_status==='exceeded').length;
    const ach=stratKpis.filter(k=>k.q_status==='achieved').length;
    const par=stratKpis.filter(k=>k.q_status==='partial').length;
    const fai=stratKpis.filter(k=>k.q_status==='not_achieved').length;
    const goals=new Set(stratKpis.map(k=>k.goal_code).filter(Boolean)).size;
    document.getElementById('stratSummaryTab').innerHTML=`
      <div style="background:rgba(139,26,58,.08);border:1px solid rgba(139,26,58,.2);border-radius:.75rem;padding:.75rem;text-align:center;grid-column:span 2">
        <div style="font-size:1.6rem;font-weight:800;color:var(--teal)">${pct}%</div><div style="font-size:.68rem;color:var(--slate)">الأداء الكلي</div></div>
      <div style="background:var(--card2);border-radius:.75rem;padding:.75rem;text-align:center">
        <div style="font-size:1.3rem;font-weight:800">${goals}</div><div style="font-size:.68rem;color:var(--slate)">الأهداف</div></div>
      <div style="background:var(--card2);border-radius:.75rem;padding:.75rem;text-align:center">
        <div style="font-size:1.3rem;font-weight:800">${stratKpis.length}</div><div style="font-size:.68rem;color:var(--slate)">المؤشرات</div></div>
      <div style="background:rgba(5,150,105,.08);border-radius:.75rem;padding:.75rem;text-align:center">
        <div style="font-size:1.3rem;font-weight:800;color:#059669">${exc}</div><div style="font-size:.68rem;color:var(--slate)">متجاوز</div></div>
      <div style="background:rgba(139,26,58,.07);border-radius:.75rem;padding:.75rem;text-align:center">
        <div style="font-size:1.3rem;font-weight:800;color:var(--teal)">${ach}</div><div style="font-size:.68rem;color:var(--slate)">متحقق</div></div>
      <div style="background:rgba(212,175,55,.07);border-radius:.75rem;padding:.75rem;text-align:center">
        <div style="font-size:1.3rem;font-weight:800;color:var(--gold)">${par}</div><div style="font-size:.68rem;color:var(--slate)">جزئي</div></div>
      <div style="background:rgba(255,77,109,.07);border-radius:.75rem;padding:.75rem;text-align:center">
        <div style="font-size:1.3rem;font-weight:800;color:var(--red)">${fai}</div><div style="font-size:.68rem;color:var(--slate)">غير متحقق</div></div>`;
    renderStratTable(stratKpis, SC, SL);
  }catch(e){
    document.getElementById('stratSummaryTab').innerHTML = '';
    document.getElementById('stratTableContainer').innerHTML = `<div style="color:var(--red);padding:1rem;text-align:center">❌ ${dashboardSafeText(e?.message) || 'خطأ في التحميل'}</div>`;
  }
}
function filterStrategicTab(){
  const f=document.getElementById('stratStatusFilter').value;
  const SC={exceeded:'#059669',achieved:'#8b1a3a',partial:'#d4af37',not_achieved:'#ff4d6d',pending:'#64748b'};
  const SL={exceeded:'✅ متجاوز',achieved:'🟢 متحقق',partial:'🟡 جزئي',not_achieved:'🔴 غير متحقق',pending:'⏳ انتظار'};
  renderStratTable(f?stratKpis.filter(k=>k.q_status===f):stratKpis, SC, SL);
}
function renderStratTable(kpis, SC, SL){
  const yr=document.getElementById('stratYear').value;
  const q=document.getElementById('stratQ').value;
  if(!Array.isArray(kpis) || !kpis.length){
    document.getElementById('stratTableContainer').innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--dim)">لا توجد مؤشرات استراتيجية لهذه الفترة</div>';
    return;
  }
  document.getElementById('stratTableContainer').innerHTML=`
    <table style="width:100%;border-collapse:collapse;font-size:.8rem">
      <thead><tr style="background:var(--card2)">
        <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">الرمز</th>
        <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">المؤشر</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">المستهدف</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الفعلي</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الإنجاز</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الانحراف</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الحالة</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">تعديل</th>
      </tr></thead>
      <tbody>${kpis.map(k=>{
        const name = dashboardSafeText(k.name);
        const desc = dashboardSafeText(k.description);
        const pctRaw = dashboardMetricPct(k.q_actual, k.q_target);
        const pct = pctRaw !== null ? Math.round(pctRaw) : null;
        const targetNum = Number(k.q_target);
        const actualNum = Number(k.q_actual);
        const dev = Number.isFinite(targetNum) && targetNum > 0 && Number.isFinite(actualNum)
          ? (((actualNum - targetNum) / targetNum) * 100).toFixed(1)
          : null;
        const sc=SC[k.q_status||'pending'];
        return `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:.5rem .75rem;font-weight:800;color:var(--teal)">${k.code}</td>
          <td style="padding:.5rem .75rem;max-width:200px">
            <div style="font-weight:600">${name.substring(0,38)}${name.length>38?'…':''}</div>
            ${desc?`<div style="font-size:.65rem;color:var(--slate);margin-top:.15rem;line-height:1.3">${desc.substring(0,70)}${desc.length>70?'…':''}</div>`:''}</td>
          <td style="padding:.5rem .75rem;text-align:center">${fmtN(k.q_target??k.annual_target)}</td>
          <td style="padding:.5rem .75rem;text-align:center;font-weight:700;color:${sc}">${k.q_actual!==null?fmtN(k.q_actual):'—'}</td>
          <td style="padding:.5rem .75rem;text-align:center;font-weight:800;color:${sc}">${pct!==null?pct+'%':'—'}</td>
          <td style="padding:.5rem .75rem;text-align:center;font-weight:700;color:${dev!==null&&+dev<0?'var(--red)':'var(--teal)'}">${dev!==null?(+dev>0?'+':'')+dev+'%':'—'}</td>
          <td style="padding:.5rem .75rem;text-align:center"><span style="font-size:.7rem;font-weight:700;color:${sc}">${SL[k.q_status||'pending']}</span></td>
          <td style="padding:.5rem .75rem;text-align:center">
            <button class="btn btn-ghost" style="padding:.25rem .6rem;font-size:.72rem" title="تعديل القيمة"
                    onclick="openStratEdit(${k.id},'${yr}',${q},'${k.code}: ${name.substring(0,25)}',${k.q_target??k.annual_target??0},${k.q_actual??''})">
              ✏️
            </button>
            <button class="btn btn-ghost" style="padding:.25rem .5rem;font-size:.72rem;color:var(--red);border-color:rgba(255,77,109,.3)" title="حذف القيمة"
                    onclick="deleteKpiValue(${k.id},'${yr}',${q},'${k.code}')">
              🗑️
            </button>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}
function openStratEdit(kpiId, yr, q, name, target, actual){
  document.getElementById('stratEditKpiId').value=kpiId+'|'+yr+'|'+q;
  document.getElementById('stratEditTitle').textContent='✏️ '+name;
  document.getElementById('stratEditTarget').value=target||'';
  document.getElementById('stratEditActual').value=actual||'';
  document.getElementById('stratEditNotes').value='';
  document.getElementById('stratEditModal').style.display='flex';
}
async function saveStratEdit(){
  const parts=document.getElementById('stratEditKpiId').value.split('|');
  const kpiId=+parts[0], yr=+parts[1], q=+parts[2];
  const target=document.getElementById('stratEditTarget').value;
  const actual=document.getElementById('stratEditActual').value;
  const notes=document.getElementById('stratEditNotes').value;
  if(actual===''){showToast('⚠️ أدخل القيمة الفعلية','gold');return;}
  try{
    const r=await fetch(`${API}?endpoint=kpi_values`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kpi_id:kpiId,year:yr,quarter:q,target:+target,actual:+actual,notes})});
    const d=await r.json();
    if(d.success){
      const emailMsg = d.email_sent ? ' · 📧 تنبيه أُرسل' : '';
      showToast(`✅ تم الحفظ · الإنجاز: ${d.achievement??'—'}%${emailMsg}`);
      document.getElementById('stratEditModal').style.display='none';
      loadStrategicTab();
    } else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ','red');}
}

// ═══════════════════════════════════════════════════
//  TAB: الأداء التشغيلي — عرض + تعديل
// ═══════════════════════════════════════════════════
let operKpis=[];
async function loadOperationalTab(){
  const yr=document.getElementById('operYear').value;
  const q=document.getElementById('operQ').value;
  const QN={1:'الربع الأول',2:'الربع الثاني',3:'الربع الثالث',4:'الربع الرابع'};
  const sub2=document.getElementById('operSubTitle');
  if(sub2) sub2.textContent=`جمعية الزاد ${yr} · ${QN[q]||'الربع الأول'}`;
  const COLORS=['#8b1a3a','#c4a246','#d4af37','#a78bfa','#fb7185','#34d399'];
  try{
    const data = await dashboardFetchJson(`${API}?endpoint=kpis&type=operational&year=${yr}&quarter=${q}`);
    if (!Array.isArray(data)) throw new Error(data?.error || 'تعذر تحميل بيانات المسار');
    operKpis = data;
    const depts={};
    operKpis.forEach(k=>{
      const d=k.owner_dept||'غير محدد';
      if(!depts[d]) depts[d]={total:0,wd:0,sum:0};
      depts[d].total++;
      const pct = dashboardMetricPct(k.q_actual, k.q_target);
      if(pct !== null){depts[d].wd++;depts[d].sum+=pct;}
    });
    const sel=document.getElementById('operDeptFilter');
    sel.innerHTML='<option value="">كل الإدارات</option>';
    Object.keys(depts).forEach(d=>sel.insertAdjacentHTML('beforeend',`<option value="${d}">${d}</option>`));
    document.getElementById('operDeptSummary').innerHTML=Object.entries(depts).map(([d,data],i)=>{
      const pct=data.wd?Math.round(data.sum/data.wd):0;
      const c=COLORS[i%COLORS.length];
      return `<div style="background:var(--card2);border-top:3px solid ${c};border-radius:.75rem;padding:.75rem;text-align:center;cursor:pointer"
                   onclick="document.getElementById('operDeptFilter').value='${d}';filterOperTab()">
        <div style="font-size:.7rem;font-weight:700;color:${c};margin-bottom:.3rem">${d}</div>
        <div style="font-size:1.3rem;font-weight:800">${pct}%</div>
        <div style="font-size:.65rem;color:var(--dim)">${data.total} مؤشر</div>
      </div>`;
    }).join('');
    renderOperTable(operKpis, yr, q);
  }catch(e){
    document.getElementById('operDeptSummary').innerHTML = '';
    document.getElementById('operTableContainer').innerHTML = `<div style="color:var(--red);padding:1rem;text-align:center">❌ ${dashboardSafeText(e?.message) || 'خطأ في التحميل'}</div>`;
  }
}
function filterOperTab(){
  const f=document.getElementById('operDeptFilter').value;
  const yr=document.getElementById('operYear').value;
  const q=document.getElementById('operQ').value;
  renderOperTable(f?operKpis.filter(k=>k.owner_dept===f):operKpis, yr, q);
}
function renderOperTable(kpis, yr, q){
  const SC={exceeded:'#059669',achieved:'#8b1a3a',partial:'#d4af37',not_achieved:'#ff4d6d',pending:'#64748b'};
  const SL={exceeded:'✅ متجاوز',achieved:'🟢 متحقق',partial:'🟡 جزئي',not_achieved:'🔴 غير متحقق',pending:'⏳ انتظار'};
  if(!Array.isArray(kpis) || !kpis.length){
    document.getElementById('operTableContainer').innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--dim)">لا توجد مؤشرات تشغيلية لهذه الفترة</div>';
    return;
  }
  document.getElementById('operTableContainer').innerHTML=`
    <table style="width:100%;border-collapse:collapse;font-size:.8rem">
      <thead><tr style="background:var(--card2)">
        <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">الرمز</th>
        <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">المؤشر</th>
        <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">الإدارة</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">المستهدف</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الفعلي</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الإنجاز</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الحالة</th>
        <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">تعديل</th>
      </tr></thead>
      <tbody>${kpis.map(k=>{
        const name = dashboardSafeText(k.name);
        const desc = dashboardSafeText(k.description);
        const pctRaw = dashboardMetricPct(k.q_actual, k.q_target);
        const pct = pctRaw !== null ? Math.round(pctRaw) : null;
        const sc=SC[k.q_status||'pending'];
        return `<tr style="border-bottom:1px solid var(--border)">
          <td style="padding:.5rem .75rem;font-weight:800;color:var(--cyan)">${k.code}</td>
          <td style="padding:.5rem .75rem;max-width:180px">
            <div style="font-weight:600">${name.substring(0,35)}${name.length>35?'…':''}</div>
            ${desc?`<div style="font-size:.65rem;color:var(--slate);margin-top:.15rem;line-height:1.3">${desc.substring(0,70)}${desc.length>70?'…':''}</div>`:''}</td>
          <td style="padding:.5rem .75rem;font-size:.75rem;color:var(--dim)">${k.owner_dept||'—'}</td>
          <td style="padding:.5rem .75rem;text-align:center">${fmtN(k.q_target??k.annual_target)}</td>
          <td style="padding:.5rem .75rem;text-align:center;font-weight:700;color:${sc}">${k.q_actual!==null?fmtN(k.q_actual):'—'}</td>
          <td style="padding:.5rem .75rem;text-align:center;font-weight:800;color:${sc}">${pct!==null?pct+'%':'—'}</td>
          <td style="padding:.5rem .75rem;text-align:center"><span style="font-size:.7rem;font-weight:700;color:${sc}">${SL[k.q_status||'pending']}</span></td>
          <td style="padding:.5rem .75rem;text-align:center">
            <button class="btn btn-ghost" style="padding:.25rem .6rem;font-size:.72rem" title="تعديل القيمة"
                    onclick="openOperEdit(${k.id},'${yr}',${q},'${k.code}',${k.q_target??k.annual_target??0},${k.q_actual??''})">
              ✏️
            </button>
            <button class="btn btn-ghost" style="padding:.25rem .5rem;font-size:.72rem;color:var(--red);border-color:rgba(255,77,109,.3)" title="حذف القيمة"
                    onclick="deleteKpiValue(${k.id},'${yr}',${q},'${k.code}')">
              🗑️
            </button>
          </td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;
}
function openOperEdit(kpiId, yr, q, code, target, actual){
  document.getElementById('operEditKpiId').value=kpiId+'|'+yr+'|'+q;
  document.getElementById('operEditTitle').textContent='✏️ '+code;
  document.getElementById('operEditTarget').value=target||'';
  document.getElementById('operEditActual').value=actual||'';
  document.getElementById('operEditNotes').value='';
  document.getElementById('operEditModal').style.display='flex';
}
async function saveOperEdit(){
  const parts=document.getElementById('operEditKpiId').value.split('|');
  const kpiId=+parts[0], yr=+parts[1], q=+parts[2];
  const target=document.getElementById('operEditTarget').value;
  const actual=document.getElementById('operEditActual').value;
  const notes=document.getElementById('operEditNotes').value;
  if(actual===''){showToast('⚠️ أدخل القيمة الفعلية','gold');return;}
  try{
    const r=await fetch(`${API}?endpoint=kpi_values`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kpi_id:kpiId,year:yr,quarter:q,target:+target,actual:+actual,notes})});
    const d=await r.json();
    if(d.success){
      const emailMsg = d.email_sent ? ' · 📧 تنبيه أُرسل' : '';
      showToast(`✅ تم الحفظ · الإنجاز: ${d.achievement??'—'}%${emailMsg}`);
      document.getElementById('operEditModal').style.display='none';
      loadOperationalTab();
    } else showToast('❌ '+(d.error||'خطأ'),'red');
  }catch(e){showToast('❌ خطأ','red');}
}

// ═══════════════════════════════════════════════════
//  TAB: الإنذار المبكر — عرض + إنشاء بطاقة انحراف
// ═══════════════════════════════════════════════════
let alertsTabData=[];
async function loadAlertsTab(){
  const yr=document.getElementById('alertYear').value;
  const q=document.getElementById('alertQ').value;
  try{
    const d=await fetch(`${API}?endpoint=dashboard&year=${yr}&quarter=${q}`).then(r=>r.json());
    alertsTabData=(d.alerts||[]).sort((a,b)=>+a.deviation_pct-+b.deviation_pct);
    const high=alertsTabData.filter(a=>+a.deviation_pct<-30);
    const med=alertsTabData.filter(a=>+a.deviation_pct>=-30&&+a.deviation_pct<-15);
    const low=alertsTabData.filter(a=>+a.deviation_pct>=-15);
    document.getElementById('alertCntHigh').textContent=high.length;
    document.getElementById('alertCntMed').textContent=med.length;
    document.getElementById('alertCntLow').textContent=low.length;
    renderAlertsTab(alertsTabData, yr, q);
  }catch(e){document.getElementById('alertsTabContainer').innerHTML='<div style="color:var(--red);padding:1rem"> خطأ</div>';}
}
function filterAlertsTab(){
  const f=document.getElementById('alertRisk').value;
  const yr=document.getElementById('alertYear').value;
  const q=document.getElementById('alertQ').value;
  const fn=a=>+a.deviation_pct<-30?'high':+a.deviation_pct<-15?'medium':'low';
  renderAlertsTab(f?alertsTabData.filter(a=>fn(a)===f):alertsTabData, yr, q);
}
function renderAlertsTab(list, yr, q){
  const cont=document.getElementById('alertsTabContainer');
  if(!list.length){cont.innerHTML='<div style="text-align:center;padding:2rem;color:var(--dim)"> لا توجد انحرافات</div>';return;}
  cont.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:.8rem">
    <thead><tr style="background:var(--card2)">
      <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">الرمز</th>
      <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">المؤشر</th>
      <th style="padding:.6rem .75rem;text-align:right;color:var(--slate);font-weight:700">الإدارة</th>
      <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">المستهدف</th>
      <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الفعلي</th>
      <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">الانحراف</th>
      <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">المستوى</th>
      <th style="padding:.6rem .75rem;text-align:center;color:var(--slate);font-weight:700">إجراء</th>
    </tr></thead>
    <tbody>${list.map(a=>{
      const dev=(+a.deviation_pct).toFixed(1);
      const risk=+a.deviation_pct<-30?{c:'var(--red)',l:' عالٍ'}:+a.deviation_pct<-15?{c:'var(--gold)',l:' متوسط'}:{c:'#fbbf24',l:' منخفض'};
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:.5rem .75rem;font-weight:800;color:var(--teal)">${a.code}</td>
        <td style="padding:.5rem .75rem;max-width:180px">${(a.name||'').substring(0,35)}${(a.name||'').length>35?'…':''}</td>
        <td style="padding:.5rem .75rem;font-size:.75rem;color:var(--dim)">${a.owner_dept||'—'}</td>
        <td style="padding:.5rem .75rem;text-align:center">${fmtN(a.target)}</td>
        <td style="padding:.5rem .75rem;text-align:center;color:${risk.c}">${fmtN(a.actual)}</td>
        <td style="padding:.5rem .75rem;text-align:center;font-weight:800;color:${risk.c}">${dev}%</td>
        <td style="padding:.5rem .75rem;text-align:center"><span style="font-size:.7rem;font-weight:700;color:${risk.c}">${risk.l}</span></td>
        <td style="padding:.5rem .75rem;text-align:center">
          <button class="btn btn-ghost" style="padding:.25rem .6rem;font-size:.7rem;color:var(--red)"
                  onclick="createAlertDevCard(${a.kpi_id||0},'${yr}',${q})">
             بطاقة
          </button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}
async function createAlertDevCard(kpiId, yr, q){
  if(!kpiId){showToast('⚠️ معرّف المؤشر غير موجود','gold');return;}
  // مزامنة فلاتر تبويب البطاقات أولاً
  const yearSel = document.getElementById('devFilterYear');
  const qSel    = document.getElementById('devFilterQ');
  if(yearSel) yearSel.value = yr;
  if(qSel)    qSel.value    = q;
  try{
    const r=await fetch(`${API}?endpoint=deviation_cards`,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kpi_id:kpiId,year:+yr,quarter:+q})});
    const d=await r.json();
    if(d.success || d.id){
      showToast('✅ تم إنشاء بطاقة الانحراف');
    } else {
      showToast('⚠️ '+(d.error||'البطاقة موجودة مسبقاً'),'gold');
    }
    switchTab('tab-deviation',document.getElementById('nav-tab-deviation'));
  }catch(e){showToast('❌ خطأ','red');}
}

// ── تحديث switchTab لاستدعاء التبويبات الجديدة ──


const KPI_DATA={strategic_goals:[],strategic_kpis:[],op_goals:[],op_kpis:[]};
let kpiDataPromise=null;
let kpiDataCacheKey='';

async function ensureKpiData(){
  const yr=document.getElementById('entryYear')?.value||'2026';
  const q=document.getElementById('entryQuarter')?.value||'1';
  const key=`${yr}:${q}`;
  if(kpiDataPromise&&kpiDataCacheKey===key) return kpiDataPromise;
  kpiDataCacheKey=key;
  kpiDataPromise=Promise.all([
    fetch(`${API}?endpoint=strategic_goals`).then(r=>r.json()).catch(()=>[]),
    fetch(`${API}?endpoint=op_goals`).then(r=>r.json()).catch(()=>[]),
    fetch(`${API}?endpoint=kpis&type=strategic&year=${yr}&quarter=${q}`).then(r=>r.json()).catch(()=>[]),
    fetch(`${API}?endpoint=kpis&type=operational&year=${yr}&quarter=${q}`).then(r=>r.json()).catch(()=>[]),
  ]).then(([strategicGoals,operationalGoals,strategicKpis,operationalKpis])=>{
    KPI_DATA.strategic_goals=Array.isArray(strategicGoals)?strategicGoals:[];
    KPI_DATA.op_goals=Array.isArray(operationalGoals)?operationalGoals.map(g=>({code:g.code,name:g.name,dept:g.department||''})):[];
    KPI_DATA.strategic_kpis=Array.isArray(strategicKpis)?strategicKpis.map(k=>({
      code:k.code,goal:k.goal_code,name:k.name,unit:k.unit,annual:k.annual_target,
      q1:k.q1_target,q2:k.q2_target,q3:k.q3_target,q4:k.q4_target,
    })):[];
    KPI_DATA.op_kpis=Array.isArray(operationalKpis)?operationalKpis.map(k=>({
      code:k.code,goal:k.goal_code,name:k.name,unit:k.unit,annual:k.annual_target,
      q1:k.q1_target,q2:k.q2_target,q3:k.q3_target,q4:k.q4_target,
    })):[];
    return KPI_DATA;
  }).catch(()=>KPI_DATA);
  return kpiDataPromise;
}

// ── تعبئة المؤشرات حسب النوع المختار ──
async function populateKpiSelect(type) {
  const sel = document.getElementById('entryKpi');
  const goalSel = document.getElementById('entryGoal');
  if (!sel) return;
  const data = await ensureKpiData();
  const list = type === 'strategic' ? data.strategic_kpis : data.op_kpis;
  const goalCode = goalSel?.value || '';
  const filtered = goalCode ? list.filter(k => k.goal === goalCode) : list;
  sel.innerHTML = '<option value="">— اختر المؤشر —</option>' +
    filtered.map(k => `<option value="${k.code}" data-unit="${k.unit||''}" data-annual="${k.annual||''}" data-q1="${k.q1||''}" data-q2="${k.q2||''}" data-q3="${k.q3||''}" data-q4="${k.q4||''}">${k.code} — ${k.name.substring(0,45)}</option>`).join('');
}

// تعبئة الأهداف حسب النوع
async function populateGoalSelect(type) {
  const sel = document.getElementById('entryGoal');
  if (!sel) return;
  const data = await ensureKpiData();
  const list = type === 'strategic' ? data.strategic_goals : data.op_goals;
  sel.innerHTML = '<option value="">— اختر الهدف —</option>' +
    list.map(g => `<option value="${g.code}">${g.code} — ${g.name.substring(0,40)}</option>`).join('');
  await populateKpiSelect(type);
}

// عند تغيير الهدف — عبّئ المؤشرات المرتبطة
async function onGoalChange() {
  const typeSel = document.getElementById('entryType');
  const type = typeSel?.value || 'strategic';
  await populateKpiSelect(type);
}

// عند اختيار مؤشر — عبّئ المستهدف تلقائياً
function onKpiChange() {
  const sel = document.getElementById('entryKpi') || document.getElementById('entryKpiSel');
  const opt = sel?.selectedOptions[0];
  if (!opt) return;
  const qSel = document.getElementById('entryQuarter');
  const q = qSel?.value || '1';
  const targets = {1: opt.dataset.q1, 2: opt.dataset.q2, 3: opt.dataset.q3, 4: opt.dataset.q4};
  const tgt = targets[+q] || opt.dataset.annual || '';
  const tgtEl = document.getElementById('entryTarget');
  if (tgtEl && tgt) tgtEl.value = tgt;
  const unitEl = document.querySelector('#entryForm .kpi-unit-label');
  if (unitEl && opt.dataset.unit) unitEl.textContent = opt.dataset.unit;
}

</script>

<div class="tab-panel" id="tab-db">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="card">
      <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:1.25rem">✅ إعدادات الاتصال بقاعدة البيانات</h2>

      <?php if ($dbMsg): ?>
        <div class="alert-box <?= $dbMsg['type']==='success' ? 'alert-success' : 'alert-error' ?>" style="margin-bottom:1.25rem">
          <?= htmlspecialchars($dbMsg['text']) ?>
        </div>
      <?php endif; ?>

      <form method="POST">
        <input type="hidden" name="action" value="save_db">
        <div style="display:flex;flex-direction:column;gap:.9rem">
          <div><label class="lbl">المضيف (Host)</label>
            <input class="inp" type="text" name="db_host" value="<?= htmlspecialchars($currentCfg['host']) ?>" placeholder="localhost"></div>
          <div><label class="lbl">اسم قاعدة البيانات</label>
            <input class="inp" type="text" name="db_name" value="<?= htmlspecialchars($currentCfg['name']) ?>" placeholder="miqyas_db"></div>
          <div><label class="lbl">اسم المستخدم</label>
            <input class="inp" type="text" name="db_user" value="<?= htmlspecialchars($currentCfg['user']) ?>" placeholder="miqyas_user"></div>
          <div>
            <label class="lbl">كلمة المرور</label>
            <div style="position:relative">
              <input class="inp" type="password" name="db_pass" id="dbPassInput" value="<?= htmlspecialchars($currentCfg['pass']) ?>" placeholder="••••••••" style="padding-left:2.5rem">
              <button type="button" onclick="togglePassVis()" style="position:absolute;left:.7rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--dim);font-size:.9rem">✏️</button>
            </div>
          </div>
          <!-- أزرار الحفظ والتغيير -->
          <div style="display:flex;gap:.65rem">
            <button type="submit" class="btn btn-maroon" style="flex:1;justify-content:center">💾 حفظ الإعدادات</button>
            <button type="button" class="btn btn-ghost" style="flex:1;justify-content:center" onclick="confirmResetDb()">🔄 تغيير قاعدة البيانات</button>
          </div>
          <button type="button" class="btn btn-red" style="width:100%;justify-content:center;margin-top:.25rem" onclick="confirmDeleteDb()">🗑️ حذف إعدادات قاعدة البيانات</button>
        </div>
      </form>

      <!-- Modal تأكيد التغيير -->
      <div id="resetDbModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
        <div style="background:var(--card);border:1px solid var(--bhi);border-radius:1.5rem;padding:2rem;width:100%;max-width:460px">
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:.75rem"> تغيير قاعدة البيانات</h3>
          <p style="font-size:.82rem;color:var(--slate);margin-bottom:1.5rem;line-height:1.7">
            سيتم مسح إعدادات الاتصال الحالية وفتح الحقول للتعديل.<br>
            أدخل بيانات قاعدة البيانات الجديدة ثم اضغط "حفظ الإعدادات".
          </p>
          <div style="display:flex;gap:.65rem">
            <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="document.getElementById('resetDbModal').style.display='none'">إلغاء</button>
            <button class="btn btn-teal" style="flex:1;justify-content:center" onclick="doResetDb()">✅ تأكيد التغيير</button>
          </div>
        </div>
      </div>

      <!-- Modal تأكيد الحذف -->
      <div id="deleteDbModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:10000;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
        <div style="background:var(--card);border:1px solid var(--red);border-radius:1.5rem;padding:2rem;width:100%;max-width:460px">
          <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:.75rem;color:var(--red)">🗑️ حذف إعدادات قاعدة البيانات</h3>
          <div style="background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.2);border-radius:.75rem;padding:.9rem;margin-bottom:1.25rem">
            <p style="font-size:.82rem;color:var(--red);font-weight:700;margin-bottom:.35rem">تحذير: هذا الإجراء لا يمكن التراجع عنه!</p>
            <p style="font-size:.78rem;color:var(--slate);line-height:1.7">
              · سيتم مسح جميع بيانات الاتصال من config.php<br>
              · لن تتمكن من الوصول للبيانات حتى تُعيد الإعداد<br>
              · البيانات في قاعدة البيانات لن تُحذف
            </p>
          </div>
          <p style="font-size:.8rem;color:var(--slate);margin-bottom:1rem">اكتب <strong style="color:var(--red)">احذف</strong> للتأكيد:</p>
          <input class="inp" type="text" id="deleteConfirmInput" placeholder="احذف" style="margin-bottom:1rem;border-color:var(--red)">
          <div style="display:flex;gap:.65rem">
            <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="document.getElementById('deleteDbModal').style.display='none';document.getElementById('deleteConfirmInput').value=''">إلغاء</button>
            <button class="btn btn-red" style="flex:1;justify-content:center" onclick="doDeleteDb()">🗑️ حذف الإعدادات</button>
          </div>
        </div>
      </div>
    </div>

    <!-- معلومات الاتصال الحالي -->
    <div style="display:flex;flex-direction:column;gap:1rem">
      <div class="card">
        <h3 style="font-size:.9rem;font-weight:800;margin-bottom:.9rem"> الإعدادات الحالية</h3>
        <?php foreach([
          ['المضيف', $currentCfg['host']],
          ['قاعدة البيانات', $currentCfg['name']],
          ['المستخدم', $currentCfg['user']],
          ['كلمة المرور', str_repeat('•', strlen($currentCfg['pass']))],
        ] as [$label, $val]): ?>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.55rem 0;border-bottom:1px solid var(--border)">
          <span style="font-size:.78rem;color:var(--slate)"><?= $label ?></span>
          <span style="font-size:.82rem;font-weight:700;color:var(--text)"><?= htmlspecialchars($val) ?: '—' ?></span>
        </div>
        <?php endforeach; ?>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.55rem 0">
          <span style="font-size:.78rem;color:var(--slate)">الحالة</span>
          <span style="font-size:.82rem;font-weight:700;color:<?= $dbConnected ? 'var(--teal)' : 'var(--red)' ?>"><?= $dbConnected ? ' متصل' : ' غير متصل' ?></span>
        </div>
      </div>

      <?php if ($dbConnected): ?>
      <div class="card">
        <h3 style="font-size:.9rem;font-weight:800;margin-bottom:.9rem"> إحصائيات قاعدة البيانات</h3>
        <?php
        try {
          $tables = ['kpis','kpi_values','departments','users','strategic_goals'];
          foreach ($tables as $tbl) {
            try { $cnt = $pdo->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn(); }
            catch(Exception $e) { $cnt = '—'; }
            echo "<div style='display:flex;justify-content:space-between;padding:.45rem 0;border-bottom:1px solid var(--border)'>";
            echo "<span style='font-size:.78rem;color:var(--slate)'>$tbl</span>";
            echo "<span style='font-size:.82rem;font-weight:700'>$cnt سجل</span>";
            echo "</div>";
          }
        } catch(Exception $e) {}
        ?>
      </div>
      <?php endif; ?>
    </div>
  </div>
</div>

<div id="stratEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:480px;padding:1.5rem;margin:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
        <h3 id="stratEditTitle" style="font-size:.95rem;font-weight:800;color:var(--teal)">تعديل قيمة المؤشر</h3>
        <button onclick="document.getElementById('stratEditModal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif">✕</button>
      </div>
      <input type="hidden" id="stratEditKpiId">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.85rem">
        <div><label class="lbl">المستهدف الربعي</label><input class="inp" type="number" id="stratEditTarget" step="any"></div>
        <div><label class="lbl" style="color:var(--gold)">✅ الفعلي</label><input class="inp" type="number" id="stratEditActual" step="any" style="border-color:var(--gold)"></div>
      </div>
      <div style="margin-bottom:.85rem"><label class="lbl">ملاحظات</label><input class="inp" id="stratEditNotes" placeholder="اختياري"></div>
      <div style="display:flex;gap:.65rem">
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="document.getElementById('stratEditModal').style.display='none'">إلغاء</button>
        <button class="btn btn-teal" style="flex:1;justify-content:center" onclick="saveStratEdit()">💾 حفظ</button>
      </div>
    </div>
  </div>

<div id="operEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(4px)">
    <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:480px;padding:1.5rem;margin:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
        <h3 id="operEditTitle" style="font-size:.95rem;font-weight:800;color:var(--cyan)">تعديل قيمة المؤشر</h3>
        <button onclick="document.getElementById('operEditModal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif">✕</button>
      </div>
      <input type="hidden" id="operEditKpiId">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.85rem">
        <div><label class="lbl">المستهدف الربعي</label><input class="inp" type="number" id="operEditTarget" step="any"></div>
        <div><label class="lbl" style="color:var(--gold)">✅ الفعلي</label><input class="inp" type="number" id="operEditActual" step="any" style="border-color:var(--gold)"></div>
      </div>
      <div style="margin-bottom:.85rem"><label class="lbl">ملاحظات</label><input class="inp" id="operEditNotes" placeholder="اختياري"></div>
      <div style="display:flex;gap:.65rem">
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="document.getElementById('operEditModal').style.display='none'">إلغاء</button>
        <button class="btn btn-teal" style="flex:1;justify-content:center" onclick="saveOperEdit()">💾 حفظ</button>
      </div>
    </div>
  </div>

<div id="devCardModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto">
  <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:680px;padding:1.5rem;margin:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
      <h3 style="font-size:.95rem;font-weight:800;color:var(--red)"> بطاقة معالجة انحراف المؤشر</h3>
      <button onclick="document.getElementById('devCardModal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.78rem"> إغلاق</button>
    </div>
    <input type="hidden" id="devCardId">

    <!-- 1-8: بيانات المؤشر -->
    <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
      <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem"> بيانات المؤشر</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">
        <div><span style="font-size:.68rem;color:var(--dim)">1. اسم المؤشر</span><p id="dcKpiName" style="font-size:.78rem;font-weight:700">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">2. رمز المؤشر</span><p id="dcKpiCode" style="font-size:.78rem;font-weight:700;color:var(--teal)">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">3. الإدارة المالكة</span><p id="dcDept" style="font-size:.78rem;font-weight:700">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">4. المستهدف الربعي</span><p id="dcTarget" style="font-size:.78rem;font-weight:700">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">5. المتحقق الفعلي</span><p id="dcActual" style="font-size:.78rem;font-weight:700;color:var(--red)">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">6. قيمة الانحراف</span><p id="dcDevVal" style="font-size:.78rem;font-weight:700;color:var(--red)">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">7. نسبة الانحراف</span><p id="dcDevPct" style="font-size:.82rem;font-weight:800;color:var(--red)">—</p></div>
        <div><span style="font-size:.68rem;color:var(--dim)">8. مستوى المخاطر</span>
          <select id="dcRiskLevel" style="background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.5rem;padding:.3rem .6rem;font-family:'Almarai',sans-serif;font-size:.78rem;width:100%;margin-top:.2rem">
            <option value="مرتفع"> مرتفع</option>
            <option value="متوسط"> متوسط</option>
            <option value="منخفض"> منخفض</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 9-11: التحليل والإجراء -->
    <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
      <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem"> التحليل والإجراء</p>
      <div style="margin-bottom:.75rem">
        <label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">9. تحليل أسباب الانحراف</label>
        <textarea id="devReason" rows="3" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.6rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem;resize:vertical" placeholder="تحليل موضوعي مدعوم ببيانات..."></textarea>
      </div>
      <div style="margin-bottom:.75rem">
        <label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">10. الأثر المتوقع في حال عدم المعالجة</label>
        <textarea id="devImpact" rows="2" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.6rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem;resize:vertical" placeholder="تشغيلي / مالي / تنظيمي..."></textarea>
      </div>
      <div>
        <label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">11. خطة الإجراء التصحيحي</label>
        <textarea id="devAction" rows="3" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.6rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem;resize:vertical" placeholder="خطوات واضحة قابلة للقياس..."></textarea>
      </div>
    </div>

    <!-- 12-13: المتابعة والحالة -->
    <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
      <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem">✅ متابعة المعالجة</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
        <div>
          <label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">المسؤول عن التصحيح</label>
          <input id="devResponsible" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem" placeholder="الإدارة أو الشخص المسؤول">
        </div>
        <div>
          <label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">12. تاريخ الإغلاق المستهدف</label>
          <input id="devDueDate" type="date" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem">
        </div>
      </div>
      <div>
        <label style="font-size:.72rem;color:var(--slate);display:block;margin-bottom:.3rem">13. حالة المعالجة</label>
        <select id="devStatus" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .75rem;font-family:'Almarai',sans-serif;font-size:.78rem">
          <option value="open"> مفتوحة</option>
          <option value="in_progress"> قيد المعالجة</option>
          <option value="under_execution"> تحت التنفيذ</option>
          <option value="pending_verify"> مكتملة بانتظار التحقق</option>
          <option value="closed"> مغلقة بعد التحقق والمعالجة</option>
        </select>
      </div>
    </div>

    <!-- 14: نتائج المعالجة -->
    <div style="background:var(--card2);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
      <p style="font-size:.75rem;font-weight:800;color:var(--slate);margin-bottom:.75rem;border-bottom:1px solid var(--border);padding-bottom:.4rem"> 14. نتائج المعالجة بعد التنفيذ</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:.65rem">
        <div>
          <label style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:.25rem">قيمة التحسن</label>
          <input id="devImprovVal" type="number" step="any" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.78rem" placeholder="—">
        </div>
        <div>
          <label style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:.25rem">نسبة التحسن %</label>
          <input id="devImprovPct" type="number" step="any" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.78rem" placeholder="—">
        </div>
        <div>
          <label style="font-size:.68rem;color:var(--dim);display:block;margin-bottom:.25rem">إعادة القياس</label>
          <input id="devRemeasure" type="date" style="width:100%;background:var(--card);border:1px solid var(--border);color:var(--text);border-radius:.55rem;padding:.5rem .65rem;font-family:'Almarai',sans-serif;font-size:.78rem">
        </div>
      <div style="margin-bottom:.75rem">
        <label class="lbl">مستوى الخطورة</label>
        <select class="inp" id="devRiskLevel">
          <option value="مرتفع">🔴 مرتفع</option>
          <option value="متوسط">🟡 متوسط</option>
          <option value="منخفض">🟢 منخفض</option>
        </select>
      </div>
      </div>
    </div>

    <!-- أزرار -->
    <div style="display:flex;gap:.65rem">
      <button onclick="document.getElementById('devCardModal').style.display='none'" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.8rem;cursor:pointer">إلغاء</button>
      <button onclick="saveDevCardDash()" style="flex:2;background:var(--teal);color:#07111f;border:none;border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer">💾 حفظ البطاقة</button>
    </div>
  </div>
</div>

<!-- ══ govModal ══════════════════════════════════════════ -->
<div id="govModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto">
  <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:540px;padding:1.5rem;margin:1rem auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
      <h3 id="govModalTitle" style="font-size:.95rem;font-weight:800;color:var(--teal)">＋ إضافة معيار جديد</h3>
      <button onclick="document.getElementById('govModal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.78rem">✕</button>
    </div>
    <input type="hidden" id="govItemId">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div>
        <label class="lbl">الرمز *</label>
        <input class="inp" id="govCode" placeholder="GOV-11">
      </div>
      <div>
        <label class="lbl">التصنيف</label>
        <select class="inp" id="govCategory">
          <option value="compliance">امتثال</option>
          <option value="policies">سياسات</option>
          <option value="procedures">إجراءات</option>
          <option value="committees">لجان</option>
          <option value="reports">تقارير</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:.75rem">
      <label class="lbl">اسم المعيار *</label>
      <input class="inp" id="govName" placeholder="أدخل اسم المعيار…">
    </div>
    <div style="margin-bottom:.75rem">
      <label class="lbl">الجهة المسؤولة</label>
      <input class="inp" id="govOwner" list="sharedDeptOptions" placeholder="اختر أو اكتب الجهة">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.25rem">
      <div>
        <label class="lbl">الحالة</label>
        <select class="inp" id="govStatus">
          <option value="pending">⏳ انتظار</option>
          <option value="partial">🟡 جزئي</option>
          <option value="compliant">✅ ملتزم</option>
          <option value="non_compliant">🔴 غير ملتزم</option>
        </select>
      </div>
      <div>
        <label class="lbl">نسبة الالتزام %</label>
        <input class="inp" id="govPct" type="number" min="0" max="100" placeholder="0">
      </div>
    </div>
    <div style="display:flex;gap:.65rem">
      <button onclick="document.getElementById('govModal').style.display='none'" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.8rem;cursor:pointer">إلغاء</button>
      <button onclick="saveGovItem()" style="flex:2;background:var(--teal);color:#fff;border:none;border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer">💾 حفظ المعيار</button>
    </div>
  </div>
</div>

<!-- ══ knowModal ══════════════════════════════════════════ -->
<div id="knowModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;align-items:flex-start;justify-content:center;backdrop-filter:blur(4px);padding:1rem;overflow-y:auto">
  <div style="background:var(--card);border:1px solid var(--border);border-radius:1.25rem;width:100%;max-width:540px;padding:1.5rem;margin:1rem auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
      <h3 id="knowModalTitle" style="font-size:.95rem;font-weight:800;color:var(--gold)">＋ إضافة أصل معرفي</h3>
      <button onclick="document.getElementById('knowModal').style.display='none'" style="background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.5rem;padding:.3rem .65rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.78rem">✕</button>
    </div>
    <input type="hidden" id="knowItemId">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div>
        <label class="lbl">الرمز *</label>
        <input class="inp" id="knowCode" placeholder="KA-009">
      </div>
      <div>
        <label class="lbl">النوع</label>
        <select class="inp" id="knowType">
          <option value="policy">📋 سياسة</option>
          <option value="procedure">⚙️ إجراء</option>
          <option value="lesson">💡 درس مستفاد</option>
          <option value="best_practice">⭐ أفضل ممارسة</option>
          <option value="report">📊 تقرير</option>
          <option value="template">📄 نموذج</option>
          <option value="other">📁 أخرى</option>
        </select>
      </div>
    </div>
    <div style="margin-bottom:.75rem">
      <label class="lbl">العنوان *</label>
      <input class="inp" id="knowTitle" placeholder="عنوان الأصل المعرفي…">
    </div>
    <div style="margin-bottom:.75rem">
      <label class="lbl">الوصف</label>
      <textarea class="inp" id="knowDesc" rows="2" style="resize:none" placeholder="وصف مختصر…"></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.75rem">
      <div>
        <label class="lbl">الجهة المالكة</label>
        <input class="inp" id="knowOwner" list="sharedDeptOptions" placeholder="اختر أو اكتب الجهة">
      </div>
      <div>
        <label class="lbl">الحالة</label>
        <select class="inp" id="knowStatus">
          <option value="draft">مسودة</option>
          <option value="active">✅ نشط</option>
          <option value="under_review">🔄 قيد المراجعة</option>
          <option value="archived">📦 مؤرشف</option>
        </select>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:1.25rem;background:var(--card2);border-radius:.55rem;padding:.6rem .85rem">
      <input type="checkbox" id="knowUsed" style="width:15px;height:15px;cursor:pointer">
      <label for="knowUsed" style="font-size:.8rem;cursor:pointer">🎯 استُخدم في اتخاذ قرار مؤسسي</label>
    </div>
    <div style="display:flex;gap:.65rem">
      <button onclick="document.getElementById('knowModal').style.display='none'" style="flex:1;background:transparent;border:1px solid var(--border);color:var(--slate);border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.8rem;cursor:pointer">إلغاء</button>
      <button onclick="saveKnowItem()" style="flex:2;background:var(--teal);color:#fff;border:none;border-radius:.6rem;padding:.6rem;font-family:'Almarai',sans-serif;font-size:.82rem;font-weight:800;cursor:pointer">💾 حفظ الأصل المعرفي</button>
    </div>
  </div>
</div>

<datalist id="sharedDeptOptions"></datalist>


<div id="deleteFileModal" onclick="if(event.target===this) closeDeleteFileModal()" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.7);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(7px);padding:1rem">
  <div onclick="event.stopPropagation()" style="background:linear-gradient(180deg,#ffffff 0%,#fbf8f7 100%);border:1px solid rgba(127,29,29,.12);box-shadow:0 30px 80px rgba(15,23,42,.22);border-radius:1.5rem;width:100%;max-width:470px;padding:1.45rem;margin:1rem">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem">
      <div>
        <div style="font-size:.75rem;font-weight:800;color:var(--red);margin-bottom:.3rem">إجراء حساس</div>
        <h3 style="font-size:1.05rem;font-weight:900;color:var(--text);margin:0 0 .35rem">تأكيد حذف الملف</h3>
        <p style="font-size:.8rem;line-height:1.8;color:var(--slate);margin:0">سيتم حذف الملف من الأرشيف المرفوع. ويمكن اختيار حذف بيانات هذا الربع المرتبطة به إذا لزم ذلك.</p>
      </div>
      <div style="min-width:56px;width:56px;height:56px;border-radius:1rem;background:linear-gradient(135deg,#fef2f2 0%,#fee2e2 100%);display:flex;align-items:center;justify-content:center;font-size:1.45rem;border:1px solid rgba(185,28,28,.12)">🗑️</div>
    </div>

    <div style="background:#fff;border:1px solid rgba(148,163,184,.22);border-radius:1rem;padding:.9rem 1rem;margin-bottom:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.55rem">
        <span style="font-size:.75rem;font-weight:800;color:var(--slate)">الملف المحدد</span>
        <span id="deleteFileExt" style="display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:28px;padding:0 .7rem;border-radius:999px;background:#f8fafc;border:1px solid rgba(148,163,184,.28);font-size:.72rem;font-weight:900;color:var(--text);letter-spacing:.03em">FILE</span>
      </div>
      <p id="deleteFileName" style="font-size:.84rem;font-weight:800;color:var(--text);background:var(--card2);border-radius:.8rem;padding:.7rem .85rem;margin:0 0 .55rem;word-break:break-all;line-height:1.8"></p>
      <p id="deleteFileMeta" style="font-size:.74rem;color:var(--dim);margin:0;line-height:1.7"></p>
    </div>

    <div style="background:linear-gradient(180deg,#fff7ed 0%,#fff 100%);border:1px solid rgba(249,115,22,.18);border-radius:1rem;padding:.9rem 1rem;margin-bottom:1rem">
      <div style="display:flex;align-items:flex-start;gap:.75rem">
        <span style="font-size:1.15rem;line-height:1">⚠️</span>
        <div style="flex:1">
          <div style="font-size:.8rem;font-weight:900;color:var(--text);margin-bottom:.25rem">خيار إضافي للحذف المرتبط</div>
          <label style="display:flex;align-items:flex-start;gap:.65rem;cursor:pointer;font-size:.82rem;line-height:1.8;color:var(--slate)">
            <input type="checkbox" id="deleteWithData" style="width:16px;height:16px;margin-top:.15rem;cursor:pointer">
            <span>
              حذف بيانات المؤشرات المرتبطة بهذا الملف لهذا الربع فقط
              <span style="display:block;font-size:.73rem;color:var(--dim);margin-top:.2rem">لن يتم حذف المؤشرات نفسها، ولن تتأثر بيانات الأرباع الأخرى.</span>
            </span>
          </label>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:.7rem">
      <button onclick="closeDeleteFileModal()" style="flex:1;background:#fff;border:1px solid var(--border);color:var(--slate);border-radius:.85rem;padding:.78rem;font-family:'Almarai',sans-serif;font-size:.83rem;font-weight:800;cursor:pointer">إلغاء</button>
      <button onclick="confirmDeleteFile(document.getElementById('deleteWithData').checked)" style="flex:1.4;background:linear-gradient(135deg,#c2410c 0%,#b91c1c 100%);color:#fff;border:none;border-radius:.85rem;padding:.78rem;font-family:'Almarai',sans-serif;font-size:.84rem;font-weight:900;cursor:pointer;box-shadow:0 14px 30px rgba(185,28,28,.18)">تأكيد الحذف الآن</button>
    </div>
  </div>
</div>
</body>
</html>
