export const PERMISSIONS = {
  ALL: "*",

  DASHBOARD_READ: "dashboard:read",

  PRODUCTS_READ: "products:read",
  PRODUCTS_CREATE: "products:create",
  PRODUCTS_UPDATE: "products:update",
  PRODUCTS_DELETE: "products:delete",

  INVENTORY_READ: "inventory:read",
  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",

  SALES_READ: "sales:read",
  SALES_CREATE: "sales:create",
  SALES_UPDATE: "sales:update",
  SALES_DELETE: "sales:delete",

  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_UPDATE: "customers:update",
  CUSTOMERS_DELETE: "customers:delete",

  SUPPLIERS_READ: "suppliers:read",
  SUPPLIERS_CREATE: "suppliers:create",
  SUPPLIERS_UPDATE: "suppliers:update",
  SUPPLIERS_DELETE: "suppliers:delete",

  PURCHASES_READ: "purchases:read",
  PURCHASES_CREATE: "purchases:create",
  PURCHASES_UPDATE: "purchases:update",
  PURCHASES_DELETE: "purchases:delete",

  PAYMENTS_READ: "payments:read",
  PAYMENTS_CREATE: "payments:create",
  PAYMENTS_UPDATE: "payments:update",
  PAYMENTS_DELETE: "payments:delete",

  REPORTS_READ: "reports:read",

  SETTINGS_READ: "settings:read",
  SETTINGS_CREATE: "settings:create",
  SETTINGS_UPDATE: "settings:update",
  SETTINGS_DELETE: "settings:delete",

  STAFF_READ: "staff:read",
  STAFF_CREATE: "staff:create",
  STAFF_UPDATE: "staff:update",
  STAFF_DELETE: "staff:delete"
};

export function normalizePermissions(rawPermissions) {
  if (!rawPermissions) return [];

  if (Array.isArray(rawPermissions)) return rawPermissions;

  if (typeof rawPermissions === "string") {
    try {
      const parsed = JSON.parse(rawPermissions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function hasPermission(user, permission) {
  const permissions = normalizePermissions(user?.permissions);

  return permissions.includes(PERMISSIONS.ALL) || permissions.includes(permission);
}

export function hasAnyPermission(user, permissions = []) {
  if (!permissions.length) return true;
  return permissions.some((permission) => hasPermission(user, permission));
}
