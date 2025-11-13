"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Contact4: React.FC = () => {
  const [ref, inView] = useInView({ triggerOnce: true });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    // Replace with your Google Form POST URL
    const formURL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSf1zZ9i46yn7eEkLd2RP1nwqfC0KGzIuehXQNiQi9qmnXqoXg/formResponse ";
    const body = new FormData();
    // Replace these entry.xxxxxxxx with actual field IDs from your Google Form
    body.append("entry.2005620554", formData.name);     // Name field
    body.append("entry.820212623", formData.email);    // Email field
    body.append("entry.839337160", formData.message);  // Message field

    try {
      await fetch(formURL, {
        method: "POST",
        body,
        mode: "no-cors",
      });

      setStatus("success");
      setMessage("Thank you! Your message has been sent.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  };

  return (
    <section id="relume" className="mt-[60px] px-[5%] py-16 md:py-24 lg:py-28">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container text-center"
      >
        <h2 className="mb-6 text-5xl font-bold md:text-7xl lg:text-8xl">
          We're Here to Help
        </h2>
        <p className="mb-12 md:mb-18 lg:mb-20 md:text-md">
          Whether you have technical questions or business inquiries — drop us a message.
        </p>

        {/* Success/Error Message */}
        {status === "success" && (
          <div className="mb-6 rounded bg-green-100 p-4 text-green-800">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="mb-6 rounded bg-red-100 p-4 text-red-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mx-auto grid max-w-2xl gap-6 text-left">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3"
              type="text"
              placeholder="Your full name"
              disabled={status === "submitting"}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3"
              type="email"
              placeholder="you@example.com"
              disabled={status === "submitting"}
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block mb-1 font-medium">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 p-3"
              rows={5}
              placeholder="Tell us how we can help"
              disabled={status === "submitting"}
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className={`rounded px-6 py-3 text-white ${
              status === "submitting"
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-[#222222] hover:bg-gray-800"
            }`}
          >
            {status === "submitting" ? "Sending..." : "Send Message"}
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export { Contact4 };