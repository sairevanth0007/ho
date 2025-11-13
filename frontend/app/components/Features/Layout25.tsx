"use client";

import React from "react";

const Layout25: React.FC = () => {
  const faqs = [
    {
      question: "Is GenerativeIDE completely offline?",
      answer:
        "Yes. Once installed, it works without any internet connection. No cloud required.",
    },
    {
      question: "Can I use my own models?",
      answer:
        "Absolutely. You can plug in local LLMs compatible with Ollama or similar frameworks.",
    },
    {
      question: "Will there be a paid version?",
      answer:
        "We offer a free core version. Pro features like larger models and enterprise tools may be paid.",
    },
  ];

  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="text-center mb-12 md:mb-18 lg:mb-20">
          <h2 className="text-5xl font-bold md:text-7xl lg:text-8xl">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-x-12 lg:gap-x-16">
          {faqs.map((item, i) => (
            <div key={i} className="flex flex-col items-start">
              <h4 className="mb-2 text-xl font-semibold">{item.question}</h4>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Layout25 };
