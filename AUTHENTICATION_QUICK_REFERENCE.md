# Authentication System - Quick Reference

## 🎯 Pages Created

### 1. Login Page - `/login`
**Features:**
- Role selection dropdown (Admin / Club Admin / Student)
- Email/Username input
- Password input
- Sign in button
- Link to registration page
- Responsive design with consistent theme

**Usage:**
```
User Flow:
1. Select user type from dropdown
2. Enter credentials
3. Click "Sign In"
4. Redirected to /create on success
```

### 2. Registration Page - `/register`
**Features:**
- VIT AP student email input
- Password input with validation
- Confirm password input
- Success screen with auto-redirect
- Link to login page
- **Students only** - Admin/Club Admin registration disabled

**Usage:**
```
User Flow:
1. Enter VIT AP email (@vitapstudent.ac.in)
2. Enter password (min 6 chars)
3. Confirm password
4. Click "Create Account"
5. Success screen → Auto-redirect to login
```

## 🔐 Authentication Context

**Located at:** `contexts/AuthContext.js`

**Provides:**
- `user` - Current user object with userType
- `loading` - Auth loading state
- `signOut()` - Logout function
- `setUser()` - Update user state
- `walletAddress` - Web3 wallet (existing)
- `signInWithEthereum()` - Web3 connect (existing)

## 🎨 UI Components Created

### Select Component
**Located at:** `components/ui/select.jsx`
- Radix UI select component
- Used for user type selection on login page
- Consistent with project theme

### Updated Components

**Navbar** (`components/navbar.js`):
- Shows "Sign In" and "Register" buttons when logged out
- Shows user avatar with username and role when logged in
- Shows "Sign Out" button when authenticated
- Fully responsive (mobile + desktop)

## 📡 API Integration

**Axios Client** (`lib/axiosClient.js`):
- Automatically adds auth token to all requests
- Handles 401 responses (clears auth & redirects to login)
- Base URL from environment variables

## 🔒 Token Management

**LocalStorage Keys:**
- `auth_token` - JWT token
- `user_type` - Role (admin/club-admin/student)
- `user_data` - User object (JSON)
- `wallet_disconnected` - Web3 disconnect flag (existing)

## 📋 Backend Endpoints

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/auth/login/admin` | POST | Admin login | Public |
| `/api/auth/login/club-admin` | POST | Club Admin login | Public |
| `/api/auth/login/student` | POST | Student login | Public |
| `/api/auth/register/student` | POST | Student registration | Public |
| `/api/auth/user` | GET | Get user data | Private |

## 🎬 Next Steps (As Per User Request)

1. ✅ **Login page** - Created with role selection
2. ✅ **Register page** - Created for students only
3. ✅ **Auth context** - Updated with user management
4. ✅ **Navbar** - Updated with auth buttons
5. ⏳ **Role restrictions** - Waiting for user specifications

## 🧪 How to Test

### Start the application:
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Test Login:
1. Visit `http://localhost:3000/login`
2. Select user type
3. Enter credentials
4. Click "Sign In"

### Test Registration:
1. Visit `http://localhost:3000/register`
2. Enter VIT AP email
3. Enter password (min 6 chars)
4. Click "Create Account"

### Test Navbar:
1. Check navbar when logged out (shows Sign In/Register)
2. Log in
3. Check navbar when logged in (shows user info)
4. Click "Sign Out"
5. Check navbar returns to logged out state

## 🎨 Design Consistency

All pages follow the existing design system:
- Same color scheme (primary, secondary, muted, etc.)
- Same components (Button, Card, Input, Badge)
- Same animations (framer-motion)
- Same icons (lucide-react)
- Same layout structure
- Responsive design matching existing pages

## 📝 Key Files Modified/Created

**New Files:**
- `frontend/app/login/page.js`
- `frontend/app/register/page.js`
- `frontend/components/ui/select.jsx`
- `AUTHENTICATION_GUIDE.md`
- `AUTHENTICATION_QUICK_REFERENCE.md`

**Modified Files:**
- `frontend/contexts/AuthContext.js`
- `frontend/components/navbar.js`
- `frontend/lib/axiosClient.js`

## 🚀 Ready for Next Phase

The authentication system is now configured and ready. The user can:
1. Log in as Admin, Club Admin, or Student
2. Register as a Student
3. See their authentication status in the navbar
4. Logout

Waiting for user instructions on how to implement role-based restrictions for different features.
