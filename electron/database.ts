/**
 * 数据库模块 — SQLite 数据库初始化与处方 CRUD 操作。
 *
 * 使用 better-sqlite3 同步 API，所有操作在主进程中同步执行。
 * 处方编号格式：YYYYMMDD + 4 位流水号（当日自增）。
 *
 * V2 变更：
 * - prescription_medicines 新增 usage_method 字段
 * - prescriptions.doctor_name 去掉 NOT NULL 约束
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

/** 药品输入类型 */
interface MedicineInput {
  medicine_name: string;
  specification?: string;
  dosage?: string;
  usage_method?: string;
  instructions?: string;
  sort_order: number;
}

/** 处方输入类型 */
interface PrescriptionInput {
  prescription_no: string;
  patient_name: string;
  patient_gender: string;
  patient_age?: string;
  department: string;
  patient_phone?: string;
  patient_address?: string;
  clinical_diagnosis: string;
  prescription_date: string;
  doctor_name?: string;
  doctor_department: string;
}

/** 查询参数类型 */
interface QueryParams {
  page: number;
  pageSize: number;
  patientName?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** 数据库操作接口 */
interface DatabaseOperations {
  generatePrescriptionNo: () => string;
  getNextSeq: (datePrefix: string) => number;
  savePrescription: (
    prescription: PrescriptionInput,
    medicines: MedicineInput[]
  ) => unknown;
  getPrescriptions: (params: QueryParams) => {
    list: unknown[];
    total: number;
    page: number;
    pageSize: number;
  };
  getPrescriptionDetail: (id: number) => unknown;
}

/**
 * 初始化数据库连接与表结构。
 * 数据库文件存储在 app.getPath('userData')/prescriptions.db。
 *
 * @returns {{ db: Database.Database; operations: DatabaseOperations }}
 */
export function initDatabase(): {
  db: Database.Database;
  operations: DatabaseOperations;
} {
  // 数据库文件路径
  const dbPath = join(app.getPath('userData'), 'prescriptions.db');
  const db = new Database(dbPath);

  // 启用 WAL 模式提升并发读取性能
  db.pragma('journal_mode = WAL');
  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 创建表结构（IF NOT EXISTS）
  // V2: doctor_name 去掉 NOT NULL，prescription_medicines 新增 usage_method
  db.exec(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_no TEXT NOT NULL UNIQUE,
      patient_name TEXT NOT NULL,
      patient_gender TEXT NOT NULL DEFAULT '男',
      patient_age TEXT DEFAULT '',
      department TEXT NOT NULL DEFAULT '',
      patient_phone TEXT DEFAULT '',
      patient_address TEXT DEFAULT '',
      clinical_diagnosis TEXT NOT NULL DEFAULT '预防措施',
      prescription_date TEXT NOT NULL,
      doctor_name TEXT DEFAULT '',
      doctor_department TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS prescription_medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      medicine_name TEXT NOT NULL,
      specification TEXT DEFAULT '',
      dosage TEXT DEFAULT '',
      usage_method TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_prescriptions_no ON prescriptions(prescription_no);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_name);
    CREATE INDEX IF NOT EXISTS idx_medicines_prescription ON prescription_medicines(prescription_id);
  `);

  // ---- 数据库迁移（安全执行，重复执行不抛异常） ----
  try {
    db.exec(`ALTER TABLE prescriptions ADD COLUMN patient_age TEXT DEFAULT ''`);
  } catch {
    // 列已存在，忽略
  }

  // ---- 准备预编译语句 ----

  const stmtCountSeq = db.prepare(`
    SELECT COUNT(*) AS cnt FROM prescriptions
    WHERE prescription_no LIKE ?
  `);

  const stmtInsertPrescription = db.prepare(`
    INSERT INTO prescriptions (
      prescription_no, patient_name, patient_gender, patient_age, department,
      patient_phone, patient_address, clinical_diagnosis,
      prescription_date, doctor_name, doctor_department
    ) VALUES (
      @prescription_no, @patient_name, @patient_gender, @patient_age, @department,
      @patient_phone, @patient_address, @clinical_diagnosis,
      @prescription_date, @doctor_name, @doctor_department
    )
  `);

  const stmtInsertMedicine = db.prepare(`
    INSERT INTO prescription_medicines (
      prescription_id, medicine_name, specification, dosage, usage_method, instructions, sort_order
    ) VALUES (
      @prescription_id, @medicine_name, @specification, @dosage, @usage_method, @instructions, @sort_order
    )
  `);

  const stmtGetMedicinesByPrescriptionId = db.prepare(`
    SELECT * FROM prescription_medicines
    WHERE prescription_id = ?
    ORDER BY sort_order ASC, id ASC
  `);

  const stmtGetPrescriptionById = db.prepare(`
    SELECT * FROM prescriptions WHERE id = ?
  `);

  /**
   * 生成当日处方编号（YYYYMMDD + 4位流水号）。
   * 在数据库事务中查询当日已有处方数，+1 后补零。
   *
   * @returns {string} 生成的处方编号
   */
  function generatePrescriptionNo(): string {
    const today = new Date();
    const datePrefix =
      today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    const row = stmtCountSeq.get(`${datePrefix}%`) as { cnt: number };
    const nextSeq = (row?.cnt ?? 0) + 1;
    return `${datePrefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * 获取指定日期前缀的下一个流水号。
   *
   * @param {string} datePrefix - 日期前缀（如 '20250115'）
   * @returns {number} 下一个流水号
   */
  function getNextSeq(datePrefix: string): number {
    const row = stmtCountSeq.get(`${datePrefix}%`) as { cnt: number };
    return (row?.cnt ?? 0) + 1;
  }

  /**
   * 保存处方及其药品明细（事务性写入）。
   *
   * @param {PrescriptionInput} prescription - 处方主记录
   * @param {MedicineInput[]} medicines - 药品明细列表
   * @returns {object} 保存后的处方完整对象（含 id、药品列表）
   */
  function savePrescription(
    prescription: PrescriptionInput,
    medicines: MedicineInput[]
  ): unknown {
    const saveTransaction = db.transaction(() => {
      // 插入处方主记录
      const result = stmtInsertPrescription.run({
        prescription_no: prescription.prescription_no,
        patient_name: prescription.patient_name,
        patient_gender: prescription.patient_gender,
        patient_age: prescription.patient_age ?? '',
        department: prescription.department,
        patient_phone: prescription.patient_phone ?? '',
        patient_address: prescription.patient_address ?? '',
        clinical_diagnosis: prescription.clinical_diagnosis,
        prescription_date: prescription.prescription_date,
        doctor_name: prescription.doctor_name ?? '',
        doctor_department: prescription.doctor_department,
      });

      const prescriptionId = result.lastInsertRowid as number;

      // 批量插入药品明细（含 usage_method）
      const insertMedicines = db.prepare(`
        INSERT INTO prescription_medicines (
          prescription_id, medicine_name, specification, dosage, usage_method, instructions, sort_order
        ) VALUES (
          @prescription_id, @medicine_name, @specification, @dosage, @usage_method, @instructions, @sort_order
        )
      `);

      for (const med of medicines) {
        insertMedicines.run({
          prescription_id: prescriptionId,
          medicine_name: med.medicine_name,
          specification: med.specification ?? '',
          dosage: med.dosage ?? '',
          usage_method: med.usage_method ?? '',
          instructions: med.instructions ?? '',
          sort_order: med.sort_order,
        });
      }

      return prescriptionId;
    });

    const prescriptionId = saveTransaction();

    // 返回完整的处方对象
    return getPrescriptionDetail(prescriptionId);
  }

  /**
   * 分页查询处方列表。
   * 支持按患者姓名模糊搜索和日期范围筛选。
   *
   * @param {QueryParams} params - 分页与筛选参数
   * @returns {{ list: unknown[]; total: number; page: number; pageSize: number }}
   */
  function getPrescriptions(params: QueryParams): {
    list: unknown[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const { page, pageSize, patientName, dateFrom, dateTo } = params;
    const conditions: string[] = [];
    const bindParams: Record<string, string | number> = {};

    if (patientName && patientName.trim()) {
      conditions.push('patient_name LIKE @patientName');
      bindParams['patientName'] = `%${patientName.trim()}%`;
    }
    if (dateFrom) {
      conditions.push('prescription_date >= @dateFrom');
      bindParams['dateFrom'] = dateFrom;
    }
    if (dateTo) {
      conditions.push('prescription_date <= @dateTo');
      bindParams['dateTo'] = dateTo;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 总数查询
    const countStmt = db.prepare(
      `SELECT COUNT(*) AS total FROM prescriptions ${whereClause}`
    );
    const countResult = countStmt.get(bindParams) as { total: number };
    const total = countResult.total;

    // 分页查询
    const offset = (page - 1) * pageSize;
    const listStmt = db.prepare(
      `SELECT * FROM prescriptions ${whereClause}
       ORDER BY created_at DESC
       LIMIT @limit OFFSET @offset`
    );
    const list = listStmt.all({
      ...bindParams,
      limit: pageSize,
      offset: offset,
    });

    return { list, total, page, pageSize };
  }

  /**
   * 根据处方 ID 获取完整详情（含药品列表）。
   *
   * @param {number} id - 处方主键 ID
   * @returns {object | undefined} 处方对象（含 medicines 数组）
   */
  function getPrescriptionDetail(id: number): unknown {
    const prescription = stmtGetPrescriptionById.get(id);
    if (!prescription) {
      return undefined;
    }
    const medicines = stmtGetMedicinesByPrescriptionId.all(id);
    return { ...(prescription as object), medicines };
  }

  const operations: DatabaseOperations = {
    generatePrescriptionNo,
    getNextSeq,
    savePrescription,
    getPrescriptions,
    getPrescriptionDetail,
  };

  return { db, operations };
}
