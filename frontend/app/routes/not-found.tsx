// routes/not-found.tsx
"use client";

import React from "react";
import NotFoundContent from "../components/common/NotFoundContent";

const NotFoundPage: React.FC = () => {
  return (
    // Navbar and Footer are handled by root.tsx
    <NotFoundContent />
  );
};

export default NotFoundPage;