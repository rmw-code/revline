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

            // Only redirect if not already on login page to prevent infinite loop
            if (!window.location.pathname.includes('/login')) {
                window.location.href = "/login";
            }

            // Throw error to prevent further processing
            throw new Error(response.status === 401 ? "Unauthorized - Please login again" : "Forbidden - Access denied");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Request failed");
        }

        // Check if response has content before parsing JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        
        // Return empty object for responses with no content
        return {};
    } catch (error) {
        console.error("API Request Error:", error);
        throw error;
    }
};
