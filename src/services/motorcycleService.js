import { request } from "./api";

export const getMotorcycles = async (page = 0, size = 100) => {
    const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    return await request(`/sec/motorcycles?${queryParams.toString()}`);
};

export const updateMotorcycle = async (id, motorcycleData) => {
    return await request(`/sec/motorcycles/${id}`, {
        method: "PUT",
        body: JSON.stringify(motorcycleData),
    });
};

export const createMotorcycle = async (motorcycleData) => {
    return await request(`/sec/motorcycles`, {
        method: "POST",
        body: JSON.stringify(motorcycleData),
    });
};

export const deleteMotorcycle = async (id) => {
    return await request(`/sec/motorcycles/${id}`, {
        method: "DELETE",
    });
};
