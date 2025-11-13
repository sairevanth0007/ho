// C:app/components/common/LoadingSpinner.tsx
import React from 'react';
import type { ReactNode } from 'react'; // Ensure ReactNode is imported if used elsewhere

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex space-x-2 mb-4"> {/* Container for the dots */}
        <div className="loading-dot"></div> {/* Dot 1 */}
        <div className="loading-dot"></div> {/* Dot 2 */}
        <div className="loading-dot"></div> {/* Dot 3 */}
        <div className="loading-dot"></div> {/* Dot 4 - added fourth dot for a fuller effect */}
      </div>
      <p className="text-gray-400 text-lg font-medium">{message}</p>
    </div>
  );
};

export default LoadingSpinner;