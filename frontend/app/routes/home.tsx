import React, { useEffect } from "react";

import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router";

// Import all original home page components
import { Header36 } from "../components/Home/Header36";
import { Layout238 } from "../components/Home/Layout238";
import { Layout237 } from "../components/Home/Layout237";
import { Layout101 } from "../components/Home/Layout101";
import { Testimonial6 } from "../components/Home/Testimonial6";
import { Cta3 } from "../components/Home/Cta3";
import { Layout4 } from "../components/Home/Layout4";
// import { Navbar3 } from "../components/common/Navbar";
import { Footer4 } from "../components/common/Footer";

const HomePage: React.FC = () => {
  // Initialize authentication context and navigation
  const { isAuthenticated, isLoading } = useUser();
  const navigate = useNavigate();

  /**
   * AUTHENTICATION CHECK EFFECT
   * 
   * This effect runs after component mount and whenever authentication state changes.
   * It checks if the user is authenticated and redirects them to the dashboard.
   * 
   * Logic:
   * - If user is authenticated (not loading and authenticated), navigate to /dashboard
   * - Only redirect when authentication check is complete (isLoading is false)
   * - This prevents premature redirects while auth status is being determined
   */
  useEffect(() => {
    // Only redirect when auth check is complete and user is authenticated
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  /**
   * LOADING STATE
   * 
   * Show a loading spinner/placeholder while authentication status is being checked.
   * This maintains the same visual experience during the auth check process.
   * 
   * Preserved visual elements:
   * - Same dark background (#000000) 
   * - Inter font family
   * - Consistent spacing and layout
   */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  /**
   * MAIN HOMEPAGE CONTENT
   * 
   * This section renders all the original homepage components exactly as they were.
   * All visual design elements, styling, and layouts are preserved:
   * 
   * Preserved Elements:
   * - Dark theme with #000000 background
   * - Inter font family throughout
   * - px-[6.5%] spacing patterns
   * - All existing components: Header36, Layout238, Layout4, Layout237, Layout101, Testimonial6
   * - All existing animations and transitions
   * - Component structure and hierarchy
   * 
   * Note: Cta3 and Footer4 remain commented out as in the original
   * Note: Navbar3 remains commented out as in the original
   */
  return (
    <div>
      {/* <Navbar3 /> */}
      <Header36 />
      <Layout238 />
      <Layout4 />
      <Layout237 />
      <Layout101 />
      <Testimonial6 />
      {/* <Cta3 /> */}
      {/* <Footer4 /> */}
    </div>
  );
};

export default HomePage;