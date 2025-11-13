// routes/dashboard.tsx
"use client";

import React from "react";
import { DashboardNavbar } from "../components/Dashboard/DashboardNavbar";
import { Footer4 } from "../components/common/Footer";
import DashboardContent from "../components/Dashboard/DashboardContent";
import AuthGuard from "../components/common/AuthGuard"; // <--- Import AuthGuard

const DashboardPage: React.FC = () => {
  return (
    <AuthGuard> {/* <--- Wrap your dashboard content with AuthGuard */}
      <DashboardNavbar />
      <DashboardContent />
      {/* <Footer4 /> */}
    </AuthGuard>
  );
};

export default DashboardPage;