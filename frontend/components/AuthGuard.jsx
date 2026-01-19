'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * AuthGuard component to protect routes and handle authentication redirects
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {string[]} props.allowedRoles - Array of allowed roles (optional)
 * @param {string} props.redirectTo - Where to redirect if not authenticated (default: '/login')
 * @param {string} props.unauthorizedRedirect - Where to redirect if unauthorized role (default: '/login')
 * @param {React.ReactNode} props.loadingComponent - Custom loading component (optional)
 */
export default function AuthGuard({
  children,
  requireAuth = true,
  allowedRoles = null,
  redirectTo = '/login',
  unauthorizedRedirect = '/login',
  loadingComponent = null,
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);
  const lastPathnameRef = useRef(pathname);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      redirectedRef.current = false;
      lastPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Compute authorization status using derived state
  const authStatus = useMemo(() => {
    // Still loading auth state
    if (loading) {
      return { loading: true, authorized: false, shouldRedirect: false };
    }

    // If auth is not required, allow access
    if (!requireAuth) {
      return { loading: false, authorized: true, shouldRedirect: false };
    }

    // Check if user is authenticated
    if (!user) {
      return { loading: false, authorized: false, shouldRedirect: true, redirectPath: redirectTo };
    }

    // Check role-based access if roles are specified
    if (allowedRoles && allowedRoles.length > 0) {
      const userRoles = user.user_metadata?.roles || [];
      const userType = user.userType;
      
      // Check if user has any of the allowed roles
      const hasAllowedRole = allowedRoles.some(role => {
        // Check in roles array
        if (userRoles.includes(role)) return true;
        // Check userType
        if (userType === role) return true;
        return false;
      });

      if (!hasAllowedRole) {
        return { loading: false, authorized: false, shouldRedirect: true, redirectPath: unauthorizedRedirect };
      }
    }

    // User is authenticated and authorized
    return { loading: false, authorized: true, shouldRedirect: false };
  }, [user, loading, requireAuth, allowedRoles, redirectTo, unauthorizedRedirect]);

  // Handle redirects in a separate effect
  useEffect(() => {
    if (authStatus.shouldRedirect && !redirectedRef.current) {
      redirectedRef.current = true;
      console.log('[AuthGuard] Redirecting to:', authStatus.redirectPath);
      // Use replace instead of push to prevent back button issues
      router.replace(authStatus.redirectPath);
    }
  }, [authStatus.shouldRedirect, authStatus.redirectPath, router]);

  // Show loading state while checking auth
  if (authStatus.loading) {
    if (loadingComponent) {
      return loadingComponent;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authorized
  if (!authStatus.authorized) {
    return null;
  }

  // Render children when authorized
  return <>{children}</>;
}
