"use client";

import React from "react";

const Team2: React.FC = () => {
  const team = [
    {
      name: "Rohit B.R",
      role: "Founder & CTO",
      image: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
    },
    {
      name: "Priya Sharma",
      role: "Lead Product Designer",
      image: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
    },
    {
      name: "Aditya Singh",
      role: "AI Researcher",
      image: "https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg",
    },
  ];

  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container text-center">
        <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
          Our Core Team
        </h2>
        <p className="mb-12 md:mb-18 lg:mb-20 md:text-md">
          Passionate minds behind the offline AI revolution.
        </p>
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:gap-x-12 lg:gap-y-16">
          {team.map((member, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
            >
              <img
                src={member.image}
                alt={`${member.name} avatar`}
                className="size-28 rounded-full object-cover mb-6"
              />
              <h4 className="text-xl font-bold">{member.name}</h4>
              <p className="text-sm">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Team2 };
