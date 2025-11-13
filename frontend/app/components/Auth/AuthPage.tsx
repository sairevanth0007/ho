// C:app/components/Auth/AuthPage.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import CustomToast from "../common/CustomToast";

// Constants for better maintainability
const CALLBACK_TIMEOUT = 10000; // 10 seconds
const ROUTE_STORAGE_KEY = 'auth_redirect_route';

// Reusable Button Component for Social Logins
interface SocialButtonProps {
  provider: "Google" | "Microsoft" | "GitHub";
  referralCode: string;
  disabled?: boolean;
}

const SocialAuthButton: React.FC<SocialButtonProps> = ({ provider, referralCode, disabled = false }) => {
  // Use the environment variable for the base URL
  const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/${provider.toLowerCase()}`;
  const redirectUrl = referralCode ? `${baseUrl}?referralCode=${encodeURIComponent(referralCode)}` : baseUrl;

  let logoSrc = "";
  // Common classes for all buttons to be white/light themed
  const buttonCommonClass = "border border-gray-300 bg-white hover:bg-gray-50";
  let textClass = "text-gray-700"; // Default text color for light buttons

  // Specific logos and text colors for each button
  switch (provider) {
    case "Google":
      // Iconic Google 'G' logo (colorful)
      logoSrc = "https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg";
      break;
    case "Microsoft":
      // Iconic Microsoft 4-square logo (colorful)
      logoSrc = "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg";
      break;
    case "GitHub":
      // Iconic GitHub Octocat logo (black for visibility on white background)
      logoSrc = "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"; // Official black PNG
      textClass = "text-gray-800"; // Slightly darker text for GitHub
      break;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    // Store the current route for post-auth navigation
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/auth') {
      sessionStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
    }
  };

  return (
    <a
      href={redirectUrl}
      onClick={handleClick}
      className={`flex items-center justify-center gap-3 rounded-lg px-6 py-3 text-lg font-medium shadow-sm transition-colors duration-200 ${
        disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:shadow-md transform hover:scale-[1.02]'
      } ${buttonCommonClass}`}
      aria-disabled={disabled}
    >
      <img 
        src={logoSrc} 
        alt={`${provider} logo`} 
        className="h-6 w-6 transition-transform duration-200" 
      /> 
      <span className={textClass}>
        {disabled ? 'Redirecting...' : `Sign in with ${provider}`}
      </span>
    </a>
  );
};

const AuthPage: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [referralCode, setReferralCode] = useState("");
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [callbackTimeout, setCallbackTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Enhanced callback processing with better error handling
  const processCallback = useCallback(async () => {
    setIsProcessingCallback(true);
    
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsProcessingCallback(false);
      toast.custom((t) => (
        <CustomToast 
          t={t} 
          message="Authentication is taking longer than expected. Please try again." 
          type="error" 
        />
      ));
    }, CALLBACK_TIMEOUT);
    
    setCallbackTimeout(timeout);

    try {
      const queryParams = new URLSearchParams(location.search);
      const status = queryParams.get("status");
      const message = queryParams.get("message");
      const loginSuccess = queryParams.get("login");
      const errorCode = queryParams.get("error");
      
      // Clear the URL parameters
      navigate(location.pathname, { replace: true });

      if (status === "failed" || errorCode) {
        const errorMessage = message || "Authentication failed. Please try again.";
        toast.custom((t) => (
          <CustomToast 
            t={t} 
            message={decodeURIComponent(errorMessage)} 
            type="error" 
          />
        ));
        setIsProcessingCallback(false);
        clearTimeout(timeout);
        return;
      }

      if (loginSuccess === "success") {
        toast.custom((t) => (
          <CustomToast 
            t={t} 
            message="Successfully logged in! Redirecting..." 
            type="success" 
          />
        ));
        
        // Wait a moment for the success message to be visible
        setTimeout(() => {
          // Check for stored redirect route
          const redirectRoute = sessionStorage.getItem(ROUTE_STORAGE_KEY);
          if (redirectRoute) {
            sessionStorage.removeItem(ROUTE_STORAGE_KEY);
            navigate(redirectRoute, { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        }, 1500);
        
        setIsProcessingCallback(false);
        clearTimeout(timeout);
        return;
      }

      // If no callback parameters, just clear the loading state
      setIsProcessingCallback(false);
      clearTimeout(timeout);
      
    } catch (error) {
      console.error("Error processing authentication callback:", error);
      setIsProcessingCallback(false);
      clearTimeout(timeout);
      
      toast.custom((t) => (
        <CustomToast 
          t={t} 
          message="An unexpected error occurred. Please try again." 
          type="error" 
        />
      ));
    }
  }, [location, navigate]);

  // Effect to handle OAuth callback messages (success/failure)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const hasCallbackParams = queryParams.has("status") || 
                             queryParams.has("login") || 
                             queryParams.has("error");
    
    if (hasCallbackParams) {
      processCallback();
    }
  }, [location.search, processCallback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (callbackTimeout) {
        clearTimeout(callbackTimeout);
      }
    };
  }, [callbackTimeout]);

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferralCode(e.target.value);
  };

  return (
    <section id="auth-section" className="mt-[60px] px-[5%] py-16 md:py-24 lg:py-28">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container text-center"
      >
        <h2 className="mb-6 text-5xl font-bold md:text-7xl lg:text-8xl">
          Join GenerativeIDE
        </h2>
        <p className="mb-12 md:mb-18 lg:mb-20 md:text-md">
          Sign in or create an account using your preferred provider.
        </p>

        <div className="mx-auto max-w-sm">
          {/* Enhanced loading state during callback processing */}
          {isProcessingCallback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-gray-900/50 rounded-lg border border-gray-700"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-white text-lg font-medium">
                  Processing authentication...
                </p>
                <p className="text-gray-400 text-sm">
                  Please wait while we verify your credentials
                </p>
              </div>
            </motion.div>
          )}

          {/* Referral Code Input - Commented out in original, keeping same */}
          {/* <div className="mb-8">
            <label htmlFor="referral-code" className="block mb-2 font-medium text-left text-gray-300">
              Referral Code (Optional)
            </label>
            <input
              id="referral-code"
              name="referralCode"
              type="text"
              value={referralCode}
              onChange={handleReferralCodeChange}
              placeholder="Enter your referral code"
              className="w-full rounded border border-gray-600 bg-white/5 p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div> */}

          {/* Social Login Buttons */}
          <div className="flex flex-col gap-4">
            <SocialAuthButton 
              provider="Google" 
              referralCode={referralCode}
              disabled={isProcessingCallback}
            />
            <SocialAuthButton 
              provider="Microsoft" 
              referralCode={referralCode}
              disabled={isProcessingCallback}
            />
            <SocialAuthButton 
              provider="GitHub" 
              referralCode={referralCode}
              disabled={isProcessingCallback}
            />
          </div>

          {/* Additional info when processing */}
          {isProcessingCallback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-sm text-gray-400"
            >
              <p> Your authentication is secure and will redirect you automatically</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default AuthPage;