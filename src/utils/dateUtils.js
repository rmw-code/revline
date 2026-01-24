
export const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // Expecting DD/MM/YYYY from API
    const parts = dateString.split("/");
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    }
    return dateString;
};

export const formatDateForApi = (dateString) => {
    if (!dateString) return "";
    // Expecting YYYY-MM-DD from Input
    const parts = dateString.split("-");
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }
    return dateString;
};
