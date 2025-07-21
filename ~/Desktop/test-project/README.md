# Test Project

A demonstration project to showcase Curvable AI Assistant features.

## Project Structure

```
test-project/
├── package.json          # Project configuration and dependencies
├── README.md            # This file
├── src/
│   ├── index.js         # Main application entry point
│   ├── utils/
│   │   └── helpers.js   # Utility functions
│   ├── routes/
│   │   └── users.js     # User API routes
│   └── models/          # Data models (future use)
```

## Features

- **Express.js REST API** with user management
- **Input validation** with comprehensive error handling
- **Modular structure** with separated concerns
- **Helper functions** for common operations

## API Endpoints

- `GET /` - Welcome message and API info
- `GET /health` - Health check endpoint
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/order` - Process order with validation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. For development with auto-restart:
   ```bash
   npm run dev
   ```

## Testing with Curvable AI Assistant

This project is designed to test various AI assistant features:

1. **Project Structure Analysis** - Use "Curvable AI: Analyze Project"
2. **Code Analysis** - Select code and use "🔍 Analyze Code" button
3. **Function Explanation** - Select functions and ask "What does this do?"
4. **Code Flow Analysis** - Ask about how different parts work together
5. **File Creation** - Ask AI to create new files or modify existing ones

## Example Code to Analyze

Try selecting and analyzing these functions:

- `calculateTotal()` in `src/utils/helpers.js`
- `validateUser()` in `src/utils/helpers.js`
- The order processing logic in `src/index.js`
- The user routes in `src/routes/users.js` 