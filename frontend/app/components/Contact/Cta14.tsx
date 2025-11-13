"use client";

import React from "react";
import { Button } from "@relume_io/relume-ui";

const Cta14: React.FC = () => {
  return (
    <section
      id="relume"
      className="bg-gray-900 px-[5%] py-16 text-white md:py-24 lg:py-28"
    >
      <div className="container text-center">
        <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
          Still Curious?
        </h2>
        <p className="mb-6 md:mb-8 md:text-md">
          Explore how GenerativeIDE can transform your development workflow —
          even offline.
        </p>
        <div className="flex justify-center gap-4">
          <Button title="Explore Features">Explore Features</Button>
          <Button title="Download Now" variant="secondary">
            Download Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export { Cta14 };
