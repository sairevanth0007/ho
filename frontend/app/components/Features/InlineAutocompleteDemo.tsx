"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const initial = "function calculateSum(a, b) {";
const suggestion = "\n  return a + b;\n}";

const InlineAutocompleteDemo: React.FC = () => {
  const [text, setText] = useState("");
  const [showGhost, setShowGhost] = useState(false);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    // Simulate user typing
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < initial.length) {
        setText((prev) => prev + initial[idx]);
        idx++;
      } else {
        clearInterval(interval);
        setShowGhost(true);

        // Show real suggestion after a second
        setTimeout(() => {
          setShowFinal(true);
          setShowGhost(false);
        }, 1000);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1e1e1e] text-white font-mono p-6 rounded-lg w-full max-w-2xl mx-auto text-left text-sm shadow-lg border border-white/10">
      <pre className="whitespace-pre-wrap">
        <code>
          {text}
          {showGhost && (
            <span className="text-white/30">{suggestion}</span>
          )}
          {showFinal && <>{suggestion}</>}
        </code>
      </pre>
    </div>
  );
};

export default InlineAutocompleteDemo;
