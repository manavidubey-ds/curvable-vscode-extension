const express = require('express');
const { validateUser, generateId } = require('../utils/helpers');

const router = express.Router();

// In-memory storage for demo
let users = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 25
    }
];

// GET all users
router.get('/', (req, res) => {
    res.json({
        success: true,
        count: users.length,
        users: users
    });
});

// GET user by ID
router.get('/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    res.json({
        success: true,
        user: user
    });
});

// POST create new user
router.post('/', (req, res) => {
    const userData = req.body;
    
    // Validate user data
    const validation = validateUser(userData);
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: validation.error
        });
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        ...validation.user
    };
    
    users.push(newUser);
    
    res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: newUser
    });
});

// PUT update user
router.put('/:id', (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    const userData = req.body;
    const validation = validateUser(userData);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            error: validation.error
        });
    }
    
    // Update user
    users[userIndex] = {
        ...users[userIndex],
        ...validation.user
    };
    
    res.json({
        success: true,
        message: 'User updated successfully',
        user: users[userIndex]
    });
});

// DELETE user
router.delete('/:id', (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    res.json({
        success: true,
        message: 'User deleted successfully',
        user: deletedUser
    });
});

module.exports = router; 