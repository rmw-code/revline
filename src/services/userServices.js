import { request } from "./api";

/**
 * Get all users with pagination
 * @param {number} page - Page number (0-based)
 * @param {number} size - Number of items per page
 * @returns {Promise} - API response with user data
 */
export const getUsers = async (page = 0, size = 10) => {
  const params = new URLSearchParams();
  
  params.append("page", page);
  params.append("size", size);

  return await request(`/sec/users?${params.toString()}`, {
    method: "GET",
  });
};

/**
 * Get users by role with pagination
 * @param {string} role - User role to filter by (e.g., "mechanic")
 * @param {number} page - Page number (0-based)
 * @param {number} size - Number of items per page
 * @returns {Promise} - API response with user data
 */
export const getUsersByRole = async (role = "", page = 0, size = 10) => {
  const params = new URLSearchParams();
  
  if (role) {
    params.append("role", role);
  }
  params.append("page", page);
  params.append("size", size);

  return await request(`/sec/users?${params.toString()}`, {
    method: "GET",
  });
};
