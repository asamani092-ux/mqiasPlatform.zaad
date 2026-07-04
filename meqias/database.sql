-- ═══════════════════════════════════════════════════════════════
--  database.sql — قاعدة بيانات منصة مِقياس الكاملة
--  جمعية الزاد 2026
--  الاستخدام: mysql -u root -p123456 < database.sql
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS `miqyas_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `miqyas_db`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ══════════════════════════════════════════════════════════════
-- 1. الإدارات والأقسام
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `dept_no`      INT NOT NULL COMMENT 'رقم الإدارة',
  `dept_name`    VARCHAR(200) NOT NULL COMMENT 'اسم الإدارة',
  `section_no`   INT          COMMENT 'رقم القسم',
  `section_name` VARCHAR(200) COMMENT 'اسم القسم',
  `section_code` VARCHAR(20)  COMMENT 'رمز القسم مثل 1/1',
  `color`        VARCHAR(20)  DEFAULT '#00c9a7',
  `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 2. الأهداف الاستراتيجية
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `strategic_goals`;
CREATE TABLE `strategic_goals` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `code`        VARCHAR(20)  NOT NULL UNIQUE COMMENT 'مثل ع1 أو م2',
  `name`        VARCHAR(500) NOT NULL,
  `description` TEXT,
  `axis`        VARCHAR(50)  COMMENT 'المحور: ع م د ن',
  `axis_name`   VARCHAR(100) COMMENT 'اسم المحور',
  `status`      ENUM('active','inactive') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 3. الأهداف التشغيلية
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `operational_goals`;
CREATE TABLE `operational_goals` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `code`        VARCHAR(20)  NOT NULL UNIQUE,
  `name`        VARCHAR(500) NOT NULL,
  `description` TEXT,
  `department`  VARCHAR(200),
  `status`      ENUM('active','inactive') DEFAULT 'active',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 4. المؤشرات (KPIs)
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `kpis`;
CREATE TABLE `kpis` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `code`          VARCHAR(50)  NOT NULL UNIQUE COMMENT 'مثل ع1-1 أو FIN-01-KPI-01',
  `goal_code`     VARCHAR(20)  COMMENT 'رمز الهدف المرتبط',
  `name`          VARCHAR(500) NOT NULL,
  `description`   TEXT,
  `unit`          VARCHAR(100) COMMENT 'وحدة القياس: ريال، نسبة، عدد...',
  `direction`     ENUM('زيادة','نقصان','ثبات') DEFAULT 'زيادة' COMMENT 'اتجاه التحسن',
  `frequency`     ENUM('شهري','ربع سنوي','نصف سنوي','سنوي') DEFAULT 'ربع سنوي',
  `type`          ENUM('strategic','operational') NOT NULL,
  `owner_dept`    VARCHAR(200) COMMENT 'الإدارة المالكة',
  `annual_target` DECIMAL(18,4) COMMENT 'المستهدف السنوي',
  `weight`        DECIMAL(5,2) DEFAULT 1.00 COMMENT 'الوزن النسبي',
  `status`        ENUM('active','inactive') DEFAULT 'active',
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_code`      (`code`),
  INDEX `idx_type`      (`type`),
  INDEX `idx_goal_code` (`goal_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 5. قيم المؤشرات (الأرباع)
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `kpi_values`;
CREATE TABLE `kpi_values` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `kpi_id`     INT      NOT NULL,
  `year`       SMALLINT NOT NULL DEFAULT 2026,
  `quarter`    TINYINT  NOT NULL COMMENT '1-4',
  `target`     DECIMAL(18,4) COMMENT 'المستهدف الربعي',
  `actual`     DECIMAL(18,4) DEFAULT NULL COMMENT 'القيمة الفعلية',
  `manual_actual` DECIMAL(18,4) DEFAULT NULL COMMENT 'القيمة اليدوية الأصلية قبل إضافات الملفات',
  `source_file` VARCHAR(255) DEFAULT NULL COMMENT 'آخر ملف أو مؤشر تعدد الملفات',
  `notes`      TEXT,
  `status`     ENUM('exceeded','achieved','partial','not_achieved','pending') DEFAULT 'pending',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_kpi_quarter` (`kpi_id`, `year`, `quarter`),
  FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON DELETE CASCADE,
  INDEX `idx_year_quarter` (`year`, `quarter`),
  INDEX `idx_source_file` (`source_file`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `kpi_file_imports`;
CREATE TABLE `kpi_file_imports` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `filename`   VARCHAR(255) NOT NULL,
  `kpi_id`     INT NOT NULL,
  `year`       SMALLINT NOT NULL DEFAULT 2026,
  `quarter`    TINYINT NOT NULL,
  `target`     DECIMAL(18,4) DEFAULT NULL,
  `actual`     DECIMAL(18,4) DEFAULT NULL,
  `notes`      TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_kpi_file_import` (`filename`, `kpi_id`, `year`, `quarter`),
  INDEX `idx_file_import_filename` (`filename`),
  INDEX `idx_file_import_period` (`kpi_id`, `year`, `quarter`),
  FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 6. نظام الإنذار المبكر
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `early_warning_log`;
CREATE TABLE `early_warning_log` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `kpi_id`      INT,
  `year`        SMALLINT,
  `quarter`     TINYINT,
  `deviation`   DECIMAL(8,4)  COMMENT 'نسبة الانحراف %',
  `risk_level`  ENUM('high','medium','low','ok') DEFAULT 'medium',
  `action`      VARCHAR(500)  COMMENT 'الإجراء المقترح',
  `responsible` VARCHAR(200)  COMMENT 'الجهة المسؤولة',
  `due_date`    DATE NULL,
  `closed_at`   TIMESTAMP NULL,
  `status`      ENUM('open','in_progress','closed') DEFAULT 'open',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 7. المستخدمون
-- ══════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(200) NOT NULL,
  `role`       ENUM('admin','manager','viewer') DEFAULT 'viewer',
  `department` VARCHAR(200),
  `email`      VARCHAR(200) UNIQUE,
  `password`   VARCHAR(255),
  `last_login` TIMESTAMP NULL,
  `status`     ENUM('active','inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════════════════════════
-- حقن البيانات الأساسية
-- ══════════════════════════════════════════════════════════════

-- الإدارات والأقسام
INSERT INTO `departments` (dept_no,dept_name,section_no,section_name,section_code,color) VALUES
(1,'الرعاية والتمكين',1,'إسناد ونمو','1/1','#00c9a7'),
(1,'الرعاية والتمكين',2,'التمكين','1/2','#00c9a7'),
(1,'الرعاية والتمكين',3,'الرعاية','1/3','#00c9a7'),
(1,'الرعاية والتمكين',4,'البحث الاجتماعي','1/4','#00c9a7'),
(2,'التكافل المجتمعي',1,'التطوع','2/1','#00b4d8'),
(2,'التكافل المجتمعي',2,'التكافل المجتمعي','2/2','#00b4d8'),
(3,'الاستدامة',1,'شركة ثمين','3/1','#f4a535'),
(3,'الاستدامة',2,'المشاريع الاستثمارية','3/2','#f4a535'),
(3,'الاستدامة',3,'الإسناد','3/3','#f4a535'),
(4,'الأداء والنمو',1,'الاستراتيجية','4/1','#a78bfa'),
(4,'الأداء والنمو',2,'الموارد البشرية','4/2','#a78bfa'),
(4,'الأداء والنمو',3,'مكتب المشاريع','4/3','#a78bfa'),
(5,'الشؤون المالية والإدارية',1,'المالية','5/1','#fb7185'),
(5,'الشؤون المالية والإدارية',2,'التقنية','5/2','#fb7185'),
(5,'الشؤون المالية والإدارية',3,'الإدارية','5/3','#fb7185'),
(6,'الاتصال المؤسسي',1,'الإعلام','6/1','#34d399'),
(6,'الاتصال المؤسسي',2,'تنمية الموارد','6/2','#34d399'),
(6,'الاتصال المؤسسي',3,'العلاقات والشركات','6/3','#34d399');

-- الأهداف الاستراتيجية
INSERT INTO `strategic_goals` (code,name,axis,axis_name) VALUES
('ع1','توفير الاحتياجات الضرورية للأسر','ع','محور العملاء'),
('ع2','تمكين الأسر من الاستغناء عن الدعم','ع','محور العملاء'),
('ع3','حماية الأسر من مسببات الفقر','ع','محور العملاء'),
('ع4','تعزيز المشاركة المجتمعية','ع','محور العملاء'),
('م1','تحقيق الاستدامة المالية','م','المحور المالي'),
('م2','تنويع مصادر الدخل','م','المحور المالي'),
('د1','تطوير البرامج والخدمات','د','محور العمليات الداخلية'),
('د2','تحسين كفاءة العمليات','د','محور العمليات الداخلية'),
('د3','الاستفادة من التقنية','د','محور العمليات الداخلية'),
('د4','تعزيز الشراكات','د','محور العمليات الداخلية'),
('د5','تقوية الحضور المؤسسي','د','محور العمليات الداخلية'),
('ن1','تطوير كفاءات الكوادر','ن','محور التعلم والنمو'),
('ن2','تعزيز التطوع المؤسسي','ن','محور التعلم والنمو'),
('ن3','تحسين بيئة العمل','ن','محور التعلم والنمو'),
('ن4','ترسيخ ثقافة الحوكمة','ن','محور التعلم والنمو'),
('ن5','إدارة المعرفة المؤسسية','ن','محور التعلم والنمو');

-- المؤشرات الاستراتيجية (34 مؤشر)
INSERT INTO `kpis` (code,goal_code,name,unit,type,owner_dept,annual_target) VALUES
('ع1-1','ع1','متوسط ما تتحصل عليه الأسرة من الجمعية','ريال','strategic','الرعاية والتمكين',20000),
('ع2-1','ع1','نسبة الأسر التي تم توفير الاحتياجات الضرورية لها','نسبة','strategic','الرعاية والتمكين',0.94),
('ع1-2','ع2','عدد المستفيدين الذين تم تأهيلهم','مستفيد','strategic','الرعاية والتمكين',450),
('ع2-2','ع2','عدد الأسر التي استغنت عن خدمات الجمعية','أسرة','strategic','التكافل المجتمعي',50),
('ع1-3','ع3','عدد المبادرات المنفذة لحماية الأسر من مسببات الفقر','مبادرة','strategic','التكافل المجتمعي',7),
('ع2-3','ع3','عدد المستفيدين من المبادرات','مستفيد','strategic','التكافل المجتمعي',40000),
('ع1-4','ع4','عدد مشاريع المشاركة المجتمعية','مشروع','strategic','التكافل المجتمعي',7),
('ع2-4','ع4','عدد المشاركين من المجتمع','مشارك','strategic','التكافل المجتمعي',70000),
('م1-1','م1','صافي أرباح المصادر الثابتة','ريال','strategic','الشؤون المالية والإدارية',1500000),
('م2-1','م1','صافي أرباح الاستثمارات','ريال','strategic','الاستدامة',10350000),
('م1-2','م2','عدد مصادر الدخل الجديدة','مصدر دخل','strategic','الاتصال المؤسسي',1),
('م2-2','م2','إجمالي الإيرادات من مصادر الدخل الجديدة','ريال','strategic','الاتصال المؤسسي',50000),
('م3-2','م2','إجمالي التبرعات','ريال','strategic','الاتصال المؤسسي',0),
('د1-1','د1','عدد البرامج المبتكرة التي تم تصميمها','برامج','strategic','الرعاية والتمكين',14),
('د2-1','د1','عدد الخدمات المبتكرة التي تم تصميمها','خدمة','strategic','الرعاية والتمكين',18),
('د1-2','د2','نسبة مصاريف البرامج والأنشطة إلى إجمالي المصاريف','نسبة','strategic','الشؤون المالية والإدارية',0.85),
('د2-2','د2','عدد العمليات التي تم تجويدها','عملية','strategic','الشؤون المالية والإدارية',1),
('د1-3','د3','نسبة نضج واستدامة البيئة التقنية','نسبة','strategic','الشؤون المالية والإدارية',1),
('د1-4','د4','عدد الشراكات الفاعلة','شراكة','strategic','الاتصال المؤسسي',80),
('د2-4','د4','عدد الزيارات المنفذة للشركاء','عدد','strategic','الاتصال المؤسسي',52),
('د1-5','د5','عدد المشاركات الإعلامية','مشاركة','strategic','الاتصال المؤسسي',200),
('د2-5','د5','عدد مرات الظهور الإعلامي','مشاهدة','strategic','الاتصال المؤسسي',5000000),
('د3-5','د5','عدد قنوات الظهور الإعلامي','قناة','strategic','الاتصال المؤسسي',20),
('ن1-1','ن1','متوسط عدد الساعات التطويرية المقدمة للفرد','ساعة','strategic','الأداء والنمو',50),
('ن2-1','ن1','نسبة الموظفين المؤهلين مهنياً','نسبة','strategic','الأداء والنمو',0.65),
('ن1-2','ن2','عدد المتطوعين في أعمال وبرامج الجمعية','متطوع','strategic','التكافل المجتمعي',2500),
('ن2-2','ن2','عدد الساعات التطوعية','ساعة','strategic','التكافل المجتمعي',70000),
('ن1-3','ن3','نسبة رضا العاملين عن بيئة العمل','نسبة','strategic','الأداء والنمو',0.88),
('ن2-3','ن3','إجمالي تكلفة المبادرات التحفيزية','ريال','strategic','الأداء والنمو',70000),
('ن1-4','ن4','نسبة اكتمال اللوائح والسياسات','نسبة','strategic','جميع الإدارات',1),
('ن2-4','ن4','الدرجة المتحصلة في معايير الحوكمة','درجة','strategic','الأداء والنمو',1),
('ن1-5','ن5','عدد المبادرات المنفذة في تطوير إدارة المعرفة','مبادرة','strategic','الأداء والنمو',4),
('ن2-5','ن5','عدد مبادرات الابتكار المنفذة','مبادرة','strategic','الأداء والنمو',2),
('ن3-5','ن5','نسبة توثيق العمليات والمعرفة','نسبة','strategic','الأداء والنمو',0.80);

-- المؤشرات التشغيلية (43 مؤشر)
INSERT INTO `kpis` (code,goal_code,name,unit,type,owner_dept,annual_target) VALUES
('FIN-01-KPI-01','FIN-01','نسبة إشغال العقارات الاستثمارية','نسبة','operational','الشؤون المالية والإدارية',0.30),
('FIN-02-KPI-01','FIN-02','نسبة تحصيل المستحقات المالية','ريال','operational','الشؤون المالية والإدارية',100000),
('FIN-03-KPI-01','FIN-03','نسبة الالتزام بمعيار السلامة المالية','نسبة','operational','الشؤون المالية والإدارية',1),
('FIN-04-KPI-01','FIN-04','الالتزام بإعداد التقرير المالي الربعي','عدد','operational','الشؤون المالية والإدارية',4),
('FIN-05-KPI-01','FIN-05','نسبة دقة التوقعات المالية','نسبة','operational','الشؤون المالية والإدارية',0.90),
('FIN-06-KPI-01','FIN-06','نسبة الالتزام بالميزانية التشغيلية','نسبة','operational','الشؤون المالية والإدارية',0.95),
('GOV-01-KPI-01','GOV-01','نسبة الالتزام بزمن تقديم الاستشارات القانونية','نسبة','operational','الأداء والنمو',1),
('GOV-02-KPI-01','GOV-02','التزام الجمعية بتطبيق معايير الحوكمة','نسبة','operational','الأداء والنمو',0.98),
('GOV-03-KPI-01','GOV-03','نسبة تنفيذ قرارات مجلس الإدارة','نسبة','operational','الأداء والنمو',1),
('GOV-04-KPI-01','GOV-04','عدد اجتماعات مجلس الإدارة المنعقدة','عدد','operational','الأداء والنمو',4),
('HR-01-KPI-01','HR-01','مؤشر عدد المتدربين','عدد','operational','الأداء والنمو',70),
('HR-02-KPI-01','HR-02','نسبة تطبيق خطط التطوير الفردية','نسبة','operational','الأداء والنمو',0.70),
('HR-03-KPI-01','HR-03','نسبة الالتزام بساعات العمل','نسبة','operational','الأداء والنمو',0.90),
('HR-03-KPI-02','HR-03','نسبة الموظفين الذين تم تقييمهم','نسبة','operational','الأداء والنمو',1),
('HR-04-KPI-01','HR-04','معدل دوران الموظفين','نسبة','operational','الأداء والنمو',0.10),
('HR-05-KPI-01','HR-05','نسبة رضا الموظفين عن برامج التدريب','نسبة','operational','الأداء والنمو',0.85),
('IT-01-KPI-01','IT-01','متوسط زمن إغلاق الطلبات التقنية','يوم','operational','الشؤون المالية والإدارية',2),
('IT-01-KPI-02','IT-01','نسبة الطلبات التقنية المغلقة','نسبة','operational','الشؤون المالية والإدارية',0.85),
('IT-02-KPI-01','IT-02','معدل تكرار الطلبات التقنية','نسبة','operational','الشؤون المالية والإدارية',0.15),
('IT-02-KPI-02','IT-02','نسبة الأقسام الملتزمة بالأنظمة التقنية','نسبة','operational','الشؤون المالية والإدارية',0.85),
('IT-03-KPI-01','IT-03','نسبة توافر الأنظمة (Uptime)','نسبة','operational','الشؤون المالية والإدارية',0.99),
('STR-01-KPI-01','STR-01','مؤشر الوعي بإدارة المشاريع','نسبة','operational','الأداء والنمو',0.80),
('STR-02-KPI-01','STR-02','نسبة مواءمة الخطط التشغيلية','نسبة','operational','الأداء والنمو',1),
('STR-03-KPI-01','STR-03','نسبة التقدم في تحقيق مؤشرات الأداء','نسبة','operational','الأداء والنمو',0.70),
('STR-04-KPI-01','STR-04','عدد التقارير الاستراتيجية المنجزة','عدد','operational','الأداء والنمو',4),
('COM-01-KPI-01','COM-01','نسبة إنجاز المحتوى وفق خطة النشر','نسبة','operational','الاتصال المؤسسي',0.95),
('COM-02-KPI-01','COM-02','نسبة الالتزام بزمن تنفيذ الطلبات الإعلامية','نسبة','operational','الاتصال المؤسسي',0.95),
('COM-03-KPI-01','COM-03','معدل التفاعل على منصات التواصل','نسبة','operational','الاتصال المؤسسي',0.05),
('PRT-01-KPI-01','PRT-01','عدد الشراكات الجديدة الفاعلة','عدد','operational','الاتصال المؤسسي',10),
('PRT-02-KPI-01','PRT-02','نسبة تجديد الشراكات القائمة','نسبة','operational','الاتصال المؤسسي',0.80),
('PRG-01-KPI-01','PRG-01','مستوى رضا المشاركين عن الفعاليات','نسبة','operational','الاتصال المؤسسي',0.90),
('PRG-02-KPI-01','PRG-02','عدد البرامج المنفذة وفق الخطة','عدد','operational','الرعاية والتمكين',12),
('PRG-03-KPI-01','PRG-03','نسبة تحقيق مستهدف الاستعانة بالخبراء','نسبة','operational','التكافل المجتمعي',0.10),
('PRG-04-KPI-01','PRG-04','نسبة رضا المستفيدين عن الخدمات','نسبة','operational','الرعاية والتمكين',0.90),
('PRG-05-KPI-01','PRG-05','نسبة اكتمال ودقة بيانات المستفيدين','نسبة','operational','الرعاية والتمكين',0.95),
('EXP-01-KPI-01','EXP-01','نسبة تحقيق مستهدف انتشار خدمات الإدارة','نسبة','operational','التكافل المجتمعي',0.60),
('EXP-02-KPI-01','EXP-02','نسبة البرامج المنفذة بالشراكة','نسبة','operational','الرعاية والتمكين',0.85),
('OPS-01-KPI-01','OPS-01','نسبة دقة سجلات المخزون','نسبة','operational','الشؤون المالية والإدارية',0.97),
('OPS-02-KPI-01','OPS-02','نسبة الالتزام بتنفيذ طلبات الفعاليات','نسبة','operational','الاتصال المؤسسي',0.97),
('OPS-03-KPI-01','OPS-03','متوسط زمن الاستجابة لطلبات الخدمة','يوم','operational','الشؤون المالية والإدارية',2),
('VOL-01-KPI-01','VOL-01','نسبة احتفاظ المتطوعين','نسبة','operational','التكافل المجتمعي',0.75),
('VOL-02-KPI-01','VOL-02','متوسط ساعات تطوع الفرد','ساعة','operational','التكافل المجتمعي',28),
('VOL-03-KPI-01','VOL-03','نسبة رضا المتطوعين عن التجربة','نسبة','operational','التكافل المجتمعي',0.88);

-- مستهدفات الأرباع للمؤشرات الاستراتيجية
INSERT INTO `kpi_values` (kpi_id, year, quarter, target)
SELECT id, 2026, 1, CASE code
  WHEN 'ع1-1' THEN 4000   WHEN 'ع2-1' THEN 0.94  WHEN 'ع1-2' THEN 100
  WHEN 'ع2-2' THEN 5      WHEN 'ع2-3' THEN 11000  WHEN 'ع2-4' THEN 20000
  WHEN 'م1-1' THEN 300000 WHEN 'د1-1' THEN 3      WHEN 'د2-1' THEN 3
  WHEN 'د1-4' THEN 25     WHEN 'د1-5' THEN 70     WHEN 'د2-5' THEN 2500000
  WHEN 'ن1-1' THEN 10     WHEN 'ن1-2' THEN 1300   WHEN 'ن2-2' THEN 32000
  WHEN 'ن1-3' THEN 0.85   ELSE annual_target / 4
END
FROM kpis WHERE status='active';

-- المستخدم الأدمين
INSERT INTO `users` (name,email,password,role,department,status) VALUES
('عبدالعزيز الزهراني','admin@miqyas.sa',
 '$2y$10$v5jFwqhKLx1JHKMRqFmPj.hFHjADXHXHxwZ3nBi2Y9u1oJzl3Ydtu',
 'admin','إدارة الأداء والنمو','active')
ON DUPLICATE KEY UPDATE status='active';

-- ══════════════════════════════════════════════════════════════
--  ✅ قاعدة البيانات جاهزة
--  بيانات الدخول: admin@miqyas.sa / Admin@2026
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- 8. بطاقات الانحراف (migration_v2 + migration_v4)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `deviation_cards` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `kpi_id`            INT NOT NULL,
  `year`              SMALLINT NOT NULL DEFAULT 2026,
  `quarter`           TINYINT  NOT NULL,
  `deviation_pct`     DECIMAL(8,2) NOT NULL COMMENT 'نسبة الانحراف %',
  `actual`            DECIMAL(18,4),
  `target`            DECIMAL(18,4),
  `reason`            TEXT     COMMENT 'سبب الانحراف',
  `action`            TEXT     COMMENT 'الإجراء التصحيحي',
  `responsible`       VARCHAR(200) COMMENT 'المسؤول عن التصحيح',
  `due_date`          DATE NULL COMMENT 'تاريخ الإغلاق المتوقع',
  `impact`            TEXT          DEFAULT NULL COMMENT 'الأثر المتوقع في حال عدم المعالجة',
  `improvement_value` DECIMAL(18,4) DEFAULT NULL COMMENT 'قيمة التحسن بعد المعالجة',
  `improvement_pct`   DECIMAL(8,2)  DEFAULT NULL COMMENT 'نسبة التحسن %',
  `remeasure_date`    DATE          DEFAULT NULL COMMENT 'تاريخ إعادة القياس',
  `risk_level`        ENUM('مرتفع','متوسط','منخفض') DEFAULT NULL,
  `status`            ENUM('open','in_progress','under_execution','pending_verify','closed') DEFAULT 'open',
  `closed_at`         TIMESTAMP NULL,
  `closed_by`         VARCHAR(200),
  `created_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_dev_card` (`kpi_id`, `year`, `quarter`),
  FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON DELETE CASCADE,
  INDEX `idx_status` (`status`),
  INDEX `idx_year_q`  (`year`, `quarter`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ══════════════════════════════════════════════════════════════
-- 9. الحوكمة (migration_v2)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `governance_items` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `code`            VARCHAR(30) NOT NULL UNIQUE COMMENT 'رمز المعيار مثل GOV-01',
  `category`        ENUM('policies','procedures','committees','reports','compliance') DEFAULT 'compliance',
  `name`            VARCHAR(500) NOT NULL COMMENT 'اسم المعيار أو اللائحة',
  `description`     TEXT,
  `owner`           VARCHAR(200) COMMENT 'الجهة المسؤولة',
  `status`          ENUM('compliant','partial','non_compliant','pending') DEFAULT 'pending',
  `compliance_pct`  DECIMAL(5,2) DEFAULT 0 COMMENT 'نسبة الالتزام %',
  `notes_count`     INT DEFAULT 0 COMMENT 'عدد الملاحظات',
  `last_reviewed`   DATE NULL,
  `next_review`     DATE NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `governance_items` (code,category,name,owner,status,compliance_pct) VALUES
('GOV-01','policies',   'سياسة إدارة الأداء المؤسسي',          'الأداء والنمو',          'compliant',  95),
('GOV-02','procedures', 'إجراءات رفع تقارير الأداء الربعية',    'الأداء والنمو',          'compliant',  90),
('GOV-03','committees', 'لجنة الأداء والتطوير المؤسسي',         'الإدارة العليا',         'partial',    75),
('GOV-04','reports',    'تقرير الأداء الربعي',                  'الأداء والنمو',          'compliant',  100),
('GOV-05','compliance', 'معايير مكين للحوكمة',                  'جميع الإدارات',          'partial',    80),
('GOV-06','policies',   'سياسة إدارة المخاطر',                  'الشؤون المالية',         'pending',    40),
('GOV-07','procedures', 'إجراءات اعتماد الخطط التشغيلية',        'الأداء والنمو',          'compliant',  85),
('GOV-08','committees', 'مجلس الإدارة — الاجتماعات الدورية',    'الإدارة العليا',         'compliant',  100),
('GOV-09','compliance', 'الإفصاح والشفافية المؤسسية',           'الاتصال المؤسسي',        'partial',    70),
('GOV-10','reports',    'التقرير السنوي للأداء المؤسسي',        'الأداء والنمو',          'pending',    0);

-- ══════════════════════════════════════════════════════════════
-- 10. إدارة المعرفة (migration_v2)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `knowledge_assets` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `code`             VARCHAR(30) NOT NULL UNIQUE,
  `type`             ENUM('policy','procedure','lesson','best_practice','report','template','other') DEFAULT 'other',
  `title`            VARCHAR(500) NOT NULL COMMENT 'عنوان الأصل المعرفي',
  `description`      TEXT,
  `owner`            VARCHAR(200),
  `kpi_id`           INT NULL COMMENT 'مؤشر مرتبط (اختياري)',
  `governance_id`    INT NULL COMMENT 'معيار حوكمة مرتبط (اختياري)',
  `status`           ENUM('draft','active','archived','under_review') DEFAULT 'draft',
  `approved_by`      VARCHAR(200),
  `used_in_decision` TINYINT(1) DEFAULT 0 COMMENT 'هل استُخدم في قرار؟',
  `decision_ref`     VARCHAR(500) COMMENT 'مرجع القرار',
  `file_path`        VARCHAR(500) COMMENT 'مسار الملف إن وجد',
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`kpi_id`)        REFERENCES `kpis`(`id`)             ON DELETE SET NULL,
  FOREIGN KEY (`governance_id`) REFERENCES `governance_items`(`id`) ON DELETE SET NULL,
  INDEX `idx_type`   (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `knowledge_assets` (code,type,title,owner,status,used_in_decision) VALUES
('KA-001','policy',       'سياسة قياس الأداء المؤسسي 2026',    'الأداء والنمو',    'active', 1),
('KA-002','procedure',    'دليل إدخال بيانات المؤشرات',         'الأداء والنمو',    'active', 1),
('KA-003','lesson',       'دروس مستفادة — الربع الرابع 2025',   'الإدارة العليا',   'active', 0),
('KA-004','best_practice','أفضل ممارسات التطوع المؤسسي',         'التكافل المجتمعي', 'active', 0),
('KA-005','report',       'تقرير تحليل الفجوة 2025',            'الأداء والنمو',    'active', 1),
('KA-006','template',     'نموذج بطاقة انحراف المؤشر',          'الأداء والنمو',    'active', 0),
('KA-007','procedure',    'إجراءات الشراكات الاستراتيجية',      'الاتصال المؤسسي',  'draft',  0),
('KA-008','lesson',       'تجربة تنفيذ برنامج التمكين 2025',    'الرعاية والتمكين', 'active', 1);

-- ══════════════════════════════════════════════════════════════
-- 11. إضافة الأعمدة الجديدة لـ kpis (migration_v3)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE `kpis`
  ADD COLUMN IF NOT EXISTS `baseline`     DECIMAL(18,4) DEFAULT NULL COMMENT 'خط الأساس',
  ADD COLUMN IF NOT EXISTS `formula_text` VARCHAR(1000) DEFAULT NULL COMMENT 'نص المعادلة',
  ADD COLUMN IF NOT EXISTS `formula_vars` VARCHAR(1000) DEFAULT NULL COMMENT 'تسمية المتغيرات',
  ADD COLUMN IF NOT EXISTS `calc_type`    ENUM('manual','formula') DEFAULT 'manual' COMMENT 'manual=يدوي | formula=تلقائي';

-- ══════════════════════════════════════════════════════════════
-- 12. إضافة أعمدة early_warning_log (migration_v2)
-- ══════════════════════════════════════════════════════════════
ALTER TABLE `early_warning_log`
  ADD COLUMN IF NOT EXISTS `due_date`   DATE NULL,
  ADD COLUMN IF NOT EXISTS `closed_by`  VARCHAR(200),
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════════════════════════
--  ✅ قاعدة البيانات الكاملة جاهزة (v4)
-- ══════════════════════════════════════════════════════════════
