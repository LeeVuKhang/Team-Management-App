import * as InvitationModel from '../models/invitation.model.js';

/**
 * Invitation Controller
 * Handles business logic and HTTP responses for invitation-related operations
 * Security: Enforces email ownership verification for all operations
 */

/**
 * Trigger n8n webhook for onboarding notifications
 * Called when a user successfully joins a team
 * 
 * @param {Object} data - Onboarding event data
 */
const triggerOnboardingWebhook = async (data) => {
  const webhookUrl = process.env.N8N_ONBOARDING_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('ℹ️ N8N_ONBOARDING_WEBHOOK_URL not configured, skipping webhook');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-system-key': process.env.N8N_SECRET_KEY || '',
      },
      body: JSON.stringify({
        event: 'member.joined',
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`⚠️ n8n webhook returned ${response.status}: ${await response.text()}`);
    } else {
      console.log(`✅ Onboarding webhook triggered for user ${data.username} in team ${data.teamName}`);
    }
  } catch (error) {
    // Don't fail the invitation accept if webhook fails
    console.error('❌ Failed to trigger onboarding webhook:', error.message);
  }
};

/**
 * Get all pending invitations for the current user
 * @route GET /api/v1/user/invitations
 */
export const getUserInvitations = async (req, res, next) => {
  try {
    const userEmail = req.user.email; // From auth middleware

    const invitations = await InvitationModel.getUserInvitations(userEmail);

    res.status(200).json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error('Get user invitations error:', error);
    next(error);
  }
};

/**
 * Accept an invitation
 * @route POST /api/v1/invitations/accept
 * @body { token: string }
 */
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validate token format (already done by middleware, but double-check)
    if (!token || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    const result = await InvitationModel.acceptInvitation(token, userId, userEmail);

    // Trigger n8n onboarding webhook for new members (non-blocking)
    // This allows n8n to send a welcome message to the team channel
    if (!result.alreadyMember) {
      triggerOnboardingWebhook({
        userId: req.user.id,
        username: req.user.username,
        email: userEmail,
        teamId: result.teamId,
        teamName: result.teamName,
        role: result.role || 'member',
        joinedAt: new Date().toISOString(),
      }).catch(err => console.error('Onboarding webhook error:', err));
    }

    res.status(200).json({
      success: true,
      message: result.alreadyMember
        ? `You are already a member of ${result.teamName}`
        : `Successfully joined ${result.teamName}`,
      data: {
        teamId: result.teamId,
        teamName: result.teamName,
        alreadyMember: result.alreadyMember,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);

    // Handle specific errors with appropriate status codes
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or has been revoked',
      });
    }

    if (error.message.includes('expired')) {
      return res.status(410).json({
        success: false,
        message: 'This invitation has expired',
      });
    }

    if (error.message.includes('already been used')) {
      return res.status(409).json({
        success: false,
        message: 'This invitation has already been used',
      });
    }

    // CRITICAL SECURITY: Email mismatch (403 Forbidden)
    if (error.message.includes('different email')) {
      return res.status(403).json({
        success: false,
        message: 'This invitation was sent to a different email address',
      });
    }

    next(error);
  }
};

/**
 * Decline an invitation
 * @route POST /api/v1/invitations/decline
 * @body { token: string }
 */
export const declineInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userEmail = req.user.email;

    if (!token || token.length !== 64) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    await InvitationModel.declineInvitation(token, userEmail);

    res.status(200).json({
      success: true,
      message: 'Invitation declined successfully',
    });
  } catch (error) {
    console.error('Decline invitation error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found',
      });
    }

    if (error.message.includes('different email')) {
      return res.status(403).json({
        success: false,
        message: 'This invitation was sent to a different email address',
      });
    }

    if (error.message.includes('no longer pending')) {
      return res.status(409).json({
        success: false,
        message: 'This invitation is no longer pending',
      });
    }

    next(error);
  }
};

/**
 * Create a new invitation (Admin/Owner only)
 * @route POST /api/v1/teams/:teamId/invitations
 * @body { email: string, role: string }
 */
export const createInvitation = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { email, role } = req.body;
    const inviterId = req.user.id;

    // TODO: Verify user has admin/owner role in team before creating invitation
    // For now, we'll allow any team member to invite (will be fixed later)

    const invitation = await InvitationModel.createInvitation(
      teamId,
      inviterId,
      email,
      role || 'member'
    );

    // TODO: Send invitation email here
    // await sendInvitationEmail(email, invitation.token, teamName);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitationId: invitation.id,
        expiresAt: invitation.expiresAt,
        // Don't expose token in production - only send via email
      },
    });
  } catch (error) {
    console.error('Create invitation error:', error);

    if (error.message.includes('already a member')) {
      return res.status(409).json({
        success: false,
        message: 'This user is already a member of the team',
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'An invitation for this email already exists',
      });
    }

    next(error);
  }
};
