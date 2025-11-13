// routes/pricing.tsx
"use client";

import React from "react";
import { Navbar3 } from "../components/common/Navbar";
import { Footer4 } from "../components/common/Footer"; // Assuming Footer4 is available
import PricingContent from "../components/Pricing/PricingContent";

const PricingPage: React.FC = () => {
  return (
    <>
      {/* <Navbar3 /> */}
      <PricingContent />
      {/* <Footer4 /> */}
    </>
  );
};

export default PricingPage;