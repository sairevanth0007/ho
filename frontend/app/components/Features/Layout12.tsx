"use client";

import React from "react";
import { motion } from "framer-motion";

const Layout12: React.FC = () => {
  const benefits = [
    {
      title: "Data Sovereignty",
      description: "Your code and data never leave your machine.",
    },
    {
      title: "Speed & Efficiency",
      description: "AI responses and generations happen instantly.",
    },
    {
      title: "Cost Saving",
      description: "No recurring cloud usage fees or API bills.",
    },
    {
      title: "Privacy by Default",
      description: "Nothing is sent to the cloud, ever.",
    },
  ];

  return (
    <section
      id="relume"
      className="mt-[80px] flex min-h-screen flex-col items-center justify-center px-[5%] pt-16 md:pt-24 lg:pt-0"
    >
      <div className="w-full max-w-7xl text-center">
        <motion.h2
          className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Why Offline?
        </motion.h2>
        <motion.p
          className="mb-12 md:mb-18 lg:mb-20 md:text-md text-white/80"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          Local-first computing unlocks more than just performance.
        </motion.p>
        <div className="mx-auto grid max-w-4xl grid-cols-1 place-items-center gap-y-12 md:grid-cols-2 md:gap-x-16 md:gap-y-16">
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              className="w-full max-w-xs flex flex-col items-start text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
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
              <p className="text-white/70 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Layout12 };
