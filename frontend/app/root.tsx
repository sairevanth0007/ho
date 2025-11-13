// C:app/root.tsx
"use client";

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation, // <--- Add this import
} from "react-router";

import { Toaster } from "react-hot-toast";
import { UserProvider, useUser } from "./contexts/UserContext"; // <--- Import useUser as well
import { Navbar3 } from "./components/common/Navbar"; // <--- Import Navbar3
import { DashboardNavbar } from "./components/Dashboard/DashboardNavbar"; // <--- Import DashboardNavbar
import { Footer4 } from "./components/common/Footer"; // <--- Import Footer4 as well (assuming it's used globally)
import LoadingSpinner from "./components/common/LoadingSpinner"; 

import type { Route } from "./+types/root";
import "./app.css";

// Prevent hydration mismatch warnings and extension noise
if (import.meta.env.DEV && typeof window !== "undefined") {
  const observer = new MutationObserver(() => {
    document.body.removeAttribute("cz-shortcut-listen");
  });
  observer.observe(document.body, { attributes: true });
  console.warn = () => {};
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <title>GenerativeIDE</title>
        <meta name="description" content="GenerativeIDE is an intelligent coding environment that leverages AI for rapid code generation, smart suggestions, and seamless development. Boost your productivity with cutting-edge AI." />
        <Links />
      </head>
      <body className="bg-[#000000] text-white">
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent /> {/* <--- New component to handle conditional rendering */}
    </UserProvider>
  );
}

// New AppContent component
function AppContent() {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  // Paths that should always use the DashboardNavbar if authenticated
  const dashboardPaths = ["/dashboard", "/pricing", "/enterprise-contact"]; // Add any other auth-only routes here

  // Determine which Navbar to show
  const showDashboardNavbar = isAuthenticated && dashboardPaths.some(path => location.pathname.startsWith(path));

  // Determine if Footer should be shown (e.g., hide on dashboard if not needed)
  // For now, let's keep footer on all pages for simplicity, but this is where you'd control it
  const showFooter = true; // Example: !location.pathname.startsWith("/dashboard");

  if (isLoading) {
    // Show a global loading indicator while user context is being fetched
    return (
      <main className="min-h-screen flex items-center justify-center px-[5%]"> {/* Full height center */}
        <LoadingSpinner message="Loading GenerativeIDE..." /> {/* <--- NEW LOADING SPINNER */}
      </main>
    );
  }

  return (
    <>
      {showDashboardNavbar ? <DashboardNavbar /> : <Navbar3 />}
      <Outlet />
      {showFooter && <Footer4 />}
    </>
  );
}


export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}