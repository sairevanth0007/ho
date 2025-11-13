"use client";

import React from "react";

const Timeline13: React.FC = () => {
  const timeline = [
    {
      year: "2022",
      title: "Idea Born",
      desc: "The vision for a fully offline AI development tool began with our founder's frustration with cloud lock-in.",
    },
    {
      year: "2023",
      title: "Prototype Launch",
      desc: "We built the first CLI-based version of GenerativeIDE and tested it with a closed group of developers.",
    },
    {
      year: "2025",
      title: "Public Release",
      desc: "With community feedback, we released the first UI-based version of GenerativeIDE for general use.",
    },
  ];

  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container text-center">
        <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
          Our Journey
        </h2>
        <p className="mb-12 md:mb-18 lg:mb-20 md:text-md">
          How GenerativeIDE evolved from an idea to a revolutionary offline AI
          tool.
        </p>
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:gap-x-12 lg:gap-y-16">
          {timeline.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-3 text-2xl font-semibold">{item.year}</div>
              <h4 className="mb-2 text-xl font-bold">{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Timeline13 };
