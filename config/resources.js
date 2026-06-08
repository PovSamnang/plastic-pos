import { PERMISSIONS } from "./permissions.js";

export const resources = {
  companies: {
    table: "companies",
    label: "Companies",
    permissions: {
      read: PERMISSIONS.SETTINGS_READ,
      create: PERMISSIONS.SETTINGS_CREATE,
      update: PERMISSIONS.SETTINGS_UPDATE,
      delete: PERMISSIONS.SETTINGS_DELETE
    }
  },
  branches: {
    table: "branches",
    label: "Branches",
    permissions: {
      read: PERMISSIONS.SETTINGS_READ,
      create: PERMISSIONS.SETTINGS_CREATE,
      update: PERMISSIONS.SETTINGS_UPDATE,
      delete: PERMISSIONS.SETTINGS_DELETE
    }
  },
  roles: {
    table: "roles",
    label: "Roles",
    permissions: {
      read: PERMISSIONS.STAFF_READ,
      create: PERMISSIONS.STAFF_CREATE,
      update: PERMISSIONS.STAFF_UPDATE,
      delete: PERMISSIONS.STAFF_DELETE
    }
  },
  staff: {
    table: "staff",
    label: "Staff",
    permissions: {
      read: PERMISSIONS.STAFF_READ,
      create: PERMISSIONS.STAFF_CREATE,
      update: PERMISSIONS.STAFF_UPDATE,
      delete: PERMISSIONS.STAFF_DELETE
    },
    hiddenColumns: ["password_hash", "pin_hash"]
  },
  categories: {
    table: "categories",
    label: "Categories",
    permissions: {
      read: PERMISSIONS.PRODUCTS_READ,
      create: PERMISSIONS.PRODUCTS_CREATE,
      update: PERMISSIONS.PRODUCTS_UPDATE,
      delete: PERMISSIONS.PRODUCTS_DELETE
    }
  },
  "units-of-measure": {
    table: "units_of_measure",
    label: "Units of Measure",
    permissions: {
      read: PERMISSIONS.PRODUCTS_READ,
      create: PERMISSIONS.PRODUCTS_CREATE,
      update: PERMISSIONS.PRODUCTS_UPDATE,
      delete: PERMISSIONS.PRODUCTS_DELETE
    }
  },
  "tax-rates": {
    table: "tax_rates",
    label: "Tax Rates",
    permissions: {
      read: PERMISSIONS.SETTINGS_READ,
      create: PERMISSIONS.SETTINGS_CREATE,
      update: PERMISSIONS.SETTINGS_UPDATE,
      delete: PERMISSIONS.SETTINGS_DELETE
    }
  },
  products: {
    table: "products",
    label: "Products",
    permissions: {
      read: PERMISSIONS.PRODUCTS_READ,
      create: PERMISSIONS.PRODUCTS_CREATE,
      update: PERMISSIONS.PRODUCTS_UPDATE,
      delete: PERMISSIONS.PRODUCTS_DELETE
    }
  },
  "product-variants": {
    table: "product_variants",
    label: "Product Variants",
    permissions: {
      read: PERMISSIONS.PRODUCTS_READ,
      create: PERMISSIONS.PRODUCTS_CREATE,
      update: PERMISSIONS.PRODUCTS_UPDATE,
      delete: PERMISSIONS.PRODUCTS_DELETE
    }
  },
  "product-variant-options": {
    table: "product_variant_options",
    label: "Variant Options",
    permissions: {
      read: PERMISSIONS.PRODUCTS_READ,
      create: PERMISSIONS.PRODUCTS_CREATE,
      update: PERMISSIONS.PRODUCTS_UPDATE,
      delete: PERMISSIONS.PRODUCTS_DELETE
    }
  },
  suppliers: {
    table: "suppliers",
    label: "Suppliers",
    permissions: {
      read: PERMISSIONS.SUPPLIERS_READ,
      create: PERMISSIONS.SUPPLIERS_CREATE,
      update: PERMISSIONS.SUPPLIERS_UPDATE,
      delete: PERMISSIONS.SUPPLIERS_DELETE
    }
  },
  "supplier-products": {
    table: "supplier_products",
    label: "Supplier Products",
    permissions: {
      read: PERMISSIONS.SUPPLIERS_READ,
      create: PERMISSIONS.SUPPLIERS_CREATE,
      update: PERMISSIONS.SUPPLIERS_UPDATE,
      delete: PERMISSIONS.SUPPLIERS_DELETE
    }
  },
  warehouses: {
    table: "warehouses",
    label: "Warehouses",
    permissions: {
      read: PERMISSIONS.INVENTORY_READ,
      create: PERMISSIONS.INVENTORY_CREATE,
      update: PERMISSIONS.INVENTORY_UPDATE,
      delete: PERMISSIONS.INVENTORY_DELETE
    }
  },
  "stock-levels": {
    table: "stock_levels",
    label: "Stock Levels",
    permissions: {
      read: PERMISSIONS.INVENTORY_READ,
      create: PERMISSIONS.INVENTORY_CREATE,
      update: PERMISSIONS.INVENTORY_UPDATE,
      delete: PERMISSIONS.INVENTORY_DELETE
    }
  },
  "stock-movements": {
    table: "stock_movements",
    label: "Stock Movements",
    permissions: {
      read: PERMISSIONS.INVENTORY_READ,
      create: PERMISSIONS.INVENTORY_CREATE,
      update: PERMISSIONS.INVENTORY_UPDATE,
      delete: PERMISSIONS.INVENTORY_DELETE
    }
  },
  "stock-transfers": {
    table: "stock_transfers",
    label: "Stock Transfers",
    permissions: {
      read: PERMISSIONS.INVENTORY_READ,
      create: PERMISSIONS.INVENTORY_CREATE,
      update: PERMISSIONS.INVENTORY_UPDATE,
      delete: PERMISSIONS.INVENTORY_DELETE
    }
  },
  "stock-transfer-items": {
    table: "stock_transfer_items",
    label: "Stock Transfer Items",
    permissions: {
      read: PERMISSIONS.INVENTORY_READ,
      create: PERMISSIONS.INVENTORY_CREATE,
      update: PERMISSIONS.INVENTORY_UPDATE,
      delete: PERMISSIONS.INVENTORY_DELETE
    }
  },
  "stock-audits": {
    table: "stock_audits",
    label: "Stock Audits",
    permissions: {
      read: PERMISSIONS.INVENTORY_READ,
      create: PERMISSIONS.INVENTORY_CREATE,
      update: PERMISSIONS.INVENTORY_UPDATE,
      delete: PERMISSIONS.INVENTORY_DELETE
    }
  },
  customers: {
    table: "customers",
    label: "Customers",
    permissions: {
      read: PERMISSIONS.CUSTOMERS_READ,
      create: PERMISSIONS.CUSTOMERS_CREATE,
      update: PERMISSIONS.CUSTOMERS_UPDATE,
      delete: PERMISSIONS.CUSTOMERS_DELETE
    }
  },
  "customer-groups": {
    table: "customer_groups",
    label: "Customer Groups",
    permissions: {
      read: PERMISSIONS.CUSTOMERS_READ,
      create: PERMISSIONS.CUSTOMERS_CREATE,
      update: PERMISSIONS.CUSTOMERS_UPDATE,
      delete: PERMISSIONS.CUSTOMERS_DELETE
    }
  },
  "loyalty-transactions": {
    table: "loyalty_transactions",
    label: "Loyalty Transactions",
    permissions: {
      read: PERMISSIONS.CUSTOMERS_READ,
      create: PERMISSIONS.CUSTOMERS_CREATE,
      update: PERMISSIONS.CUSTOMERS_UPDATE,
      delete: PERMISSIONS.CUSTOMERS_DELETE
    }
  },
  sales: {
    table: "sales",
    label: "Sales",
    permissions: {
      read: PERMISSIONS.SALES_READ,
      create: PERMISSIONS.SALES_CREATE,
      update: PERMISSIONS.SALES_UPDATE,
      delete: PERMISSIONS.SALES_DELETE
    }
  },
  "sale-items": {
    table: "sale_items",
    label: "Sale Items",
    permissions: {
      read: PERMISSIONS.SALES_READ,
      create: PERMISSIONS.SALES_CREATE,
      update: PERMISSIONS.SALES_UPDATE,
      delete: PERMISSIONS.SALES_DELETE
    }
  },
  payments: {
    table: "payments",
    label: "Payments",
    permissions: {
      read: PERMISSIONS.PAYMENTS_READ,
      create: PERMISSIONS.PAYMENTS_CREATE,
      update: PERMISSIONS.PAYMENTS_UPDATE,
      delete: PERMISSIONS.PAYMENTS_DELETE
    }
  },
  "payment-methods": {
    table: "payment_methods",
    label: "Payment Methods",
    permissions: {
      read: PERMISSIONS.PAYMENTS_READ,
      create: PERMISSIONS.PAYMENTS_CREATE,
      update: PERMISSIONS.PAYMENTS_UPDATE,
      delete: PERMISSIONS.PAYMENTS_DELETE
    }
  },
  invoices: {
    table: "invoices",
    label: "Invoices",
    permissions: {
      read: PERMISSIONS.PAYMENTS_READ,
      create: PERMISSIONS.PAYMENTS_CREATE,
      update: PERMISSIONS.PAYMENTS_UPDATE,
      delete: PERMISSIONS.PAYMENTS_DELETE
    }
  },
  "purchase-orders": {
    table: "purchase_orders",
    label: "Purchase Orders",
    permissions: {
      read: PERMISSIONS.PURCHASES_READ,
      create: PERMISSIONS.PURCHASES_CREATE,
      update: PERMISSIONS.PURCHASES_UPDATE,
      delete: PERMISSIONS.PURCHASES_DELETE
    }
  },
  "purchase-order-items": {
    table: "purchase_order_items",
    label: "Purchase Order Items",
    permissions: {
      read: PERMISSIONS.PURCHASES_READ,
      create: PERMISSIONS.PURCHASES_CREATE,
      update: PERMISSIONS.PURCHASES_UPDATE,
      delete: PERMISSIONS.PURCHASES_DELETE
    }
  },
  "goods-received-notes": {
    table: "goods_received_notes",
    label: "Goods Received Notes",
    permissions: {
      read: PERMISSIONS.PURCHASES_READ,
      create: PERMISSIONS.PURCHASES_CREATE,
      update: PERMISSIONS.PURCHASES_UPDATE,
      delete: PERMISSIONS.PURCHASES_DELETE
    }
  },
  "grn-items": {
    table: "grn_items",
    label: "GRN Items",
    permissions: {
      read: PERMISSIONS.PURCHASES_READ,
      create: PERMISSIONS.PURCHASES_CREATE,
      update: PERMISSIONS.PURCHASES_UPDATE,
      delete: PERMISSIONS.PURCHASES_DELETE
    }
  },
  "daily-summaries": {
    table: "daily_summaries",
    label: "Daily Summaries",
    readOnly: true,
    permissions: {
      read: PERMISSIONS.REPORTS_READ
    }
  },
  "report-snapshots": {
    table: "report_snapshots",
    label: "Report Snapshots",
    readOnly: true,
    permissions: {
      read: PERMISSIONS.REPORTS_READ
    }
  }
};

export function getResource(resourceKey) {
  const resource = resources[resourceKey];

  if (!resource) {
    const error = new Error(`Unknown resource: ${resourceKey}`);
    error.status = 404;
    throw error;
  }

  return resource;
}
