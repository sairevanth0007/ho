"use client";

import React from "react";

const Contact13: React.FC = () => {
  const contacts = [
    {
      label: "Email Us",
      value: "support@generativeide.com",
    },
    {
      label: "Call Us",
      value: "+1 (555) 123-4567",
    },
    {
      label: "Visit",
      value: "123 AI Lane, Offline City, US",
    },
  ];

  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container text-center">
        <h2 className="mb-6 text-5xl font-bold md:text-7xl lg:text-8xl">
          Contact Info
        </h2>
        <div className="grid grid-cols-1 gap-y-12 pt-12 md:grid-cols-3 md:gap-x-8 lg:gap-x-12 lg:pt-20">
          {contacts.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <h4 className="mb-2 text-xl font-semibold">{item.label}</h4>
              <p className="text-md">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Contact13 };
