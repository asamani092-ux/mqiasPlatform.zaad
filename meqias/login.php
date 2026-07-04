<!DOCTYPE html>
<?php
// ═══════════════════════════════════════════════════
//  login.php — صفحة تسجيل الدخول
//  منصة مِقياس · جمعية الزاد 2026
// ═══════════════════════════════════════════════════
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
session_start();

if (!empty($_SESSION['user_id'])) {
    header('Location: index.php'); exit;
}

$error = $success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']    ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$email || !$password) {
        $error = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
    } else {
        try {
            $db   = getDB();
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND status = 'active' LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user']    = [
                    'id'         => $user['id'],
                    'name'       => $user['name'],
                    'role'       => $user['role'],
                    'department' => $user['department'],
                    'email'      => $user['email'],
                    'avatar'     => mb_substr($user['name'], 0, 1),
                ];
                try { $db->prepare("UPDATE users SET last_login=NOW() WHERE id=?")->execute([$user['id']]); } catch(Exception $e){}
                header('Location: index.php'); exit;
            } else {
                $error = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            }
        } catch (Exception $e) {
            $error = 'تعذّر الاتصال بقاعدة البيانات — تحقق من config.php';
        }
    }
}
?>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تسجيل الدخول | منصة مِقياس</title>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap" rel="stylesheet">
<style>
* { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:    #f6f7f4;
  --card:  #ffffff;
  --card2: #f1f3ef;
  --border:#e2e5dd;
  --bhi:   #c8cebf;
  --teal:  #0f5132;
  --cyan:  #157f6d;
  --red:   #c0392b;
  --slate: #71808a;
  --text:  #1f2a2e;
  --dim:   #5b6b73;
  --inp-bg:#f8fafc;
  --maroon:#0b3d2e;
}
body.light {
  --bg:    #f6f7f4;
  --card:  #ffffff;
  --border:#e2e5dd;
  --bhi:   #c8cebf;
  --teal:  #0f5132;
  --cyan:  #157f6d;
  --red:   #c0392b;
  --slate: #71808a;
  --text:  #1f2a2e;
  --dim:   #5b6b73;
  --inp-bg:#f8fafc;
}
body {
  font-family:'Almarai',sans-serif;
  background:var(--bg);
  color:var(--text);
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  transition: background .4s, color .4s;
  background-image:
    radial-gradient(ellipse 70% 60% at 15% 0%,   rgba(0,201,167,.08) 0%,transparent 60%),
    radial-gradient(ellipse 50% 50% at 85% 100%,  rgba(0,180,216,.06) 0%,transparent 60%);
}

/* ── Card ── */
.login-wrap {
  width:100%;
  max-width:440px;
  padding:1.5rem;
}

.logo-area {
  text-align:center;
  margin-bottom:2rem;
  animation:fadeDown .5s ease;
}
.logo-icon {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:64px; height:64px;
  border-radius:1.1rem;
  background:linear-gradient(135deg,var(--teal),var(--cyan));
  font-size:2rem;
  box-shadow:0 0 32px rgba(0,201,167,.25);
  margin-bottom:.9rem;
}
.logo-title {
  font-size:2.2rem;
  font-weight:800;
  color:var(--teal);
  letter-spacing:-1.5px;
  line-height:1;
}
.logo-sub {
  font-size:.8rem;
  color:var(--slate);
  margin-top:.35rem;
}

.card {
  background:var(--card);
  border:1px solid var(--border);
  border-radius:1.5rem;
  padding:2rem 2.25rem;
  animation:fadeUp .5s ease .1s both;
}

h2 {
  font-size:1.25rem;
  font-weight:800;
  margin-bottom:.35rem;
}
.sub { font-size:.8rem; color:var(--slate); margin-bottom:1.75rem; }

/* ── Inputs ── */
.field { margin-bottom:1.1rem; }
label {
  display:block;
  font-size:.75rem;
  font-weight:700;
  color:var(--slate);
  margin-bottom:.4rem;
}
.inp-wrap { position:relative; }
.inp-wrap .icon {
  position:absolute;
  top:50%; right:.9rem;
  transform:translateY(-50%);
  font-size:1rem;
  color:var(--dim);
  pointer-events:none;
}
input[type=email],
input[type=password],
input[type=text] {
  width:100%;
  background:var(--inp-bg);
  border:1px solid var(--border);
  border-radius:.7rem;
  padding:.7rem 2.4rem .7rem .9rem;
  color:var(--text);
  font-family:'Almarai',sans-serif;
  font-size:.88rem;
  outline:none;
  transition:border-color .2s, box-shadow .2s;
}
input:focus {
  border-color:var(--teal);
  box-shadow:0 0 0 3px rgba(0,201,167,.12);
}

/* Show/hide password */
.eye-btn {
  position:absolute;
  top:50%; left:.9rem;
  transform:translateY(-50%);
  background:none; border:none;
  cursor:pointer; color:var(--dim);
  font-size:.9rem; padding:.2rem;
  transition:color .2s;
}
.eye-btn:hover { color:var(--teal); }

/* ── Remember me ── */
.remember {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:1.5rem;
  font-size:.78rem;
}
.remember label {
  display:flex; align-items:center; gap:.4rem;
  color:var(--slate); cursor:pointer; margin:0;
}
.remember input[type=checkbox] { accent-color:var(--teal); width:14px; height:14px; }
.remember a { color:var(--teal); text-decoration:none; }
.remember a:hover { text-decoration:underline; }

/* ── Button ── */
.btn-login {
  width:100%;
  background:linear-gradient(135deg,var(--teal),var(--cyan));
  color:#07111f;
  border:none;
  border-radius:.8rem;
  padding:.85rem;
  font-family:'Almarai',sans-serif;
  font-size:.95rem;
  font-weight:800;
  cursor:pointer;
  transition:opacity .2s, transform .15s;
  box-shadow:0 4px 20px rgba(0,201,167,.25);
}
.btn-login:hover   { opacity:.9; transform:translateY(-1px); }
.btn-login:active  { transform:translateY(0); }
.btn-login:disabled{ opacity:.5; cursor:not-allowed; transform:none; }

/* ── Alerts ── */
.alert {
  border-radius:.75rem;
  padding:.8rem 1rem;
  font-size:.82rem;
  font-weight:700;
  margin-bottom:1.25rem;
  display:flex;
  align-items:center;
  gap:.5rem;
}
.alert-error   { background:rgba(255,77,109,.1);  border:1px solid rgba(255,77,109,.3); color:var(--red);  }
.alert-success { background:rgba(0,201,167,.1);   border:1px solid rgba(0,201,167,.3);  color:var(--teal); }

/* ── Default credentials hint ── */
.hint-box {
  margin-top:1.25rem;
  background:#061525;
  border:1px dashed var(--border);
  border-radius:.9rem;
  padding:1rem 1.25rem;
  font-size:.76rem;
  color:var(--dim);
  text-align:center;
  line-height:1.8;
}
.hint-box strong { color:var(--teal); }
.hint-box .fill-btn {
  display:inline-block;
  margin-top:.5rem;
  background:rgba(0,201,167,.1);
  border:1px solid rgba(0,201,167,.25);
  color:var(--teal);
  padding:.3rem .9rem;
  border-radius:.5rem;
  font-size:.74rem;
  font-weight:700;
  cursor:pointer;
  transition:background .2s;
  font-family:'Almarai',sans-serif;
}
.hint-box .fill-btn:hover { background:rgba(0,201,167,.2); }

/* ── Footer ── */
.login-footer {
  text-align:center;
  font-size:.73rem;
  color:var(--dim);
  margin-top:1.5rem;
  animation:fadeUp .5s ease .25s both;
}

/* ── Animations ── */
@keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }

/* ── Loading spinner ── */
.spinner {
  display:inline-block;
  width:16px; height:16px;
  border:2px solid rgba(7,17,31,.4);
  border-top-color:#07111f;
  border-radius:50%;
  animation:spin .7s linear infinite;
  vertical-align:middle;
  margin-left:.4rem;
}
@keyframes spin { to { transform:rotate(360deg); } }

/* ══ وضع النهار ══════════════════════════════════ */
body.light {
  --bg:    #f0f4f8;
  --card:  #ffffff;
  --border:#cbd5e1;
  --bhi:   #94a3b8;
  --teal:  #0097a7;
  --slate: #475569;
  --text:  #0f172a;
  --dim:   #94a3b8;
  --red:   #dc2626;
}
body.light input { background:#f8fafc; color:#0f172a; border-color:#cbd5e1; }
body.light .hint-box { background:#f1f5f9; border-color:#cbd5e1; }
body.light .alert-error { background:rgba(220,38,38,.08); }
/* زر التبديل */
.theme-btn {
  position:fixed; top:1.25rem; left:1.25rem;
  background:var(--card); border:1px solid var(--border);
  border-radius:99px; padding:.4rem .9rem;
  font-size:.75rem; font-weight:700; color:var(--slate);
  cursor:pointer; transition:all .25s; z-index:50;
  font-family:'Almarai',sans-serif;
  display:flex; align-items:center; gap:.4rem;
  box-shadow:0 2px 8px rgba(0,0,0,.15);
}
.theme-btn:hover { border-color:var(--bhi); color:var(--text); }
@media (max-width: 640px) {
  .login-wrap { padding: 1rem; }
  .card { padding: 1.35rem 1.1rem; border-radius: 1.1rem; }
  .logo-title { font-size: 1.8rem; }
  .theme-btn {
    top: .75rem;
    left: .75rem;
    padding: .35rem .75rem;
  }
}
</style>
</head>
<body>

<div class="login-wrap">

  <!-- Logo -->
  <div class="logo-area">
    <div class="logo-icon">📊</div>
    <div class="logo-title">مِقياس</div>
    <div class="logo-sub">منصة قياس الأداء المؤسسي · جمعية الزاد 2026</div>
  </div>

  <!-- Card -->
  <div class="card">
    <h2>مرحباً بك 👋</h2>
    <p class="sub">سجّل دخولك للوصول إلى لوحة الأداء</p>

    <?php if ($error): ?>
      <div class="alert alert-error">❌ <?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <?php if ($success): ?>
      <div class="alert alert-success">✅ <?= htmlspecialchars($success) ?></div>
    <?php endif; ?>

    <form method="POST" id="loginForm" onsubmit="handleSubmit(event)">
      <input type="hidden" name="action" value="login">

      <!-- Email -->
      <div class="field">
        <label for="email">البريد الإلكتروني</label>
        <div class="inp-wrap">
          <span class="icon">✉️</span>
          <input type="email" id="email" name="email"
                 placeholder="admin@miqyas.sa"
                 value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
                 autocomplete="email" required>
        </div>
      </div>

      <!-- Password -->
      <div class="field">
        <label for="password">كلمة المرور</label>
        <div class="inp-wrap">
          <span class="icon">🔑</span>
          <input type="password" id="password" name="password"
                 placeholder="••••••••"
                 autocomplete="current-password" required>
          <button type="button" class="eye-btn" onclick="togglePass()" id="eyeBtn" title="إظهار/إخفاء">
            👁️
          </button>
        </div>
      </div>

      <!-- Remember -->
      <div class="remember">
        <label>
          <input type="checkbox" name="remember" value="1">
          تذكّرني
        </label>
        <a href="#">نسيت كلمة المرور؟</a>
      </div>

      <!-- Submit -->
      <button type="submit" class="btn-login" id="submitBtn">
        تسجيل الدخول
      </button>
    </form>

    <!-- Theme Toggle -->
    <div style="display:flex;justify-content:center;margin-top:1rem">
      <button onclick="toggleTheme()" style="display:flex;align-items:center;gap:.5rem;background:transparent;border:1px solid var(--border);border-radius:.75rem;padding:.4rem .9rem;cursor:pointer;font-family:'Almarai',sans-serif;font-size:.75rem;font-weight:700;color:var(--slate);transition:all .2s" id="themeBtn">
        🌙 الوضع الليلي
      </button>
    </div>

    <!-- Default credentials hint -->
    <div class="hint-box">
      بيانات الدخول الافتراضية للمنصة:<br>
      📧 البريد: <strong><a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="f9989d949097b994908880988ad78a98">[email&#160;protected]</a></strong><br>
      🔑 كلمة المرور: <strong>Admin@2026</strong><br>
      <button class="fill-btn" onclick="fillDefault()">تعبئة تلقائية ←</button>
    </div>
  </div>

  <!-- Footer -->
  <div class="login-footer">
    © 2026 منصة مِقياس · جمعية الزاد · جميع الحقوق محفوظة
  </div>

</div>

<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
function togglePass() {
  const inp = document.getElementById('password');
  const btn = document.getElementById('eyeBtn');
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁️'; }
}
function fillDefault() {
  document.getElementById('email').value    = 'admin@miqyas.sa';
  document.getElementById('password').value = 'Admin@2026';
  document.getElementById('eyeBtn').textContent = '👁️';
}
function handleSubmit(e) {
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = 'جارٍ التحقق… <span class="spinner"></span>';
}
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('miqyas_theme', isLight ? 'light' : 'dark');
  document.getElementById('themeBtnIcon').textContent = isLight ? '☀️' : '🌙';
  document.getElementById('themeBtnText').textContent = isLight ? 'نهاري' : 'ليلي';
}
(function(){
  if(localStorage.getItem('miqyas_theme') === 'light'){
    document.body.classList.add('light');
    window.addEventLi
</script>
</body>
</html>
