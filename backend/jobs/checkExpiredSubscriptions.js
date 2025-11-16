/**
 * @file jobs/checkExpiredSubscriptions.js
 * @description Scheduled job to check and update expired subscriptions, team memberships, and cleanup
 * @author GIDE
 */

import { User } from '../models/user.model.js';
import { TeamSubscription } from '../models/teamSubscription.model.js';
import { TeamMember } from '../models/teamMember.model.js';
import { PlanTypes } from '../constants/index.js';

/**
 * Check for expired FREE TRIAL and ACTIVE subscriptions and update status to 'ended'
 */
export const checkExpiredSubscriptions = async () => {
    try {
        console.log('[CRON] Checking for expired subscriptions...');
        
        const now = new Date();
        
        // Find all users whose subscription has expired (but not already marked as canceled/ended)
        const expiredUsers = await User.find({
            subscriptionExpiresAt: { $lt: now },
            subscriptionStatus: { 
                $in: [
                    PlanTypes.FREE_TRIAL, 
                    'active',
                    'trialing'
                ] 
            }
        });

        if (expiredUsers.length === 0) {
            console.log('[CRON] No expired active subscriptions found.');
        } else {
            console.log(`[CRON] Found ${expiredUsers.length} expired subscription(s). Updating...`);

            let updatedCount = 0;
            for (const user of expiredUsers) {
                const previousStatus = user.subscriptionStatus;
                const previousPlan = user.currentPlanType;
                
                user.subscriptionStatus = 'ended';
                user.currentPlanType = null;
                user.currentPlanId = null;
                
                await user.save({ validateBeforeSave: false });
                updatedCount++;
                
                console.log(`[CRON] Updated user ${user.email}: ${previousPlan}/${previousStatus} -> null/ended`);
            }

            console.log(`[CRON] Successfully updated ${updatedCount} expired subscription(s).`);
        }
        
    } catch (error) {
        console.error('[CRON] Error checking expired subscriptions:', error);
    }
};

/**
 * Clean up CANCELED subscriptions that have now expired
 * (Users who canceled via Stripe portal and billing period has ended)
 */
export const cleanupCanceledSubscriptions = async () => {
    try {
        console.log('[CRON] Cleaning up canceled subscriptions...');
        
        const now = new Date();
        
        // Find users with canceled subscriptions where the access period has ended
        const expiredCanceledUsers = await User.find({
            subscriptionStatus: 'canceled',
            subscriptionExpiresAt: { $lt: now },
            stripeSubscriptionId: { $ne: null } // Still has subscription fields
        });

        if (expiredCanceledUsers.length === 0) {
            console.log('[CRON] No expired canceled subscriptions to clean up.');
            return 0;
        }

        console.log(`[CRON] Found ${expiredCanceledUsers.length} expired canceled subscription(s). Cleaning...`);

        let cleanedCount = 0;
        for (const user of expiredCanceledUsers) {
            console.log(`[CRON] Cleaning canceled subscription for user: ${user.email}`);
            
            // Clear all subscription fields after access period ends
            user.stripeSubscriptionId = null;
            user.currentPlanId = null;
            user.currentPlanType = null;
            user.subscriptionExpiresAt = null;
            // Keep subscriptionStatus as 'canceled' for history tracking
            
            await user.save({ validateBeforeSave: false });
            cleanedCount++;
        }

        console.log(`[CRON] Successfully cleaned ${cleanedCount} canceled subscription(s).`);
        return cleanedCount;
        
    } catch (error) {
        console.error('[CRON] Error cleaning canceled subscriptions:', error);
        return 0;
    }
};

/**
 * Clean up team members with expired access
 * (Members who were removed but had extended access from personal plans)
 */
export const cleanupExpiredTeamMembers = async () => {
    try {
        console.log('[CRON] Cleaning up expired team members...');
        
        const now = new Date();
        
        // Find team members pending removal with expired access
        const expiredMembers = await TeamMember.find({
            status: 'pending_removal',
            accessExpiresAt: { $lt: now }
        }).populate('userId teamSubscriptionId');

        if (expiredMembers.length === 0) {
            console.log('[CRON] No expired team members to clean up.');
            return 0;
        }

        console.log(`[CRON] Found ${expiredMembers.length} expired team member(s). Cleaning...`);

        let cleanedCount = 0;
        for (const member of expiredMembers) {
            console.log(`[CRON] Removing team member: ${member.userId?.email || 'Unknown'}`);
            
            // Update member status to removed
            member.status = 'removed';
            await member.save();
            
            // Update user fields
            if (member.userId) {
                const user = member.userId;
                user.isTeamMember = false;
                user.teamMembership = null;
                user.extendedExpiryFromPersonalPlan = null;
                await user.save({ validateBeforeSave: false });
            }
            
            // Decrement team used seats
            if (member.teamSubscriptionId) {
                const teamSub = await TeamSubscription.findById(member.teamSubscriptionId);
                if (teamSub && teamSub.usedSeats > 0) {
                    teamSub.usedSeats -= 1;
                    await teamSub.save();
                    console.log(`[CRON] Decremented team ${teamSub._id} seats to ${teamSub.usedSeats}`);
                }
            }
            
            cleanedCount++;
        }

        console.log(`[CRON] Successfully cleaned ${cleanedCount} expired team member(s).`);
        return cleanedCount;
        
    } catch (error) {
        console.error('[CRON] Error cleaning expired team members:', error);
        return 0;
    }
};

/**
 * Clean up team subscriptions that are canceled and expired
 */
export const cleanupExpiredTeamSubscriptions = async () => {
    try {
        console.log('[CRON] Cleaning up expired team subscriptions...');
        
        const now = new Date();
        
        // Find team subscriptions that are canceled and billing period has ended
        const expiredTeams = await TeamSubscription.find({
            subscriptionStatus: 'canceled',
            currentPeriodEnd: { $lt: now }
        }).populate('ownerId');

        if (expiredTeams.length === 0) {
            console.log('[CRON] No expired team subscriptions to clean up.');
            return 0;
        }

        console.log(`[CRON] Found ${expiredTeams.length} expired team subscription(s). Cleaning...`);

        let cleanedCount = 0;
        for (const teamSub of expiredTeams) {
            console.log(`[CRON] Cleaning team subscription: ${teamSub._id}`);
            
            // Update team owner
            const owner = teamSub.ownerId;
            if (owner) {
                owner.isTeamOwner = false;
                owner.ownedTeamSubscription = null;
                owner.stripeSubscriptionId = null;
                owner.currentPlanId = null;
                owner.currentPlanType = null;
                owner.subscriptionExpiresAt = null;
                owner.subscriptionStatus = 'ended';
                await owner.save({ validateBeforeSave: false });
                console.log(`[CRON] Cleaned team owner: ${owner.email}`);
            }
            
            // Remove all remaining active/pending team members
            const allMembers = await TeamMember.find({
                teamSubscriptionId: teamSub._id,
                status: { $in: ['active', 'pending_removal'] }
            }).populate('userId');
            
            for (const member of allMembers) {
                member.status = 'removed';
                await member.save();
                
                if (member.userId) {
                    member.userId.isTeamMember = false;
                    member.userId.teamMembership = null;
                    member.userId.extendedExpiryFromPersonalPlan = null;
                    await member.userId.save({ validateBeforeSave: false });
                    console.log(`[CRON] Removed team member: ${member.userId.email}`);
                }
            }
            
            cleanedCount++;
        }

        console.log(`[CRON] Successfully cleaned ${cleanedCount} expired team subscription(s).`);
        return cleanedCount;
        
    } catch (error) {
        console.error('[CRON] Error cleaning expired team subscriptions:', error);
        return 0;
    }
};

/**
 * Clean up extended expiry dates that have passed
 * (Team members who had bonus days from personal plans)
 */
export const cleanupExpiredExtendedAccess = async () => {
    try {
        console.log('[CRON] Cleaning up expired extended access...');
        
        const now = new Date();
        
        // Find team members with expired extended access
        const result = await User.updateMany(
            {
                isTeamMember: true,
                extendedExpiryFromPersonalPlan: { $lt: now, $ne: null }
            },
            {
                $set: { extendedExpiryFromPersonalPlan: null }
            }
        );

        if (result.modifiedCount === 0) {
            console.log('[CRON] No expired extended access to clean up.');
        } else {
            console.log(`[CRON] Successfully cleaned ${result.modifiedCount} expired extended access date(s).`);
        }
        
        return result.modifiedCount;
        
    } catch (error) {
        console.error('[CRON] Error cleaning expired extended access:', error);
        return 0;
    }
};

/**
 * Master cleanup function that runs all cleanup tasks
 */
export const runAllCleanupTasks = async () => {
    console.log('\n========================================');
    console.log('🚀 STARTING COMPREHENSIVE CLEANUP JOB');
    console.log(`📅 Run time: ${new Date().toISOString()}`);
    console.log('========================================\n');
    
    try {
        // Task 1: Check and expire active subscriptions
        await checkExpiredSubscriptions();
        
        // Task 2: Clean up canceled subscriptions that have expired
        const canceledCount = await cleanupCanceledSubscriptions();
        
        // Task 3: Clean up expired team members
        const teamMembersCount = await cleanupExpiredTeamMembers();
        
        // Task 4: Clean up expired team subscriptions
        const teamSubsCount = await cleanupExpiredTeamSubscriptions();
        
        // Task 5: Clean up extended access dates
        const extendedAccessCount = await cleanupExpiredExtendedAccess();
        
        // Summary
        console.log('\n========================================');
        console.log('📊 CLEANUP SUMMARY');
        console.log('========================================');
        console.log(`   Canceled Subscriptions Cleaned: ${canceledCount}`);
        console.log(`   Team Members Cleaned: ${teamMembersCount}`);
        console.log(`   Team Subscriptions Cleaned: ${teamSubsCount}`);
        console.log(`   Extended Access Dates Cleaned: ${extendedAccessCount}`);
        console.log(`   Total Items Cleaned: ${canceledCount + teamMembersCount + teamSubsCount + extendedAccessCount}`);
        console.log('========================================');
        console.log('✅ CLEANUP JOB COMPLETED SUCCESSFULLY\n');
        
    } catch (error) {
        console.error('\n❌ CLEANUP JOB FAILED:', error);
        throw error;
    }
};