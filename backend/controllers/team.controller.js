/**
 * @file controllers/team.controller.js
 * @description Controller for team subscription management operations.
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HttpStatusCode, AppMessages, PlanTypes, TeamLimits, TeamMemberStatus } from '../constants/index.js';
import { stripe } from '../config/stripe.js';
import { User } from '../models/user.model.js';
import { Plan } from '../models/plan.model.js';
import { TeamSubscription } from '../models/teamSubscription.model.js';
import { TeamMember } from '../models/teamMember.model.js';
import { bridge } from '../bridge.js';
import mongoose from 'mongoose';

/**
 * Helper: Calculate days between two dates
 */
function calculateDaysBetween(startDate, endDate) {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Helper: Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * @async
 * @function createTeamCheckoutSession
 * @route POST /api/v1/team/create-checkout
 * @description Creates a Stripe Checkout Session for Small Business team subscription
 */
const createTeamCheckoutSession = asyncHandler(async (req, res) => {
  const { planId, seats } = req.body;
  const userId = req.user._id;

  // Validation
  if (!planId || !seats) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Plan ID and seats are required.');
  }
  if (seats < TeamLimits.MIN_SEATS || seats > TeamLimits.MAX_SEATS) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      `Seats must be between ${TeamLimits.MIN_SEATS} and ${TeamLimits.MAX_SEATS}.`
    );
  }

  // Check if user already owns a team
  if (req.user.isTeamOwner && req.user.ownedTeamSubscription) {
    const existingTeamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription);
    if (existingTeamSub && existingTeamSub.subscriptionStatus === 'active' && 
        existingTeamSub.currentPeriodEnd > new Date()) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, 'You already own an active team subscription.');
    }
  }

  // VALIDATION: Prevent team member from purchasing team plan
  if (req.user.isTeamMember && req.user.teamMembership) {
    const teamMember = await TeamMember.findById(req.user.teamMembership)
      .populate('teamSubscriptionId');
    
    if (teamMember && teamMember.status === 'active' && 
        teamMember.teamSubscriptionId.subscriptionStatus === 'active' &&
        teamMember.teamSubscriptionId.currentPeriodEnd > new Date()) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        'You cannot purchase a team plan while being an active team member. Please leave the team first.'
      );
    }
  }

  // Verify plan
  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive || plan.type !== PlanTypes.SMALL_BUSINESS) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Invalid Small Business plan selected.');
  }

  // Get or create Stripe customer
  let stripeCustomerId = req.user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.name,
      metadata: { userId: userId.toString() },
    });
    stripeCustomerId = customer.id;
  }

  const frontendUrl = bridge.FRONTEND_URL;
  let processedFrontendUrl = frontendUrl;
  if (!frontendUrl.startsWith('http://') && !frontendUrl.startsWith('https://')) {
    processedFrontendUrl = `https://${frontendUrl}`;
  }
  
  const successUrl = `${processedFrontendUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${processedFrontendUrl}/dashboard?payment=canceled`;

  const totalAmount = plan.price * seats;

  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{
        price: plan.stripePriceId,
        quantity: seats,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        planId: plan._id.toString(),
        planType: PlanTypes.SMALL_BUSINESS,
        seats: seats.toString(),
        paymentPurpose: 'team_subscription',
      },
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          seats: seats.toString(),
        },
      },
      allow_promotion_codes: true,
    });

    if (!req.user.stripeCustomerId) {
      req.user.stripeCustomerId = stripeCustomerId;
      await req.user.save({ validateBeforeSave: false });
    }

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      { 
        sessionId: session.id, 
        url: session.url,
        totalAmount: totalAmount,
        seats: seats,
        basePrice: plan.price
      },
      'Team checkout session created successfully.'
    ));
  } catch (error) {
    console.error("Error creating team checkout session:", error);
    
    if (error.type === 'StripeCardError') {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, `Payment error: ${error.message}`);
    } else if (error.type === 'StripeInvalidRequestError') {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, `Invalid request: ${error.message}`);
    }
    
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create checkout session.'
    );
  }
});

/**
 * @async
 * @function addTeamMember
 * @route POST /api/v1/team/members/add
 * @description Add a team member to the team subscription
 */
const addTeamMember = asyncHandler(async (req, res) => {
  const { memberEmail } = req.body;
  const ownerId = req.user._id;

  if (!memberEmail) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Member email is required.');
  }

  // Verify owner has a team subscription
  if (!req.user.isTeamOwner || !req.user.ownedTeamSubscription) {
    throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not own a team subscription.');
  }

  const teamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription).populate('planId');
  if (!teamSub || teamSub.subscriptionStatus !== 'active') {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Your team subscription is not active.');
  }

  // Check available seats
  if (teamSub.usedSeats >= teamSub.totalSeats) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      `No available seats. You have ${teamSub.totalSeats} total seats and all are occupied. Currently used: ${teamSub.usedSeats}/${teamSub.totalSeats}.`
    );
  }

  // Find user to add
  const memberUser = await User.findOne({ email: memberEmail.toLowerCase() });
  if (!memberUser) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'User with this email not found. User must register first.');
  }

  // Prevent owner from adding themselves
  if (memberUser._id.equals(ownerId)) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'You cannot add yourself as a team member.');
  }

  // Check if already a member of this team
  const existingMembership = await TeamMember.findOne({
    teamSubscriptionId: teamSub._id,
    userId: memberUser._id,
    status: 'active',
  });

  if (existingMembership) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'User is already a member of your team.');
  }

  // Check if user is member of another team
  if (memberUser.isTeamMember && memberUser.teamMembership) {
    const currentMembership = await TeamMember.findById(memberUser.teamMembership)
      .populate('teamSubscriptionId');
    
    if (currentMembership && currentMembership.status === 'active' &&
        currentMembership.teamSubscriptionId.subscriptionStatus === 'active' &&
        currentMembership.teamSubscriptionId.currentPeriodEnd > new Date()) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        'User is already an active member of another team. They must leave that team first.'
      );
    }
  }

  // Check if user owns another team
  if (memberUser.isTeamOwner && memberUser.ownedTeamSubscription) {
    const ownedTeam = await TeamSubscription.findById(memberUser.ownedTeamSubscription);
    if (ownedTeam && ownedTeam.subscriptionStatus === 'active' && 
        ownedTeam.currentPeriodEnd > new Date()) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        'User owns an active team subscription. Team owners cannot be added as team members.'
      );
    }
  }

  // Start transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let transitionDetails = {};
    let extendedExpiryDate = null;

    // CRITICAL FIX: Handle personal subscription transition with remaining days
    if (memberUser.subscriptionStatus === 'active' && memberUser.stripeSubscriptionId) {
      const now = new Date();
      const personalExpiry = memberUser.subscriptionExpiresAt;

      if (personalExpiry > now) {
        // Calculate remaining days from personal subscription
        const remainingDays = calculateDaysBetween(now, personalExpiry);

        // Add remaining days to team subscription end date
        extendedExpiryDate = addDays(teamSub.currentPeriodEnd, remainingDays);

        transitionDetails = {
          previousPlanId: memberUser.currentPlanId,
          previousStripeSubscriptionId: memberUser.stripeSubscriptionId,
          daysAddedToTeamEnd: remainingDays,
          personalPlanCanceledAt: now,
        };

        // Cancel personal Stripe subscription immediately
        try {
          await stripe.subscriptions.update(memberUser.stripeSubscriptionId, {
            cancel_at_period_end: false,
          });
          await stripe.subscriptions.cancel(memberUser.stripeSubscriptionId);
          console.log(`Canceled personal subscription ${memberUser.stripeSubscriptionId} for user ${memberUser.email}. ${remainingDays} days added to team access.`);
        } catch (stripeError) {
          console.error('Error canceling personal subscription:', stripeError);
          // Continue - webhook will handle
        }
      }
    }

    // CRITICAL FIX: Clear free trial status when joining team
    const wasOnFreeTrial = memberUser.subscriptionStatus === PlanTypes.FREE_TRIAL;

    // Create team member record
    const teamMember = new TeamMember({
      teamSubscriptionId: teamSub._id,
      userId: memberUser._id,
      memberEmail: memberEmail.toLowerCase(),
      status: 'active',
      addedAt: new Date(),
      transitionDetails: Object.keys(transitionDetails).length > 0 ? transitionDetails : undefined,
    });
    await teamMember.save({ session });

    // CRITICAL FIX: Update member user with proper field clearing
    memberUser.isTeamMember = true;
    memberUser.teamMembership = teamMember._id;
    
    // Clear personal subscription fields
    memberUser.stripeSubscriptionId = null;
    memberUser.subscriptionStatus = 'active'; // Active through team
    memberUser.currentPlanId = null;
    memberUser.currentPlanType = null;
    memberUser.personalPlanCanceledForTeam = true;
    memberUser.extendedExpiryFromPersonalPlan = extendedExpiryDate;
    
    // Clear free trial if applicable
    if (wasOnFreeTrial || memberUser.isFreeTrialEligible) {
      memberUser.hasUsedFreeTrial = true;
      memberUser.isFreeTrialEligible = false;
      memberUser.subscriptionExpiresAt = null; // Clear free trial expiry
    }

    await memberUser.save({ session, validateBeforeSave: false });

    // Update team subscription used seats
    teamSub.usedSeats += 1;
    await teamSub.save({ session });

    await session.commitTransaction();

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      {
        teamMember: {
          id: teamMember._id,
          email: teamMember.memberEmail,
          addedAt: teamMember.addedAt,
          extendedExpiry: extendedExpiryDate,
          daysFromPersonalPlan: transitionDetails.daysAddedToTeamEnd || 0,
        },
        usedSeats: teamSub.usedSeats,
        totalSeats: teamSub.totalSeats,
      },
      extendedExpiryDate 
        ? `Team member added successfully. ${transitionDetails.daysAddedToTeamEnd} days from their personal plan added to their team access.`
        : 'Team member added successfully.'
    ));
  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding team member:', error);
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to add team member.'
    );
  } finally {
    session.endSession();
  }
});

/**
 * @async
 * @function removeTeamMember
 * @route POST /api/v1/team/members/remove
 * @description Remove a team member (access remains until period end or extended expiry)
 */
const removeTeamMember = asyncHandler(async (req, res) => {
  const { memberId } = req.body;
  const ownerId = req.user._id;

  if (!memberId) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Member ID is required.');
  }

  // Verify ownership
  if (!req.user.isTeamOwner || !req.user.ownedTeamSubscription) {
    throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not own a team subscription.');
  }

  const teamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription);
  if (!teamSub) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Team subscription not found.');
  }

  // Find team member
  const teamMember = await TeamMember.findOne({
    _id: memberId,
    teamSubscriptionId: teamSub._id,
    status: 'active',
  }).populate('userId');

  if (!teamMember) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Team member not found or already removed.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const memberUser = await User.findById(teamMember.userId);
    
    // Determine access expiry - use extended expiry if exists, otherwise team period end
    const accessExpiry = memberUser.extendedExpiryFromPersonalPlan || teamSub.currentPeriodEnd;

    // Mark as pending removal
    teamMember.status = 'pending_removal';
    teamMember.removedAt = new Date();
    teamMember.accessExpiresAt = accessExpiry;
    await teamMember.save({ session });

    // Note: Don't decrement usedSeats yet - member still has access
    // usedSeats will be decremented when status changes to 'removed' at next renewal

    await session.commitTransaction();

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      {
        memberId: teamMember._id,
        memberEmail: teamMember.memberEmail,
        accessExpiresAt: teamMember.accessExpiresAt,
        extendedAccess: !!memberUser.extendedExpiryFromPersonalPlan,
      },
      `Team member removed. Access remains until ${teamMember.accessExpiresAt.toLocaleDateString()}.`
    ));
  } catch (error) {
    await session.abortTransaction();
    console.error('Error removing team member:', error);
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to remove team member.'
    );
  } finally {
    session.endSession();
  }
});

/**
 * @async
 * @function getTeamMembers
 * @route GET /api/v1/team/members
 * @description Get all team members for the owner's team
 */
const getTeamMembers = asyncHandler(async (req, res) => {
  if (!req.user.isTeamOwner || !req.user.ownedTeamSubscription) {
    throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not own a team subscription.');
  }

  const members = await TeamMember.find({
    teamSubscriptionId: req.user.ownedTeamSubscription,
  })
  .populate('userId', 'name email avatar extendedExpiryFromPersonalPlan')
  .sort({ addedAt: -1 });

  const teamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription);

  // Enhance member data with extended access info
  const enhancedMembers = members.map(member => ({
    ...member.toObject(),
    hasExtendedAccess: !!member.userId?.extendedExpiryFromPersonalPlan,
    effectiveAccessExpiry: member.userId?.extendedExpiryFromPersonalPlan || teamSub.currentPeriodEnd,
  }));

  return res.status(HttpStatusCode.OK).json(new ApiResponse(
    HttpStatusCode.OK,
    {
      members: enhancedMembers,
      usedSeats: teamSub.usedSeats,
      totalSeats: teamSub.totalSeats,
      availableSeats: teamSub.totalSeats - teamSub.usedSeats,
      note: 'You (owner) occupy 1 seat. Used seats includes you + active team members.'
    },
    'Team members fetched successfully.'
  ));
});

/**
 * @async
 * @function transferOwnership
 * @route POST /api/v1/team/transfer-ownership
 * @description Transfer team ownership to another team member
 */
const transferOwnership = asyncHandler(async (req, res) => {
  const { newOwnerEmail } = req.body;
  const currentOwnerId = req.user._id;

  if (!newOwnerEmail) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'New owner email is required.');
  }

  // Verify current ownership
  if (!req.user.isTeamOwner || !req.user.ownedTeamSubscription) {
    throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not own a team subscription.');
  }

  const teamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription);
  if (!teamSub || teamSub.subscriptionStatus !== 'active') {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Your team subscription is not active.');
  }

  // Find new owner
  const newOwner = await User.findOne({ email: newOwnerEmail.toLowerCase() });
  if (!newOwner) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'New owner user not found.');
  }

  if (newOwner._id.equals(currentOwnerId)) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'You are already the owner.');
  }

  // Verify new owner is a team member
  const newOwnerMembership = await TeamMember.findOne({
    teamSubscriptionId: teamSub._id,
    userId: newOwner._id,
    status: 'active',
  });

  if (!newOwnerMembership) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'New owner must be an active team member.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create new Stripe customer for new owner if needed
    let newOwnerStripeCustomerId = newOwner.stripeCustomerId;
    if (!newOwnerStripeCustomerId) {
      const customer = await stripe.customers.create({
        email: newOwner.email,
        name: newOwner.name,
        metadata: { userId: newOwner._id.toString() },
      });
      newOwnerStripeCustomerId = customer.id;
      newOwner.stripeCustomerId = newOwnerStripeCustomerId;
    }

    // Transfer subscription to new customer in Stripe
    await stripe.subscriptions.update(teamSub.stripeSubscriptionId, {
      customer: newOwnerStripeCustomerId,
      cancel_at_period_end: false,
    });

    // Update team subscription
    teamSub.ownerId = newOwner._id;
    await teamSub.save({ session });

    // Update old owner - convert to team member
    const oldOwnerAsMember = new TeamMember({
      teamSubscriptionId: teamSub._id,
      userId: currentOwnerId,
      memberEmail: req.user.email,
      status: 'active',
      addedAt: new Date(),
    });
    await oldOwnerAsMember.save({ session });

    req.user.isTeamOwner = false;
    req.user.ownedTeamSubscription = null;
    req.user.isTeamMember = true;
    req.user.teamMembership = oldOwnerAsMember._id;
    req.user.currentPlanId = null;
    req.user.currentPlanType = null;
    await req.user.save({ session, validateBeforeSave: false });

    // Update new owner - remove from members, make owner
    await TeamMember.findByIdAndDelete(newOwnerMembership._id, { session });
    
    newOwner.isTeamMember = false;
    newOwner.teamMembership = null;
    newOwner.isTeamOwner = true;
    newOwner.ownedTeamSubscription = teamSub._id;
    newOwner.currentPlanId = teamSub.planId;
    newOwner.currentPlanType = PlanTypes.SMALL_BUSINESS;
    newOwner.subscriptionStatus = 'active';
    newOwner.subscriptionExpiresAt = teamSub.currentPeriodEnd;
    newOwner.extendedExpiryFromPersonalPlan = null; // Clear extended expiry
    await newOwner.save({ session, validateBeforeSave: false });

    await session.commitTransaction();

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      {
        newOwnerEmail: newOwner.email,
        transferredAt: new Date(),
      },
      'Ownership transferred successfully.'
    ));
  } catch (error) {
    await session.abortTransaction();
    console.error('Error transferring ownership:', error);
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to transfer ownership.'
    );
  } finally {
    session.endSession();
  }
});

/**
 * @async
 * @function getTeamSubscriptionDetails
 * @route GET /api/v1/team/subscription
 * @description Get team subscription details for owner
 */
const getTeamSubscriptionDetails = asyncHandler(async (req, res) => {
  if (!req.user.isTeamOwner || !req.user.ownedTeamSubscription) {
    throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not own a team subscription.');
  }

  const teamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription)
    .populate('planId');

  if (!teamSub) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Team subscription not found.');
  }

  return res.status(HttpStatusCode.OK).json(new ApiResponse(
    HttpStatusCode.OK,
    {
      subscription: teamSub,
      members: teamSub.usedSeats,
      availableSeats: teamSub.totalSeats - teamSub.usedSeats,
    },
    'Team subscription details fetched successfully.'
  ));
});

export const teamController = {
  createTeamCheckoutSession,
  addTeamMember,
  removeTeamMember,
  getTeamMembers,
  transferOwnership,
  getTeamSubscriptionDetails,
};