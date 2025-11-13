"use client";

import React from "react";

const Logo6: React.FC = () => {
  const logos = [
    "https://d22po4pjz3o32e.cloudfront.net/webflow-logo.svg",
    "https://d22po4pjz3o32e.cloudfront.net/figma-logo.svg",
    "https://d22po4pjz3o32e.cloudfront.net/shopify-logo.svg",
    "https://d22po4pjz3o32e.cloudfront.net/notion-logo.svg",
    "https://d22po4pjz3o32e.cloudfront.net/framer-logo.svg",
  ];

  return (
    <section
      id="relume"
      className="flex flex-wrap items-center justify-center gap-10 px-[5%] py-16 md:gap-x-12 md:py-24 lg:gap-x-16 lg:py-28"
    >
      {logos.map((logo, i) => (
        <img
          key={i}
          src={logo}
          alt={`Logo ${i + 1}`}
          className="max-h-12 object-contain"
        />
      ))}
    </section>
  );
};

export { Logo6 };
