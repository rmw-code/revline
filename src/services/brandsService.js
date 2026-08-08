import { request } from "./api";

export const getBrands = async () => {
  return await request("/sec/brands");
};

export const createBrand = async (brandData) => {
  return await request("/sec/brands", {
    method: "POST",
    body: JSON.stringify(brandData),
  });
};

export const updateBrand = async (id, brandData) => {
  return await request(`/sec/brands/${id}`, {
    method: "PUT",
    body: JSON.stringify(brandData),
  });
};

export const deleteBrand = async (id) => {
  return await request(`/sec/brands/${id}`, {
    method: "DELETE",
  });
};
