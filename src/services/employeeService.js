import { request } from "./api";
import { loadLS } from "../utils";
import { LS_KEYS } from "../enum";

const BASE_URL = import.meta.env.VITE_API_URL;

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

/**
 * Get employee salary details
 * @param {number} userId - User ID
 * @returns {Promise} - API response with salary data
 */
export const getEmployeeSalary = async (userId) => {
  return await request(`/api/employees/${userId}/salary`, {
    method: "GET",
  });
};

/**
 * Get salary history
 * @param {number} userId
 * @param {number} page
 * @param {number} size
 * @returns {Promise} - Paged salary history
 */
export const getSalaryHistory = async (userId, page = 0, size = 10) => {
  // Use request helper
  return await request(`/api/salary-history?userId=${userId}&page=${page}&size=${size}`, {
    method: "GET"
  });
};

/**
 * Download salary history file
 * @param {number} id - History ID
 * @returns {Promise<Blob>}
 */
export const downloadSalaryHistory = async (id) => {
  const token = loadLS(LS_KEYS.TOKEN);
  const response = await fetch(`${BASE_URL}/api/salary-history/${id}/download`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error("Download failed");
  }
  return await response.blob();
};

/**
 * Create salary history entry
 * @param {object} data - Salary history data
 * @returns {Promise} - API response
 */
export const createSalaryHistory = async (data) => {
  return await request("/api/salary-history/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Upload salary history file
 * @param {number} userId
 * @param {string} month
 * @param {File} file
 * @param {object} [data] - Optional salary data
 * @returns {Promise}
 */
export const uploadSalaryHistory = async (userId, month, file, data = {}) => {
  const token = loadLS(LS_KEYS.TOKEN);
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("month", month);
  formData.append("file", file);

  if (data) {
    if (data.baseAmount !== undefined) formData.append("baseAmount", data.baseAmount);
    if (data.netAmount !== undefined) formData.append("netAmount", data.netAmount);
    if (data.epf !== undefined) formData.append("epf", data.epf);
    if (data.eis !== undefined) formData.append("eis", data.eis);
  }

  const response = await fetch(`${BASE_URL}/api/salary-history/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const txt = await response.text();
    try {
      const err = JSON.parse(txt);
      throw new Error(err.message || "Upload failed");
    } catch (e) {
      throw new Error(txt || "Upload failed");
    }
  }

  const txt = await response.text();
  return txt ? JSON.parse(txt) : {};
};
