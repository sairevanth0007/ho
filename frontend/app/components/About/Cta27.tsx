"use client";

import React from "react";
import { Button } from "@relume_io/relume-ui";

const Cta27: React.FC = () => {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container text-center">
        <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
          Ready to Go Offline?
        </h2>
        <p className="mb-6 md:mb-8 md:text-md">
          Join the developers building in privacy, speed, and freedom.
        </p>
        <div className="flex justify-center gap-4">
          <Button title="Download">Download</Button>
          <Button title="Contact Us" variant="secondary">
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
};

export { Cta27 };
