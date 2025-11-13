// C:app/components/common/NotFoundContent.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext"; // Import useUser to check authentication

const NotFoundContent: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { isAuthenticated, isLoading } = useUser(); // Get auth state from context
  const navigate = useNavigate();

  const handleReturnClick = () => {
    if (isLoading) return; // Prevent action if user state is still loading

    if (isAuthenticated) {
      navigate("/dashboard"); // Redirect to dashboard if logged in
    } else {
      navigate("/"); // Redirect to home if not logged in
    }
  };

  return (
    <section id="not-found-section" className="mt-[60px] px-[5%] py-16 md:py-24 lg:py-28 text-center h-[calc(100vh-120px)] flex flex-col justify-center items-center">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container"
      >
        <h2 className="mb-6 text-7xl font-bold md:text-9xl lg:text-[10rem] text-gray-700">
          404
        </h2>
        <p className="mb-8 text-3xl font-semibold md:text-4xl text-white">
          Page Not Found
        </p>
        <p className="mb-12 text-lg md:text-xl text-gray-300 max-w-lg mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <button
          onClick={handleReturnClick}
          disabled={isLoading} // Disable button while loading user state
          className={`rounded px-8 py-4 text-xl font-semibold transition-colors
            ${isLoading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#222222] hover:bg-gray-800 text-white"
            }`}
        >
          {isLoading ? "Checking Login Status..." : isAuthenticated ? "Return to Dashboard" : "Return to Home"}
        </button>
      </motion.div>
    </section>
  );
};

export default NotFoundContent;