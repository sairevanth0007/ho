"use client";

import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

const stats: Stat[] = [
  { label: "Offline Sessions", value: 12673, suffix: "+" },
  { label: "Code Generated", value: 100000, suffix: "+ lines" },
  { label: "Active Users", value: 121, suffix: "+" },
];

const StatCounter: React.FC<Stat> = ({ label, value, suffix }) => {
  const [ref, inView] = useInView({ triggerOnce: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let current = 0;
    const duration = 2000;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = value / steps;

    const counter = setInterval(() => {
      current += increment;
      if (current >= value) {
        clearInterval(counter);
        setCount(value);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(counter);
  }, [inView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      <h3 className="mb-2 text-4xl font-bold md:text-5xl text-white">
        {count.toLocaleString()} {suffix}
      </h3>
      <p className="text-md text-white/70">{label}</p>
    </div>
  );
};

const Layout4: React.FC = () => {
  return (
    <section id="relume" className="py-20 px-[5%] lg:py-24">
      <div className="w-full max-w-7xl mx-auto text-center">
        <h2 className="mb-6 text-5xl font-bold md:mb-10 md:text-7xl lg:text-8xl">
          Our Impact So Far
        </h2>
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-8 lg:gap-x-12 lg:gap-y-16">
          {stats.map((stat, i) => (
            <StatCounter key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export { Layout4 };
