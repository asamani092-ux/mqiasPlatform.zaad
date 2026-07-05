// بذرة قاعدة البيانات — الهيكل التنظيمي والأهداف الاستراتيجية (منقولة من المنصة القديمة)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("يجب ضبط DATABASE_URL في ملف .env قبل تشغيل البذرة");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const DEPARTMENTS: [number, string, string, [number, string, string][]][] = [
  [1, "الرعاية والتمكين", "#00c9a7", [[1, "إسناد ونمو", "1/1"], [2, "التمكين", "1/2"], [3, "الرعاية", "1/3"], [4, "البحث الاجتماعي", "1/4"]]],
  [2, "التكافل المجتمعي", "#00b4d8", [[1, "التطوع", "2/1"], [2, "التكافل المجتمعي", "2/2"]]],
  [3, "الاستدامة", "#f4a535", [[1, "شركة ثمين", "3/1"], [2, "المشاريع الاستثمارية", "3/2"], [3, "الإسناد", "3/3"]]],
  [4, "الأداء والنمو", "#a78bfa", [[1, "الاستراتيجية", "4/1"], [2, "الموارد البشرية", "4/2"], [3, "مكتب المشاريع", "4/3"]]],
  [5, "الشؤون المالية والإدارية", "#fb7185", [[1, "المالية", "5/1"], [2, "التقنية", "5/2"], [3, "الإدارية", "5/3"]]],
  [6, "الاتصال المؤسسي", "#34d399", [[1, "الإعلام", "6/1"], [2, "تنمية الموارد", "6/2"], [3, "العلاقات والشركات", "6/3"]]],
];

const STRATEGIC_GOALS: [string, string, string][] = [
  ["ع1", "توفير الاحتياجات الضرورية للأسر", "محور العملاء"],
  ["ع2", "تمكين الأسر من الاستغناء عن الدعم", "محور العملاء"],
  ["ع3", "حماية الأسر من مسببات الفقر", "محور العملاء"],
  ["ع4", "تعزيز المشاركة المجتمعية", "محور العملاء"],
  ["م1", "تحقيق الاستدامة المالية", "المحور المالي"],
  ["م2", "تنويع مصادر الدخل", "المحور المالي"],
  ["د1", "تطوير البرامج والخدمات", "محور العمليات الداخلية"],
  ["د2", "تحسين كفاءة العمليات", "محور العمليات الداخلية"],
  ["د3", "الاستفادة من التقنية", "محور العمليات الداخلية"],
  ["د4", "تعزيز الشراكات", "محور العمليات الداخلية"],
  ["د5", "تقوية الحضور المؤسسي", "محور العمليات الداخلية"],
  ["ن1", "تطوير كفاءات الكوادر", "محور التعلم والنمو"],
  ["ن2", "تعزيز التطوع المؤسسي", "محور التعلم والنمو"],
  ["ن3", "تحسين بيئة العمل", "محور التعلم والنمو"],
  ["ن4", "ترسيخ ثقافة الحوكمة", "محور التعلم والنمو"],
  ["ن5", "إدارة المعرفة المؤسسية", "محور التعلم والنمو"],
];

async function main() {
  for (const [deptNo, name, color, sections] of DEPARTMENTS) {
    const dept = await db.department.upsert({
      where: { deptNo },
      update: { name, color },
      create: { deptNo, name, color },
    });
    for (const [sectionNo, sName, code] of sections) {
      await db.section.upsert({
        where: { code },
        update: { name: sName },
        create: { sectionNo, name: sName, code, departmentId: dept.id },
      });
    }
  }

  let i = 0;
  for (const [code, title, axis] of STRATEGIC_GOALS) {
    await db.strategicGoal.upsert({
      where: { code },
      update: { title, description: axis },
      create: { code, title, description: axis, sortOrder: i++ },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@zad.org.sa";
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) throw new Error("يجب ضبط ADMIN_PASSWORD في ملف .env قبل تشغيل البذرة");
  await db.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: await bcrypt.hash(adminPass, 12), status: "ACTIVE" },
    create: {
      name: "مكتب إدارة الأداء",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 12),
      role: "SYSTEM_ADMIN",
    },
  });

  const settings: [string, string][] = [
    ["section_head_can_approve", "0"],
    ["early_warning_gap_pct", "20"],
    ["action_escalation_days", "0"],
    ["current_year", String(new Date().getFullYear())],
  ];
  for (const [key, value] of settings) {
    await db.systemSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  console.log("✅ اكتملت البذرة: 6 إدارات، 18 قسمًا، 16 هدفًا استراتيجيًا، حساب المشرف");
}

main()
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
