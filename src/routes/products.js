const express = require('express');
const { validateProduct, generateId, calculateDiscount, formatCurrency } = require('../utils/helpers');

const router = express.Router();

// In-memory storage for products
let products = [
    {
        id: '1',
        name: 'Laptop Pro',
        price: 1299.99,
        description: 'High-performance laptop for professionals',
        category: 'Electronics',
        stock: 15,
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Wireless Headphones',
        price: 199.99,
        description: 'Premium noise-canceling headphones',
        category: 'Audio',
        stock: 25,
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Smartphone X',
        price: 899.99,
        description: 'Latest smartphone with advanced features',
        category: 'Electronics',
        stock: 8,
        createdAt: new Date().toISOString()
    }
];

// GET all products with filtering and pagination
router.get('/', (req, res) => {
    try {
        const { category, minPrice, maxPrice, search, page = 1, limit = 10 } = req.query;
        
        let filteredProducts = [...products];
        
        // Filter by category
        if (category) {
            filteredProducts = filteredProducts.filter(p => 
                p.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        // Filter by price range
        if (minPrice) {
            filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
        }
        
        if (maxPrice) {
            filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
        }
        
        // Search by name or description
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                products: paginatedProducts,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(filteredProducts.length / limitNum),
                    totalItems: filteredProducts.length,
                    itemsPerPage: limitNum,
                    hasNextPage: endIndex < filteredProducts.length,
                    hasPrevPage: pageNum > 1
                }
            },
            filters: {
                category,
                minPrice,
                maxPrice,
                search
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving products',
            message: error.message
        });
    }
});

// GET product by ID
router.get('/:id', (req, res) => {
    try {
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        res.json({
            success: true,
            data: product
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving product',
            message: error.message
        });
    }
});

// POST create new product
router.post('/', (req, res) => {
    try {
        const productData = req.body;
        
        // Validate product data
        const validation = validateProduct(productData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }
        
        // Create new product
        const newProduct = {
            id: generateId(),
            ...validation.product,
            stock: productData.stock || 0,
            createdAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: newProduct
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error creating product',
            message: error.message
        });
    }
});

// PUT update product
router.put('/:id', (req, res) => {
    try {
        const productIndex = products.findIndex(p => p.id === req.params.id);
        
        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        const productData = req.body;
        const validation = validateProduct(productData);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }
        
        // Update product
        products[productIndex] = {
            ...products[productIndex],
            ...validation.product,
            stock: productData.stock !== undefined ? productData.stock : products[productIndex].stock,
            updatedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            message: 'Product updated successfully',
            data: products[productIndex]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error updating product',
            message: error.message
        });
    }
});

// DELETE product
router.delete('/:id', (req, res) => {
    try {
        const productIndex = products.findIndex(p => p.id === req.params.id);
        
        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        const deletedProduct = products.splice(productIndex, 1)[0];
        
        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: deletedProduct
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error deleting product',
            message: error.message
        });
    }
});

// GET product categories
router.get('/categories/list', (req, res) => {
    try {
        const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
        
        res.json({
            success: true,
            data: categories
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving categories',
            message: error.message
        });
    }
});

// POST calculate discount for product
router.post('/:id/discount', (req, res) => {
    try {
        const { discountPercentage } = req.body;
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        
        if (typeof discountPercentage !== 'number' || discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).json({
                success: false,
                error: 'Discount percentage must be a number between 0 and 100'
            });
        }
        
        const discountInfo = calculateDiscount(product.price, discountPercentage);
        
        res.json({
            success: true,
            data: {
                product: {
                    id: product.id,
                    name: product.name,
                    originalPrice: formatCurrency(product.price),
                    ...discountInfo,
                    discountedPrice: formatCurrency(discountInfo.discountedPrice),
                    savings: formatCurrency(discountInfo.savings)
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error calculating discount',
            message: error.message
        });
    }
});

module.exports = router; 