"use client";

import { Button } from "@relume_io/relume-ui";
import React from "react";
import { motion } from "framer-motion";

const Header69: React.FC = () => {
  return (
    <section
      id="relume"
      className="grid grid-cols-1 items-center gap-y-16 pt-16 md:pt-24 lg:grid-cols-2 lg:pt-0"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="mx-[5%] sm:max-w-md md:justify-self-start lg:mr-20 lg:ml-[5vw] lg:justify-self-end"
      >
        <h1 className="mb-5 text-6xl font-bold md:mb-6 md:text-9xl lg:text-10xl">
          Discover What Makes GenerativeIDE Unique
        </h1>
        <p className="md:text-md">
          A powerful offline-first AI toolset that gives you freedom, security,
          and blazing performance with no cloud lock-in.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 md:mt-8">
          <Button title="Explore Features">Explore Features</Button>
          <Button title="Get Started" variant="secondary">
            Get Started
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <img
          src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
          alt="Relume placeholder"
          className="w-full object-cover lg:h-screen lg:max-h-[60rem]"
        />
      </motion.div>
    </section>
  );
};

export { Header69 };
