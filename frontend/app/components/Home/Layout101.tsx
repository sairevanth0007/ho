"use client";

import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const benefits = [
  {
    badge: "Privacy",
    title: "Total Control",
    desc: "Maintain privacy and security with complete offline functionality.",
  },
  {
    badge: "Integration",
    title: "Seamless Integration",
    desc: "Easily integrate with your existing tools and workflows for enhanced productivity.",
  },
  {
    badge: "Speed",
    title: "Blazing Fast Performance",
    desc: "Experience ultra-fast code generation and suggestions, optimized for offline execution.",
  },
  {
    badge: "Reliability",
    title: "Trusted & Reliable",
    desc: "Stay productive even without internet—your AI tools always available, always stable.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Layout101: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true });

  return (
    <section
      id="relume"
      className="mt-[80px] grid min-h-screen grid-cols-1 items-center px-[5%] pt-16 md:pt-24 lg:pt-0"
    >
      <div className="w-full max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="mb-12 grid grid-cols-1 items-start justify-between gap-x-12 gap-y-5 md:mb-18 md:grid-cols-2 md:gap-x-12 md:gap-y-8 lg:mb-20 lg:gap-x-20"
        >
          <motion.div variants={fadeInUp}>
            <p className="mb-3 font-semibold md:mb-4 text-white/80">Unleashed</p>
            <h3 className="text-5xl leading-[1.2] font-bold md:text-7xl lg:text-8xl">
              Experience the Future of Offline AI Today
            </h3>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <p className="mb-6 md:mb-8 md:text-md text-white/70">
              GenerativeIDE offers unparalleled performance without the need for
              internet connectivity. Enjoy the freedom and security of working
              offline while accessing advanced AI capabilities.
            </p>
            <div className="grid grid-cols-1 gap-6 py-2 sm:grid-cols-2">
              {benefits.map(({ badge, title, desc }, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <div className="inline-block mb-3 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium tracking-wide">
                    {badge}
                  </div>
                  <h6 className="mb-3 text-md leading-[1.4] font-bold md:mb-4 md:text-xl">
                    {title}
                  </h6>
                  <p className="text-white/70 text-sm">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export { Layout101 };
