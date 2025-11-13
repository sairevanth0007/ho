"use client";

import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const topFeatures = [
  {
    badge: "Autocomplete",
    title: "Inline AI Autocomplete",
    desc: "Smart code completion as you type. Understands context better than traditional IntelliSense.",
    button: "Learn More",
  },
  {
    badge: "Chat",
    title: "Ask Gide",
    desc: "Chat with AI directly in the editor. Get docs, fix bugs, and generate snippets instantly.",
    button: "Try Chat",
  },
  {
    badge: "Edit",
    title: "Edit With AI",
    desc: 'Right-click → "Edit with AI" → Describe changes in natural language. Great for refactoring.',
    button: "Refactor Now",
  },
  {
    badge: "Explain",
    title: "Explain Code",
    desc: "Highlights complex blocks and explains what the code does in simple language.",
    button: "Understand Code",
  },
  {
    badge: "Testing",
    title: "Test Case Generation",
    desc: "Automatically generate unit tests for selected functions or files with one click.",
    button: "Generate Tests",
  },
  {
    badge: "Debug",
    title: "Debugging Assistance",
    desc: "AI helps identify and fix bugs, including stack trace analysis and suggestions.",
    button: "Fix Bugs",
  },
];

const Layout238: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true });

  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28 text-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:mb-20 lg:mb-24"
        >
          <div className="mx-auto w-full max-w-5xl px-4">
            <h2 className="text-4xl leading-tight font-bold md:text-5xl lg:text-6xl text-white">
              Discover the groundbreaking features of GenerativeIDE for offline AI development.
            </h2>
          </div>
        </motion.div>

        <div
          ref={ref}
          className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-2 md:gap-x-10 md:gap-y-14 lg:grid-cols-3 lg:gap-x-12"
        >
          {topFeatures.map(({ badge, title, desc }, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.2, duration: 0.5 }}
              className="flex flex-col items-start text-left bg-[#1a1a1a] p-6 rounded-lg shadow-md"
            >
              <span className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                {badge}
              </span>
              <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3>
              <p className="text-white/70 text-sm mb-4">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Layout238 };
