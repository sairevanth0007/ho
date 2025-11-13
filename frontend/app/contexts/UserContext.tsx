// C:app/contexts/UserContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import toast from "react-hot-toast";
import CustomToast from "../components/common/CustomToast";

// Define the shape of a User object received from /api/v1/auth/me
interface User {
  _id: string;
  name: string;
  email: string;
  provider: string;
  avatar?: string;
  userReferralCode: string;
  userNumberOfReferrals: number;
  subscriptionStatus: 
    | "active" 
    | "trialing" 
    | "past_due" 
    | "canceled" 
    | "unsubscribed" 
    | "free" 
    | "ended" 
    | "FreeTrial" 
    | "BonusExtension" 
    | null;
  currentPlanType: 
    | "free" 
    | "Monthly" 
    | "Yearly" 
    | "SmallBusiness" 
    | "FreeTrial" 
    | "BonusExtension" 
    | null;
  subscriptionExpiresAt: string; // ISO 8601 date string
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Team-related fields
  isTeamOwner?: boolean;
  isTeamMember?: boolean;
  teamSubscriptionId?: string;
  teamOwnerId?: string;
  teamOwnerEmail?: string;
}

// Extended subscription info from getEffectiveSubscription()
interface EffectiveSubscription {
  type: "personal" | "team_owner" | "team_member" | "team_member_extended" | "free";
  subscription: any;
  expiresAt: string;
  planName: string;
  seats?: string; // For team owners: "3/5"
  ownerEmail?: string; // For team members
}

// Define the shape of the UserContext
interface UserContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  effectiveSubscription: EffectiveSubscription | null;
  fetchCurrentUser: () => Promise<void>;
  fetchEffectiveSubscription: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Team-specific helpers
  isTeamOwner: boolean;
  isTeamMember: boolean;
  hasActiveSubscription: boolean;
}

// Enhanced error types for better error handling
interface ContextError {
  message: string;
  code?: string;
  retryable?: boolean;
}

// Route preservation interface
interface RouteState {
  path: string;
  timestamp: number;
  preserve: boolean;
}

// Create the context with a default (null) value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to use the UserContext
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

/**
 * Enhanced UserProvider component with improved authentication state management,
 * route preservation, and better error handling
 * 
 * Key improvements:
 * 1. Route preservation mechanism using sessionStorage
 * 2. Enhanced logout with retry logic and better error handling
 * 3. Environment variable validation with fallbacks
 * 4. Improved loading state management
 * 5. Comprehensive error handling and user feedback
 * 6. Maintains exact same API and usage patterns
 */
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [effectiveSubscription, setEffectiveSubscription] = useState<EffectiveSubscription | null>(null);
  const [lastError, setLastError] = useState<ContextError | null>(null);

  // Environment variable validation with fallbacks
  const getApiBaseUrl = useCallback((): string => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (!envUrl || typeof envUrl !== 'string' || envUrl.trim() === '') {
      console.warn('VITE_API_BASE_URL is not properly configured, using fallback');
      return 'http://localhost:3001'; // Fallback URL
    }
    try {
      new URL(envUrl);
      return envUrl;
    } catch {
      console.warn('VITE_API_BASE_URL is not a valid URL, using fallback');
      return 'http://localhost:3001'; // Fallback URL
    }
  }, []);

  const API_BASE_URL = getApiBaseUrl();

  // Route preservation mechanism
  const ROUTE_STORAGE_KEY = 'user_context_route_state';
  
  const saveRouteState = useCallback((path: string, preserve: boolean = true) => {
    try {
      const routeState: RouteState = {
        path,
        timestamp: Date.now(),
        preserve
      };
      sessionStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(routeState));
    } catch (error) {
      console.warn('Failed to save route state:', error);
    }
  }, []);

  const getRouteState = useCallback((): RouteState | null => {
    try {
      const stored = sessionStorage.getItem(ROUTE_STORAGE_KEY);
      if (!stored) return null;
      
      const routeState: RouteState = JSON.parse(stored);
      
      // Check if route state is not too old (24 hours)
      const isExpired = Date.now() - routeState.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        sessionStorage.removeItem(ROUTE_STORAGE_KEY);
        return null;
      }
      
      return routeState;
    } catch (error) {
      console.warn('Failed to retrieve route state:', error);
      return null;
    }
  }, []);

  const clearRouteState = useCallback(() => {
    try {
      sessionStorage.removeItem(ROUTE_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear route state:', error);
    }
  }, []);

  // Enhanced error handling with retry logic
  const handleApiError = useCallback((error: any, operation: string, retryable: boolean = false): ContextError => {
    const contextError: ContextError = {
      message: error?.message || `${operation} failed due to an unknown error`,
      code: error?.code || 'UNKNOWN_ERROR',
      retryable
    };

    if (error?.response?.status) {
      contextError.code = `HTTP_${error.response.status}`;
      contextError.retryable = [408, 429, 500, 502, 503, 504].includes(error.response.status);
    }

    setLastError(contextError);
    return contextError;
  }, []);

  // Enhanced fetch with retry logic
  const fetchWithRetry = useCallback(async (
    url: string,
    options: RequestInit,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<Response> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Don't retry on client errors (4xx)
        if (!response.ok && response.status >= 400 && response.status < 500) {
          return response;
        }
        
        if (response.ok) {
          return response;
        }
        
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        lastError.response = { status: response.status };
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }, []);

  // Enhanced user data fetching
  const fetchCurrentUser = useCallback(async () => {
    setIsLoading(true);
    setLastError(null);
    
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/v1/auth/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const userData = data.data;
        
        // Determine team status from user data
        const isOwner = userData.currentPlanType === "SmallBusiness" && userData.subscriptionStatus === "active";
        const isMember = !!userData.teamSubscriptionId && !isOwner;
        
        const user = {
          ...userData,
          isTeamOwner: isOwner,
          isTeamMember: isMember,
        };
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Fetch effective subscription details
        await fetchEffectiveSubscriptionInternal(user._id);
        
        // Clear any previous route state on successful authentication
        clearRouteState();
        
      } else if (response.status === 401) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setEffectiveSubscription(null);
        clearRouteState();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const contextError = handleApiError(
          { 
            ...errorData, 
            response: { status: response.status } 
          },
          "fetch user data"
        );
        
        console.error("Failed to fetch user:", errorData.message || response.statusText);
        toast.custom((t) => (
          <CustomToast 
            t={t} 
            message={errorData.message || "Failed to fetch user data due to server error."} 
            type="error" 
          />
        ));
        
        setCurrentUser(null);
        setIsAuthenticated(false);
        setEffectiveSubscription(null);
      }
    } catch (error: any) {
      const contextError = handleApiError(error, "fetch user data", true);
      console.error("Error fetching user:", error);
      
      toast.custom((t) => (
        <CustomToast 
          t={t} 
          message="Network error: Could not connect to the server. Please check your internet connection." 
          type="error" 
        />
      ));
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      setEffectiveSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, fetchWithRetry, handleApiError, clearRouteState]);

  // Internal function to fetch effective subscription (doesn't set loading state)
  const fetchEffectiveSubscriptionInternal = async (userId?: string, retries: number = 2) => {
    if (!userId) return;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetchWithRetry(
          `${API_BASE_URL}/api/v1/user/effective-subscription`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
          1, // Only retry once for subscription
          500
        );

        if (response.ok) {
          const data = await response.json();
          setEffectiveSubscription(data.data);
          return;
        } else {
          // If this is not the last attempt, wait before retrying
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          setEffectiveSubscription(null);
          return;
        }
      } catch (error) {
        if (attempt === retries) {
          console.error("Error fetching effective subscription:", error);
          setEffectiveSubscription(null);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  // Public function to fetch effective subscription
  const fetchEffectiveSubscription = useCallback(async () => {
    if (currentUser?._id) {
      await fetchEffectiveSubscriptionInternal(currentUser._id);
    }
  }, [currentUser?._id]);

  // Enhanced logout with retry logic
  const logout = useCallback(async () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    setIsLoading(true);
    setLastError(null);
    
    // Save current route before logout for potential restoration
    saveRouteState(currentPath, true);
    
    try {
      const response = await fetchWithRetry(
        `${API_BASE_URL}/api/v1/auth/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setEffectiveSubscription(null);
        
        // Clear route state on successful logout
        clearRouteState();
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        const contextError = handleApiError(
          { 
            ...errorData, 
            response: { status: response.status } 
          },
          "logout",
          true
        );
        
        console.error("Logout failed:", errorData.message || response.statusText);
        
        toast.custom((t) => (
          <CustomToast 
            t={t} 
            message={errorData.message || "Failed to log out. Please try again."} 
            type="error" 
          />
        ));
        
        // Even if logout fails on server, clear local state for security
        setCurrentUser(null);
        setIsAuthenticated(false);
        setEffectiveSubscription(null);
      }
    } catch (error: any) {
      const contextError = handleApiError(error, "logout", true);
      console.error("Error during logout:", error);
      
      toast.custom((t) => (
        <CustomToast 
          t={t} 
          message="Network error during logout. Your session has been cleared locally." 
          type="error" 
        />
      ));
      
      // Clear local state even on network error for security
      setCurrentUser(null);
      setIsAuthenticated(false);
      setEffectiveSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, fetchWithRetry, handleApiError, saveRouteState, clearRouteState]);

  // Enhanced initial load with route state management
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for preserved route state
      const routeState = getRouteState();
      
      if (routeState?.preserve) {
        // Optional: Could restore route here if needed
        console.log('Preserved route found:', routeState.path);
      }
      
      await fetchCurrentUser();
    };

    initializeAuth();
  }, [fetchCurrentUser, getRouteState]);

  // Save route state when component mounts (for route preservation)
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      saveRouteState(currentPath, true);
    }
  }, [isAuthenticated, saveRouteState]);

  // Computed values (unchanged from original)
  const isTeamOwner = currentUser?.isTeamOwner || false;
  const isTeamMember = currentUser?.isTeamMember || false;
  const hasActiveSubscription = 
    currentUser?.subscriptionStatus === "active" || 
    currentUser?.subscriptionStatus === "trialing" ||
    isTeamMember;

  // Provide the context value to children
  const contextValue: UserContextType = {
    currentUser,
    isAuthenticated,
    isLoading,
    effectiveSubscription,
    fetchCurrentUser,
    fetchEffectiveSubscription,
    logout,
    isTeamOwner,
    isTeamMember,
    hasActiveSubscription,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Export context for advanced usage if needed
export default UserContext;
