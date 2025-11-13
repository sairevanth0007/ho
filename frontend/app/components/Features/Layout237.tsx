"use client";

import React from "react";
import { Button } from "@relume_io/relume-ui";
import { RxChevronRight } from "react-icons/rx";

const Layout237: React.FC = () => {
  const steps = [
    {
      title: "Download & Install",
      description: "Grab the GenerativeIDE package for your OS and install.",
    },
    {
      title: "Customize Locally",
      description: "Set up workspaces, themes, and offline models as needed.",
    },
    {
      title: "Start Coding Offline",
      description: "Use AI code assist, generate UIs, and build — all offline.",
    },
  ];

  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container text-center">
        <p className="mb-3 font-semibold md:mb-4">Get Started</p>
        <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
          How It Works
        </h2>
        <p className="mb-12 md:mb-18 lg:mb-20 md:text-md">
          A simple 3-step journey to your offline coding future.
        </p>
        <div className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-5 md:mb-6">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg"
                  alt="Step icon"
                  className="size-12"
                />
              </div>
              <h3 className="mb-5 text-2xl font-bold md:mb-6 md:text-3xl lg:text-4xl">
                {step.title}
              </h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center gap-4 md:mt-14 lg:mt-16">
          <Button variant="secondary">Learn More</Button>
          <Button iconRight={<RxChevronRight />} variant="link" size="link">
            Sign Up
          </Button>
        </div>
      </div>
    </section>
  );
};

export { Layout237 };
