"use client";

import React from "react";
import { Button } from "@relume_io/relume-ui";

const Cta3: React.FC = () => {
  return (
    <section id="relume" className="relative px-[5%] py-16 md:py-24 lg:py-28">
      <div className="relative z-10 container">
        <div className="w-full max-w-lg">
          <h2 className="mb-5 text-5xl font-bold text-text-alternative md:mb-6 md:text-7xl lg:text-8xl">
            Unlock the Power of AI
          </h2>
          <p className="text-text-alternative md:text-md">
            Discover how our offline AI can transform your workflow and enhance
            productivity today.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
            <Button title="Download">Download</Button>
            <Button title="Contact" variant="secondary-alt">
              Contact
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 z-0">
        <img
          src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
          className="size-full object-cover"
          alt="Relume placeholder image"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
    </section>
  );
};

export { Cta3 };
