// C:app/components/Contact/EnterpriseContact.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import toast from "react-hot-toast";
import CustomToast from "../common/CustomToast";
const EnterpriseContact: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    // Simulate API call for enterprise contact
    try {
      // In a real app, you'd send this to your backend's contact form endpoint
      // Example: const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/enterprise-inquiry`, { ... });
      console.log("Enterprise Contact Form Submitted:", formData);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

      setStatus("success");
      setMessage("Your enterprise inquiry has been sent! We'll get back to you soon.");
       toast.custom((t) => <CustomToast t={t} message="Inquiry sent successfully!" type="success" />);
      setFormData({ name: "", email: "", company: "", message: "" }); // Clear form
    } catch (error: any) {
      setStatus("error");
      setMessage("Failed to send inquiry. Please try again.");
      toast.error("Failed to send inquiry.");toast.custom((t) => <CustomToast t={t} message="Failed to send inquiry." type="error" />);
      console.error("Enterprise contact form error:", error);
    }
  };

  return (
    <section id="enterprise-contact-section" className="mt-[60px] px-[5%] py-16 md:py-24 lg:py-28">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="container text-center"
      >
        <h2 className="mb-6 text-5xl font-bold md:text-7xl lg:text-8xl">
          Enterprise Inquiry
        </h2>
        <p className="mb-12 md:mb-18 lg:mb-20 md:text-md">
          Interested in a custom solution? Fill out the form below and our team will get in touch.
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
            <label htmlFor="name" className="block mb-1 font-medium text-gray-300">
              Your Name
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded border border-gray-600 bg-white/5 p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              type="text"
              placeholder="John Doe"
              disabled={status === "submitting"}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 font-medium text-gray-300">
              Your Email
            </label>
            <input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded border border-gray-600 bg-white/5 p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              type="email"
              placeholder="you@example.com"
              disabled={status === "submitting"}
              required
            />
          </div>
          <div>
            <label htmlFor="company" className="block mb-1 font-medium text-gray-300">
              Company Name (Optional)
            </label>
            <input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full rounded border border-gray-600 bg-white/5 p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              type="text"
              placeholder="Your Company"
              disabled={status === "submitting"}
            />
          </div>
          <div>
            <label htmlFor="message" className="block mb-1 font-medium text-gray-300">
              Tell us about your needs
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full rounded border border-gray-600 bg-white/5 p-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              rows={5}
              placeholder="Describe your enterprise requirements"
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
            {status === "submitting" ? "Sending..." : "Send Inquiry"}
          </button>
        </form>
      </motion.div>
    </section>
  );
};

export default EnterpriseContact;