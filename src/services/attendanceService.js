import { request } from "./api";

/**
 * Fetch attendance records
 * For SUPERADMIN: Returns all attendance records from all users
 * For regular users: Returns only their own attendance records
 * 
 * @param {number} page - Page number (0-indexed)
 * @param {number} size - Number of records per page
 * @param {string} sort - Sort parameter (e.g., "date,desc")
 * @returns {Promise} Response containing attendance data with pagination info
 */
export const getAttendanceRecords = async (page = 0, size = 300, sort = "date,desc") => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort: sort,
    });
    return await request(`/sec/attendances/my-attendance?${queryParams.toString()}`);
};
