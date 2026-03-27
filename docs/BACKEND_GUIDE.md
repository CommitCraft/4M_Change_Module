# Backend Architecture & API Development Guide

## MVC Architecture

### Models (src/models/)
- **User.js** - User database operations
- **ChangeRequest.js** - Change request, approval, audit log, and attachment operations

### Controllers (src/controllers/)
- **authController.js** - Authentication logic (register, login, profile)
- **changeRequestController.js** - Change request CRUD operations
- **fileController.js** - File upload/download management

### Routes (src/routes/)
- **authRoutes.js** - Auth endpoints
- **changeRequestRoutes.js** - Change request endpoints
- **fileRoutes.js** - File management endpoints

### Middleware (src/middleware/)
- **auth.js** - JWT verification and role-based access control
- **validation.js** - Express-validator error handling

### Config & Utils
- **src/config/database.js** - MySQL connection pool
- **src/utils/jwt.js** - Token generation and verification
- **src/utils/password.js** - Password hashing and comparison
- **src/utils/response.js** - Standard API response format

## API Request/Response Flow

```
Client Request
    ↓
Express Router (routes/)
    ↓
Middleware (auth, validation)
    ↓
Controller (business logic)
    ↓
Model (database query)
    ↓
Response (JSON format)
```

## Database Connection

Uses MySQL connection pool with 10 connections:
```javascript
pool = mysql.createPool({
  host, user, password, database, port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
```

## Authentication Flow

1. User login → Hash password verification
2. Generate JWT token
3. Token sent to client
4. Client includes token in Authorization header
5. Auth middleware verifies token
6. Request proceeds or returns 401 error

## Role-Based Access Control

- **Admin** (ID: 1) - Full access
- **Manager** (ID: 2) - Can approve changes, manage approvals
- **User** (ID: 3) - Can create and view own changes

## File Upload Handling

- Uses **Multer** for multipart/form-data
- Allowed types: PDF, Excel, PNG, JPEG
- Max file size: 10MB
- Files stored in `/uploads/` directory
- File path saved in database

## Error Handling

Standard error response format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Details (dev mode only)"
}
```

Status codes:
- 200: Success
- 201: Created
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Adding New Endpoints

1. Create model method in `src/models/`
2. Create controller function in `src/controllers/`
3. Add route in `src/routes/`
4. Register route in `server.js`

Example:
```javascript
// Model
export const MyModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM my_table');
    return rows;
  }
}

// Controller
export const getAll = async (req, res) => {
  try {
    const data = await MyModel.getAll();
    sendResponse(res, 200, true, 'Data fetched', data);
  } catch (error) {
    sendError(res, 500, 'Error', error.message);
  }
};

// Route
router.get('/', authMiddleware, getAll);

// Register in server.js
app.use('/api/my', myRoutes);
```

## Performance Optimization

- Connection pooling for database
- Indexed database queries
- Pagination for large datasets
- Input validation to prevent invalid queries
- Error handling to prevent crashes

## Security Best Practices

- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens with expiration
- ✅ CORS whitelist configured
- ✅ Input validation with express-validator
- ✅ File type validation
- ✅ Role-based access control
- ✅ Protected file upload route
- ✅ SQL queries use parameterized queries

## Environment Variables

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=change_management_db
DB_PORT=3306
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## Testing Endpoints

Use curl or Postman to test:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123"}'

# Get change requests (with token)
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:5000/api/change
```

See [POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json) for complete API test collection.
