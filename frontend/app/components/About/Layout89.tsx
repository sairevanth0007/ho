"use client";

import React from "react";

const Layout89: React.FC = () => {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16 lg:gap-x-12">
          {[
            {
              title: "Built Offline First",
              description:
                "GenerativeIDE is engineered for speed and security, even with zero connectivity.",
            },
            {
              title: "User-Centered Design",
              description:
                "Every feature we build serves the goal of local-first productivity.",
            },
            {
              title: "Community Driven",
              description:
                "We listen to feedback and evolve with real developers in mind.",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-start text-left">
              <div className="mb-3 md:mb-4">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg"
                  className="size-12"
                  alt="Relume icon"
                />
              </div>
              <h3 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">
                {item.title}
              </h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Layout89 };
