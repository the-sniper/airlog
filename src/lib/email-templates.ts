/**
 * Centralized Email Templates
 * 
 * This module provides consistent email styling and templates across the entire application.
 * All email HTML should use these utilities to ensure brand consistency.
 */

// ============================================================================
// BRAND COLORS & DESIGN SYSTEM
// ============================================================================

export const EmailColors = {
  // Primary brand color
  primary: '#0d9488',
  primaryDark: '#0f766e',
  primaryLight: '#14b8a6',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  
  // Background colors
  bgLight: '#f3f4f6',
  bgWhite: '#ffffff',
  
  // Border colors
  border: '#e5e7eb',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#3b82f6',
} as const;

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

export const EmailFonts = {
  family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  sizes: {
    h1: '24px',
    h2: '20px',
    body: '16px',
    small: '14px',
    tiny: '12px',
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.6',
  },
} as const;

// ============================================================================
// SPACING & LAYOUT
// ============================================================================

export const EmailSpacing = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
};

export const EmailLayout = {
  maxWidth: '600px',
  borderRadius: '8px',
  buttonRadius: '8px',
};

// ============================================================================
// REUSABLE STYLE STRINGS
// ============================================================================

const containerStyle = `
  font-family: ${EmailFonts.family};
  max-width: ${EmailLayout.maxWidth};
  margin: 0 auto;
  padding: ${EmailSpacing.lg};
  color: ${EmailColors.textSecondary};
`.trim();

const h1Style = `
  color: ${EmailColors.primary};
  font-size: ${EmailFonts.sizes.h1};
  font-weight: ${EmailFonts.weights.semibold};
  margin: 0 0 ${EmailSpacing.lg} 0;
  line-height: ${EmailFonts.lineHeights.tight};
`.trim();

const h2Style = `
  color: ${EmailColors.textPrimary};
  font-size: ${EmailFonts.sizes.h2};
  font-weight: ${EmailFonts.weights.semibold};
  margin: 0 0 ${EmailSpacing.md} 0;
  line-height: ${EmailFonts.lineHeights.normal};
`.trim();

const paragraphStyle = `
  color: ${EmailColors.textSecondary};
  font-size: ${EmailFonts.sizes.body};
  line-height: ${EmailFonts.lineHeights.relaxed};
  margin: 0 0 ${EmailSpacing.md} 0;
`.trim();

const smallTextStyle = `
  color: ${EmailColors.textMuted};
  font-size: ${EmailFonts.sizes.small};
  line-height: ${EmailFonts.lineHeights.relaxed};
`.trim();

const tinyTextStyle = `
  color: ${EmailColors.textLight};
  font-size: ${EmailFonts.sizes.tiny};
`.trim();

const buttonStyle = `
  display: inline-block;
  background-color: ${EmailColors.primary};
  color: white;
  padding: ${EmailSpacing.sm} ${EmailSpacing.lg};
  text-decoration: none;
  border-radius: ${EmailLayout.buttonRadius};
  font-weight: ${EmailFonts.weights.semibold};
  font-size: ${EmailFonts.sizes.body};
`.trim();

const buttonCenterStyle = `
  margin: ${EmailSpacing.xl} 0;
  text-align: center;
`.trim();

const dividerStyle = `
  border: none;
  border-top: 1px solid ${EmailColors.border};
  margin: ${EmailSpacing.xl} 0;
`.trim();

const footerStyle = `
  ${tinyTextStyle}
  margin-top: ${EmailSpacing.xl};
  padding-top: ${EmailSpacing.md};
  border-top: 1px solid ${EmailColors.border};
`.trim();

const codeBoxStyle = `
  background-color: ${EmailColors.bgLight};
  padding: ${EmailSpacing.md};
  border-radius: ${EmailLayout.borderRadius};
  margin: ${EmailSpacing.lg} 0;
  text-align: center;
`.trim();

const codeTextStyle = `
  margin: 0;
  color: ${EmailColors.textPrimary};
  font-size: 32px;
  font-weight: ${EmailFonts.weights.bold};
  letter-spacing: 2px;
  font-family: monospace;
`.trim();

const infoBoxStyle = `
  background-color: ${EmailColors.bgLight};
  padding: ${EmailSpacing.md};
  border-radius: ${EmailLayout.borderRadius};
  margin: ${EmailSpacing.lg} 0;
`.trim();

const linkStyle = `
  color: ${EmailColors.primary};
  text-decoration: none;
`.trim();

// ============================================================================
// BASE EMAIL WRAPPER
// ============================================================================

interface BaseEmailParams {
  heading: string;
  body: string;
  footer?: string;
}

export function createBaseEmail({ heading, body, footer }: BaseEmailParams): string {
  return `
    <div style="${containerStyle}">
      <h1 style="${h1Style}">${heading}</h1>
      ${body}
      ${footer ? `<div style="${footerStyle}"><p>${footer}</p></div>` : ''}
    </div>
  `;
}

// ============================================================================
// COMMON EMAIL COMPONENTS  
// ============================================================================

export function createButton(text: string, url: string): string {
  return `
    <div style="${buttonCenterStyle}">
      <a href="${url}" style="${buttonStyle}">${text}</a>
    </div>
  `;
}

export function createParagraph(text: string): string {
  return `<p style="${paragraphStyle}">${text}</p>`;
}

export function createHeading(text: string): string {
  return `<h2 style="${h2Style}">${text}</h2>`;
}

export function createDivider(): string {
  return `<hr style="${dividerStyle}" />`;
}

export function createCodeBox(code: string, label?: string): string {
  return `
    <div style="${codeBoxStyle}">
      ${label ? `<p style="margin: 0 0 ${EmailSpacing.xs} 0; color: ${EmailColors.textMuted}; font-size: ${EmailFonts.sizes.small};">${label}</p>` : ''}
      <p style="${codeTextStyle}">${code}</p>
    </div>
  `;
}

export function createInfoBox(content: string): string {
  return `
    <div style="${infoBoxStyle}">
      ${content}
    </div>
  `;
}

export function createLink(text: string, url: string): string {
  return `<a href="${url}" style="${linkStyle}">${text}</a>`;
}

export function createSmallText(text: string): string {
  return `<p style="${smallTextStyle}">${text}</p>`;
}

export function createTinyText(text: string): string {
  return `<p style="${tinyTextStyle}">${text}</p>`;
}

// ============================================================================
// PRE-BUILT EMAIL TEMPLATES
// ============================================================================

interface SessionInviteParams {
  firstName: string;
  sessionName?: string;
  joinCode: string;
  inviteUrl: string;
  baseUrl: string;
}

export function createSessionInviteEmail(params: SessionInviteParams): string {
  const body = `
    ${createParagraph(`Hi ${params.firstName},`)}
    ${createParagraph(
      `You've been invited to participate in a testing session${params.sessionName ? ` for <strong>${params.sessionName}</strong>` : ''}.`
    )}
    ${createCodeBox(params.joinCode, 'Session Join Code:')}
    ${createButton('Join Session', params.inviteUrl)}
    ${createSmallText(
      `Or go to ${createLink(`${params.baseUrl}/join`, `${params.baseUrl}/join`)} and enter the code above.`
    )}
    ${createDivider()}
    ${createTinyText('You will need to log in or create an account to join the session.')}
  `;

  return createBaseEmail({
    heading: 'AirLog Session Invitation',
    body,
  });
}

interface ReportReadyParams {
  firstName: string;
  sessionName: string;
  reportUrl: string;
}

export function createReportReadyEmail(params: ReportReadyParams): string {
  const body = `
    ${createParagraph(`Hi ${params.firstName},`)}
    ${createParagraph(
      `Thank you for participating in the testing session for <strong>${params.sessionName}</strong>. The session has been completed and the report is now available.`
    )}
    ${createButton('View Testing Report', params.reportUrl)}
    ${createSmallText(
      `Or copy and paste this link into your browser:<br/>${createLink(params.reportUrl, params.reportUrl)}`
    )}
    ${createDivider()}
    ${createTinyText('This report contains feedback and notes collected during the testing session.')}
  `;

  return createBaseEmail({
    heading: 'AirLog Testing Report',
    body,
  });
}

interface CompanyInviteParams {
  companyName: string;
  inviteUrl: string;
}

export function createCompanyInviteEmail(params: CompanyInviteParams): string {
  const body = `
    ${createParagraph(
      `You've been invited to join <strong>${params.companyName}</strong> on AirLog, a platform for collecting and managing product feedback.`
    )}
    ${createButton('Accept Invitation', params.inviteUrl)}
    ${createSmallText('Or copy and paste this link into your browser:')}
    ${createInfoBox(`<p style="margin: 0; word-break: break-all; font-size: ${EmailFonts.sizes.small}; color: ${EmailColors.textSecondary};">${params.inviteUrl}</p>`)}
    ${createDivider()}
    ${createTinyText('This invitation will expire in 7 days. If you didn\'t expect this invitation, you can ignore this email.')}
  `;

  return createBaseEmail({
    heading: `Join ${params.companyName} on AirLog`,
    body,
  });
}

interface JoinRequestApprovedParams {
  firstName: string;
  companyName: string;
  dashboardUrl: string;
}

export function createJoinRequestApprovedEmail(params: JoinRequestApprovedParams): string {
  const body = `
    ${createParagraph(`Hi ${params.firstName},`)}
    ${createParagraph(
      `Great news! Your request to join <strong>${params.companyName}</strong> on AirLog has been approved.`
    )}
    ${createParagraph('You now have full access to participate in testing sessions and collaborate with your team.')}
    ${createButton('Go to Dashboard', params.dashboardUrl)}
    ${createDivider()}
    ${createTinyText('Welcome to the team!')}
  `;

  return createBaseEmail({
    heading: '🎉 You\'re in!',
    body,
  });
}

interface JoinRequestRejectedParams {
  firstName: string;
  companyName: string;
  rejectionReason?: string;
}

export function createJoinRequestRejectedEmail(params: JoinRequestRejectedParams): string {
  const body = `
    ${createParagraph(`Hi ${params.firstName},`)}
    ${createParagraph(
      `We wanted to let you know that your request to join <strong>${params.companyName}</strong> on AirLog was not approved at this time.`
    )}
    ${params.rejectionReason ? createInfoBox(`<p style="margin: 0 0 ${EmailSpacing.xs} 0; color: ${EmailColors.textMuted}; font-size: ${EmailFonts.sizes.small};"><strong>Reason:</strong></p><p style="margin: 0; color: ${EmailColors.textSecondary}; font-size: ${EmailFonts.sizes.small};">${params.rejectionReason}</p>`) : ''}
    ${createParagraph('You can still use AirLog to participate in sessions when invited directly by other companies.')}
    ${createDivider()}
    ${createTinyText('If you believe this was a mistake, please contact the company directly.')}
  `;

  return createBaseEmail({
    heading: 'Request Update',
    body,
  });
}

interface SignupInviteParams {
  inviteType: 'session' | 'team';
  targetName: string;
  signupUrl: string;
}

export function createSignupInviteEmail(params: SignupInviteParams): string {
  const body = `
    ${createParagraph(
      `You've been invited to join ${params.inviteType === 'session' ? 'the testing session' : 'the team'}: <strong>${params.targetName}</strong>`
    )}
    ${createParagraph('To participate, please create an account:')}
    ${createButton('Create Account', params.signupUrl)}
    ${createSmallText(`Once you register with this email address, you'll automatically be added to ${params.targetName}.`)}
    ${createDivider()}
    ${createTinyText('This invitation expires in 7 days.')}
  `;

  return createBaseEmail({
    heading: 'You\'ve Been Invited!',
    body,
  });
}

interface AdminNotificationParams {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  dashboardUrl: string;
  timestamp: string;
}

export function createAdminNotificationEmail(params: AdminNotificationParams): string {
  const severityConfig = {
    critical: { color: EmailColors.error, label: 'CRITICAL' },
    warning: { color: EmailColors.warning, label: 'WARNING' },
    info: { color: EmailColors.info, label: 'INFO' },
  };

  const config = severityConfig[params.severity];

  const body = `
    <div style="margin-bottom: ${EmailSpacing.lg};">
      <span style="display: inline-block; padding: 4px 10px; background-color: ${config.color}15; color: ${config.color}; font-size: 11px; font-weight: ${EmailFonts.weights.semibold}; border-radius: 4px; letter-spacing: 0.5px;">
        ${config.label}
      </span>
    </div>
    ${createHeading(params.title)}
    ${createParagraph(params.message)}
    ${createButton('View Dashboard →', params.dashboardUrl)}
    ${createTinyText(`AirLog Admin · ${params.timestamp}`)}
  `;

  return `
    <div style="${containerStyle}">
      ${body}
    </div>
  `;
}

interface RolePromotionParams {
  firstName: string;
  companyName: string;
  newRole: 'owner' | 'admin';
  loginUrl: string;
  email: string;
}

export function createRolePromotionEmail(params: RolePromotionParams): string {
  const roleDisplay = params.newRole === 'owner' ? 'Owner' : 'Admin';
  const roleDescription = params.newRole === 'owner' 
    ? 'You now have full ownership privileges, including the ability to manage all company settings, users, and billing.'
    : 'You now have administrative privileges, allowing you to manage sessions, teams, and users within your company.';

  const body = `
    ${createParagraph(`Hi ${params.firstName},`)}
    ${createParagraph(
      `Great news! You have been upgraded to <strong>${roleDisplay}</strong> of <strong>${params.companyName}</strong> on AirLog.`
    )}
    ${createParagraph(roleDescription)}
    ${createInfoBox(`
      <p style="margin: 0 0 ${EmailSpacing.xs} 0; color: ${EmailColors.textMuted}; font-size: ${EmailFonts.sizes.small};"><strong>Your Login Details:</strong></p>
      <p style="margin: 0; color: ${EmailColors.textSecondary}; font-size: ${EmailFonts.sizes.small};">Email: <strong>${params.email}</strong></p>
    `)}
    ${createButton('Access Company Dashboard', params.loginUrl)}
    ${createDivider()}
    ${createTinyText('If you have any questions about your new role, please contact your company owner or support.')}
  `;

  return createBaseEmail({
    heading: `🎉 You're now ${params.newRole === 'owner' ? 'an' : 'a'} ${roleDisplay}!`,
    body,
    footer: 'airlog-pro.vercel.app',
  });
}

interface RoleDemotionParams {
  firstName: string;
  companyName: string;
  newRole: 'admin' | 'user';
  loginUrl: string;
  email: string;
}

export function createRoleDemotionEmail(params: RoleDemotionParams): string {
  const roleDisplay = params.newRole === 'admin' ? 'Admin' : 'User';
  const roleDescription = params.newRole === 'admin' 
    ? 'You now have administrative privileges, allowing you to manage sessions, teams, and users within your company.'
    : 'You are now a regular member of the company. You can participate in sessions and view projects you are assigned to.';

  const body = `
    ${createParagraph(`Hi ${params.firstName},`)}
    ${createParagraph(
      `Your role in <strong>${params.companyName}</strong> on AirLog has been updated to <strong>${roleDisplay}</strong>.`
    )}
    ${createParagraph(roleDescription)}
    ${createButton('Access Dashboard', params.loginUrl)}
    ${createDivider()}
    ${createTinyText('If you have any questions about this change, please contact your company owner or support.')}
  `;

  return createBaseEmail({
    heading: 'Role Update',
    body,
    footer: 'airlog-pro.vercel.app',
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export const EmailStyles = {
  container: containerStyle,
  h1: h1Style,
  h2: h2Style,
  paragraph: paragraphStyle,
  smallText: smallTextStyle,
  tinyText: tinyTextStyle,
  button: buttonStyle,
  buttonCenter: buttonCenterStyle,
  divider: dividerStyle,
  footer: footerStyle,
  codeBox: codeBoxStyle,
  codeText: codeTextStyle,
  infoBox: infoBoxStyle,
  link: linkStyle,
} as const;
