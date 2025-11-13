// C:app/components/Pricing/PricingContent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import toast from "react-hot-toast";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import CustomToast from "../common/CustomToast";

interface Plan {
  _id: string;
  name: string;
  description: string | string[];
  type: "Monthly" | "Yearly" | "SmallBusiness" | "free";
  price: number;
  stripePriceId: string;
  isActive: boolean;
  isPopular: boolean;
  minSeats?: number;
  maxSeats?: number;
}

const PricingContent: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { currentUser, isAuthenticated, isLoading: isUserLoading, fetchCurrentUser } = useUser();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [showBusinessPlans, setShowBusinessPlans] = useState(false);
  const [teamSeats, setTeamSeats] = useState<{ [key: string]: number }>({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/payment/plans`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data.data);
          
          // Initialize team seats for business plans
          const initialSeats: { [key: string]: number } = {};
          data.data.forEach((plan: Plan) => {
            if (plan.type === "SmallBusiness") {
              initialSeats[plan._id] = plan.minSeats || 1;
            }
          });
          setTeamSeats(initialSeats);
        } else {
          const errorData = await response.json();
          toast.custom((t) => <CustomToast t={t} message={errorData.message || "Failed to load pricing plans."} type="error" />);
        }
      } catch (error: any) {
        toast.custom((t) => <CustomToast t={t} message="Network error while fetching plans." type="error" />);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const handleCheckout = async (planId: string, isTeamPlan: boolean = false) => {
    if (!isAuthenticated) {
      toast.custom((t) => <CustomToast t={t} message="Please log in to subscribe." type="error" />);
      navigate("/login");
      return;
    }

    setIsSubmitting(planId);
    try {
      const endpoint = isTeamPlan 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/v1/team/create-checkout`
        : `${import.meta.env.VITE_API_BASE_URL}/api/v1/payment/create-checkout-session`;

      const body = isTeamPlan
        ? { planId, seats: teamSeats[planId] || 1 }
        : { planId };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.data.url;
      } else {
        const errorData = await response.json();
        toast.custom((t) => <CustomToast t={t} message={errorData.message || "Failed to initiate subscription."} type="error" />);
      }
    } catch (error: any) {
      toast.custom((t) => <CustomToast t={t} message="Network error during checkout." type="error" />);
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleUpgradeToYearly = async (planId: string) => {
    if (!isAuthenticated || currentUser?.currentPlanType !== 'Monthly' || currentUser?.subscriptionStatus !== 'active') {
      toast.custom((t) => <CustomToast t={t} message="You must be on an active Monthly plan to upgrade." type="error" />);
      return;
    }
    setIsUpgrading(planId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/payment/upgrade-to-yearly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        await fetchCurrentUser();
        toast.custom((t) => <CustomToast t={t} message="Upgrade to Yearly successful!" type="success" />);
      } else {
        const errorData = await response.json();
        toast.custom((t) => <CustomToast t={t} message={errorData.message || "Failed to upgrade plan."} type="error" />);
      }
    } catch (error: any) {
      toast.custom((t) => <CustomToast t={t} message="Network error during upgrade." type="error" />);
    } finally {
      setIsUpgrading(null);
    }
  };

  const getPlanButtonText = (plan: Plan) => {
    if (!isAuthenticated) return "Log in to Subscribe";
    if (currentUser?.currentPlanType === plan.type && currentUser?.subscriptionStatus === 'active') return "Current Plan";
    if (currentUser?.currentPlanType === 'free' && plan.type === 'free') return "Current Plan";
    if (currentUser?.currentPlanType === 'Monthly' && plan.type === 'Yearly') return "Upgrade to Yearly";
    if (currentUser?.currentPlanType === 'Yearly' && plan.type === 'Monthly') return "Manage via Portal";
    if (plan.type === 'SmallBusiness') return "Choose Team Plan";
    return `Choose ${plan.type === 'free' ? 'Free' : 'Plan'}`;
  };

  const isButtonDisabled = (plan: Plan) => {
    if (isSubmitting || isUpgrading || isUserLoading || isLoadingPlans) return true;
    if (!isAuthenticated && plan.type !== 'free') return false;
    if (currentUser?.currentPlanType === plan.type && currentUser?.subscriptionStatus === 'active') return true;
    if (currentUser?.currentPlanType === 'free' && plan.type === 'free') return true;
    if (currentUser?.currentPlanType === 'Yearly' && plan.type === 'Monthly') return true;
    return false;
  };

  const getButtonClickHandler = (plan: Plan) => {
    if (isAuthenticated && currentUser?.currentPlanType === 'Monthly' && plan.type === 'Yearly') {
      return () => handleUpgradeToYearly(plan._id);
    }
    return () => handleCheckout(plan._id, plan.type === 'SmallBusiness');
  };

  const handleSeatChange = (planId: string, value: number, minSeats: number = 1, maxSeats: number = 20) => {
    const clampedValue = Math.max(minSeats, Math.min(maxSeats, value));
    setTeamSeats(prev => ({ ...prev, [planId]: clampedValue }));
  };

  if (isLoadingPlans) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400 text-xl">Loading pricing plans...</p>
      </section>
    );
  }

  if (plans.length === 0) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-red-400 text-xl">No pricing plans available.</p>
      </section>
    );
  }

  const personalPlans = plans.filter(p => p.type !== 'SmallBusiness');
  const businessPlans = plans.filter(p => p.type === 'SmallBusiness');
  const displayPlans = showBusinessPlans ? businessPlans : personalPlans;

  const sortedPlans = [...displayPlans].sort((a, b) => {
    const order = { free: 0, Monthly: 1, Yearly: 2, SmallBusiness: 3 };
    return (order[a.type] - order[b.type]) || (a.price - b.price);
  });

  const getCardStyles = (plan: Plan) => {
    const isCurrent = currentUser?.currentPlanType === plan.type && currentUser?.subscriptionStatus === 'active';
    const isHighlighted = isCurrent || plan.isPopular;

    const borderGradient = isHighlighted
      ? 'from-white to-neutral-500'
      : 'from-neutral-800 to-neutral-800';

    const radialBackground = isHighlighted
      ? 'bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-white/10 to-black to-black_70%'
      : 'bg-black';

    return { borderGradient, radialBackground };
  };

  return (
    <section id="pricing-section" className="mt-[60px] px-[5%] py-16 md:py-24 lg:py-28 bg-black">
      <motion.div 
        ref={ref} 
        initial={{ opacity: 0, y: 30 }} 
        animate={inView ? { opacity: 1, y: 0 } : {}} 
        transition={{ duration: 0.6 }} 
        className="container text-center"
      >
        <h1 className="mb-6 text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Flexible Pricing for Every Need
        </h1>
        <p className="mb-8 text-lg md:text-xl text-neutral-300">
          Choose the plan that's right for you and unlock powerful features.
        </p>

        {/* Text Slider Toggle */}
        <div className="flex justify-center items-center mb-12">
          <button
            onClick={() => setShowBusinessPlans(!showBusinessPlans)}
            className="relative inline-flex h-12 items-center rounded-full bg-neutral-800 transition-all duration-300 focus:outline-none"
            style={{ minWidth: '280px' }}
          >
            {/* Sliding background */}
            <div
              className={`absolute top-1 left-1 h-10 rounded-full bg-white transition-all duration-300 shadow-lg ${
                showBusinessPlans ? 'w-[calc(50%-4px)] translate-x-[calc(100%+4px)]' : 'w-[calc(50%-4px)]'
              }`}
            />
            
            {/* Left label */}
            <span
              className={`relative z-10 flex-1 text-base font-medium transition-colors duration-300 ${
                showBusinessPlans ? 'text-neutral-400' : 'text-black'
              }`}
            >
              Personal Plans
            </span>
            
            {/* Right label */}
            <span
              className={`relative z-10 flex-1 text-base font-medium transition-colors duration-300 ${
                showBusinessPlans ? 'text-black' : 'text-neutral-400'
              }`}
            >
              Team Plans
            </span>
          </button>
        </div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {sortedPlans.map((plan) => {
            const { borderGradient, radialBackground } = getCardStyles(plan);
            const isDisabled = isButtonDisabled(plan);
            const isTeamPlan = plan.type === 'SmallBusiness';
            const seats = teamSeats[plan._id] || plan.minSeats || 1;
            const pricePerSeat = plan.price / 100;
            const totalPrice = pricePerSeat * seats;
            
            return (
              <div key={plan._id} className={`relative rounded-[2.25rem] p-px bg-gradient-to-br ${borderGradient} shadow-2xl shadow-black/40`}>
                <div className={`relative h-full flex flex-col rounded-[calc(2.25rem-1px)] ${radialBackground} p-8 text-center`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 bg-white text-black text-xs font-bold uppercase py-1 px-4 rounded-bl-lg rounded-tr-[calc(2.25rem-1px)]">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                    {isTeamPlan ? (
                      <>
                        <p className="text-5xl font-extrabold mb-1 flex items-baseline justify-center text-white">
                          ${totalPrice.toFixed(2)}
                          <span className="ml-2 text-base font-medium text-neutral-400">/month</span>
                        </p>
                        <p className="text-sm text-neutral-400">${pricePerSeat.toFixed(2)} per seat/month</p>
                      </>
                    ) : (
                      <p className="text-5xl font-extrabold mb-1 flex items-baseline justify-center text-white">
                        {plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`}
                        {plan.type !== 'free' && (
                          <span className="ml-2 text-base font-medium text-neutral-400">
                            {plan.type === 'Monthly' ? "/month" : "/year"}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                 {isTeamPlan && (
                 <div className="mb-6 p-4 bg-neutral-900 rounded-xl">
                   <label className="block text-sm font-medium text-neutral-300 mb-3">
                     Number of Team Members
                   </label>
                   <div className="flex items-center gap-3">
                     <button
                       onClick={() => handleSeatChange(plan._id, seats - 1, plan.minSeats, plan.maxSeats)}
                       disabled={seats <= (plan.minSeats || 1)}
                       className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
                     >
                       −
                     </button>
                     <input
                       type="number"
                       value={seats}
                       onChange={(e) => handleSeatChange(plan._id, parseInt(e.target.value) || 1, plan.minSeats, plan.maxSeats)}
                       min={plan.minSeats || 1}
                       max={plan.maxSeats || 20}
                       className="flex-1 h-10 text-center rounded-lg bg-neutral-800 text-white font-semibold border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                     />
                     <button
                       onClick={() => handleSeatChange(plan._id, seats + 1, plan.minSeats, plan.maxSeats)}
                       disabled={seats >= (plan.maxSeats || 20)}
                       className="w-10 h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
                     >
                       +
                     </button>
                   </div>
                   <p className="text-xs text-neutral-400 mt-2">
                     Min: {plan.minSeats || 1} • Max: {plan.maxSeats || 20} seats
                   </p>
                 </div>
                  )}

                  <div className="border-t border-neutral-800"></div>

                  <ul className="my-8 text-base text-neutral-300 space-y-4 flex-grow text-left">
                    {(Array.isArray(plan.description) ? plan.description : [plan.description]).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <button 
                      onClick={getButtonClickHandler(plan)} 
                      disabled={isDisabled} 
                      className={`w-full rounded-xl px-6 py-3 transition-all duration-300 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white ${
                        isDisabled 
                          ? "bg-neutral-700 text-neutral-400 cursor-not-allowed" 
                          : "bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      {isSubmitting === plan._id ? "Processing..." : isUpgrading === plan._id ? "Upgrading..." : getPlanButtonText(plan)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Enterprise Card - Only show in business plans view */}
          {showBusinessPlans && (
            <div className="relative rounded-[2.25rem] p-px bg-gradient-to-br from-neutral-800 to-neutral-800 shadow-2xl shadow-black/40">
              <div className="relative h-full flex flex-col rounded-[calc(2.25rem-1px)] bg-black p-8 text-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-white mb-2">Enterprise Solutions</h3>
                  <p className="text-5xl font-extrabold text-white">Custom</p>
                </div>
                <div className="border-t border-neutral-800"></div>
                <ul className="my-8 text-base text-neutral-300 space-y-4 flex-grow text-left">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span>Unlimited team members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span>Advanced security & compliance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span>Priority enterprise support</span>
                  </li>
                </ul>
                <div className="mt-auto">
                  <button 
                    onClick={() => navigate('/enterprise-contact')} 
                    className="w-full rounded-xl px-6 py-3 transition-all duration-300 text-base font-semibold bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white cursor-pointer"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default PricingContent;