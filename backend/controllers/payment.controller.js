/**
 * @file controllers/payment.controller.js
 * @description Controller for Stripe payment operations and webhook handling.
 * @author GIDE
 */
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HttpStatusCode, AppMessages, PlanTypes } from '../constants/index.js';
import { stripe, STRIPE_PLAN_PRICE_IDS, stripeWebhookSecret } from '../config/stripe.js';
import { User } from '../models/user.model.js';
import { Plan } from '../models/plan.model.js';
import { TeamSubscription } from '../models/teamSubscription.model.js';
import { TeamMember } from '../models/teamMember.model.js';
import { bridge } from '../bridge.js';
import mongoose from 'mongoose';

// Helper function to add duration to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function calculateDaysBetween(startDate, endDate) {
  const diff = endDate.getTime() - startDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * @async
 * @function createCheckoutSession
 * @route POST /api/v1/payment/create-checkout-session
 * @description Creates a Stripe Checkout Session for a new subscription or to extend an existing one.
 */
const createCheckoutSession = asyncHandler(async (req, res, next) => {
  const { planId, quantity = 1 } = req.body;
  const userId = req.user._id;

  if (!planId) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Plan ID is required to create a checkout session.');
  }

  const plan = await Plan.findById(planId);

  if (!plan || !plan.isActive) {
    throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Selected plan not found or is inactive.');
  }

  // VALIDATION: Prevent downgrade from yearly to monthly
  if (req.user.currentPlanType === PlanTypes.YEARLY && plan.type === PlanTypes.MONTHLY) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      'You cannot downgrade from Yearly to Monthly plan. Please wait until your current subscription ends.'
    );
  }

  // VALIDATION: Prevent switching from team to personal while team is active
  if (req.user.isTeamOwner && req.user.ownedTeamSubscription && 
      plan.type !== PlanTypes.SMALL_BUSINESS) {
    const teamSub = await TeamSubscription.findById(req.user.ownedTeamSubscription);
    if (teamSub && teamSub.subscriptionStatus === 'active' && 
        teamSub.currentPeriodEnd > new Date()) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        'You cannot purchase a personal plan while owning an active team subscription. Please wait until your team subscription ends or cancel it first.'
      );
    }
  }

  // VALIDATION: Prevent team member from purchasing personal plan
  if (req.user.isTeamMember && req.user.teamMembership) {
    const teamMember = await TeamMember.findById(req.user.teamMembership)
      .populate('teamSubscriptionId');
    
    if (teamMember && teamMember.status === 'active' && 
        teamMember.teamSubscriptionId.subscriptionStatus === 'active' &&
        teamMember.teamSubscriptionId.currentPeriodEnd > new Date()) {
      throw new ApiError(
        HttpStatusCode.BAD_REQUEST,
        'You cannot purchase a personal plan while being an active team member. Please leave the team first or wait until your team access expires.'
      );
    }
  }

  let user = req.user;
  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: userId.toString(),
      },
    });
    stripeCustomerId = customer.id;
  }

  const frontendUrl = bridge.FRONTEND_URL;
  const successUrl = `${frontendUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontendUrl}/dashboard?payment=canceled`;

  let sessionMode;
  let lineItems = [];
  let metadata = {
    userId: userId.toString(),
    planId: plan._id.toString(),
    planType: plan.type,
  };
  let subscriptionData = {};

  const isExtendingSamePlan = (
    user.subscriptionStatus === 'active' &&
    user.currentPlanId &&
    user.currentPlanId.equals(plan._id) &&
    (plan.type === PlanTypes.MONTHLY || plan.type === PlanTypes.YEARLY)
  );

  if (isExtendingSamePlan) {
    sessionMode = 'payment';
    lineItems.push({
      price: plan.stripePriceId,
      quantity: 1,
    });
    metadata.paymentPurpose = 'extension';
    metadata.originalSubscriptionId = user.stripeSubscriptionId;
    console.log(`User ${user.email} is extending their existing ${plan.type} plan.`);
  } else {
    sessionMode = 'subscription';
    lineItems.push({
      price: plan.stripePriceId,
      quantity: 1,
    });
    subscriptionData = {
      metadata: {
        userId: userId.toString(),
      },
    };
    metadata.paymentPurpose = 'new_subscription';
    console.log(`User ${user.email} is purchasing a NEW ${plan.type} subscription.`);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: sessionMode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata,
      subscription_data: sessionMode === 'subscription' ? subscriptionData : undefined,
      allow_promotion_codes: true,
    });

    if (!user.stripeCustomerId) {
      user.stripeCustomerId = stripeCustomerId;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      { sessionId: session.id, url: session.url },
      'Stripe Checkout Session created successfully.'
    ));
  } catch (error) {
    console.error("Error creating Stripe Checkout Session:", error);
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create Stripe Checkout Session.'
    );
  }
});

/**
 * @async
 * @function handleStripeWebhook
 * @description Handles incoming Stripe webhook events.
 */
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    console.error(`❌ Webhook Error: ${err.message}`);
    return res.status(HttpStatusCode.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(HttpStatusCode.OK).send('Webhook Received');
});

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutSessionCompleted(session) {
  console.log(`✅ Checkout Session Completed: ${session.id}`);

  const userId = session.metadata.userId;
  const planId = session.metadata.planId;
  const paymentPurpose = session.metadata.paymentPurpose;
  const purchasedPlanType = session.metadata.planType;

  const user = await User.findById(userId);
  const plan = await Plan.findById(planId);

  if (!user || !plan) {
    console.error(`User or Plan not found. UserID: ${userId}, PlanID: ${planId}`);
    return;
  }

  // Handle team subscription
  if (paymentPurpose === 'team_subscription') {
    const seats = parseInt(session.metadata.seats);

    if (!session.subscription) {
      console.warn(`Team checkout session ${session.id} has no subscription attached.`);
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // CRITICAL FIX: Handle user's existing personal subscription before creating team
    const sessionDb = await mongoose.startSession();
    sessionDb.startTransaction();

    try {
      let remainingDaysFromPersonal = 0;
      let extendedTeamEnd = new Date(subscription.current_period_end * 1000);

      // If user has active personal subscription, calculate remaining days
      if (user.subscriptionStatus === 'active' && user.stripeSubscriptionId && user.subscriptionExpiresAt) {
        const now = new Date();
        if (user.subscriptionExpiresAt > now) {
          remainingDaysFromPersonal = calculateDaysBetween(now, user.subscriptionExpiresAt);
          extendedTeamEnd = addDays(extendedTeamEnd, remainingDaysFromPersonal);

          // Cancel personal subscription in Stripe
          try {
            await stripe.subscriptions.update(user.stripeSubscriptionId, {
              cancel_at_period_end: false,
            });
            await stripe.subscriptions.cancel(user.stripeSubscriptionId);
            console.log(`Canceled personal subscription ${user.stripeSubscriptionId} for team owner ${user.email}`);
          } catch (stripeError) {
            console.error('Error canceling personal subscription for team owner:', stripeError);
          }
        }
      }

      // Create team subscription record
      const teamSub = new TeamSubscription({
        ownerId: user._id,
        planId: plan._id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: plan.stripePriceId,
        totalSeats: seats,
        usedSeats: 1, // Owner counts as 1 seat
        subscriptionStatus: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: extendedTeamEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
      await teamSub.save({ session: sessionDb });

      // CRITICAL FIX: Update user with proper team and subscription fields
      user.stripeCustomerId = session.customer.toString();
      user.isTeamOwner = true;
      user.ownedTeamSubscription = teamSub._id;
      
      // Clear personal subscription fields
      user.stripeSubscriptionId = subscription.id; // Update to team subscription ID
      user.currentPlanId = plan._id;
      user.currentPlanType = plan.type;
      user.subscriptionStatus = 'active';
      user.subscriptionExpiresAt = extendedTeamEnd;
      
      // Clear free trial fields if applicable
      if (user.subscriptionStatus === PlanTypes.FREE_TRIAL || user.isFreeTrialEligible) {
        user.hasUsedFreeTrial = true;
        user.isFreeTrialEligible = false;
      }

      await user.save({ session: sessionDb, validateBeforeSave: false });

      await sessionDb.commitTransaction();
      console.log(`Team subscription created for ${user.email} with ${seats} seats. Extended end: ${extendedTeamEnd}`);
    } catch (error) {
      await sessionDb.abortTransaction();
      console.error('Error in team subscription creation:', error);
      throw error;
    } finally {
      sessionDb.endSession();
    }
    return;
  }

  // Handle extension payment
  if (paymentPurpose === 'extension') {
    let extensionDurationMonths = 1;
    if (purchasedPlanType === PlanTypes.YEARLY) {
      extensionDurationMonths = 12;
    }

    let newExpiry;
    if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt < new Date()) {
      newExpiry = addMonths(new Date(), extensionDurationMonths);
    } else {
      newExpiry = addMonths(new Date(user.subscriptionExpiresAt), extensionDurationMonths);
    }

    user.subscriptionExpiresAt = newExpiry;
    user.subscriptionStatus = 'active';
    
    // Clear free trial status if extending
    if (user.subscriptionStatus === PlanTypes.FREE_TRIAL) {
      user.hasUsedFreeTrial = true;
      user.isFreeTrialEligible = false;
    }

    await user.save({ validateBeforeSave: false });

    console.log(`User ${user.email} subscription extended by ${extensionDurationMonths} months.`);
    return;
  }

  // CRITICAL FIX: Handle upgrade to yearly payment
  if (paymentPurpose === 'upgrade_to_yearly') {
    const yearlyPlan = plan;
    const remainingDays = parseInt(session.metadata.remainingDays || '0');
    const currentSubscriptionId = session.metadata.currentSubscriptionId;

    // Cancel old monthly subscription
    if (currentSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(currentSubscriptionId);
        console.log(`Canceled old monthly subscription: ${currentSubscriptionId}`);
      } catch (error) {
        console.error('Error canceling old subscription:', error);
      }
    }

    // Calculate new expiry: 12 months (yearly) + remaining days from monthly
    const yearlyStartDate = new Date();
    const yearlyEndDate = addMonths(yearlyStartDate, 12);
    const finalExpiryDate = addDays(yearlyEndDate, remainingDays);

    // Create new yearly subscription in Stripe
    const newSubscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: yearlyPlan.stripePriceId }],
      metadata: {
        userId: user._id.toString(),
        upgradedFrom: 'monthly',
        remainingDaysAdded: remainingDays.toString(),
      },
    });

    // Update user with new yearly subscription
    user.stripeSubscriptionId = newSubscription.id;
    user.currentPlanId = yearlyPlan._id;
    user.currentPlanType = PlanTypes.YEARLY;
    user.subscriptionStatus = 'active';
    user.subscriptionExpiresAt = finalExpiryDate;

    await user.save({ validateBeforeSave: false });

    console.log(`User ${user.email} upgraded to yearly. ${remainingDays} days added. New expiry: ${finalExpiryDate}`);
    return;
  }

  // Handle new personal subscription
  if (paymentPurpose === 'new_subscription') {
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);

      // CRITICAL FIX: Properly update all subscription fields
      user.stripeSubscriptionId = subscription.id;
      user.stripeCustomerId = session.customer.toString();
      user.currentPlanId = plan._id;
      user.currentPlanType = plan.type;
      user.subscriptionStatus = subscription.status;
      user.subscriptionExpiresAt = new Date(subscription.current_period_end * 1000);
      
      // CRITICAL FIX: Clear free trial fields when starting paid subscription
      if (user.subscriptionStatus === PlanTypes.FREE_TRIAL || user.hasUsedFreeTrial === false) {
        user.hasUsedFreeTrial = true;
        user.isFreeTrialEligible = false;
      }

      await user.save({ validateBeforeSave: false });

      console.log(`User ${user.email} new subscription: ${plan.name}, Status: ${subscription.status}, Expires: ${user.subscriptionExpiresAt}`);
    }
  }
}

/**
 * Handle invoice.payment_succeeded
 */
async function handleInvoicePaymentSucceeded(invoice) {
  console.log(`💰 Invoice Payment Succeeded: ${invoice.id}`);

  if (!invoice.subscription) {
    console.log('Invoice has no subscription attached.');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

  // Check if it's a team subscription
  const teamSub = await TeamSubscription.findOne({ stripeSubscriptionId: subscription.id });
  if (teamSub) {
    // Handle team subscription renewal
    const newPeriodEnd = new Date(subscription.current_period_end * 1000);
    teamSub.subscriptionStatus = subscription.status;
    teamSub.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    teamSub.currentPeriodEnd = newPeriodEnd;
    teamSub.cancelAtPeriodEnd = subscription.cancel_at_period_end;

    // Clean up pending_removal members
    await TeamMember.updateMany(
      {
        teamSubscriptionId: teamSub._id,
        status: 'pending_removal',
        accessExpiresAt: { $lt: newPeriodEnd }
      },
      {
        status: 'removed'
      }
    );

    // Recalculate used seats (count active members + 1 for owner)
    const activeMembers = await TeamMember.countDocuments({
      teamSubscriptionId: teamSub._id,
      status: 'active'
    });
    teamSub.usedSeats = activeMembers + 1; // +1 for owner
    await teamSub.save();

    // CRITICAL FIX: Update team owner's subscription expiry
    const owner = await User.findById(teamSub.ownerId);
    if (owner) {
      owner.subscriptionStatus = 'active';
      owner.subscriptionExpiresAt = newPeriodEnd;
      await owner.save({ validateBeforeSave: false });
    }

    // Update extended expiry for team members
    const members = await TeamMember.find({
      teamSubscriptionId: teamSub._id,
      status: 'active'
    });
    for (const member of members) {
      const memberUser = await User.findById(member.userId);
      if (memberUser && memberUser.extendedExpiryFromPersonalPlan) {
        // Check if extended expiry is within this period
        if (memberUser.extendedExpiryFromPersonalPlan <= newPeriodEnd) {
          memberUser.extendedExpiryFromPersonalPlan = null;
          await memberUser.save({ validateBeforeSave: false });
        }
      }
    }

    console.log(`Team subscription ${teamSub._id} renewed. Period end: ${newPeriodEnd}`);
    return;
  }

  // Handle personal subscription renewal
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  if (user) {
    const stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);

    if (!user.subscriptionExpiresAt || stripeCurrentPeriodEnd > user.subscriptionExpiresAt) {
      user.subscriptionExpiresAt = stripeCurrentPeriodEnd;
    }
    user.subscriptionStatus = subscription.status;
    await user.save({ validateBeforeSave: false });

    console.log(`User ${user.email} subscription renewed via invoice payment.`);
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(updatedSubscription) {
  console.log(`🔄 Subscription Updated: ${updatedSubscription.id}, Status: ${updatedSubscription.status}`);

  // CRITICAL: Skip if status is changing from incomplete to active during initial creation
  // This will be handled by checkout.session.completed
  if (updatedSubscription.status === 'active' && 
      updatedSubscription.metadata && 
      updatedSubscription.metadata.userId) {
    
    // Check if this is initial activation (user doesn't have this subscription yet)
    const userId = updatedSubscription.metadata.userId;
    const userCheck = await User.findById(userId);
    
    if (userCheck && !userCheck.stripeSubscriptionId) {
      console.log(`⏭️ Skipping subscription.updated for initial activation. Will be handled by checkout.session.completed`);
      return;
    }
  }

  // Check if it's a team subscription
  const teamSub = await TeamSubscription.findOne({
    stripeSubscriptionId: updatedSubscription.id
  });
  if (teamSub) {
    teamSub.subscriptionStatus = updatedSubscription.status;
    teamSub.currentPeriodStart = new Date(updatedSubscription.current_period_start * 1000);
    teamSub.currentPeriodEnd = new Date(updatedSubscription.current_period_end * 1000);
    teamSub.cancelAtPeriodEnd = updatedSubscription.cancel_at_period_end;

    // Check if quantity changed
    if (updatedSubscription.items.data.length > 0) {
      const newQuantity = updatedSubscription.items.data[0].quantity;
      if (newQuantity !== teamSub.totalSeats) {
        console.log(`Team seats updated from ${teamSub.totalSeats} to ${newQuantity}`);
        teamSub.totalSeats = newQuantity;
      }
    }
    await teamSub.save();

    // Update owner's subscription status
    const owner = await User.findById(teamSub.ownerId);
    if (owner) {
      owner.subscriptionStatus = updatedSubscription.status;
      owner.subscriptionExpiresAt = teamSub.currentPeriodEnd;
      await owner.save({ validateBeforeSave: false });
    }

    console.log(`Team subscription ${teamSub._id} updated.`);
    return;
  }

  // Handle personal subscription update
  const userUpdated = await User.findOne({ stripeSubscriptionId: updatedSubscription.id });
  if (userUpdated) {
    userUpdated.subscriptionStatus = updatedSubscription.status;
    userUpdated.subscriptionExpiresAt = new Date(updatedSubscription.current_period_end * 1000);

    if (updatedSubscription.items.data.length > 0) {
      const newPriceId = updatedSubscription.items.data[0].price.id;
      const newPlan = await Plan.findOne({ stripePriceId: newPriceId });

      if (newPlan) {
        userUpdated.currentPlanId = newPlan._id;
        userUpdated.currentPlanType = newPlan.type;
      }
    }
    await userUpdated.save({ validateBeforeSave: false });

    console.log(`User ${userUpdated.email} subscription updated via webhook.`);
  } else {
    console.log(`⚠️ No user found with subscription ${updatedSubscription.id}. This may be a new subscription that will be handled by checkout.session.completed.`);
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(deletedSubscription) {
  console.log(`🗑️ Subscription Deleted: ${deletedSubscription.id}`);

  // Check if it's a team subscription
  const teamSub = await TeamSubscription.findOne({
    stripeSubscriptionId: deletedSubscription.id
  });
  if (teamSub) {
    const periodEnd = deletedSubscription.current_period_end
      ? new Date(deletedSubscription.current_period_end * 1000)
      : new Date();
    
    teamSub.subscriptionStatus = 'canceled';
    teamSub.cancelAtPeriodEnd = true;
    
    // Members retain access until period end
    await TeamMember.updateMany(
      {
        teamSubscriptionId: teamSub._id,
        status: 'active'
      },
      {
        status: 'pending_removal',
        accessExpiresAt: periodEnd
      }
    );
    await teamSub.save();

    // Update owner
    const owner = await User.findById(teamSub.ownerId);
    if (owner) {
      owner.subscriptionStatus = 'canceled';
      owner.subscriptionExpiresAt = periodEnd;
      await owner.save({ validateBeforeSave: false });
    }

    console.log(`Team subscription ${teamSub._id} canceled. Access until: ${periodEnd}`);
    return;
  }

  // Handle personal subscription deletion
  const userDeleted = await User.findOne({ stripeSubscriptionId: deletedSubscription.id });
  if (userDeleted) {
    const stripePeriodEnd = deletedSubscription.current_period_end
      ? new Date(deletedSubscription.current_period_end * 1000)
      : new Date();

    // CRITICAL: Keep subscription details but mark as canceled
    // User retains access until period end
    userDeleted.subscriptionStatus = 'canceled';

    // Only update expiry if Stripe period end is later than current expiry
    if (!userDeleted.subscriptionExpiresAt || userDeleted.subscriptionExpiresAt < stripePeriodEnd) {
      userDeleted.subscriptionExpiresAt = stripePeriodEnd;
    }
    
    await userDeleted.save({ validateBeforeSave: false });

    console.log(`User ${userDeleted.email} subscription canceled via Stripe Portal. Access until: ${stripePeriodEnd}`);
  }
}

/**
 * Background job to clean up expired subscriptions
 * Run this periodically (e.g., daily cron job)
 */
async function cleanupExpiredSubscriptions() {
  const now = new Date();
  
  // Find users with canceled subscriptions that have expired
  const expiredUsers = await User.find({
    subscriptionStatus: 'canceled',
    subscriptionExpiresAt: { $lt: now }
  });

  for (const user of expiredUsers) {
    // Clear subscription fields after expiry
    user.stripeSubscriptionId = null;
    user.currentPlanId = null;
    user.currentPlanType = null;
    user.subscriptionExpiresAt = null;
    // Keep subscriptionStatus as 'canceled' for history
    
    await user.save({ validateBeforeSave: false });
    console.log(`Cleaned up expired subscription for user: ${user.email}`);
  }

  // Clean up team members with expired access
  await TeamMember.updateMany(
    {
      status: 'pending_removal',
      accessExpiresAt: { $lt: now }
    },
    {
      status: 'removed'
    }
  );
}

/**
 * @async
 * @function upgradeToYearly
 * @description Creates a checkout session to upgrade Monthly subscription to Yearly.
 * User pays the prorated amount, then subscription is upgraded with remaining days added.
 */
const upgradeToYearly = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeSubscriptionId || user.subscriptionStatus !== 'active' || user.currentPlanType !== PlanTypes.MONTHLY) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      'You must have an active Monthly plan to upgrade to Yearly.'
    );
  }

  const yearlyPlan = await Plan.findOne({ type: PlanTypes.YEARLY, isActive: true });
  if (!yearlyPlan) {
    throw new ApiError(HttpStatusCode.NOT_FOUND, 'Yearly plan not found in database.');
  }

  if (!yearlyPlan.stripePriceId) {
    console.error(`Yearly plan (${yearlyPlan.name}) missing Stripe Price ID.`);
    throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Yearly plan misconfigured.');
  }

  // Calculate remaining days on current monthly plan
  const now = new Date();
  const remainingDays = user.subscriptionExpiresAt 
    ? calculateDaysBetween(now, user.subscriptionExpiresAt)
    : 0;

  const frontendUrl = bridge.FRONTEND_URL;
  const successUrl = `${frontendUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${frontendUrl}/dashboard?payment=canceled`;

  try {
    // Create checkout session for upgrade payment
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      line_items: [{
        price: yearlyPlan.stripePriceId,
        quantity: 1,
      }],
      mode: 'payment', // One-time payment for upgrade
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user._id.toString(),
        planId: yearlyPlan._id.toString(),
        planType: PlanTypes.YEARLY,
        paymentPurpose: 'upgrade_to_yearly',
        currentSubscriptionId: user.stripeSubscriptionId,
        remainingDays: remainingDays.toString(),
      },
      allow_promotion_codes: true,
    });

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      { 
        sessionId: session.id, 
        url: session.url,
        remainingDays: remainingDays,
        message: `You have ${remainingDays} days remaining on your monthly plan. These will be added to your yearly subscription.`
      },
      'Upgrade checkout session created. Complete payment to upgrade to Yearly Plan.'
    ));
  } catch (error) {
    console.error("Error creating upgrade checkout session:", error);
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create upgrade checkout session.'
    );
  }
});

/**
 * @async
 * @function manageSubscriptionPortal
 * @description Creates a Stripe Customer Portal session for users to manage their subscription.
 */
const manageSubscriptionPortal = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeCustomerId) {
    throw new ApiError(
      HttpStatusCode.BAD_REQUEST,
      'You do not have an active Stripe customer ID to manage subscriptions.'
    );
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${bridge.FRONTEND_URL}/dashboard?portal=return`,
    });

    return res.status(HttpStatusCode.OK).json(new ApiResponse(
      HttpStatusCode.OK,
      { portalUrl: session.url },
      'Stripe Customer Portal session created successfully.'
    ));
  } catch (error) {
    console.error("Error creating Stripe Customer Portal session:", error);
    throw new ApiError(
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to create Stripe Customer Portal session.'
    );
  }
});

/**
 * @async
 * @function getPlans
 * @route GET /api/v1/payment/plans
 * @description Retrieves a list of active subscription plans from the database.
 */
const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).select('-createdAt -updatedAt -__v');

  return res.status(HttpStatusCode.OK).json(new ApiResponse(
    HttpStatusCode.OK,
    plans,
    AppMessages.FETCHED
  ));
});

export const paymentController = {
  createCheckoutSession,
  handleStripeWebhook,
  upgradeToYearly,
  manageSubscriptionPortal,
  getPlans,
};