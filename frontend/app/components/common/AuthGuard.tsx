// C:app/components/common/AuthGuard.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../contexts/UserContext"; // Import useUser hook
import LoadingSpinner from "./LoadingSpinner";

interface AuthGuardProps {
  children: ReactNode;
}

// Constants for better maintainability
const GUARD_RETRY_ATTEMPTS = 3;
const GUARD_RETRY_DELAY = 1000; // 1 second
const STORAGE_KEY = 'auth_guard_redirect';

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, fetchCurrentUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Store current route before redirect for better UX
  const storeCurrentRoute = (path: string) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        path,
        timestamp: Date.now(),
        search: location.search,
        hash: location.hash
      }));
    } catch (error) {
      console.warn('Failed to store redirect route:', error);
    }
  };

  // Retrieve stored route for post-login navigation
  const getStoredRoute = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Check if stored route is not older than 1 hour
        if (Date.now() - data.timestamp < 3600000) {
          return data;
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve stored route:', error);
      sessionStorage.removeItem(STORAGE_KEY);
    }
    return null;
  };

  // Enhanced redirect with route preservation
  const performRedirect = () => {
    const currentPath = location.pathname;
    const storedRoute = getStoredRoute();
    
    // Store the current route if it's not the login page
    if (currentPath !== '/login' && currentPath !== '/auth') {
      storeCurrentRoute(currentPath);
    }

    navigate("/login", { 
      replace: true,
      state: { 
        from: currentPath,
        reason: 'unauthorized_access'
      }
    });
  };

  // Retry mechanism for network issues
  const handleRetry = async () => {
    if (retryCount >= GUARD_RETRY_ATTEMPTS) {
      performRedirect();
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await fetchCurrentUser();
      // If we get here, authentication succeeded
    } catch (error) {
      console.error('Auth retry failed:', error);
      // Try again or redirect
      setTimeout(() => {
        if (retryCount + 1 >= GUARD_RETRY_ATTEMPTS) {
          performRedirect();
        } else {
          setIsRetrying(false);
        }
      }, GUARD_RETRY_DELAY);
    }
  };

  // Enhanced authentication check with retry logic
  useEffect(() => {
    // Skip if still in initial load phase
    if (isLoading && isInitialLoad) {
      return;
    }

    // If not loading and not authenticated, handle authentication
    if (!isLoading && !isAuthenticated) {
      // Try to retry if we haven't exhausted attempts and this is not the initial load
      if (!isInitialLoad && retryCount < GUARD_RETRY_ATTEMPTS) {
        handleRetry();
      } else {
        performRedirect();
      }
    }

    // Mark initial load as complete
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isAuthenticated, isLoading, retryCount, isInitialLoad, fetchCurrentUser, navigate, location.pathname]);

  // Loading state with enhanced UX
  if (isLoading && isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center space-y-4">
          <LoadingSpinner />
          <div className="space-y-2">
            <h3 className="text-white text-xl font-semibold">
              Verifying Authentication
            </h3>
            <p className="text-gray-400 text-sm max-w-md">
              Please wait while we check your credentials and prepare your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Retry state with manual retry option
  if (!isLoading && !isAuthenticated && !isInitialLoad && retryCount < GUARD_RETRY_ATTEMPTS) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center space-y-6 max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto bg-red-900/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-red-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-white text-xl font-semibold">
              Authentication Check Failed
            </h3>
            <p className="text-gray-400 text-sm">
              We couldn't verify your authentication status. This might be a temporary network issue.
            </p>
            <p className="text-gray-500 text-xs">
              Attempt {retryCount + 1} of {GUARD_RETRY_ATTEMPTS}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isRetrying ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Retrying...
                </div>
              ) : (
                'Try Again'
              )}
            </button>
            
            <button
              onClick={performRedirect}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Final loading state for non-initial loads
  if (isLoading && !isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center space-y-3">
          <LoadingSpinner />
          <p className="text-gray-400 text-sm">
            Checking authentication status...
          </p>
        </div>
      </div>
    );
  }

  // If authenticated, render the children (the protected content)
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback - should rarely reach here
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
};

export default AuthGuard;