# Authentication Guards Documentation

This project implements centralized authentication guards to handle route protection and redirects, preventing race conditions and ensuring proper loading states.

## Components

### 1. AuthGuard (`components/AuthGuard.jsx`)

Protects routes that require authentication. Redirects unauthenticated users to the login page.

#### Features
- ✅ Prevents race conditions by waiting for auth state to load
- ✅ Proper loading states with customizable loading components
- ✅ Role-based access control
- ✅ Customizable redirect paths
- ✅ No flickering or layout shifts

#### Usage

**Basic Authentication (any logged-in user)**
```jsx
import AuthGuard from '@/components/AuthGuard';

export default function ProfilePage() {
  return (
    <AuthGuard>
      {/* Your protected content */}
    </AuthGuard>
  );
}
```

**Role-Based Access Control**
```jsx
import AuthGuard from '@/components/AuthGuard';

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      {/* Admin-only content */}
    </AuthGuard>
  );
}
```

**Multiple Roles**
```jsx
<AuthGuard allowedRoles={['admin', 'club-admin']}>
  {/* Content for admins and club admins */}
</AuthGuard>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Content to render when authorized |
| `requireAuth` | boolean | `true` | Whether authentication is required |
| `allowedRoles` | string[] | `null` | Array of allowed roles (optional) |
| `redirectTo` | string | `'/login'` | Where to redirect unauthenticated users |
| `unauthorizedRedirect` | string | `'/login'` | Where to redirect unauthorized users |
| `loadingComponent` | ReactNode | default spinner | Custom loading component |

### 2. GuestGuard (`components/GuestGuard.jsx`)

Protects guest-only routes (login, register). Redirects authenticated users to their profile.

#### Features
- ✅ Prevents authenticated users from accessing login/register pages
- ✅ Proper loading states
- ✅ No race conditions
- ✅ Customizable redirect paths

#### Usage

```jsx
import GuestGuard from '@/components/GuestGuard';

export default function LoginPage() {
  return (
    <GuestGuard>
      {/* Login form */}
    </GuestGuard>
  );
}
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Content to render when not authenticated |
| `redirectTo` | string | `'/profile'` | Where to redirect authenticated users |
| `loadingComponent` | ReactNode | default spinner | Custom loading component |

## Implementation Details

### How It Prevents Race Conditions

1. **Waits for auth state to load**: Guards don't make decisions until `loading` is `false`
2. **Internal state tracking**: Uses `isChecking` state to prevent premature rendering
3. **Single source of truth**: All auth logic centralized in guards
4. **Proper cleanup**: useEffect dependencies prevent stale closures

### Loading Flow

```
1. Auth context is loading → Show loading spinner
2. Auth context loaded → Check user state
3. User authenticated/authorized → Render children
4. User not authenticated/authorized → Redirect (render null)
```

### No Flickering

- Content only renders when authorization check is complete
- Returns `null` during redirect to prevent flash of unauthorized content
- Consistent loading UI across all protected routes

## Pages Using Guards

### Protected with AuthGuard
- [app/profile/page.js](../app/profile/page.js) - Requires any authenticated user
- [app/admin/page.js](../app/admin/page.js) - Requires `admin` role

### Protected with GuestGuard
- [app/login/page.js](../app/login/page.js) - Redirects authenticated users
- [app/register/page.js](../app/register/page.js) - Redirects authenticated users

### Public Pages (No Guard)
- [app/page.js](../app/page.js) - Home page
- [app/verify/page.js](../app/verify/page.js) - Certificate verification
- [app/about/page.js](../app/about/page.js) - About page

## Migration Guide

### Before (Old Pattern)
```jsx
export default function MyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingSpinner />;
  }

  return <div>My protected content</div>;
}
```

### After (New Pattern)
```jsx
import AuthGuard from '@/components/AuthGuard';

export default function MyPage() {
  const { user } = useAuth(); // No need for loading state

  return (
    <AuthGuard>
      <div>My protected content</div>
    </AuthGuard>
  );
}
```

## Benefits

✅ **Centralized Logic**: All auth redirect logic in one place  
✅ **Consistent UX**: Same loading behavior across all pages  
✅ **Less Code**: Remove repetitive useEffect hooks  
✅ **Type Safety**: Single source of truth for auth checks  
✅ **Maintainable**: Update guard once, affects all protected routes  
✅ **No Race Conditions**: Proper state management prevents timing issues  
✅ **Better Performance**: Optimized re-renders  

## Custom Loading Component

```jsx
const MyLoadingSpinner = (
  <div className="custom-loading">
    <Spinner />
    <p>Please wait...</p>
  </div>
);

<AuthGuard loadingComponent={MyLoadingSpinner}>
  {/* Content */}
</AuthGuard>
```

## Role Checking Logic

The guard checks roles in two places:
1. `user.user_metadata?.roles` array (Supabase format)
2. `user.userType` field (Backend format)

This ensures compatibility with different authentication flows.

## Best Practices

1. **Always wrap early**: Place guard at the top level of your page component
2. **Don't nest guards**: Use one guard per page
3. **Use correct guard**: AuthGuard for protected routes, GuestGuard for public auth pages
4. **Specify roles explicitly**: Use `allowedRoles` for role-based access
5. **Remove old auth logic**: Delete redundant useEffect hooks and loading checks
