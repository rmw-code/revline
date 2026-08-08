import { request } from "./api";

export const getServiceTypes = async (sort = "asc") => {
  return await request(`/sec/service-types?sort=${sort}`);
};

export const createServiceType = async (serviceTypeData) => {
  return await request("/sec/service-types", {
    method: "POST",
    body: JSON.stringify(serviceTypeData),
  });
};

export const updateServiceType = async (id, serviceTypeData) => {
  return await request(`/sec/service-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(serviceTypeData),
  });
};

export const deleteServiceType = async (id) => {
  return await request(`/sec/service-types/${id}`, {
    method: "DELETE",
  });
};
