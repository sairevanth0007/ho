// routes/enterprise-contact.tsx
"use client";

import React from "react";
import EnterpriseContact from "../components/Contact/EnterpriseContact";

const EnterpriseContactPage: React.FC = () => {
  return (
    // Navbar and Footer are now rendered by root.tsx
    <EnterpriseContact />
  );
};

export default EnterpriseContactPage;