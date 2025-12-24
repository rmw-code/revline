import { request } from "./api";

export const getServices = async (keyword = "", page = 0, size = 100) => {
    const queryParams = new URLSearchParams({
        keyword,
        page: page.toString(),
        size: size.toString(),
    });
    return await request(`/sec/services?${queryParams.toString()}`);
};

export const updateService = async (id, serviceData) => {
    return await request(`/sec/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(serviceData),
    });
};

export const createService = async (serviceData) => {
    return await request(`/sec/services`, {
        method: "POST",
        body: JSON.stringify(serviceData),
    });
};

export const deleteService = async (id) => {
    return await request(`/sec/services/${id}`, {
        method: "DELETE",
    });
};
