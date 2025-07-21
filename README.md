# Test Project - Curvable AI Assistant Demo

A comprehensive demonstration project showcasing all Curvable AI Assistant features with a full-featured Express.js REST API.

## 🚀 Project Overview

This project demonstrates a complete e-commerce API with user management, product catalog, and order processing. It's designed to showcase the AI assistant's ability to analyze complex codebases, understand relationships between files, and provide intelligent suggestions.

## 📁 Project Structure

```
test-project/
├── package.json              # Project configuration and dependencies
├── README.md                # This comprehensive documentation
├── src/
│   ├── index.js             # Main application entry point with Express server
│   ├── utils/
│   │   └── helpers.js       # Utility functions for validation, calculations, etc.
│   ├── routes/
│   │   ├── users.js         # User management API endpoints
│   │   └── products.js      # Product catalog API endpoints
│   └── models/              # Data models (future expansion)
```

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Security**: Helmet, CORS
- **Validation**: Custom validation functions
- **Documentation**: JSDoc comments throughout

## 🔧 Features

### Core API Features
- **User Management**: CRUD operations with validation
- **Product Catalog**: Full product management with filtering
- **Order Processing**: Complete order workflow with calculations
- **Security**: Input validation, error handling, security headers
- **Pagination**: Built-in pagination for all list endpoints
- **Search & Filtering**: Advanced search capabilities

### Technical Features
- **Comprehensive Error Handling**: Try-catch blocks with detailed error messages
- **Input Validation**: Robust validation for all user inputs
- **Request Logging**: Automatic request logging middleware
- **Health Monitoring**: Detailed health check endpoint
- **API Documentation**: Self-documenting API responses

## 📚 API Endpoints

### Main Endpoints
- `GET /` - API documentation and endpoint information
- `GET /health` - System health check with detailed metrics

### User Management (`/api/users`)
- `GET /api/users` - List users with filtering and pagination
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats/overview` - User statistics
- `GET /api/users/roles/list` - Available user roles

### Product Management (`/api/products`)
- `GET /api/products` - List products with filtering and pagination
- `GET /api/products/:id` - Get specific product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/categories/list` - Available categories
- `POST /api/products/:id/discount` - Calculate product discount

### Order Processing (`/api/order`)
- `POST /api/order` - Process order with validation and calculations

## 🎯 Testing with Curvable AI Assistant

This project is specifically designed to test various AI assistant capabilities:

### 1. **Project Structure Analysis**
- Use command: `"Curvable AI: Analyze Project"`
- AI will analyze the entire codebase structure
- Provides insights about organization and architecture

### 2. **Code Analysis**
- Select any function and click "🔍 Analyze Code" button
- AI analyzes selected code with detailed explanations
- Suggests improvements and best practices

### 3. **Function Understanding**
- Select functions like `calculateTotal()`, `validateUser()`, etc.
- Ask: "What does this function do?"
- AI explains purpose, parameters, and usage

### 4. **Code Flow Analysis**
- Ask: "How does the order processing work?"
- AI explains the flow between different files and functions
- Shows relationships between components

### 5. **File Creation & Modification**
- Ask: "Create a new endpoint for inventory management"
- AI suggests new files and code structure
- Can modify existing files with improvements

### 6. **Error Analysis**
- Select error handling code
- Ask: "How can I improve this error handling?"
- AI provides suggestions for better error management

## 🔍 Example Code to Analyze

### Helper Functions (`src/utils/helpers.js`)
- `calculateTotal()` - Complex array reduction with validation
- `validateUser()` - Comprehensive input validation
- `validateProduct()` - Product-specific validation
- `formatCurrency()` - Internationalization example
- `calculateDiscount()` - Business logic implementation

### API Routes (`src/routes/`)
- `users.js` - Complete CRUD with filtering and pagination
- `products.js` - Advanced product management with search

### Main Application (`src/index.js`)
- Express server setup with middleware
- Order processing logic
- Error handling middleware
- Comprehensive logging

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager

### Installation
```bash
# Clone or navigate to the project
cd test-project

# Install dependencies
npm install

# Start the server
npm start

# For development with auto-restart
npm run dev
```

### Testing the API
```bash
# Health check
curl http://localhost:3000/health

# Get API documentation
curl http://localhost:3000/

# List users
curl http://localhost:3000/api/users

# List products
curl http://localhost:3000/api/products
```

## 🎨 AI Assistant Testing Scenarios

### Scenario 1: Function Analysis
1. Open `src/utils/helpers.js`
2. Select the `calculateTotal()` function
3. Click "🔍 Analyze Code" button
4. AI explains the function's purpose and suggests improvements

### Scenario 2: Project Understanding
1. Ask in chat: "Explain the project structure"
2. AI analyzes all files and explains the architecture
3. Shows relationships between different components

### Scenario 3: Code Flow Analysis
1. Ask: "How does order processing work?"
2. AI traces the flow from API endpoint to helper functions
3. Explains the complete workflow

### Scenario 4: File Creation
1. Ask: "Create a new endpoint for order history"
2. AI suggests new route file and modifications
3. Provides complete implementation

### Scenario 5: Code Improvement
1. Select any validation function
2. Ask: "How can I improve this validation?"
3. AI suggests better error handling and validation patterns

## 📊 Project Metrics

- **Files**: 5 main files
- **Functions**: 15+ utility functions
- **API Endpoints**: 20+ endpoints
- **Validation Rules**: 10+ validation functions
- **Error Handling**: Comprehensive error management

## 🔧 Development Commands

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (when implemented)
npm run lint       # Run ESLint (when configured)
npm run build      # Build for production (when configured)
```

## 🎯 AI Assistant Features Demonstrated

- ✅ **Selected Code Reading** - AI reads and analyzes selected code
- ✅ **Project Structure Analysis** - AI understands the entire codebase
- ✅ **Code Flow Explanation** - AI explains how components work together
- ✅ **Function Analysis** - AI analyzes individual functions
- ✅ **File Creation** - AI can create new files and modify existing ones
- ✅ **Error Analysis** - AI suggests improvements for error handling
- ✅ **Best Practices** - AI recommends coding standards and patterns
- ✅ **Context Awareness** - AI understands relationships between files

This project provides a comprehensive testing environment for all Curvable AI Assistant features! 🚀 