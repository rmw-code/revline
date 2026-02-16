/**
 * Check if user has a specific role
 * @param {string|string[]} userRoles - User's role(s) - can be string or array
 * @param {string} requiredRole - Role to check for
 * @returns {boolean}
 */
export const hasRole = (userRoles, requiredRole) => {
  if (!userRoles) return false;
  
  // Handle both string (old format) and array (new format)
  if (typeof userRoles === 'string') {
    return userRoles.toLowerCase() === requiredRole.toLowerCase();
  }
  
  if (Array.isArray(userRoles)) {
    return userRoles.some(role => role.toLowerCase() === requiredRole.toLowerCase());
  }
  
  return false;
};

/**
 * Check if user has any of the specified roles
 * @param {string|string[]} userRoles - User's role(s) - can be string or array
 * @param {string[]} requiredRoles - Array of roles to check for
 * @returns {boolean}
 */
export const hasAnyRole = (userRoles, requiredRoles) => {
  if (!userRoles || !requiredRoles || !Array.isArray(requiredRoles)) return false;
  
  return requiredRoles.some(role => hasRole(userRoles, role));
};

/**
 * Get display string for roles
 * @param {string|string[]} userRoles - User's role(s)
 * @returns {string}
 */
export const getRolesDisplay = (userRoles) => {
  if (!userRoles) return 'User';
  
  if (typeof userRoles === 'string') return userRoles;
  
  if (Array.isArray(userRoles)) {
    return userRoles.join(', ');
  }
  
  return 'User';
};
