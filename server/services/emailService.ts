import nodemailer from 'nodemailer';

// HTML escape function to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Truncate text to a max length
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASSWORD
  }
});

// Base email template wrapper with YoForex branding
function createEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header with gradient -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">YoForex</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Your Forex Trading Community</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px 0;">
            © 2025 YoForex. All rights reserved.
          </p>
          <p style="margin: 0;">
            <a href="${process.env.BASE_URL}/settings/notifications" style="color: #2563eb; font-size: 12px; text-decoration: none;">Email Preferences</a>
            <span style="color: #d1d5db; margin: 0 8px;">|</span>
            <a href="${process.env.BASE_URL}/unsubscribe" style="color: #2563eb; font-size: 12px; text-decoration: none;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const emailService = {
  // 1. COMMENT NOTIFICATION
  async sendCommentNotification(to: string, commenterName: string, threadTitle: string, commentPreview: string, threadSlug: string): Promise<void> {
    const safeCommenterName = escapeHtml(commenterName);
    const safeThreadTitle = escapeHtml(threadTitle);
    const safeCommentPreview = escapeHtml(truncate(commentPreview, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💬 New Comment</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeCommenterName}</strong> commented on <strong>"${safeThreadTitle}"</strong>
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${safeCommentPreview}</p>
      </div>
      <a href="${process.env.BASE_URL}/threads/${threadSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">View Thread</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `${commenterName} commented on "${truncate(threadTitle, 50)}"`,
      html: createEmailTemplate(content)
    });
  },

  // 2. LIKE NOTIFICATION
  async sendLikeNotification(to: string, likerName: string, contentType: string, contentTitle: string, contentUrl: string): Promise<void> {
    const safeLikerName = escapeHtml(likerName);
    const safeContentType = escapeHtml(contentType);
    const safeContentTitle = escapeHtml(contentTitle);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">❤️ New Like</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeLikerName}</strong> liked your ${safeContentType}: <strong>"${safeContentTitle}"</strong>
      </p>
      <a href="${process.env.BASE_URL}${contentUrl}" style="display: inline-block; background: #ec4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View ${safeContentType}</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `${likerName} liked your ${contentType}`,
      html: createEmailTemplate(content)
    });
  },

  // 3. FOLLOW NOTIFICATION
  async sendFollowNotification(to: string, followerName: string, followerUsername: string, followerAvatar?: string): Promise<void> {
    const safeFollowerName = escapeHtml(followerName);
    const safeFollowerUsername = escapeHtml(followerUsername);
    
    const avatarHtml = followerAvatar 
      ? `<img src="${followerAvatar}" alt="${safeFollowerName}" style="width: 64px; height: 64px; border-radius: 50%; margin-right: 16px;" />`
      : '';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👥 New Follower</h2>
      <div style="display: flex; align-items: center; margin: 16px 0;">
        ${avatarHtml}
        <div>
          <p style="color: #374151; font-size: 16px; margin: 0; line-height: 1.5;">
            <strong>${safeFollowerName}</strong> started following you!
          </p>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">@${safeFollowerUsername}</p>
        </div>
      </div>
      <a href="${process.env.BASE_URL}/users/${safeFollowerUsername}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">View Profile</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `${followerName} started following you`,
      html: createEmailTemplate(content)
    });
  },

  // 4. WITHDRAWAL REQUEST RECEIVED
  async sendWithdrawalRequestReceived(to: string, amount: number, method: string, requestId: string): Promise<void> {
    const safeMethod = escapeHtml(method);
    const safeRequestId = escapeHtml(requestId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💰 Withdrawal Request Received</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        We've received your withdrawal request. Here are the details:
      </p>
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Amount:</strong> ${amount} coins</p>
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Method:</strong> ${safeMethod}</p>
        <p style="margin: 0; color: #92400e;"><strong>Request ID:</strong> #${safeRequestId}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">Processing time: 1-3 business days</p>
      <a href="${process.env.BASE_URL}/wallet/withdrawals/${safeRequestId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Status</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `Withdrawal Request #${requestId} - Processing`,
      html: createEmailTemplate(content)
    });
  },

  // 5. WITHDRAWAL SENT (APPROVED)
  async sendWithdrawalSent(to: string, amount: number, method: string, transactionId: string): Promise<void> {
    const safeMethod = escapeHtml(method);
    const safeTransactionId = escapeHtml(transactionId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✅ Withdrawal Sent</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Great news! Your withdrawal has been processed successfully.
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Amount:</strong> ${amount} coins</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Method:</strong> ${safeMethod}</p>
        <p style="margin: 0; color: #065f46;"><strong>Transaction ID:</strong> ${safeTransactionId}</p>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">The funds should arrive in your account within 1-2 business days.</p>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `Withdrawal Successful - ${amount} Coins Sent`,
      html: createEmailTemplate(content)
    });
  },

  // 6. COINS RECEIVED
  async sendCoinsReceived(to: string, amount: number, source: string, newBalance: number): Promise<void> {
    const safeSource = escapeHtml(source);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🪙 Coins Received!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        You've earned <strong style="color: #f59e0b; font-size: 20px;">${amount} coins</strong>!
      </p>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Source:</strong> ${safeSource}</p>
        <p style="margin: 0; color: #92400e;"><strong>New Balance:</strong> ${newBalance} coins</p>
      </div>
      <a href="${process.env.BASE_URL}/wallet" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Wallet</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `You earned ${amount} coins!`,
      html: createEmailTemplate(content)
    });
  },

  // 7. PRODUCT SOLD
  async sendProductSold(to: string, productName: string, buyerName: string, price: number, earnings: number): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeBuyerName = escapeHtml(buyerName);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎉 Your Product Sold!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Congratulations! <strong>${safeBuyerName}</strong> purchased your product.
      </p>
      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Product:</strong> ${safeProductName}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Sale Price:</strong> ${price} coins</p>
        <p style="margin: 0; color: #065f46; font-size: 18px;"><strong>Your Earnings:</strong> +${earnings} coins 💰</p>
      </div>
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `Your "${truncate(productName, 50)}" was purchased!`,
      html: createEmailTemplate(content)
    });
  },

  // 8. PRODUCT PUBLISHED
  async sendProductPublished(to: string, productName: string, productSlug: string, category: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safeCategory = escapeHtml(category);
    const safeProductSlug = escapeHtml(productSlug);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✅ Product Published Successfully</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your ${safeCategory} "<strong>${safeProductName}</strong>" is now live on the marketplace!
      </p>
      <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; color: #1e40af;">Your product is visible to all YoForex members and can now generate sales.</p>
      </div>
      <div style="margin-top: 16px;">
        <a href="${process.env.BASE_URL}/content/${safeProductSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">View Listing</a>
        <a href="${process.env.BASE_URL}/content/${safeProductSlug}/edit" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">Edit</a>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `"${truncate(productName, 50)}" is now live!`,
      html: createEmailTemplate(content)
    });
  },

  // 9. PASSWORD RESET
  async sendPasswordReset(to: string, resetToken: string, expiresIn: string = '1 hour'): Promise<void> {
    const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🔒 Password Reset Request</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
        Or copy this link: <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
      </p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>⚠️ Security Notice:</strong> This link expires in ${expiresIn}. If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: 'Reset your YoForex password',
      html: createEmailTemplate(content)
    });
  },

  // 10. USERNAME CHANGE CONFIRMATION
  async sendUsernameChanged(to: string, oldUsername: string, newUsername: string): Promise<void> {
    const safeOldUsername = escapeHtml(oldUsername);
    const safeNewUsername = escapeHtml(newUsername);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✏️ Username Changed</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Your username has been successfully updated.
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>Old Username:</strong> @${safeOldUsername}</p>
        <p style="margin: 0; color: #4b5563;"><strong>New Username:</strong> @${safeNewUsername}</p>
      </div>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>⚠️ Important:</strong> If you didn't make this change, please contact support immediately.</p>
      </div>
      <a href="${process.env.BASE_URL}/settings" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Settings</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: 'Your username has been changed',
      html: createEmailTemplate(content)
    });
  },

  // 11. NEW MESSAGE RECEIVED
  async sendNewMessage(to: string, senderName: string, senderUsername: string, messagePreview: string): Promise<void> {
    const safeSenderName = escapeHtml(senderName);
    const safeSenderUsername = escapeHtml(senderUsername);
    const safeMessagePreview = escapeHtml(truncate(messagePreview, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">✉️ New Message</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        You received a message from <strong>${safeSenderName}</strong> (@${safeSenderUsername})
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #8b5cf6; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${safeMessagePreview}</p>
      </div>
      <a href="${process.env.BASE_URL}/messages" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Read Message</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `New message from ${senderName}`,
      html: createEmailTemplate(content)
    });
  },

  // 12. LEVEL UP NOTIFICATION
  async sendLevelUp(to: string, newLevel: string, xp: number, rewards: string[]): Promise<void> {
    const safeNewLevel = escapeHtml(newLevel);
    const rewardsList = rewards.map(r => `<li style="margin: 4px 0;">${escapeHtml(r)}</li>`).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎊 Level Up!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Congratulations! You've reached <strong style="color: #f59e0b; font-size: 20px;">${safeNewLevel}</strong> level!
      </p>
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #92400e; font-size: 18px;"><strong>Your XP:</strong> ${xp}</p>
        ${rewards.length > 0 ? `
          <p style="margin: 8px 0 4px 0; color: #92400e;"><strong>Rewards Unlocked:</strong></p>
          <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #92400e;">${rewardsList}</ul>
        ` : ''}
      </div>
      <a href="${process.env.BASE_URL}/dashboard" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Dashboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `🎊 You've reached ${newLevel} level!`,
      html: createEmailTemplate(content)
    });
  },

  // 13. LEADERBOARD RANK NOTIFICATION
  async sendLeaderboardRank(to: string, rank: number, category: string, points: number): Promise<void> {
    const safeCategory = escapeHtml(category);
    
    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏆';
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">${medalEmoji} Leaderboard Achievement!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Amazing! You're now ranked <strong style="color: #f59e0b; font-size: 20px;">#${rank}</strong> in ${safeCategory}!
      </p>
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
        <p style="margin: 0; color: #1e40af; font-size: 48px; font-weight: bold;">#${rank}</p>
        <p style="margin: 8px 0 0 0; color: #1e40af;"><strong>${points}</strong> points</p>
      </div>
      <a href="${process.env.BASE_URL}/leaderboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Leaderboard</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `${medalEmoji} You're ranked #${rank} in ${category}!`,
      html: createEmailTemplate(content)
    });
  },

  // 14. EMAIL VERIFICATION (WELCOME)
  async sendEmailVerification(to: string, username: string, verificationToken: string): Promise<void> {
    const safeUsername = escapeHtml(username);
    const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">👋 Welcome to YoForex!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Hi <strong>${safeUsername}</strong>, welcome to the YoForex community!
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        To get started, please verify your email address:
      </p>
      <a href="${verifyUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Verify Email Address</a>
      <p style="color: #6b7280; font-size: 14px; margin: 16px 0;">
        Or copy this link: <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
      </p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #4b5563;"><strong>What you can do on YoForex:</strong></p>
        <ul style="margin: 4px 0 0 0; padding-left: 20px; color: #4b5563;">
          <li style="margin: 4px 0;">Share and discuss trading strategies</li>
          <li style="margin: 4px 0;">Buy and sell EAs, indicators, and templates</li>
          <li style="margin: 4px 0;">Earn coins for contributions</li>
          <li style="margin: 4px 0;">Connect with forex traders worldwide</li>
        </ul>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: 'Welcome to YoForex - Verify your email',
      html: createEmailTemplate(content)
    });
  },

  // 15. PURCHASE RECEIPT
  async sendPurchaseReceipt(to: string, productName: string, price: number, purchaseId: string, downloadUrl: string): Promise<void> {
    const safeProductName = escapeHtml(productName);
    const safePurchaseId = escapeHtml(purchaseId);
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">🎁 Purchase Successful!</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Thank you for your purchase! You now have access to <strong>"${safeProductName}"</strong>
      </p>
      <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Product:</strong> ${safeProductName}</p>
        <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Price:</strong> ${price} coins</p>
        <p style="margin: 0; color: #065f46;"><strong>Order ID:</strong> #${safePurchaseId}</p>
      </div>
      <a href="${downloadUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 12px;">Download Now</a>
      <a href="${process.env.BASE_URL}/purchases" style="display: inline-block; background: white; border: 2px solid #2563eb; color: #2563eb; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold;">View All Purchases</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `Receipt: ${truncate(productName, 50)} - ${price} coins`,
      html: createEmailTemplate(content)
    });
  },

  // 16. THREAD REPLY NOTIFICATION
  async sendThreadReply(to: string, replierName: string, threadTitle: string, replyPreview: string, threadSlug: string): Promise<void> {
    const safeReplierName = escapeHtml(replierName);
    const safeThreadTitle = escapeHtml(threadTitle);
    const safeReplyPreview = escapeHtml(truncate(replyPreview, 200));
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">💬 New Reply to Your Thread</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        <strong>${safeReplierName}</strong> replied to your thread <strong>"${safeThreadTitle}"</strong>
      </p>
      <div style="background: #f3f4f6; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.6;">${safeReplyPreview}</p>
      </div>
      <a href="${process.env.BASE_URL}/threads/${threadSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Reply</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `${replierName} replied to "${truncate(threadTitle, 50)}"`,
      html: createEmailTemplate(content)
    });
  },

  // 17. WEEKLY DIGEST
  async sendWeeklyDigest(to: string, username: string, stats: {
    newThreads: number;
    hotDiscussions: Array<{title: string; slug: string; replies: number}>;
    topContent: Array<{title: string; slug: string; author: string}>;
    yourEarnings: number;
    yourRank: number;
  }): Promise<void> {
    const safeUsername = escapeHtml(username);
    
    const hotDiscussionsHtml = stats.hotDiscussions.map(thread => `
      <li style="margin: 8px 0;">
        <a href="${process.env.BASE_URL}/threads/${thread.slug}" style="color: #2563eb; text-decoration: none; font-weight: bold;">
          ${escapeHtml(thread.title)}
        </a>
        <span style="color: #6b7280; font-size: 14px;"> (${thread.replies} replies)</span>
      </li>
    `).join('');
    
    const topContentHtml = stats.topContent.map(content => `
      <li style="margin: 8px 0;">
        <a href="${process.env.BASE_URL}/content/${content.slug}" style="color: #2563eb; text-decoration: none; font-weight: bold;">
          ${escapeHtml(content.title)}
        </a>
        <span style="color: #6b7280; font-size: 14px;"> by ${escapeHtml(content.author)}</span>
      </li>
    `).join('');
    
    const content = `
      <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px;">📊 Your Weekly YoForex Digest</h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
        Hi <strong>${safeUsername}</strong>, here's what happened this week on YoForex:
      </p>
      
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">📈 Platform Activity</h3>
        <p style="color: #4b5563; margin: 0;"><strong>${stats.newThreads}</strong> new threads this week</p>
      </div>
      
      ${stats.hotDiscussions.length > 0 ? `
        <div style="margin: 16px 0;">
          <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">🔥 Hot Discussions</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">${hotDiscussionsHtml}</ul>
        </div>
      ` : ''}
      
      ${stats.topContent.length > 0 ? `
        <div style="margin: 16px 0;">
          <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">⭐ Top Content</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563;">${topContentHtml}</ul>
        </div>
      ` : ''}
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 18px;">💰 Your Stats</h3>
        <p style="color: #92400e; margin: 0 0 8px 0;"><strong>Coins Earned:</strong> ${stats.yourEarnings}</p>
        <p style="color: #92400e; margin: 0;"><strong>Leaderboard Rank:</strong> #${stats.yourRank}</p>
      </div>
      
      <a href="${process.env.BASE_URL}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 8px;">Visit YoForex</a>
    `;
    
    await transporter.sendMail({
      from: `"${process.env.BREVO_FROM_NAME || 'YoForex'}" <${process.env.BREVO_FROM_EMAIL}>`,
      to,
      subject: `Your Weekly YoForex Digest - ${stats.newThreads} new threads`,
      html: createEmailTemplate(content)
    });
  }
};
