/**
 * PM2 — منصة مِقياس
 * التشغيل: pm2 start ecosystem.config.js --env production
 * إعادة التحميل: pm2 reload ecosystem.config.js --env production --update-env
 *
 * ملاحظة: instances=1 — لا ترفع العدد إلا بعد التأكد من عدم الاعتماد على ذاكرة
 * الخادم بين طلبات متعددة (مثل previewCache في الاستيراد).
 */
module.exports = {
  apps: [
    {
      name: "miqyas",
      cwd: "./.next/standalone",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};

/**
 * ── Cron يومي (بديل PM2 cron — يُفضّل crontab النظام) ──
 *
 * أضف في crontab المستخدم الذي يملك .env:
 *
 *   0 6 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://SUBDOMAIN.example.org/api/cron >> /var/log/miqyas-cron.log 2>&1
 *
 * يُشغّل: الإنذار المبكر + تصعيد الإجراءات المتأخرة.
 * راجع DEPLOYMENT.md للتفاصيل.
 */
