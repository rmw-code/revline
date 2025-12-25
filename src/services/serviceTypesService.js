import { request } from "./api";

export const getServiceTypes = async () => {
    return await request("/sec/service-types");
};
