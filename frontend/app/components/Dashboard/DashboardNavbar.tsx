// C:app/components/Dashboard/DashboardNavbar.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMediaQuery } from "@relume_io/relume-ui";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Link, useLocation } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

const dashboardNavItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Pricing", href: "/pricing" },
];

const useRelumeNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 991px)");
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const getMobileOverlayClassNames = clsx(
    "fixed inset-0 z-40 bg-black/50 lg:hidden",
    { block: isMobileMenuOpen, hidden: !isMobileMenuOpen }
  );
  const animateMobileMenu = isMobileMenuOpen ? "open" : "close";
  return {
    toggleMobileMenu,
    getMobileOverlayClassNames,
    animateMobileMenu,
  };
};

// Helper function to generate an initials avatar as a data URL
const getInitialsAvatar = (email: string | undefined): string => {
  if (!email) return "data:image/svg+xml;charset=UTF-8,%3Csvg width='128' height='128' viewBox='0 0 128 128' fill='%236B7280' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='128' height='128' fill='%231F2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='60' fill='%23D1D5DB'%3E?%3C/text%3E%3C/svg%3E";

  const parts = email.split('@')[0].split('.');
  let initials = '';
  if (parts.length > 0) {
    initials = parts.map(part => part.charAt(0)).join('');
  }
  initials = initials.toUpperCase().slice(0, 2);

  return `data:image/svg+xml;charset=UTF-8,%3Csvg width='128' height='128' viewBox='0 0 128 128' fill='%236B7280' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='128' height='128' fill='%231F2937'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='60' fill='%23D1D5DB'%3E${initials}%3C/text%3E%3C/svg%3E`;
};

// Custom hook for simplified avatar loading
const useOptimizedAvatar = (avatarUrl: string | undefined, userEmail: string | undefined) => {
  const [avatarSrc, setAvatarSrc] = useState<string>(getInitialsAvatar(userEmail));
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!avatarUrl) {
      setAvatarSrc(getInitialsAvatar(userEmail));
      setHasError(false);
      return;
    }

    // Reset state for new avatar
    setIsLoading(true);
    setHasError(false);
    
    // Use the avatar URL directly
    const img = new Image();
    
    img.onload = () => {
      setAvatarSrc(avatarUrl);
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      console.error('Failed to load avatar:', avatarUrl);
      setAvatarSrc(getInitialsAvatar(userEmail));
      setIsLoading(false);
      setHasError(true);
    };

    img.src = avatarUrl;
  }, [avatarUrl, userEmail]);

  return { avatarSrc, isLoading, hasError };
};

const DashboardNavbar: React.FC = () => {
  const {
    toggleMobileMenu,
    getMobileOverlayClassNames,
    animateMobileMenu,
  } = useRelumeNavbar();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, currentUser, isAuthenticated } = useUser();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Function to check if current page is active
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
    navigate("/login");
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Use optimized avatar hook
  const { avatarSrc, isLoading } = useOptimizedAvatar(
    currentUser?.avatar,
    currentUser?.email
  );

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-[6.5%] py-6 bg-[#000000]">
      <Link to="/dashboard" className="text-2xl font-semibold text-white">
        GenerativeIDE
      </Link>

      <button
        className="flex size-10 flex-col justify-center items-center space-y-1 lg:hidden"
        onClick={toggleMobileMenu}
      >
        <span className="h-0.5 w-6 bg-white" />
        <span className="h-0.5 w-6 bg-white" />
        <span className="h-0.5 w-6 bg-white" />
      </button>

      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center gap-6">
        {/* User Avatar */}
        {isAuthenticated && (
          <Link to="/dashboard" title={currentUser?.email || "User Profile"} className="flex-shrink-0 relative">
            <img
              src={avatarSrc}
              alt="User Avatar"
              className={`h-10 w-10 rounded-full object-cover border border-gray-700 transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </Link>
        )}

        {dashboardNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={clsx(
              "text-xl font-medium hover:scale-[1.025] transition-all",
              isActive(item.href)
                ? "text-transparent bg-clip-text bg-gradient-to-r from-[#286ffe] to-[#5a23ef]" // Active page gradient
                : "text-white"
            )}
          >
            {item.name}
          </Link>
        ))}
        <button
          onClick={handleLogoutClick}
          className="ml-4 rounded px-5 py-2 text-white bg-red-600 hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {animateMobileMenu === "open" && (
          <>
            <motion.div
              className={getMobileOverlayClassNames}
              onClick={toggleMobileMenu}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.4 }}
              className="fixed top-0 left-0 z-50 h-full w-[80%] max-w-xs bg-[#0E0B04] px-6 py-6 flex flex-col justify-between"
            >
              {/* Top Row: Brand + Close Button */}
              <div className="flex items-center justify-between mb-10">
                <span className="text-xl font-semibold text-white">
                  Dashboard
                </span>
                <button
                  className="text-white text-2xl"
                  onClick={toggleMobileMenu}
                >
                  <IoClose />
                </button>
              </div>

              {/* User Avatar in Mobile Drawer */}
              {isAuthenticated && (
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={avatarSrc}
                      alt="User Avatar"
                      className={`h-12 w-12 rounded-full object-cover border border-gray-700 transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <span className="text-white text-lg font-semibold">{currentUser?.email || "User"}</span>
                </div>
              )}

              {/* Nav Items */}
              <div className="flex flex-col gap-6">
                {dashboardNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      "text-2xl font-semibold hover:scale-[1.025] transition-all",
                      isActive(item.href)
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-[#286ffe] to-[#5a23ef]" // Active page gradient
                        : "text-white"
                    )}
                    onClick={toggleMobileMenu}
                  >
                    {item.name}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    handleLogoutClick();
                    toggleMobileMenu();
                  }}
                  className="mt-4 rounded px-6 py-3 text-white bg-red-600 hover:bg-red-700 transition-colors text-2xl font-semibold"
                >
                  Logout
                </button>
              </div>

              {/* Bottom Branding (Optional) */}
              <div className="mt-auto pt-10 text-white text-sm font-medium opacity-70">
                © 2025 GenerativeIDE
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop with blur */}
          <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0E0B04] rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-700 shadow-2xl"
            >
              <h3 className="text-2xl font-semibold text-white mb-4">Confirm Logout</h3>
              <p className="text-gray-300 mb-8">Are you sure you want to logout from your account?</p>
              <div className="flex gap-4 justify-end">
                <button
                  onClick={handleLogoutCancel}
                  className="px-6 py-3 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 hover:scale-[1.02] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="px-6 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 hover:scale-[1.02] font-medium"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </nav>
  );
};

export { DashboardNavbar };
