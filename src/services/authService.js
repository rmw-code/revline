
import { saveLS } from "../utils";
import { LS_KEYS } from "../enum";

export const login = async (email, password) => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/pub/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!response.ok) {
            // Attempt to parse error message if available
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();

        if (data.token) {
            saveLS(LS_KEYS.TOKEN, data.token);
        }

        // Save user data (name, email, roles) in session
        const userData = {
            name: data.name,
            email: data.email,
            roles: data.roles || [],
            token: data.token
        };

        return userData;
    } catch (error) {
        throw error;
    }
};
