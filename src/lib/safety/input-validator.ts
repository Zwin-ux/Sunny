/**
 * Input Validation - Safety checks for user messages
 * Protects children and ensures age-appropriate interactions
 */

import { getOpenAIClient } from '../sunny-ai';

/**
 * Validation result
 */
export interface ValidationResult {
  safe: boolean;
  flags: string[];
  sanitized: string;
  concerns?: string[];
}

/**
 * Personal information patterns (COPPA compliance)
 */
const PERSONAL_INFO_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  address: /\b\d{1,5}\s+([A-Z][a-z]*\s+){1,3}(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir)\b/gi,
  zipCode: /\b\d{5}(?:-\d{4})?\b/g
};

/**
 * Inappropriate content keywords (age-inappropriate for 6-10)
 */
const INAPPROPRIATE_KEYWORDS = [
  // Violence
  'kill', 'murder', 'blood', 'gun', 'weapon', 'bomb', 'shoot',
  // Adult content (basic filters)
  'sex', 'porn', 'xxx',
  // Drugs
  'drug', 'cocaine', 'heroin', 'marijuana',
  // Self-harm
  'suicide', 'self-harm', 'hurt myself', 'end my life',
  // Hate speech
  'hate', 'racist', 'nazi'
];

/**
 * Detect personal information in user input
 */
function detectPersonalInfo(message: string): string[] {
  const flags: string[] = [];

  for (const [type, pattern] of Object.entries(PERSONAL_INFO_PATTERNS)) {
    if (pattern.test(message)) {
      flags.push(`personal_info_${type}`);
    }
  }

  return flags;
}

/**
 * Detect inappropriate content
 */
function detectInappropriateContent(message: string): string[] {
  const flags: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      flags.push(`inappropriate_${keyword}`);
    }
  }

  return flags;
}

/**
 * Sanitize message (remove/replace problematic content)
 */
function sanitizeMessage(message: string): string {
  let sanitized = message;

  // Remove email addresses
  sanitized = sanitized.replace(PERSONAL_INFO_PATTERNS.email, '[EMAIL REMOVED]');

  // Remove phone numbers
  sanitized = sanitized.replace(PERSONAL_INFO_PATTERNS.phone, '[PHONE REMOVED]');

  // Remove SSN
  sanitized = sanitized.replace(PERSONAL_INFO_PATTERNS.ssn, '[SSN REMOVED]');

  // Remove credit card numbers
  sanitized = sanitized.replace(PERSONAL_INFO_PATTERNS.creditCard, '[CARD REMOVED]');

  // Remove full addresses
  sanitized = sanitized.replace(PERSONAL_INFO_PATTERNS.address, '[ADDRESS REMOVED]');

  // Remove zip codes
  sanitized = sanitized.replace(PERSONAL_INFO_PATTERNS.zipCode, '[ZIP REMOVED]');

  return sanitized;
}

/**
 * Use OpenAI Moderation API for advanced safety checks
 */
async function moderateWithOpenAI(message: string): Promise<{
  flagged: boolean;
  categories: string[];
}> {
  try {
    const client = getOpenAIClient();
    const moderation = await client.moderations.create({
      input: message
    });

    const result = moderation.results[0];
    const categories: string[] = [];

    if (result.flagged) {
      // Collect flagged categories
      for (const [category, flagged] of Object.entries(result.categories)) {
        if (flagged) {
          categories.push(category);
        }
      }
    }

    return {
      flagged: result.flagged,
      categories
    };
  } catch (error) {
    console.error('Error calling OpenAI moderation API:', error);
    // If moderation fails, be cautious and flag suspicious content
    return {
      flagged: false,
      categories: []
    };
  }
}

/**
 * Main validation function - checks user input for safety
 */
export async function validateUserInput(message: string): Promise<ValidationResult> {
  const flags: string[] = [];

  // 1. Check for personal information
  const personalInfoFlags = detectPersonalInfo(message);
  flags.push(...personalInfoFlags);

  // 2. Check for inappropriate content
  const inappropriateFlags = detectInappropriateContent(message);
  flags.push(...inappropriateFlags);

  // 3. Use OpenAI moderation API
  const moderation = await moderateWithOpenAI(message);
  if (moderation.flagged) {
    flags.push(...moderation.categories.map(cat => `openai_${cat}`));
  }

  // 4. Sanitize the message
  const sanitized = sanitizeMessage(message);

  // Determine if safe
  const safe = flags.length === 0 && !moderation.flagged;

  return {
    safe,
    flags,
    sanitized,
    concerns: flags.length > 0 ? ['Content flagged for review'] : undefined
  };
}

/**
 * Get user-friendly message when input is blocked
 */
export function getBlockedInputMessage(flags: string[]): string {
  // Check what type of content was flagged
  const hasPersonalInfo = flags.some(f => f.startsWith('personal_info'));
  const hasInappropriate = flags.some(f => f.startsWith('inappropriate') || f.startsWith('openai'));

  if (hasPersonalInfo) {
    return "Oops! 🛡️ Remember, I don't need your personal information like email, phone number, or address. Let's keep our conversations safe and fun!";
  }

  if (hasInappropriate) {
    return "Hmm, that doesn't seem quite right for our learning time. 🤔 Let's try asking something else! I'm here to help you learn and have fun!";
  }

  return "Let's try asking that in a different way! I'm here to help you learn. 😊";
}

/**
 * Log safety incident (for parental/teacher dashboards)
 */
export async function logSafetyIncident(
  userId: string,
  message: string,
  flags: string[],
  timestamp: Date = new Date()
): Promise<void> {
  // TODO: Log to Supabase safety_incidents table
  console.warn('Safety incident logged:', {
    userId,
    messageLength: message.length,
    flags,
    timestamp: timestamp.toISOString()
  });

  // Future: Store in database for parental dashboard
  // const supabase = getAdminClient();
  // await supabase.from('safety_incidents').insert({
  //   user_id: userId,
  //   message_preview: message.substring(0, 50),
  //   flags: flags,
  //   timestamp: timestamp.toISOString(),
  //   severity: determineSeverity(flags)
  // });
}

/**
 * Check if message is likely prompt injection attempt
 */
export function detectPromptInjection(message: string): boolean {
  const injectionPatterns = [
    /ignore (previous|above|all) instructions/i,
    /you are now/i,
    /new instructions:/i,
    /system prompt/i,
    /override/i,
    /disregard/i,
    /pretend (you are|to be)/i,
    /roleplay as/i
  ];

  return injectionPatterns.some(pattern => pattern.test(message));
}
