/**
 * Calculate the total price of items in an array
 * @param {Array} items - Array of items with price property
 * @returns {number} Total price
 */
function calculateTotal(items) {
    if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
    }
    
    return items.reduce((sum, item) => {
        if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error('Invalid price for item');
        }
        return sum + item.price;
    }, 0);
}

/**
 * Validate user data
 * @param {Object} user - User object to validate
 * @returns {Object} Validation result with isValid and user/error properties
 */
function validateUser(user) {
    if (!user || typeof user !== 'object') {
        return { isValid: false, error: 'User must be an object' };
    }
    
    const { name, email, age } = user;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return { isValid: false, error: 'Name must be a string with at least 2 characters' };
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return { isValid: false, error: 'Email must be a valid email address' };
    }
    
    if (age && (typeof age !== 'number' || age < 0 || age > 150)) {
        return { isValid: false, error: 'Age must be a number between 0 and 150' };
    }
    
    return {
        isValid: true,
        user: {
            name: name.trim(),
            email: email.toLowerCase(),
            age: age || null
        }
    };
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'USD') {
    if (typeof amount !== 'number') {
        throw new Error('Amount must be a number');
    }
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
    calculateTotal,
    validateUser,
    formatCurrency,
    generateId
}; 