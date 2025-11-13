// C:app/components/common/Navbar.tsx
"use client";

import React, { useState } from "react";
import { useMediaQuery } from "@relume_io/relume-ui";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Link, useLocation } from "react-router-dom";
import { IoClose } from "react-icons/io5";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Features", href: "/features" },
  { name: "Contact", href: "/contact" },
  // --- New Nav Items ---
  { name: "Pricing", href: "/pricing" }, // Added Pricing page link
];

// Added a separate array for authentication buttons to keep them distinct
const authButtons = [
  { name: "Login", href: "/login" },
];

const useRelume = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 991px)");
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const getMobileOverlayClassNames = clsx(
    "fixed inset-0 z-40 bg-black/50 lg:hidden",
    { block: isMobileMenuOpen, hidden: !isMobileMenuOpen }
  );
  const NavbarWrapper = isMobile ? motion.div : "div";
  const animateMobileMenu = isMobileMenuOpen ? "open" : "close";
  return {
    toggleMobileMenu,
    getMobileOverlayClassNames,
    animateMobileMenu,
    NavbarWrapper,
  };
};

const Navbar3: React.FC = () => {
  const {
    toggleMobileMenu,
    getMobileOverlayClassNames,
    animateMobileMenu,
    NavbarWrapper,
  } = useRelume();
  const location = useLocation();

  // Function to check if current page is active
  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-[6.5%] py-6 bg-[#000000]">
      {/* Left: Brand */}
      <Link to="/" className="text-2xl font-semibold text-white">
        GenerativeIDE
      </Link>

      {/* Mobile Hamburger */}
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
        {navItems.map((item) => (
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
        {/* Login Button with matching style */}
        <div className="ml-4 flex gap-3">
          {authButtons.map((button) => (
            <Link
              key={button.name}
              to={button.href}
              className={clsx(
                "rounded px-5 py-2 font-medium hover:scale-[1.025] transition-all",
                isActive(button.href)
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-[#286ffe] to-[#5a23ef] border border-[#286ffe]" // Active gradient with border
                  : "text-white border border-white" // Non-active: white text with white border
              )}
            >
              {button.name}
            </Link>
          ))}
        </div>
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
                  GenerativeIDE
                </span>
                <button
                  className="text-white text-2xl"
                  onClick={toggleMobileMenu}
                >
                  <IoClose />
                </button>
              </div>

              {/* Nav Items */}
              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
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
                {/* Login Button for Mobile with matching style */}
                <div className="mt-4 flex flex-col gap-4">
                  {authButtons.map((button) => (
                    <Link
                      key={button.name}
                      to={button.href}
                      className={clsx(
                        "rounded px-6 py-3 text-2xl font-semibold text-center hover:scale-[1.025] transition-all",
                        isActive(button.href)
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-[#286ffe] to-[#5a23ef] border-2 border-[#286ffe]" // Active gradient with border
                          : "text-white border-2 border-white" // Non-active: white text with white border
                      )}
                      onClick={toggleMobileMenu} // Close menu on click
                    >
                      {button.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Branding (Optional) */}
              <div className="mt-auto pt-10 text-white text-sm font-medium opacity-70">
                © 2025 GenerativeIDE
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export { Navbar3 };