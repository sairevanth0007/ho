// routes/login.tsx
"use client";

import React, { useEffect } from "react";
import AuthPage from "../components/Auth/AuthPage";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and not currently loading, redirect to dashboard.
    // This effect ensures that authenticated users cannot access the /login page.
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Always render AuthPage.
  // The 'AuthPage' component itself will handle displaying toasts for 'status=failed'
  // and other URL parameters, without triggering a re-render here.
  // The global isLoading from UserContext is handled in root.tsx AppContent,
  // which provides a global loading screen before any page content renders.
  return (
    <>
      <AuthPage />
    </>
  );
};

export default LoginPage;