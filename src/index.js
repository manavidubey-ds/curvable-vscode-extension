const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { calculateTotal, validateUser, formatCurrency, generateId } = require('./utils/helpers');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Main route with comprehensive API information
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Test Project API',
        version: '1.0.0',
        description: 'A comprehensive API demonstrating Curvable AI Assistant features',
        endpoints: {
            users: {
                base: '/api/users',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                description: 'User management endpoints'
            },
            products: {
                base: '/api/products',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                description: 'Product management endpoints'
            },
            orders: {
                base: '/api/order',
                methods: ['POST'],
                description: 'Order processing with validation'
            },
            health: {
                base: '/health',
                methods: ['GET'],
                description: 'Health check endpoint'
            }
        },
        features: [
            'Input validation',
            'Error handling',
            'Security headers',
            'CORS support',
            'Request logging'
        ]
    });
});

// Health check with detailed system information
app.get('/health', (req, res) => {
    const healthInfo = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        version: process.version
    };
    
    res.json(healthInfo);
});

// Comprehensive order processing endpoint
app.post('/api/order', async (req, res) => {
    try {
        const { items, user, shippingAddress, paymentMethod } = req.body;
        
        // Validate required fields
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'Items array is required and must not be empty' 
            });
        }
        
        if (!user) {
            return res.status(400).json({ 
                error: 'User information is required' 
            });
        }
        
        // Validate user data
        const userValidation = validateUser(user);
        if (!userValidation.isValid) {
            return res.status(400).json({ 
                error: userValidation.error,
                field: 'user'
            });
        }
        
        // Calculate order total
        const subtotal = calculateTotal(items);
        const tax = subtotal * 0.08; // 8% tax
        const shipping = shippingAddress ? 5.99 : 0;
        const total = subtotal + tax + shipping;
        
        // Generate order ID
        const orderId = generateId();
        
        // Create order response
        const orderResponse = {
            success: true,
            orderId: orderId,
            order: {
                items: items,
                subtotal: formatCurrency(subtotal),
                tax: formatCurrency(tax),
                shipping: formatCurrency(shipping),
                total: formatCurrency(total),
                itemCount: items.length,
                user: userValidation.user,
                shippingAddress: shippingAddress || null,
                paymentMethod: paymentMethod || 'credit_card',
                status: 'pending',
                createdAt: new Date().toISOString()
            }
        };
        
        res.status(201).json(orderResponse);
        
    } catch (error) {
        console.error('Order processing error:', error);
        res.status(500).json({ 
            error: 'Internal server error during order processing',
            message: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: ['/', '/health', '/api/users', '/api/products', '/api/order']
    });
});

// Start server with comprehensive logging
app.listen(PORT, () => {
    console.log('🚀 Test Project API Server Started');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 