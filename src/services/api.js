import { loadLS, saveLS } from "../utils";
import { LS_KEYS } from "../enum";

const BASE_URL = import.meta.env.VITE_API_URL;

export const request = async (endpoint, options = {}) => {
    const token = loadLS(LS_KEYS.TOKEN);

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        // Handle authentication and authorization errors
        if (response.status === 401 || response.status === 403) {
            // Clear the token from localStorage
            saveLS(LS_KEYS.TOKEN, null);

            // Redirect to login page
            window.location.href = "/login";

            // Throw error to prevent further processing
            throw new Error(response.status === 401 ? "Unauthorized - Please login again" : "Forbidden - Access denied");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Request failed");
        }

        return await response.json();
    } catch (error) {
        console.error("API Request Error:", error);
        throw error;
    }
};
