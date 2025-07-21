/**
 * Utility functions for the Test Project API
 * This module contains helper functions for common operations
 */

/**
 * Calculate the total price of items in an array
 * @param {Array} items - Array of items with price property
 * @returns {number} Total price
 * @throws {Error} If items is not an array or contains invalid prices
 * 
 * @example
 * const items = [{ name: 'Product 1', price: 10.99 }, { name: 'Product 2', price: 5.50 }];
 * const total = calculateTotal(items); // Returns 16.49
 */
function calculateTotal(items) {
    if (!Array.isArray(items)) {
        throw new Error('Items must be an array');
    }
    
    if (items.length === 0) {
        return 0;
    }
    
    return items.reduce((sum, item, index) => {
        if (!item || typeof item !== 'object') {
            throw new Error(`Invalid item at index ${index}: must be an object`);
        }
        
        if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error(`Invalid price for item at index ${index}: must be a non-negative number`);
        }
        
        return sum + item.price;
    }, 0);
}

/**
 * Validate user data with comprehensive checks
 * @param {Object} user - User object to validate
 * @returns {Object} Validation result with isValid and user/error properties
 * 
 * @example
 * const user = { name: 'John Doe', email: 'john@example.com', age: 30 };
 * const result = validateUser(user);
 * // Returns: { isValid: true, user: { name: 'John Doe', email: 'john@example.com', age: 30 } }
 */
function validateUser(user) {
    if (!user || typeof user !== 'object') {
        return { isValid: false, error: 'User must be an object' };
    }
    
    const { name, email, age, phone } = user;
    
    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return { isValid: false, error: 'Name must be a string with at least 2 characters' };
    }
    
    if (name.trim().length > 100) {
        return { isValid: false, error: 'Name must be less than 100 characters' };
    }
    
    // Validate email
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email must be a string' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Email must be a valid email address' };
    }
    
    // Validate age (optional)
    if (age !== undefined && age !== null) {
        if (typeof age !== 'number' || age < 0 || age > 150) {
            return { isValid: false, error: 'Age must be a number between 0 and 150' };
        }
    }
    
    // Validate phone (optional)
    if (phone !== undefined && phone !== null) {
        if (typeof phone !== 'string' || phone.trim().length < 10) {
            return { isValid: false, error: 'Phone must be a string with at least 10 characters' };
        }
    }
    
    return {
        isValid: true,
        user: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            age: age || null,
            phone: phone ? phone.trim() : null
        }
    };
}

/**
 * Format currency for display using Intl.NumberFormat
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 * @throws {Error} If amount is not a number
 * 
 * @example
 * formatCurrency(1234.56); // Returns "$1,234.56"
 * formatCurrency(1234.56, 'EUR'); // Returns "€1,234.56"
 */
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    if (typeof amount !== 'number') {
        throw new Error('Amount must be a number');
    }
    
    if (isNaN(amount) || !isFinite(amount)) {
        throw new Error('Amount must be a finite number');
    }
    
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Generate a unique ID using timestamp and random numbers
 * @returns {string} Unique ID string
 * 
 * @example
 * const id = generateId(); // Returns something like "lmnopqr123456"
 */
function generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return timestamp + random;
}

/**
 * Validate and sanitize product data
 * @param {Object} product - Product object to validate
 * @returns {Object} Validation result with isValid and product/error properties
 */
function validateProduct(product) {
    if (!product || typeof product !== 'object') {
        return { isValid: false, error: 'Product must be an object' };
    }
    
    const { name, price, description, category } = product;
    
    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
        return { isValid: false, error: 'Product name is required' };
    }
    
    if (name.trim().length > 200) {
        return { isValid: false, error: 'Product name must be less than 200 characters' };
    }
    
    // Validate price
    if (typeof price !== 'number' || price < 0) {
        return { isValid: false, error: 'Price must be a non-negative number' };
    }
    
    // Validate description (optional)
    if (description !== undefined && description !== null) {
        if (typeof description !== 'string' || description.length > 1000) {
            return { isValid: false, error: 'Description must be a string less than 1000 characters' };
        }
    }
    
    // Validate category (optional)
    if (category !== undefined && category !== null) {
        if (typeof category !== 'string' || category.trim().length < 1) {
            return { isValid: false, error: 'Category must be a non-empty string' };
        }
    }
    
    return {
        isValid: true,
        product: {
            name: name.trim(),
            price: price,
            description: description ? description.trim() : null,
            category: category ? category.trim() : null
        }
    };
}

/**
 * Calculate discount based on percentage
 * @param {number} originalPrice - Original price
 * @param {number} discountPercentage - Discount percentage (0-100)
 * @returns {Object} Object with discounted price and savings
 */
function calculateDiscount(originalPrice, discountPercentage) {
    if (typeof originalPrice !== 'number' || originalPrice < 0) {
        throw new Error('Original price must be a non-negative number');
    }
    
    if (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100) {
        throw new Error('Discount percentage must be a number between 0 and 100');
    }
    
    const savings = originalPrice * (discountPercentage / 100);
    const discountedPrice = originalPrice - savings;
    
    return {
        originalPrice,
        discountPercentage,
        savings: Math.round(savings * 100) / 100,
        discountedPrice: Math.round(discountedPrice * 100) / 100
    };
}

/**
 * Format date to ISO string with timezone
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!(date instanceof Date)) {
        throw new Error('Date must be a Date object');
    }
    
    return date.toISOString();
}

module.exports = {
    calculateTotal,
    validateUser,
    validateProduct,
    formatCurrency,
    generateId,
    calculateDiscount,
    formatDate
}; 