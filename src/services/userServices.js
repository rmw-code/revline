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

/**
 * Create a new user
 * @param {Object} userData - User data to create
 * @returns {Promise} - API response with created user data
 */
export const createUser = async (userData) => {
  return await request("/sec/addUser", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

/**
 * Update an existing user
 * @param {string} userId - User ID to update
 * @param {Object} userData - Updated user data
 * @returns {Promise} - API response with updated user data
 */
export const updateUser = async (userId, userData) => {
  return await request(`/sec/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
};

/**
 * Delete a user
 * @param {string} userId - User ID to delete
 * @returns {Promise} - API response
 */
export const deleteUser = async (userId) => {
  return await request(`/sec/users/${userId}`, {
    method: "DELETE",
  });
};
