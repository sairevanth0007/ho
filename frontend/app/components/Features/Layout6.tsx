"use client";

import React from "react";
import { motion } from "framer-motion";

const Layout6: React.FC = () => {
  const topFeatures = [
    {
      badge: "Autocomplete",
      title: "Inline AI Autocomplete",
      desc: "Blazing-fast code suggestions powered by local LLMs. No cloud, no lag — just smart autocompletion that works anywhere, anytime.",
      button: "Try Autocomplete",
    },
    {
      badge: "Chat",
      title: "Built-in GenerativeIDE Chat",
      desc: "A fully integrated AI assistant inside your editor. Ask questions, fix bugs, or generate code — all offline, with zero data leaving your device.",
      button: "Open Chat",
    },
    {
      badge: "Edit",
      title: "Natural Language Code Editing",
      desc: "Edit any block of code by simply describing your changes. From bug fixes to refactors, GenerativeIDE turns plain English into working code.",
      button: "Edit with AI",
    },
    {
      badge: "Explain",
      title: "One-Click Code Explanations",
      desc: "Understand complex logic instantly. GenerativeIDE breaks down code into clear, concise explanations that help you learn and debug faster.",
      button: "Explain Code",
    },
    {
      badge: "Testing",
      title: "Auto Test Case Generator",
      desc: "Save hours writing tests. GenerativeIDE generates unit tests tailored to your functions — even handling edge cases intelligently.",
      button: "Generate Tests",
    },
    {
      badge: "Debug",
      title: "Smart Error Fixing",
      desc: "Paste any error or stack trace — GenerativeIDE identifies the issue and suggests clean, working fixes with explanations.",
      button: "Fix Errors",
    },
    {
      badge: "Commands",
      title: "AI Command Palette",
      desc: "Access all AI features through a simple command palette. Refactor code, generate snippets, or chat — all with one keyboard shortcut.",
      button: "Open Palette",
    },
    {
      badge: "Codebase",
      title: "Local Codebase Awareness",
      desc: "GenerativeIDE indexes your entire codebase offline. It understands relationships between files and functions without any cloud access.",
      button: "Analyze Project",
    },
    {
      badge: "Refactor",
      title: "Advanced AI Refactoring",
      desc: "From renaming variables to restructuring files, GenerativeIDE performs complex multi-step refactors and shows diffs before applying.",
      button: "Start Refactor",
    },
  ];

  return (
    <section
      id="relume"
      className="mt-[80px] grid min-h-screen grid-cols-1 items-stretch gap-y-16 px-[5%] pt-16 md:pt-24 lg:pt-0"
    >
      <div className="w-full max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl"
        >
          Key Features
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-12 md:mb-18 lg:mb-20 md:text-md text-white/80"
        >
          Everything you need to code smarter — completely offline.
        </motion.p>

        <div className="grid grid-cols-1 items-start justify-center gap-y-12 md:grid-cols-2 md:gap-x-10 md:gap-y-14 lg:grid-cols-3 lg:gap-x-12">
          {topFeatures.map(({ badge, title, desc }, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
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

export { Layout6 };
