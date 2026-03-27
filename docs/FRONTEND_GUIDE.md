# Frontend Architecture & Component Guide

## Component Structure

### Layout Components
- **Navbar.jsx** - Top navigation bar with user menu and dark mode toggle
- **Sidebar.jsx** - Side menu with role-based navigation
- **Modal.jsx** - Reusable modal component

### Feature Components
- **FormInput.jsx** - Reusable form input with validation
- **Table.jsx** - Reusable data table with actions

## Page Components

### Authentication Pages
- **Login.jsx** - User login page
- **Register.jsx** - User registration page

### Dashboard Pages
- **Dashboard.jsx** - Main dashboard with charts and statistics
- **ChangeList.jsx** - List all change requests with filters
- **CreateChange.jsx** - Form to create new change request
- **Approvals.jsx** - Approval management page for managers

## Context & State Management

### AuthContext.jsx
Manages:
- User authentication state
- JWT token management
- Dark mode toggle
- User logout

## Services

### api.js
- Axios instance with interceptors
- API calls for:
  - Authentication
  - Change requests (CRUD)
  - File management
  - Dashboard statistics

### helpers.js
- Toast notifications
- Date formatting utilities

## Styling

- **Tailwind CSS** for utility-first styling
- **Dark mode** support with CSS classes
- Custom classes in `index.css` for components
- Responsive design for mobile, tablet, desktop

## Component Usage Examples

### FormInput
```jsx
<FormInput
  label="Title"
  name="title"
  value={formData.title}
  onChange={handleChange}
  required
  error={errors.title}
/>
```

### Modal
```jsx
<Modal
  isOpen={isOpen}
  title="Change Details"
  onClose={closeModal}
>
  {/* Modal content */}
</Modal>
```

### Table
```jsx
<Table
  columns={[
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' }
  ]}
  data={data}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

## Data Flow

1. User logs in → AuthContext stores token
2. Protected routes check authentication
3. API calls automatically include token in header
4. Response interceptor handles 401 errors
5. Components update state with fetched data
6. Notifications show success/error messages

## Best Practices

- Always check `isAuthenticated` before rendering protected content
- Use `useAuth()` hook to access auth context
- Display loading states during API calls
- Show toast notifications for user feedback
- Validate form inputs before submission
- Handle API errors gracefully
- Use semantic HTML elements
- Implement keyboard navigation
