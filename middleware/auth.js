import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { hasPermission, normalizePermissions } from "../config/permissions.js";

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.query(
      `SELECT
        s.id,
        s.company_id,
        s.branch_id,
        s.role_id,
        s.first_name,
        s.last_name,
        s.email,
        s.is_active,
        r.name AS role,
        r.permissions
       FROM staff s
       JOIN roles r ON r.id = s.role_id
       WHERE s.id = ?
       LIMIT 1`,
      [payload.id]
    );

    const staff = rows[0];

    if (!staff || Number(staff.is_active) !== 1) {
      return res.status(401).json({ message: "Account is inactive or missing" });
    }

    req.user = {
      id: staff.id,
      company_id: staff.company_id,
      branch_id: staff.branch_id,
      role_id: staff.role_id,
      role: staff.role,
      full_name: `${staff.first_name} ${staff.last_name}`.trim(),
      email: staff.email,
      permissions: normalizePermissions(staff.permissions)
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    if (hasPermission(req.user, permission)) {
      return next();
    }

    return res.status(403).json({
      message: `Permission denied. Required permission: ${permission}`
    });
  };
}

export function requireAnyPermission(permissions = []) {
  return (req, res, next) => {
    const allowed = permissions.some((permission) => hasPermission(req.user, permission));

    if (allowed) return next();

    return res.status(403).json({
      message: `Permission denied. Required one of: ${permissions.join(", ")}`
    });
  };
}
