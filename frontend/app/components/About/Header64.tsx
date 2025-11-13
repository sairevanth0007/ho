"use client";

import { Button } from "@relume_io/relume-ui";
import React from "react";

const Header64: React.FC = () => {
  return (
    <section
      id="relume"
      className="grid grid-cols-1 items-center gap-y-16 pt-16 md:pt-24 lg:grid-cols-2 lg:pt-0"
    >
      <div className="mx-[5%] sm:max-w-md md:justify-self-start lg:mr-20 lg:ml-[5vw] lg:justify-self-end">
        <h1 className="mb-5 text-6xl font-bold md:mb-6 md:text-9xl lg:text-10xl">
          Meet the Team Behind GenerativeIDE
        </h1>
        <p className="md:text-md">
          We’re building the future of offline AI. Passionate, innovative, and
          committed to user freedom.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
          <Button title="Learn More">Learn More</Button>
          <Button title="Our Mission" variant="secondary">
            Our Mission
          </Button>
        </div>
      </div>
      <div>
        <img
          src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
          alt="Relume placeholder image"
          className="w-full object-cover lg:h-screen lg:max-h-[60rem]"
        />
      </div>
    </section>
  );
};

export { Header64 };
