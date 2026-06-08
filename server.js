import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { db } from "./db.js";

dotenv.config();

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "2mb" }));

const resources = {
  companies: "companies",

  // ADDED: System Settings module aliases
  "system-settings": "system_settings",
  "system-general": "system_settings",
  "system-tax-billing": "system_settings",
  "system-receipts": "system_settings",
  "system-notifications": "system_settings",
  "system-security": "system_settings",
  "system-hardware": "system_settings",
  "business-profile": "companies",
  currencies: "currencies",
  "receipt-templates": "receipt_templates",

  branches: "branches",
  roles: "roles",
  staff: "staff",
  categories: "categories",
  "units-of-measure": "units_of_measure",
  "tax-rates": "tax_rates",
  products: "products",
  "product-variants": "product_variants",
  "product-variant-options": "product_variant_options",
  warehouses: "warehouses",
  "stock-levels": "stock_levels",
  "stock-movements": "stock_movements",
  "stock-transfers": "stock_transfers",
  "stock-transfer-items": "stock_transfer_items",
  "stock-audits": "stock_audits",
  "stock-audit-items": "stock_audit_items",
  customers: "customers",
  "customer-groups": "customer_groups",
  "loyalty-transactions": "loyalty_transactions",
  promotions: "promotions",
  coupons: "coupons",
  quotations: "quotations",
  "quotation-items": "quotation_items",
  registers: "registers",
  "register-sessions": "register_sessions",
  sales: "sales",
  "sale-items": "sale_items",
  "payment-methods": "payment_methods",
  payments: "payments",
  refunds: "refunds",
  "cash-movements": "cash_movements",
  invoices: "invoices",
  suppliers: "suppliers",
  "supplier-products": "supplier_products",
  "purchase-orders": "purchase_orders",
  "purchase-order-items": "purchase_order_items",
  "goods-received-notes": "goods_received_notes",
  "grn-items": "grn_items",
  "supplier-invoices": "supplier_invoices",
  "hardware-devices": "hardware_devices",
  "payment-terminals": "payment_terminals",
  "daily-summaries": "daily_summaries",
  "report-snapshots": "report_snapshots"
};

const readOnly = new Set(["stock-movements", "daily-summaries"]);

function q(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(String(name))) throw new Error("Invalid identifier");
  return `\`${name}\``;
}

function getTable(key) {
  const table = resources[key];
  if (!table) {
    const error = new Error(`Unknown resource: ${key}`);
    error.status = 404;
    throw error;
  }
  return table;
}

function cleanPayload(payload) {
  const cleaned = {};

  for (const [key, value] of Object.entries(payload || {})) {
    if (!/^[a-zA-Z0-9_]+$/.test(key)) continue;

    if (
      [
        "id",
        "created_at",
        "updated_at",
        "variance",
        "password",
        "pin",
        "password_hash",
        "pin_hash",
        "token_hash"
      ].includes(key)
    ) {
      continue;
    }

    if (key.endsWith("_at")) continue;

    cleaned[key] = value === "" || value === undefined ? null : value;
  }

  return cleaned;
}

async function buildPayload(resourceKey, body, isUpdate = false) {
  const payload = cleanPayload(body);

  if (resourceKey === "staff") {
    const password = String(body?.password || "").trim();
    const pin = String(body?.pin || "").trim();

    if (password) {
      if (password.length < 6) {
        const error = new Error("Password must be at least 6 characters");
        error.status = 400;
        throw error;
      }

      payload.password_hash = await bcrypt.hash(password, 10);
    }

    if (pin) {
      if (!/^\d{4,8}$/.test(pin)) {
        const error = new Error("PIN must be 4 to 8 digits");
        error.status = 400;
        throw error;
      }

      payload.pin_hash = await bcrypt.hash(pin, 10);
    }

    if (!isUpdate && !payload.password_hash) {
      const error = new Error("Password is required when creating staff account");
      error.status = 400;
      throw error;
    }
  }

  return payload;
}

function emptyToNull(value) {
  return value === "" || value === undefined ? null : value;
}

function toNumber(value, fallback = 0) {
  if (value === "" || value === undefined || value === null) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

async function barcodeExists(connection, barcode) {
  if (!barcode) return false;
  const [p] = await connection.query("SELECT id FROM products WHERE barcode = ? LIMIT 1", [barcode]);
  if (p.length) return true;
  const [v] = await connection.query("SELECT id FROM product_variants WHERE barcode = ? LIMIT 1", [barcode]);
  return v.length > 0;
}

async function createOpeningStock({
  connection,
  warehouseId,
  productId,
  variantId = null,
  quantity,
  reorderPoint,
  reorderQty,
  unitCost,
  batchNumber,
  expiryDate,
  staffId
}) {
  if (!warehouseId) return;
  const qty = toNumber(quantity, 0);

  await connection.query(
    `INSERT INTO stock_levels (warehouse_id, product_id, variant_id, quantity, reorder_point, reorder_qty)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [warehouseId, productId, variantId, qty, toNumber(reorderPoint, 0), toNumber(reorderQty, 0)]
  );

  if (qty !== 0) {
    await connection.query(
      `INSERT INTO stock_movements
       (warehouse_id, product_id, variant_id, movement_type, quantity, quantity_before, quantity_after, unit_cost, reference_type, reference_id, batch_number, expiry_date, notes, created_by)
       VALUES (?, ?, ?, 'opening', ?, 0, ?, ?, 'product', ?, ?, ?, 'Opening stock from Add Product', ?)`,
      [
        warehouseId,
        productId,
        variantId,
        qty,
        qty,
        emptyToNull(unitCost),
        productId,
        emptyToNull(batchNumber),
        emptyToNull(expiryDate),
        emptyToNull(staffId)
      ]
    );
  }
}

// ADDED: Fixed System Settings definitions matching your screenshot
const systemSettingGroups = {
  general: {
    dbGroup: "general",
    title: "General",
    description: "Loyalty rates, currency display, language, date format",
    fields: [
      { key: "loyalty_rate", label: "Loyalty Rate", type: "number", default: "1" },
      { key: "currency_display", label: "Currency Display", type: "text", default: "USD" },
      { key: "language", label: "Language", type: "text", default: "en" },
      { key: "date_format", label: "Date Format", type: "text", default: "YYYY-MM-DD" }
    ]
  },
  tax: {
    dbGroup: "tax",
    title: "Tax & Billing",
    description: "Default tax rate, inclusive pricing, receipt tax breakdown",
    fields: [
      { key: "default_tax_rate", label: "Default Tax Rate", type: "number", default: "0" },
      { key: "inclusive_pricing", label: "Inclusive Pricing", type: "boolean", default: "0" },
      { key: "receipt_tax_breakdown", label: "Receipt Tax Breakdown", type: "boolean", default: "1" }
    ]
  },
  receipt: {
    dbGroup: "receipt",
    title: "Receipts",
    description: "Header/footer text, logo toggle, copy count, auto-email",
    fields: [
      { key: "receipt_header_text", label: "Header Text", type: "textarea", default: "" },
      { key: "receipt_footer_text", label: "Footer Text", type: "textarea", default: "Thank you!" },
      { key: "receipt_show_logo", label: "Logo Toggle", type: "boolean", default: "1" },
      { key: "receipt_copy_count", label: "Copy Count", type: "number", default: "1" },
      { key: "receipt_auto_email", label: "Auto Email", type: "boolean", default: "0" }
    ]
  },
  notification: {
    dbGroup: "notification",
    title: "Notifications",
    description: "Low-stock email, daily report email, alert toggles, schedule time",
    fields: [
      { key: "low_stock_email", label: "Low-stock Email", type: "boolean", default: "1" },
      { key: "daily_report_email", label: "Daily Report Email", type: "boolean", default: "1" },
      { key: "alert_toggles", label: "Alert Toggles", type: "boolean", default: "1" },
      { key: "schedule_time", label: "Schedule Time", type: "time", default: "18:00" }
    ]
  },
  security: {
    dbGroup: "security",
    title: "Security",
    description: "Session timeout, manager approval, PIN policy, 2FA, audit retention",
    fields: [
      { key: "session_timeout_minutes", label: "Session Timeout Minutes", type: "number", default: "30" },
      { key: "manager_approval", label: "Manager Approval", type: "boolean", default: "1" },
      { key: "pin_policy", label: "PIN Policy", type: "text", default: "4 digits minimum" },
      { key: "two_factor_auth", label: "2FA", type: "boolean", default: "0" },
      { key: "audit_retention_days", label: "Audit Retention Days", type: "number", default: "365" }
    ]
  },
  hardware: {
    dbGroup: "hardware",
    title: "Hardware",
    description: "Default printer, cash drawer trigger, barcode sound, scale unit",
    fields: [
      { key: "default_printer", label: "Default Printer", type: "text", default: "" },
      { key: "cash_drawer_trigger", label: "Cash Drawer Trigger", type: "boolean", default: "1" },
      { key: "barcode_sound", label: "Barcode Sound", type: "boolean", default: "1" },
      { key: "scale_unit", label: "Scale Unit", type: "text", default: "kg" }
    ]
  }
};

app.get("/", (req, res) => res.send("PETCUP POS API is running"));

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      `SELECT s.id, s.company_id, s.branch_id, s.role_id, s.first_name, s.last_name, s.email, s.password_hash, s.is_active,
              r.name AS role, b.name AS branch_name, c.name AS company_name
       FROM staff s
       JOIN roles r ON r.id = s.role_id
       JOIN companies c ON c.id = s.company_id
       LEFT JOIN branches b ON b.id = s.branch_id
       WHERE s.email = ?
       LIMIT 1`,
      [email]
    );

    const staff = rows[0];

    if (!staff || Number(staff.is_active) !== 1) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!staff.password_hash) {
      return res.status(401).json({ message: "Password login is not enabled for this account" });
    }

    const ok = await bcrypt.compare(password, staff.password_hash);

    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = {
      id: staff.id,
      company_id: staff.company_id,
      branch_id: staff.branch_id,
      role_id: staff.role_id,
      role: String(staff.role || "cashier").toLowerCase(),
      full_name: `${staff.first_name} ${staff.last_name}`.trim(),
      email: staff.email,
      branch_name: staff.branch_name,
      company_name: staff.company_name
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.sqlMessage || error.message || "Login failed" });
  }
});

app.get("/api/lookups/product-form", async (req, res) => {
  try {
    const { company_id, branch_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ message: "company_id is required" });
    }

    const [categories] = await db.query(
      "SELECT id, name FROM categories WHERE company_id = ? AND is_active = 1 ORDER BY name",
      [company_id]
    );

    const [taxRates] = await db.query(
      "SELECT id, name, rate FROM tax_rates WHERE company_id = ? AND is_active = 1 ORDER BY is_default DESC, name",
      [company_id]
    );

    const [units] = await db.query(
      "SELECT id, name, abbreviation FROM units_of_measure WHERE company_id = ? ORDER BY name",
      [company_id]
    );

    const [suppliers] = await db.query(
      "SELECT id, name FROM suppliers WHERE company_id = ? AND is_active = 1 ORDER BY name",
      [company_id]
    );

    const [warehouses] = branch_id
      ? await db.query(
          "SELECT id, name, code FROM warehouses WHERE branch_id = ? AND is_active = 1 ORDER BY is_default DESC, name",
          [branch_id]
        )
      : await db.query(
          `SELECT w.id, w.name, w.code
           FROM warehouses w
           JOIN branches b ON b.id = w.branch_id
           WHERE b.company_id = ? AND w.is_active = 1
           ORDER BY w.is_default DESC, w.name`,
          [company_id]
        );

    res.json({ categories, taxRates, units, suppliers, warehouses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.sqlMessage || error.message || "Failed to load product form lookups" });
  }
});

app.get("/api/products/barcode/:code", async (req, res) => {
  try {
    const code = req.params.code;

    const [rows] = await db.query(
      `SELECT p.id AS product_id, NULL AS variant_id, p.name, p.sku, p.barcode, p.sell_price, p.cost_price, 'product' AS match_type
       FROM products p WHERE p.barcode = ? OR p.sku = ?
       UNION ALL
       SELECT p.id, v.id, CONCAT(p.name, ' - ', v.variant_name), v.sku, v.barcode, v.sell_price, v.cost_price, 'variant'
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.barcode = ? OR v.sku = ?
       LIMIT 1`,
      [code, code, code, code]
    );

    if (!rows[0]) return res.status(404).json({ message: "Product not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to lookup barcode" });
  }
});

app.post("/api/products/full", async (req, res) => {
  const connection = await db.getConnection();
  let tx = false;

  try {
    const body = req.body;

    if (!body.company_id) return res.status(400).json({ message: "company_id is required" });
    if (!body.sku) return res.status(400).json({ message: "SKU is required" });
    if (!body.name) return res.status(400).json({ message: "Product name is required" });

    const [skuRows] = await connection.query(
      "SELECT id FROM products WHERE company_id = ? AND sku = ? LIMIT 1",
      [body.company_id, body.sku]
    );

    if (skuRows.length) return res.status(409).json({ message: "SKU already exists" });

    if (body.barcode && (await barcodeExists(connection, body.barcode))) {
      return res.status(409).json({ message: "Barcode already exists" });
    }

    for (const variant of body.variants || []) {
      if (variant.barcode && (await barcodeExists(connection, variant.barcode))) {
        return res.status(409).json({ message: `Variant barcode already exists: ${variant.barcode}` });
      }
    }

    await connection.beginTransaction();
    tx = true;

    const variants = (body.variants || []).filter((v) => v.variant_name?.trim());

    const [productResult] = await connection.query(
      `INSERT INTO products
       (company_id, category_id, tax_rate_id, uom_id, sku, barcode, name, description, image_url, cost_price, sell_price, member_price, wholesale_price, min_sell_price, track_inventory, allow_negative, is_service, is_active, has_variants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.company_id,
        emptyToNull(body.category_id),
        emptyToNull(body.tax_rate_id),
        emptyToNull(body.uom_id),
        body.sku,
        emptyToNull(body.barcode),
        body.name,
        emptyToNull(body.description),
        emptyToNull(body.image_url),
        toNumber(body.cost_price, 0),
        toNumber(body.sell_price, 0),
        emptyToNull(body.member_price),
        emptyToNull(body.wholesale_price),
        emptyToNull(body.min_sell_price),
        Number(body.track_inventory) === 0 ? 0 : 1,
        Number(body.allow_negative) === 1 ? 1 : 0,
        Number(body.is_service) === 1 ? 1 : 0,
        Number(body.is_active) === 0 ? 0 : 1,
        variants.length ? 1 : 0
      ]
    );

    const productId = productResult.insertId;

    if (body.supplier_id) {
      await connection.query(
        `INSERT INTO supplier_products
         (supplier_id, product_id, supplier_sku, cost_price, min_order_qty, lead_time_days, is_preferred)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          body.supplier_id,
          productId,
          body.sku,
          toNumber(body.cost_price, 0),
          toNumber(body.min_order_qty, 1),
          toNumber(body.lead_time_days, 0)
        ]
      );
    }

    if (Number(body.track_inventory) !== 0 && body.warehouse_id) {
      await createOpeningStock({
        connection,
        warehouseId: body.warehouse_id,
        productId,
        quantity: body.initial_quantity,
        reorderPoint: body.reorder_point,
        reorderQty: body.reorder_qty,
        unitCost: body.cost_price,
        batchNumber: body.batch_number,
        expiryDate: body.expiry_date,
        staffId: body.created_by
      });
    }

    const createdVariants = [];

    for (const variant of variants) {
      const variantSku =
        variant.sku?.trim() ||
        `${body.sku}-${variant.variant_name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 24)}`;

      const [variantResult] = await connection.query(
        `INSERT INTO product_variants
         (product_id, sku, barcode, variant_name, cost_price, sell_price, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          variantSku,
          emptyToNull(variant.barcode),
          variant.variant_name,
          toNumber(variant.cost_price, toNumber(body.cost_price, 0)),
          toNumber(variant.sell_price, toNumber(body.sell_price, 0)),
          emptyToNull(variant.image_url),
          Number(variant.is_active) === 0 ? 0 : 1
        ]
      );

      const variantId = variantResult.insertId;

      if (variant.option_name && variant.option_value) {
        await connection.query(
          "INSERT INTO product_variant_options (product_id, option_name, option_value) VALUES (?, ?, ?)",
          [productId, variant.option_name, variant.option_value]
        );
      }

      if (Number(body.track_inventory) !== 0 && body.warehouse_id) {
        await createOpeningStock({
          connection,
          warehouseId: body.warehouse_id,
          productId,
          variantId,
          quantity: variant.initial_quantity,
          reorderPoint: variant.reorder_point || body.reorder_point,
          reorderQty: variant.reorder_qty || body.reorder_qty,
          unitCost: variant.cost_price || body.cost_price,
          batchNumber: variant.batch_number,
          expiryDate: variant.expiry_date,
          staffId: body.created_by
        });
      }

      createdVariants.push({ id: variantId, sku: variantSku, variant_name: variant.variant_name });
    }

    await connection.commit();

    res.status(201).json({
      message: "Product created successfully",
      product: {
        id: productId,
        sku: body.sku,
        barcode: body.barcode,
        name: body.name
      },
      variants: createdVariants
    });
  } catch (error) {
    if (tx) await connection.rollback().catch(() => {});
    console.error(error);
    res.status(500).json({ message: error.sqlMessage || error.message || "Failed to create product" });
  } finally {
    connection.release();
  }
});

// ADDED: Load setting form by group
app.get("/api/settings/:groupKey", async (req, res) => {
  try {
    const { groupKey } = req.params;
    const companyId = req.query.company_id;

    if (!companyId) {
      return res.status(400).json({ message: "company_id is required" });
    }

    if (groupKey === "business-profile") {
      const [rows] = await db.query(
        `SELECT id, name, legal_name, tax_number, address, currency_code, timezone, language
         FROM companies
         WHERE id = ?
         LIMIT 1`,
        [companyId]
      );

      return res.json({
        title: "Business Profile",
        description: "Company name, legal name, tax number, address, currency, timezone",
        fields: [
          { key: "name", label: "Company Name", type: "text" },
          { key: "legal_name", label: "Legal Name", type: "text" },
          { key: "tax_number", label: "Tax Number", type: "text" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "currency_code", label: "Currency", type: "text" },
          { key: "timezone", label: "Timezone", type: "text" },
          { key: "language", label: "Language", type: "text" }
        ],
        values: rows[0] || {}
      });
    }

    const group = systemSettingGroups[groupKey];

    if (!group) {
      return res.status(404).json({ message: "Unknown settings group" });
    }

    const [rows] = await db.query(
      `SELECT setting_key, setting_value
       FROM system_settings
       WHERE company_id = ? AND setting_group = ?`,
      [companyId, group.dbGroup]
    );

    const saved = {};

    rows.forEach((row) => {
      saved[row.setting_key] = row.setting_value;
    });

    const values = {};

    group.fields.forEach((field) => {
      values[field.key] = saved[field.key] ?? field.default ?? "";
    });

    res.json({
      title: group.title,
      description: group.description,
      fields: group.fields,
      values
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to load settings"
    });
  }
});

// ADDED: Save setting form by group
app.put("/api/settings/:groupKey", async (req, res) => {
  const connection = await db.getConnection();
  let tx = false;

  try {
    const { groupKey } = req.params;
    const { company_id, values, updated_by } = req.body;

    if (!company_id) {
      return res.status(400).json({ message: "company_id is required" });
    }

    if (groupKey === "business-profile") {
      const allowed = [
        "name",
        "legal_name",
        "tax_number",
        "address",
        "currency_code",
        "timezone",
        "language"
      ];

      const payload = {};

      allowed.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(values || {}, key)) {
          payload[key] = values[key] === "" ? null : values[key];
        }
      });

      const columns = Object.keys(payload);

      if (!columns.length) {
        return res.status(400).json({ message: "No valid business profile fields" });
      }

      const sql = `UPDATE companies SET ${columns.map((c) => `${q(c)} = ?`).join(", ")} WHERE id = ?`;

      await connection.query(sql, [...columns.map((c) => payload[c]), company_id]);

      return res.json({ message: "Business profile saved" });
    }

    const group = systemSettingGroups[groupKey];

    if (!group) {
      return res.status(404).json({ message: "Unknown settings group" });
    }

    await connection.beginTransaction();
    tx = true;

    for (const field of group.fields) {
      const value = values?.[field.key] ?? field.default ?? "";

      await connection.query(
        `INSERT INTO system_settings
         (company_id, setting_key, setting_value, setting_group, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         setting_value = VALUES(setting_value),
         setting_group = VALUES(setting_group),
         updated_by = VALUES(updated_by),
         updated_at = CURRENT_TIMESTAMP`,
        [company_id, field.key, value, group.dbGroup, updated_by || null]
      );
    }

    await connection.commit();
    tx = false;

    res.json({ message: "Settings saved" });
  } catch (error) {
    if (tx) await connection.rollback().catch(() => {});
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to save settings"
    });
  } finally {
    connection.release();
  }
});

function money(value) {
  const number = Number(value || 0);
  return Math.round((Number.isFinite(number) ? number : 0) * 100) / 100;
}

function decimalQty(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function createReceiptNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `R-${y}${m}${d}-${Date.now().toString().slice(-6)}-${random}`;
}

app.get("/api/pos/lookups", async (req, res) => {
  try {
    const { company_id, branch_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ message: "company_id is required" });
    }

    const [paymentMethods] = await db.query(
      `SELECT id, name, type
       FROM payment_methods
       WHERE company_id = ? AND is_active = 1
       ORDER BY sort_order, name`,
      [company_id]
    );

    const [customers] = await db.query(
      `SELECT id, code, first_name, last_name, phone, loyalty_points
       FROM customers
       WHERE company_id = ? AND status = 'active'
       ORDER BY id DESC
       LIMIT 100`,
      [company_id]
    );

    const [registers] = branch_id
      ? await db.query(
          `SELECT id, name, code, opening_float
           FROM registers
           WHERE branch_id = ? AND is_active = 1
           ORDER BY name`,
          [branch_id]
        )
      : await db.query(
          `SELECT r.id, r.name, r.code, r.opening_float
           FROM registers r
           JOIN branches b ON b.id = r.branch_id
           WHERE b.company_id = ? AND r.is_active = 1
           ORDER BY r.name`,
          [company_id]
        );

    const [warehouses] = branch_id
      ? await db.query(
          `SELECT id, name, code
           FROM warehouses
           WHERE branch_id = ? AND is_active = 1
           ORDER BY is_default DESC, name`,
          [branch_id]
        )
      : await db.query(
          `SELECT w.id, w.name, w.code
           FROM warehouses w
           JOIN branches b ON b.id = w.branch_id
           WHERE b.company_id = ? AND w.is_active = 1
           ORDER BY w.is_default DESC, w.name`,
          [company_id]
        );

    res.json({ paymentMethods, customers, registers, warehouses });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to load POS lookups"
    });
  }
});

app.get("/api/pos/register-session/current", async (req, res) => {
  try {
    const { staff_id } = req.query;

    if (!staff_id) {
      return res.status(400).json({ message: "staff_id is required" });
    }

    const [rows] = await db.query(
      `SELECT rs.*, r.name AS register_name, r.code AS register_code
       FROM register_sessions rs
       JOIN registers r ON r.id = rs.register_id
       WHERE rs.staff_id = ? AND rs.status = 'open'
       ORDER BY rs.opened_at DESC
       LIMIT 1`,
      [staff_id]
    );

    res.json(rows[0] || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to load register session"
    });
  }
});

app.post("/api/pos/register-sessions/open", async (req, res) => {
  try {
    const { register_id, staff_id, opening_float } = req.body;

    if (!register_id) return res.status(400).json({ message: "register_id is required" });
    if (!staff_id) return res.status(400).json({ message: "staff_id is required" });

    const [existing] = await db.query(
      `SELECT id
       FROM register_sessions
       WHERE staff_id = ? AND status = 'open'
       LIMIT 1`,
      [staff_id]
    );

    if (existing.length) {
      return res.status(409).json({ message: "This staff already has an open register session" });
    }

    const [result] = await db.query(
      `INSERT INTO register_sessions
       (register_id, staff_id, opening_float, status)
       VALUES (?, ?, ?, 'open')`,
      [register_id, staff_id, money(opening_float)]
    );

    const [rows] = await db.query(
      `SELECT rs.*, r.name AS register_name, r.code AS register_code
       FROM register_sessions rs
       JOIN registers r ON r.id = rs.register_id
       WHERE rs.id = ?
       LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Register opened",
      session: rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to open register"
    });
  }
});

app.post("/api/pos/register-sessions/close", async (req, res) => {
  const connection = await db.getConnection();
  let tx = false;

  try {
    const { session_id, staff_id, closing_float, notes } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    if (!staff_id) {
      return res.status(400).json({ message: "staff_id is required" });
    }

    if (closing_float === undefined || closing_float === null || closing_float === "") {
      return res.status(400).json({ message: "closing_float is required" });
    }

    await connection.beginTransaction();
    tx = true;

    const [sessionRows] = await connection.query(
      `SELECT *
       FROM register_sessions
       WHERE id = ? AND staff_id = ? AND status = 'open'
       LIMIT 1
       FOR UPDATE`,
      [session_id, staff_id]
    );

    const session = sessionRows[0];

    if (!session) {
      return res.status(400).json({
        message: "Open register session not found"
      });
    }

    const [cashSaleRows] = await connection.query(
      `SELECT COALESCE(SUM(p.amount), 0) AS cash_sales
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       JOIN payment_methods pm ON pm.id = p.payment_method_id
       WHERE s.session_id = ?
         AND s.status = 'completed'
         AND p.status = 'completed'
         AND LOWER(pm.type) = 'cash'`,
      [session_id]
    );

    const [movementRows] = await connection.query(
      `SELECT COALESCE(SUM(
         CASE
           WHEN type IN ('float_in', 'pay_in', 'adjustment') THEN amount
           WHEN type IN ('float_out', 'pay_out') THEN -amount
           ELSE 0
         END
       ), 0) AS movement_total
       FROM cash_movements
       WHERE session_id = ?`,
      [session_id]
    );

    const openingFloat = money(session.opening_float);
    const cashSales = money(cashSaleRows[0]?.cash_sales);
    const movementTotal = money(movementRows[0]?.movement_total);
    const expectedFloat = money(openingFloat + cashSales + movementTotal);
    const closingFloat = money(closing_float);

    await connection.query(
      `UPDATE register_sessions
       SET closing_float = ?,
           expected_float = ?,
           status = 'closed',
           closed_at = NOW(),
           notes = ?
       WHERE id = ?`,
      [
        closingFloat,
        expectedFloat,
        emptyToNull(notes),
        session_id
      ]
    );

    const [rows] = await connection.query(
      `SELECT rs.*, r.name AS register_name, r.code AS register_code
       FROM register_sessions rs
       JOIN registers r ON r.id = rs.register_id
       WHERE rs.id = ?
       LIMIT 1`,
      [session_id]
    );

    await connection.commit();
    tx = false;

    res.json({
      message: "Register closed",
      session: rows[0],
      summary: {
        opening_float: openingFloat,
        cash_sales: cashSales,
        cash_movements: movementTotal,
        expected_float: expectedFloat,
        closing_float: closingFloat,
        variance: money(closingFloat - expectedFloat)
      }
    });
  } catch (error) {
    if (tx) await connection.rollback().catch(() => {});

    console.error(error);

    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to close register"
    });
  } finally {
    connection.release();
  }
});

app.get("/api/pos/products/search", async (req, res) => {
  try {
    const { company_id, warehouse_id } = req.query;
    const search = String(req.query.q || "").trim();

    if (!company_id) {
      return res.status(400).json({ message: "company_id is required" });
    }

    if (!search) {
      return res.json([]);
    }

    const like = `%${search}%`;

    const params = warehouse_id
      ? [warehouse_id, company_id, search, search, like, like, warehouse_id, company_id, search, search, like, like]
      : [company_id, search, search, like, like, company_id, search, search, like, like];

    const stockProductJoin = warehouse_id
      ? `LEFT JOIN stock_levels sl
           ON sl.product_id = p.id
          AND sl.variant_id IS NULL
          AND sl.warehouse_id = ?`
      : `LEFT JOIN stock_levels sl
           ON sl.product_id = p.id
          AND sl.variant_id IS NULL`;

    const stockVariantJoin = warehouse_id
      ? `LEFT JOIN stock_levels sl
           ON sl.product_id = p.id
          AND sl.variant_id = v.id
          AND sl.warehouse_id = ?`
      : `LEFT JOIN stock_levels sl
           ON sl.product_id = p.id
          AND sl.variant_id = v.id`;

    const [rows] = await db.query(
      `SELECT
         p.id AS product_id,
         NULL AS variant_id,
         p.name,
         p.sku,
         p.barcode,
         p.sell_price,
         p.cost_price,
         p.track_inventory,
         p.allow_negative,
         p.tax_rate_id,
         COALESCE(t.rate, 0) AS tax_rate,
         COALESCE(sl.quantity, 0) AS stock_qty,
         'product' AS item_type
       FROM products p
       LEFT JOIN tax_rates t ON t.id = p.tax_rate_id
       ${stockProductJoin}
       WHERE p.company_id = ?
         AND p.is_active = 1
         AND p.has_variants = 0
         AND (p.barcode = ? OR p.sku = ? OR p.name LIKE ? OR p.barcode LIKE ?)

       UNION ALL

       SELECT
         p.id AS product_id,
         v.id AS variant_id,
         CONCAT(p.name, ' - ', v.variant_name) AS name,
         v.sku,
         v.barcode,
         v.sell_price,
         v.cost_price,
         p.track_inventory,
         p.allow_negative,
         p.tax_rate_id,
         COALESCE(t.rate, 0) AS tax_rate,
         COALESCE(sl.quantity, 0) AS stock_qty,
         'variant' AS item_type
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       LEFT JOIN tax_rates t ON t.id = p.tax_rate_id
       ${stockVariantJoin}
       WHERE p.company_id = ?
         AND p.is_active = 1
         AND v.is_active = 1
         AND (v.barcode = ? OR v.sku = ? OR p.name LIKE ? OR v.barcode LIKE ?)

       LIMIT 40`,
      params
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to search products"
    });
  }
});

app.post("/api/pos/sales/complete", async (req, res) => {
  const connection = await db.getConnection();
  let tx = false;

  try {
    const body = req.body;
    const items = Array.isArray(body.items) ? body.items : [];
    const payments = Array.isArray(body.payments) ? body.payments : [];

    if (!body.company_id) return res.status(400).json({ message: "company_id is required" });
    if (!body.branch_id) return res.status(400).json({ message: "branch_id is required" });
    if (!body.staff_id) return res.status(400).json({ message: "staff_id is required" });
    if (!body.session_id) return res.status(400).json({ message: "Open register session is required" });
    if (!body.register_id) return res.status(400).json({ message: "register_id is required" });
    if (!body.warehouse_id) return res.status(400).json({ message: "warehouse_id is required" });
    if (!items.length) return res.status(400).json({ message: "Cart is empty" });
    if (!payments.length) return res.status(400).json({ message: "Payment is required" });

    const [sessionRows] = await connection.query(
      `SELECT id
       FROM register_sessions
       WHERE id = ? AND staff_id = ? AND status = 'open'
       LIMIT 1`,
      [body.session_id, body.staff_id]
    );

    if (!sessionRows.length) {
      return res.status(400).json({ message: "Register session is not open" });
    }

    await connection.beginTransaction();
    tx = true;

    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    let totalCost = 0;
    const normalizedItems = [];

    for (const item of items) {
      const qty = decimalQty(item.quantity);

      if (qty <= 0) {
        throw new Error("Item quantity must be greater than zero");
      }

      const [productRows] = item.variant_id
        ? await connection.query(
            `SELECT
               p.id AS product_id,
               v.id AS variant_id,
               CONCAT(p.name, ' - ', v.variant_name) AS description,
               v.sell_price,
               v.cost_price,
               p.tax_rate_id,
               p.track_inventory,
               p.allow_negative,
               COALESCE(t.rate, 0) AS tax_rate
             FROM product_variants v
             JOIN products p ON p.id = v.product_id
             LEFT JOIN tax_rates t ON t.id = p.tax_rate_id
             WHERE p.id = ? AND v.id = ? AND p.company_id = ? AND p.is_active = 1 AND v.is_active = 1
             LIMIT 1`,
            [item.product_id, item.variant_id, body.company_id]
          )
        : await connection.query(
            `SELECT
               p.id AS product_id,
               NULL AS variant_id,
               p.name AS description,
               p.sell_price,
               p.cost_price,
               p.tax_rate_id,
               p.track_inventory,
               p.allow_negative,
               COALESCE(t.rate, 0) AS tax_rate
             FROM products p
             LEFT JOIN tax_rates t ON t.id = p.tax_rate_id
             WHERE p.id = ? AND p.company_id = ? AND p.is_active = 1
             LIMIT 1`,
            [item.product_id, body.company_id]
          );

      const product = productRows[0];

      if (!product) {
        throw new Error("Product not found in cart");
      }

      const unitPrice = money(item.unit_price ?? product.sell_price);
      const costPrice = money(product.cost_price);
      const discountPct = decimalQty(item.discount_pct || 0);
      const lineSubtotal = money(unitPrice * qty);
      const lineDiscount = money(lineSubtotal * (discountPct / 100));
      const taxable = money(lineSubtotal - lineDiscount);
      const lineTax = money(taxable * Number(product.tax_rate || 0));
      const lineTotal = money(taxable + lineTax);

      subtotal = money(subtotal + lineSubtotal);
      discountAmount = money(discountAmount + lineDiscount);
      taxAmount = money(taxAmount + lineTax);
      totalCost = money(totalCost + costPrice * qty);

      normalizedItems.push({
        ...product,
        quantity: qty,
        unit_price: unitPrice,
        cost_price: costPrice,
        discount_pct: discountPct,
        discount_amount: lineDiscount,
        tax_amount: lineTax,
        line_total: lineTotal
      });
    }

    const totalAmount = money(subtotal - discountAmount + taxAmount);
    const amountTendered = money(payments.reduce((sum, payment) => sum + Number(payment.amount_tendered || payment.amount || 0), 0));
    const amountPaid = money(payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
    const changeDue = money(Math.max(0, amountTendered - totalAmount));

    if (amountPaid < totalAmount) {
      throw new Error("Payment amount is less than sale total");
    }

    const receiptNumber = createReceiptNumber();

    const [saleResult] = await connection.query(
      `INSERT INTO sales
       (company_id, branch_id, register_id, session_id, customer_id, staff_id,
        receipt_number, status, currency_code, exchange_rate, subtotal,
        discount_amount, tax_amount, rounding, total_amount, amount_paid,
        change_due, notes, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, 1, ?, ?, ?, 0, ?, ?, ?, ?, NOW())`,
      [
        body.company_id,
        body.branch_id,
        body.register_id,
        body.session_id,
        emptyToNull(body.customer_id),
        body.staff_id,
        receiptNumber,
        body.currency_code || "USD",
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        amountPaid,
        changeDue,
        emptyToNull(body.notes)
      ]
    );

    const saleId = saleResult.insertId;

    for (const item of normalizedItems) {
      const [itemResult] = await connection.query(
        `INSERT INTO sale_items
         (sale_id, product_id, variant_id, description, quantity, unit_price,
          cost_price, discount_pct, discount_amount, tax_rate_id, tax_amount, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.product_id,
          item.variant_id,
          item.description,
          item.quantity,
          item.unit_price,
          item.cost_price,
          item.discount_pct,
          item.discount_amount,
          item.tax_rate_id,
          item.tax_amount,
          item.line_total
        ]
      );

      if (Number(item.track_inventory) === 1) {
        const [stockRows] = await connection.query(
          `SELECT id, quantity
           FROM stock_levels
           WHERE warehouse_id = ?
             AND product_id = ?
             AND variant_id <=> ?
           LIMIT 1
           FOR UPDATE`,
          [body.warehouse_id, item.product_id, item.variant_id]
        );

        const beforeQty = stockRows[0] ? Number(stockRows[0].quantity) : 0;
        const afterQty = beforeQty - item.quantity;

        if (afterQty < 0 && Number(item.allow_negative) !== 1) {
          throw new Error(`Not enough stock for ${item.description}`);
        }

        if (stockRows[0]) {
          await connection.query(
            `UPDATE stock_levels
             SET quantity = ?
             WHERE id = ?`,
            [afterQty, stockRows[0].id]
          );
        } else {
          await connection.query(
            `INSERT INTO stock_levels
             (warehouse_id, product_id, variant_id, quantity, reorder_point, reorder_qty)
             VALUES (?, ?, ?, ?, 0, 0)`,
            [body.warehouse_id, item.product_id, item.variant_id, afterQty]
          );
        }

        await connection.query(
          `INSERT INTO stock_movements
           (warehouse_id, product_id, variant_id, movement_type, quantity,
            quantity_before, quantity_after, unit_cost, reference_type,
            reference_id, notes, created_by)
           VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, 'sale', ?, ?, ?)`,
          [
            body.warehouse_id,
            item.product_id,
            item.variant_id,
            -item.quantity,
            beforeQty,
            afterQty,
            item.cost_price,
            saleId,
            `Sale item #${itemResult.insertId}`,
            body.staff_id
          ]
        );
      }
    }

    for (const payment of payments) {
      await connection.query(
        `INSERT INTO payments
         (sale_id, payment_method_id, currency_code, amount, amount_tendered,
          change_given, reference_no, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          saleId,
          payment.payment_method_id,
          payment.currency_code || body.currency_code || "USD",
          money(payment.amount || totalAmount),
          money(payment.amount_tendered || payment.amount || totalAmount),
          changeDue,
          emptyToNull(payment.reference_no)
        ]
      );
    }

    await connection.commit();
    tx = false;

    res.status(201).json({
      message: "Sale completed",
      sale: {
        id: saleId,
        receipt_number: receiptNumber,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        change_due: changeDue,
        total_cost: totalCost
      }
    });
  } catch (error) {
    if (tx) await connection.rollback().catch(() => {});
    console.error(error);
    res.status(500).json({
      message: error.sqlMessage || error.message || "Failed to complete sale"
    });
  } finally {
    connection.release();
  }
});

app.get("/api/:resourceKey", async (req, res) => {
  try {
    const table = getTable(req.params.resourceKey);
    const [rows] = await db.query(`SELECT * FROM ${q(table)} ORDER BY 1 DESC LIMIT 300`);
    res.json(rows);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.sqlMessage || error.message || "Failed to load records" });
  }
});

app.post("/api/:resourceKey", async (req, res) => {
  try {
    if (readOnly.has(req.params.resourceKey)) {
      return res.status(403).json({ message: "This module is read-only" });
    }

    const table = getTable(req.params.resourceKey);
    const payload = await buildPayload(req.params.resourceKey, req.body, false);
    const columns = Object.keys(payload);

    if (!columns.length) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const sql = `INSERT INTO ${q(table)} (${columns.map(q).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
    const [result] = await db.query(sql, columns.map((c) => payload[c]));

    res.status(201).json({ message: "Record created", result });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.sqlMessage || error.message || "Failed to create record"
    });
  }
});

app.put("/api/:resourceKey/:id", async (req, res) => {
  try {
    if (readOnly.has(req.params.resourceKey)) {
      return res.status(403).json({ message: "This module is read-only" });
    }

    const table = getTable(req.params.resourceKey);
    const payload = await buildPayload(req.params.resourceKey, req.body, true);
    const columns = Object.keys(payload);

    if (!columns.length) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const sql = `UPDATE ${q(table)} SET ${columns.map((c) => `${q(c)} = ?`).join(", ")} WHERE id = ?`;
    const [result] = await db.query(sql, [...columns.map((c) => payload[c]), req.params.id]);

    res.json({ message: "Record updated", result });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.sqlMessage || error.message || "Failed to update record"
    });
  }
});

app.delete("/api/:resourceKey/:id", async (req, res) => {
  try {
    if (readOnly.has(req.params.resourceKey)) {
      return res.status(403).json({ message: "This module is read-only" });
    }

    const table = getTable(req.params.resourceKey);
    const [result] = await db.query(`DELETE FROM ${q(table)} WHERE id = ?`, [req.params.id]);

    res.json({ message: "Record deleted", result });
  } catch (error) {
    res.status(500).json({ message: error.sqlMessage || error.message || "Failed to delete record" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`PETCUP POS API running at http://localhost:${port}`));