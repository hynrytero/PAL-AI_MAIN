/**
 * Validates an email address format
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if email format is valid, false otherwise
 */
export const validateEmail = (email) => {
    if (!email) return false;
    
    // Regular expression for email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    return emailRegex.test(email);
};
