'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * GuestGuard component - redirects authenticated users away from guest-only pages
 * Useful for login, register pages where authenticated users shouldn't access
 * Automatically redirects based on user type: admins to /admin, others to /profile
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render when not authenticated
 * @param {React.ReactNode} props.loadingComponent - Custom loading component (optional)
 */
export default function GuestGuard({
  children,
  loadingComponent = null,
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  // Compute redirect path based on user type
  const computedRedirectTo = useMemo(() => {
    if (user?.userType === 'admin') {
      return '/admin';
    } else if (user?.userType === 'club-admin') {
      return '/club-admin';
    }
    return '/profile';
  }, [user?.userType]);

  // Compute guest status using derived state
  const guestStatus = useMemo(() => {
    // Still loading auth state
    if (loading) {
      return { loading: true, shouldRender: false, shouldRedirect: false };
    }

    // If user is authenticated, redirect them
    if (user) {
      return { loading: false, shouldRender: false, shouldRedirect: true };
    }

    // User is not authenticated, show the page
    return { loading: false, shouldRender: true, shouldRedirect: false };
  }, [user, loading]);

  // Handle redirects in a separate effect
  useEffect(() => {
    if (guestStatus.shouldRedirect && !redirectedRef.current) {
      redirectedRef.current = true;
      console.log('[GuestGuard] Redirecting authenticated user to:', computedRedirectTo);
      // Use replace instead of push to prevent back button issues
      router.replace(computedRedirectTo);
    }
  }, [guestStatus.shouldRedirect, computedRedirectTo, router]);

  // Show loading state while checking auth or during redirect
  if (guestStatus.loading || guestStatus.shouldRedirect) {
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

  // Don't render children if shouldn't render
  if (!guestStatus.shouldRender) {
    return null;
  }

  // Render children when user is not authenticated
  return <>{children}</>;
}
