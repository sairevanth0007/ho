// C:app/components/Dashboard/DashboardContent.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useUser } from "../../contexts/UserContext";
import toast from "react-hot-toast";
import CustomToast from "../common/CustomToast";
import { Link } from "react-router-dom";

const WindowsLogo: React.FC = () => (
  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 3.567L10.909 2.1v9.559H0V3.567zM0 12.873h10.909v9.559L0 21.033v-8.16zM12.045 2.02L24 0v11.66H12.045V2.02zM12.045 12.873H24V24l-11.955-2.02v-9.107z" />
  </svg>
);

const AppleLogo: React.FC = () => (
  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
  </svg>
);

interface TeamMember {
  _id: string;
  memberEmail: string;
  status: 'active' | 'pending_removal' | 'removed';
  addedAt: string;
  removedAt?: string;
  accessExpiresAt?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  transitionDetails?: {
    daysAddedToTeamEnd: number;
    personalPlanCanceledAt: string;
  };
}

interface TeamSubscription {
  _id: string;
  totalSeats: number;
  usedSeats: number;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  planId: {
    name: string;
  };
}

const DashboardContent: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const { currentUser, isLoading, isAuthenticated, fetchCurrentUser } = useUser();
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Team management states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamSubscription, setTeamSubscription] = useState<TeamSubscription | null>(null);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const isTeamOwner = currentUser?.currentPlanType === 'SmallBusiness' && currentUser?.subscriptionStatus === 'active';

  useEffect(() => {
    if (isTeamOwner) {
      fetchTeamData();
    }
  }, [isTeamOwner]);

  const fetchTeamData = async () => {
    setIsLoadingTeam(true);
    try {
      const [membersRes, subRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/team/members`, {
          credentials: "include",
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/team/subscription`, {
          credentials: "include",
        })
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setTeamMembers(membersData.data.members || []);
      }

      if (subRes.ok) {
        const subData = await subRes.json();
        setTeamSubscription(subData.data.subscription);
      }
    } catch (error) {
      console.error("Error fetching team data:", error);
    } finally {
      setIsLoadingTeam(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      toast.custom((t) => <CustomToast t={t} message="Please enter an email address." type="error" />);
      return;
    }

    setIsAddingMember(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/team/members/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberEmail: newMemberEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.custom((t) => <CustomToast t={t} message={data.message || "Team member added successfully!"} type="success" />);
        setNewMemberEmail("");
        setShowAddMemberForm(false);
        fetchTeamData();
      } else {
        toast.custom((t) => <CustomToast t={t} message={data.message || "Failed to add team member."} type="error" />);
      }
    } catch (error) {
      toast.custom((t) => <CustomToast t={t} message="Network error. Please try again." type="error" />);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail}? They will retain access until the end of the billing period.`)) {
      return;
    }

    setRemovingMemberId(memberId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/team/members/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.custom((t) => <CustomToast t={t} message={data.message || "Team member removed successfully."} type="success" />);
        fetchTeamData();
      } else {
        toast.custom((t) => <CustomToast t={t} message={data.message || "Failed to remove team member."} type="error" />);
      }
    } catch (error) {
      toast.custom((t) => <CustomToast t={t} message="Network error. Please try again." type="error" />);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmail.trim()) {
      toast.custom((t) => <CustomToast t={t} message="Please enter an email address." type="error" />);
      return;
    }

    if (!confirm(`Are you sure you want to transfer ownership to ${transferEmail}? This action cannot be undone.`)) {
      return;
    }

    setIsTransferring(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/team/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newOwnerEmail: transferEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.custom((t) => <CustomToast t={t} message={data.message || "Ownership transferred successfully!"} type="success" />);
        setTransferEmail("");
        setShowTransferForm(false);
        await fetchCurrentUser();
        fetchTeamData();
      } else {
        toast.custom((t) => <CustomToast t={t} message={data.message || "Failed to transfer ownership."} type="error" />);
      }
    } catch (error) {
      toast.custom((t) => <CustomToast t={t} message="Network error. Please try again." type="error" />);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatExpiresAt = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handleManageSubscription = async () => {
    if (!isAuthenticated || !currentUser?.stripeCustomerId) {
      toast.custom((t) => <CustomToast t={t} message="No active subscription to manage." type="error" />);
      return;
    }
    setIsManagingSubscription(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/payment/manage-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.data.portalUrl;
      } else {
        const errorData = await response.json();
        toast.custom((t) => <CustomToast t={t} message={errorData.message || "Failed to open subscription management."} type="error" />);
      }
    } catch (error: any) {
      toast.custom((t) => <CustomToast t={t} message="Network error, please try again." type="error" />);
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleUpgradeToYearlyFromDashboard = async () => {
    if (!isAuthenticated || currentUser?.currentPlanType !== 'Monthly' || currentUser?.subscriptionStatus !== 'active') {
      toast.custom((t) => <CustomToast t={t} message="You must be on an active Monthly plan to upgrade." type="error" />);
      return;
    }
    setIsUpgrading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/payment/upgrade-to-yearly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        await fetchCurrentUser();
        toast.custom((t) => <CustomToast t={t} message="Upgrade to Yearly successful! Your dashboard will update." type="success" />);
      } else {
        const errorData = await response.json();
        toast.custom((t) => <CustomToast t={t} message={errorData.message || "Failed to upgrade plan."} type="error" />);
      }
    } catch (error: any) {
      toast.custom((t) => <CustomToast t={t} message="Network error during upgrade." type="error" />);
    } finally {
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400 text-xl">Loading your dashboard...</p>
      </section>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-red-400 text-xl">Access Denied. Please log in.</p>
      </section>
    );
  }

  const showManageSubscriptionButton = isAuthenticated && currentUser.stripeCustomerId;
  const showUpgradeToYearlyButton = isAuthenticated && currentUser?.currentPlanType === 'Monthly' && currentUser?.subscriptionStatus === 'active';

  return (
    <section id="dashboard-section" className="min-h-screen mt-[60px] px-[5%] py-16 md:py-24 lg:py-28 bg-black flex flex-col items-center">
      <motion.div 
        ref={ref} 
        initial={{ opacity: 0, y: 30 }} 
        animate={inView ? { opacity: 1, y: 0 } : {}} 
        transition={{ duration: 0.6 }} 
        className="container text-center w-full"
      >
        <h1 className="mb-6 text-4xl md:text-5xl font-extrabold text-white leading-tight">Your Dashboard</h1>
        <p className="mb-12 text-lg md:text-xl text-neutral-300">
          Welcome back, <span className="font-semibold text-white">{currentUser.email}</span>!
        </p>

        {/* Open GIDE Button */}
        <div className="w-full max-w-2xl mx-auto">
          <button className="w-full rounded-xl px-6 py-3 text-white text-base font-bold bg-gradient-to-r from-blue-500 to-violet-600 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-violet-500">
            Open GIDE
          </button>
        </div>

        {/* Download Section */}
        <div className="w-full max-w-2xl mx-auto mt-8">
          <p className="text-center text-neutral-400 font-semibold mb-6">Download Now</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <a href="#" className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-xl p-3 px-6 bg-neutral-900 hover:bg-neutral-800 transition-colors">
              <WindowsLogo />
              <span className="font-semibold text-white">Windows</span>
            </a>
            <a href="#" className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-xl p-3 px-6 bg-neutral-900 hover:bg-neutral-800 transition-colors">
              <AppleLogo />
              <span className="font-semibold text-white">Mac</span>
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-6xl w-full mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subscription Card */}
          <div className="relative rounded-[2.25rem] p-px bg-gradient-to-br from-white to-neutral-500 shadow-2xl shadow-black/40">
            <div className="relative h-full flex flex-col rounded-[calc(2.25rem-1px)] bg-black p-8 text-left">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Subscription Details</h2>
              </div>
              <div className="border-t border-neutral-800"></div>
              <div className="my-8 space-y-4 text-base">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Plan:</span>
                  <span className="font-semibold text-white">
                    {currentUser.currentPlanType 
                      ? currentUser.currentPlanType.replace(/([A-Z])/g, ' $1').trim()
                      : 'No Plan'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Status:</span>
                  <span className={`font-semibold ${
                    currentUser?.subscriptionStatus === 'active' ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {currentUser?.subscriptionStatus 
                      ? currentUser.subscriptionStatus.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                        currentUser.subscriptionStatus.replace(/_/g, ' ').slice(1)
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Renews/Expires:</span>
                  <span className="font-semibold text-white">
                    {currentUser.subscriptionExpiresAt ? formatExpiresAt(currentUser.subscriptionExpiresAt) : "N/A"}
                  </span>
                </div>
                {isTeamOwner && teamSubscription && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Team Seats:</span>
                    <span className="font-semibold text-white">
                      {teamSubscription.usedSeats} / {teamSubscription.totalSeats}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-auto pt-8 border-t border-neutral-800 flex flex-col gap-4">
                {showUpgradeToYearlyButton && (
                  <button 
                    onClick={handleUpgradeToYearlyFromDashboard} 
                    disabled={isUpgrading} 
                    className={`w-full rounded-xl px-6 py-3 transition-all duration-300 text-base font-semibold ${
                      isUpgrading 
                        ? "bg-neutral-700 text-neutral-400 cursor-not-allowed" 
                        : "bg-white text-black hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
                    }`}
                  >
                    {isUpgrading ? "Upgrading..." : "Upgrade to Yearly & Save"}
                  </button>
                )}
                {showManageSubscriptionButton && (
                  <button 
                    onClick={handleManageSubscription} 
                    disabled={isManagingSubscription} 
                    className={`w-full rounded-xl px-6 py-3 transition-all duration-300 text-base font-semibold ${
                      isManagingSubscription 
                        ? "bg-neutral-700 text-neutral-400 cursor-not-allowed" 
                        : "bg-neutral-900 text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
                    }`}
                  >
                    {isManagingSubscription ? "Opening Portal..." : "Manage Subscription"}
                  </button>
                )}
                {currentUser.currentPlanType === 'free' && (
                  <Link 
                    to="/pricing" 
                    className="block text-center text-white hover:text-neutral-300 transition-colors text-sm font-medium"
                  >
                    Explore Paid Plans →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Team Management Card - Only for Team Owners */}
          {isTeamOwner && (
            <div className="relative rounded-[2.25rem] p-px bg-gradient-to-br from-blue-500 to-violet-600 shadow-2xl shadow-black/40">
              <div className="relative h-full flex flex-col rounded-[calc(2.25rem-1px)] bg-black p-8 text-left">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-white">Team Management</h2>
                </div>
                <div className="border-t border-neutral-800"></div>
                
                {isLoadingTeam ? (
                  <div className="flex-grow flex items-center justify-center py-12">
                    <p className="text-neutral-400">Loading team data...</p>
                  </div>
                ) : (
                  <>
                    <div className="my-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Team Members</h3>
                        <button
                          onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                          className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors text-sm"
                        >
                          {showAddMemberForm ? 'Cancel' : '+ Add Member'}
                        </button>
                      </div>

                      {showAddMemberForm && (
                        <form onSubmit={handleAddMember} className="mb-6 p-4 bg-neutral-900 rounded-xl">
                          <input
                            type="email"
                            value={newMemberEmail}
                            onChange={(e) => setNewMemberEmail(e.target.value)}
                            placeholder="member@example.com"
                            className="w-full px-4 py-2 mb-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
                            disabled={isAddingMember}
                          />
                          <button
                            type="submit"
                            disabled={isAddingMember}
                            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                              isAddingMember
                                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                : 'bg-white text-black hover:bg-neutral-200'
                            }`}
                          >
                            {isAddingMember ? 'Adding...' : 'Add Team Member'}
                          </button>
                        </form>
                      )}

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {teamMembers.length === 0 ? (
                          <p className="text-neutral-400 text-center py-8">No team members yet.</p>
                        ) : (
                          teamMembers.map((member) => (
                            <div 
                              key={member._id} 
                              className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{member.memberEmail}</p>
                                <p className="text-xs text-neutral-400">
                                  {member.status === 'active' && 'Active'}
                                  {member.status === 'pending_removal' && `Removing ${formatExpiresAt(member.accessExpiresAt || '')}`}
                                  {member.status === 'removed' && 'Removed'}
                                </p>
                              </div>
                              {member.status === 'active' && (
                                <button
                                  onClick={() => handleRemoveMember(member._id, member.memberEmail)}
                                  disabled={removingMemberId === member._id}
                                  className="ml-3 px-3 py-1 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {removingMemberId === member._id ? 'Removing...' : 'Remove'}
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-neutral-800">
                      <button
                        onClick={() => setShowTransferForm(!showTransferForm)}
                        className="w-full px-4 py-2 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors text-sm mb-3"
                      >
                        {showTransferForm ? 'Cancel Transfer' : 'Transfer Ownership'}
                      </button>

                      {showTransferForm && (
                        <form onSubmit={handleTransferOwnership} className="p-4 bg-neutral-900 rounded-xl">
                          <p className="text-xs text-neutral-400 mb-3">
                            Transfer ownership to an existing team member. This action cannot be undone.
                          </p>
                          <input
                            type="email"
                            value={transferEmail}
                            onChange={(e) => setTransferEmail(e.target.value)}
                            placeholder="new-owner@example.com"
                            className="w-full px-4 py-2 mb-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
                            disabled={isTransferring}
                          />
                          <button
                            type="submit"
                            disabled={isTransferring}
                            className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                              isTransferring
                                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default DashboardContent;