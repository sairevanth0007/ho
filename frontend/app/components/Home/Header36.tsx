"use client";

import { Button, Input } from "@relume_io/relume-ui";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { ChangeEvent, FormEvent } from "react";
import CodeAnimation from "./CodeAnimation";

// ✅ Hook to check for desktop
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isDesktop;
};

const useForm = () => {
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSetEmail = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formURL =
      "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdzuL9PBQCcEQaXuDEKN2J7lAMgwup_D8dbAw0YrSKBqNkkqQ/formResponse";
    const formData = new FormData();
    formData.append("entry.1517018336", email);

    try {
      await fetch(formURL, {
        method: "POST",
        body: formData,
        mode: "no-cors",
      });

      setStatus("success");
      setEmail("");
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };

  return {
    email,
    handleSetEmail,
    handleSubmit,
    status,
    errorMessage,
    setStatus,
  };
};

const Header36: React.FC = () => {
  const formState = useForm();
  const isDesktop = useIsDesktop();

  // ✅ Safe client-only rendering
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // ✅ Skip SSR

  return (
    <section
      id="relume"
      className={`mt-[80px] px-[5%] pt-16 md:pt-24 lg:pt-0 ${
        isDesktop ? "grid grid-cols-2 min-h-screen items-center" : ""
      }`}
    >
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className={`flex flex-col justify-center max-w-xl w-full px-4 lg:px-8 ${
          !isDesktop ? "mx-auto pb-20" : ""
        }`}
      >
        <h1 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
          Experience the Future of Offline AI
        </h1>
        <p className="md:text-md">
          Introducing GenerativeIDE, the world's first fully offline AI. Enjoy
          unparalleled security, speed, and reliability with our innovative
          technology.
        </p>
        <div className="mt-6 max-w-sm md:mt-8">
          <form
            onSubmit={formState.handleSubmit}
            className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Input
              id="email"
              type="email"
              placeholder="Enter your Email"
              value={formState.email}
              onChange={formState.handleSetEmail}
              className="min-w-[300px] sm:min-w-[200px] md:min-w-[400px] lg:min-w-[300px] rounded-md bg-white/10 border border-white/20 text-white placeholder-white/60 px-5 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-white/40"
              disabled={formState.status === "submitting"}
            />
            <Button
              title="SignUp For Early Access"
              size="primary"
              type="submit"
              disabled={formState.status === "submitting"}
              className={`h-10 rounded-md px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                formState.status === "submitting"
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {formState.status === "submitting"
                ? "Submitting..."
                : "SignUp For Early Access"}
            </Button>
          </form>
          {formState.errorMessage && (
            <p className="mt-2 text-sm text-red-400">{formState.errorMessage}</p>
          )}
          <p className="mt-3 text-xs text-white/70">
            By clicking Sign Up, you confirm your agreement with our Terms and Conditions.
          </p>
        </div>
      </motion.div>

      {/* Right side code animation only on desktop (hydration-safe) */}
      {isDesktop && (
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="h-full w-full flex items-center justify-center p-4"
        >
          <CodeAnimation />
        </motion.div>
      )}

      {/* Success Modal */}
      {formState.status === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full mx-auto text-center animate-fadeIn">
            <h3 className="text-xl font-bold mb-2">Thank You!</h3>
            <p className="text-gray-700 mb-4">
              You're all set! We'll notify you when we launch.
            </p>
            <Button
              onClick={() => formState.setStatus("idle")}
              className="bg-black text-white hover:bg-gray-800"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export { Header36 };
