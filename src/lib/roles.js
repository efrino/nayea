// Central place for role logic so "who counts as staff" is defined once.
export const ROLES = { SUPERADMIN: 'superadmin', ADMIN: 'admin', CUSTOMER: 'customer' };
const STAFF_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

export const isStaff = (role) => STAFF_ROLES.includes(role);
export const isSuperAdmin = (role) => role === ROLES.SUPERADMIN;
