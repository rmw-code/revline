import { request } from "./api";

/**
 * Get orders with optional filters
 * @param {Object} filters - Optional filter parameters
 * @param {string} filters.customerName - Filter by customer name
 * @param {string} filters.motorcycleName - Filter by motorcycle name
 * @param {string|string[]} filters.status - Filter by status (e.g., "PENDING", "COMPLETED") or array of statuses
 * @param {boolean} filters.isPaid - Filter by payment status
 * @param {string} filters.createAtFrom - Filter by creation date from (ISO format)
 * @param {string} filters.createAtTo - Filter by creation date to (ISO format)
 * @param {boolean} filters.includeServices - Include services in the response
 * @param {number} filters.page - Page number (0-based)
 * @param {number} filters.size - Number of items per page
 * @param {string} filters.sort - Sort parameter (e.g., "createAt,desc")
 * @returns {Promise} - API response with orders data
 */
export const getOrders = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.customerName) params.append("customerName", filters.customerName);
  if (filters.motorcycleName) params.append("motorcycleName", filters.motorcycleName);
  
  // Handle status as string or array
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append("status", s));
    } else {
      params.append("status", filters.status);
    }
  }
  
  if (filters.isPaid !== undefined) params.append("isPaid", filters.isPaid);
  if (filters.createAtFrom) params.append("createAtFrom", filters.createAtFrom);
  if (filters.createAtTo) params.append("createAtTo", filters.createAtTo);
  if (filters.includeServices !== undefined) params.append("includeServices", filters.includeServices);
  
  params.append("page", filters.page ?? 0);
  params.append("size", filters.size ?? 10);
  
  if (filters.sort) params.append("sort", filters.sort);

  return await request(`/sec/orders?${params.toString()}`, {
    method: "GET",
  });
};

/**
 * Get order by ID
 * @param {number} orderId - Order ID
 * @returns {Promise} - API response with order details
 */
export const getOrderById = async (orderId) => {
  return await request(`/sec/orders/${orderId}`, {
    method: "GET",
  });
};

/**
 * Mark order as paid
 * @param {number} orderId - Order ID
 * @returns {Promise} - API response
 */
export const markOrderAsPaid = async (orderId) => {
  return await request(`/sec/orders/${orderId}/mark-as-paid`, {
    method: "PUT",
  });
};

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status (PENDING, IN-PROGRESS, COMPLETED)
 * @returns {Promise} - API response
 */
export const updateOrderStatus = async (orderId, status) => {
  return await request(`/sec/orders/${orderId}/status?status=${status}`, {
    method: "PUT",
  });
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @param {string} orderData.customerName - Customer name
 * @param {string} orderData.motorcycleName - Motorcycle name
 * @param {number} orderData.motorcycleId - Motorcycle ID
 * @param {string} orderData.mechanicName - Mechanic name
 * @param {number} orderData.mechanicId - Mechanic ID
 * @param {string} orderData.status - Order status (e.g., "PENDING")
 * @param {boolean} orderData.isPaid - Payment status
 * @param {Array} orderData.services - Array of service objects with name, price, and details
 * @returns {Promise} - API response with created order
 */
export const createOrder = async (orderData) => {
  return await request("/sec/orders", {
    method: "POST",
    body: JSON.stringify(orderData),
  });
};
