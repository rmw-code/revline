import { request } from "./api";

/**
 * Get all employees with detailed salary and leave information
 * @returns {Promise} - API response with employee data
 */
export const getEmployees = async () => {
  return await request("/api/employees", {
    method: "GET",
  });
};

/**
 * Update employee details
 * @param {number} userId - User ID of the employee to update
 * @param {object} details - Employee details to update
 * @returns {Promise} - API response
 */
export const updateEmployeeDetails = async (userId, details) => {
  return await request(`/api/employees/${userId}/details`, {
    method: "POST",
    body: JSON.stringify(details),
  });
};

/**
 * Update employee salary publish status
 * @param {number} userId - User ID of the employee to update
 * @param {boolean} isSalaryPublished - Whether salary is published
 * @returns {Promise} - API response
 */
export const updateSalaryPublishStatus = async (userId, isSalaryPublished) => {
  return await request(`/api/employees/${userId}/salary-publish`, {
    method: "PUT",
    body: JSON.stringify({ isSalaryPublished }),
  });
};
