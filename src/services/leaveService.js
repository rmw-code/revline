import { request } from "./api";

export const createLeaveRequest = async (leaveData) => {
    return await request(`/sec/leave-requests`, {
        method: "POST",
        body: JSON.stringify(leaveData),
    });
};

export const getLeaveRequests = async (page = 0, size = 10) => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    return await request(`/sec/leave-requests/my-requests?${queryParams.toString()}`);
};

export const approveLeaveRequest = async (id) => {
    return await request(`/sec/leave-requests/${id}/status?status=APPROVED`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
    });
};

export const rejectLeaveRequest = async (id) => {
    return await request(`/sec/leave-requests/${id}/status?status=REJECTED`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
    });
};

export const getPendingLeaveRequests = async (page = 0, size = 10) => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    return await request(`/sec/leave-requests/status/PENDING?${queryParams.toString()}`);
};
