# Authentication System Documentation

## Overview
This project uses Supabase authentication with role-based access control. There are three types of users:
- **Admin**: Full system access
- **Club Admin**: Can manage club certificates
- **Student**: Can view their certificates

## Frontend Pages

### Login Page (`/login`)
- Users select their role type from a dropdown (Admin, Club Admin, or Student)
- Form displays after role selection with email/username and password fields
- Makes API call to the appropriate backend endpoint based on role
- Stores authentication token and user data in localStorage
- Redirects to `/create` page upon successful login

### Register Page (`/register`)
- **Only available for students** - Admin and Club Admin registration is restricted
- Requires VIT AP student email (`@vitapstudent.ac.in`)
- Password must be at least 6 characters
- Success screen shown after registration
- Automatic redirect to login page after 2 seconds

## Backend Endpoints

### Login Endpoints
- `POST /api/auth/login/admin` - Admin login
- `POST /api/auth/login/club-admin` - Club Admin login
- `POST /api/auth/login/student` - Student login

**Request Body:**
```json
{
  "username": "user@example.com or username",
  "password": "password123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "user-id",
      "username": "username",
      "email": "email@example.com",
      "role": "student"
    },
    "token": "jwt-token",
    "session": {...}
  },
  "message": "Login successful",
  "success": true
}
```

### Register Endpoint
- `POST /api/auth/register/student` - Student registration only

**Request Body:**
```json
{
  "username": "student@vitapstudent.ac.in",
  "password": "password123"
}
```

**Note:** The backend expects the email in the `username` field.

## Authentication Context

The `AuthContext` provides the following:
- `user`: Current authenticated user object with userType
- `loading`: Loading state during authentication check
- `signOut()`: Function to log out user
- `setUser()`: Function to update user state
- `walletAddress`: Connected Web3 wallet address (if any)
- `signInWithEthereum()`: Function to connect Web3 wallet

## Token Management

### Storage
- `auth_token`: JWT token from backend
- `user_type`: User role (admin/club-admin/student)
- `user_data`: Serialized user object

### Axios Interceptor
- Automatically adds `Authorization: Bearer <token>` header to all requests
- Handles 401 responses by clearing auth data and redirecting to login

## UI Components

### Navbar
- Shows Sign In/Register buttons when not authenticated
- Shows user avatar, username, role badge, and Sign Out button when authenticated
- Responsive design for mobile and desktop

### Protected Routes
To protect a route/page, check for user in the component:

```javascript
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <div>Protected Content</div>;
}
```

## Role-Based Restrictions (To Be Implemented)

You mentioned you'll specify later how to restrict options for users. Here are some patterns you can use:

### Component-Level Restriction
```javascript
const { user } = useAuth();

// Only show for admins
{user?.userType === 'admin' && (
  <Button>Admin Only Action</Button>
)}

// Show for admin and club-admin
{(user?.userType === 'admin' || user?.userType === 'club-admin') && (
  <Button>Create Certificate</Button>
)}
```

### Page-Level Restriction
```javascript
export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.userType !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // ... rest of component
}
```

## Security Notes

1. **Email Validation**: Student registration requires `@vitapstudent.ac.in` email
2. **Password Requirements**: Minimum 6 characters
3. **Token Expiration**: Handled by Supabase JWT
4. **HTTPS**: Ensure production uses HTTPS
5. **CORS**: Backend should have proper CORS configuration

## Environment Variables

Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5500
```

## Next Steps

1. ✅ Login page with role selection
2. ✅ Student registration page
3. ✅ AuthContext with token management
4. ✅ Navbar with auth buttons and user info
5. ⏳ Implement role-based restrictions (as per your next instructions)
6. ⏳ Protected routes implementation
7. ⏳ Email verification flow (for students)
8. ⏳ Password reset functionality

## Testing

### Test Admin Login
- Endpoint: `/login`
- Select: Admin
- Credentials: Use existing admin credentials from database

### Test Student Registration
1. Go to `/register`
2. Enter VIT AP student email
3. Enter password (min 6 chars)
4. Confirm password
5. Click "Create Account"
6. Should redirect to login

### Test Student Login
- After registration and email verification
- Use student email and password
- Should be able to log in
