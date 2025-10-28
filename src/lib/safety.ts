const blockedPatterns = [
  /suicide/i,
  /self[-\s]?harm/i,
  /kill myself/i,
  /sex(ual)?/i,
  /inappropriate/i,
];

export interface SafetyCheckResult {
  safe: boolean;
  replacementMessage?: string;
}

export function checkSafety(message: string): SafetyCheckResult {
  if (!message) {
    return { safe: true };
  }

  for (const pattern of blockedPatterns) {
    if (pattern.test(message)) {
      return {
        safe: false,
        replacementMessage:
          "Let's stay on learning topics. Want to try space, dinosaurs, or fractions instead?",
      };
    }
  }

  return { safe: true };
}
