const express = require('express');
const { calculateTotal, validateUser } = require('./utils/helpers');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Main route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Test Project API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            health: '/health'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Example of using helper functions
app.post('/api/order', (req, res) => {
    try {
        const { items, user } = req.body;
        
        // Validate user
        const userValidation = validateUser(user);
        if (!userValidation.isValid) {
            return res.status(400).json({ error: userValidation.error });
        }
        
        // Calculate total
        const total = calculateTotal(items);
        
        res.json({
            success: true,
            total: total,
            itemCount: items.length,
            user: userValidation.user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app; 