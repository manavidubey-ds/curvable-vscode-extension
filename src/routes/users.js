const express = require('express');
const { validateUser, generateId } = require('../utils/helpers');

const router = express.Router();

// In-memory storage for users
let users = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        phone: '+1-555-0123',
        role: 'customer',
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 25,
        phone: '+1-555-0456',
        role: 'admin',
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        age: 35,
        phone: '+1-555-0789',
        role: 'customer',
        createdAt: new Date().toISOString()
    }
];

// GET all users with filtering and pagination
router.get('/', (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        
        let filteredUsers = [...users];
        
        // Filter by role
        if (role) {
            filteredUsers = filteredUsers.filter(u => 
                u.role.toLowerCase() === role.toLowerCase()
            );
        }
        
        // Search by name or email
        if (search) {
            const searchTerm = search.toLowerCase();
            filteredUsers = filteredUsers.filter(u => 
                u.name.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                users: paginatedUsers,
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(filteredUsers.length / limitNum),
                    totalItems: filteredUsers.length,
                    itemsPerPage: limitNum,
                    hasNextPage: endIndex < filteredUsers.length,
                    hasPrevPage: pageNum > 1
                }
            },
            filters: {
                role,
                search
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving users',
            message: error.message
        });
    }
});

// GET user by ID
router.get('/:id', (req, res) => {
    try {
        const user = users.find(u => u.id === req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving user',
            message: error.message
        });
    }
});

// POST create new user
router.post('/', (req, res) => {
    try {
        const userData = req.body;
        
        // Validate user data
        const validation = validateUser(userData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }
        
        // Check if email already exists
        const existingUser = users.find(u => u.email === validation.user.email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        
        // Create new user
        const newUser = {
            id: generateId(),
            ...validation.user,
            role: userData.role || 'customer',
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error creating user',
            message: error.message
        });
    }
});

// PUT update user
router.put('/:id', (req, res) => {
    try {
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
        
        // Check if email is being changed and if it already exists
        if (validation.user.email !== users[userIndex].email) {
            const existingUser = users.find(u => u.email === validation.user.email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'User with this email already exists'
                });
            }
        }
        
        // Update user
        users[userIndex] = {
            ...users[userIndex],
            ...validation.user,
            role: userData.role || users[userIndex].role,
            updatedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: users[userIndex]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error updating user',
            message: error.message
        });
    }
});

// DELETE user
router.delete('/:id', (req, res) => {
    try {
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
            data: deletedUser
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error deleting user',
            message: error.message
        });
    }
});

// GET user statistics
router.get('/stats/overview', (req, res) => {
    try {
        const totalUsers = users.length;
        const customers = users.filter(u => u.role === 'customer').length;
        const admins = users.filter(u => u.role === 'admin').length;
        
        // Calculate average age
        const usersWithAge = users.filter(u => u.age !== null);
        const averageAge = usersWithAge.length > 0 
            ? Math.round(usersWithAge.reduce((sum, u) => sum + u.age, 0) / usersWithAge.length)
            : 0;
        
        // Age distribution
        const ageGroups = {
            '18-25': users.filter(u => u.age >= 18 && u.age <= 25).length,
            '26-35': users.filter(u => u.age >= 26 && u.age <= 35).length,
            '36-50': users.filter(u => u.age >= 36 && u.age <= 50).length,
            '50+': users.filter(u => u.age > 50).length
        };
        
        res.json({
            success: true,
            data: {
                totalUsers,
                customers,
                admins,
                averageAge,
                ageGroups,
                roles: {
                    customer: customers,
                    admin: admins
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving user statistics',
            message: error.message
        });
    }
});

// GET user roles
router.get('/roles/list', (req, res) => {
    try {
        const roles = [...new Set(users.map(u => u.role))].filter(Boolean);
        
        res.json({
            success: true,
            data: roles
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error retrieving roles',
            message: error.message
        });
    }
});

module.exports = router; 