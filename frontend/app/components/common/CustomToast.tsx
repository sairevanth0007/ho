// C:app/components/common/CustomToast.tsx
import React from "react";
import toast, { type Toast } from "react-hot-toast"; 
import { IoClose } from "react-icons/io5"; // Already using this icon in Navbars
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa"; // For success/error icons

interface CustomToastProps {
  t: Toast; // The toast object provided by react-hot-toast
  message: string;
  type?: "success" | "error" | "default"; // Added types for icons
}

const CustomToast: React.FC<CustomToastProps> = ({ t, message, type = "default" }) => {
  let iconComponent: React.ReactNode | null = null;
  let borderColor = "border-gray-700"; // Default border color

  switch (type) {
    case "success":
      iconComponent = <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />;
      borderColor = "border-green-500";
      break;
    case "error":
      iconComponent = <FaExclamationCircle className="text-red-500 text-2xl flex-shrink-0" />;
      borderColor = "border-red-500";
      break;
    default:
      // No specific icon for default toasts, or you could add a generic one
      break;
  }

  return (
    <div
      className={`${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-md w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border ${borderColor}
        p-4 items-center gap-3`}
    >
      {iconComponent} {/* Render icon if available */}
      <div className="flex-1 text-white text-md font-medium">
        {message}
      </div>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="ml-auto flex-shrink-0 rounded-md p-1.5 inline-flex text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
      >
        <span className="sr-only">Close</span>
        <IoClose className="h-5 w-5" />
      </button>
    </div>
  );
};

export default CustomToast;