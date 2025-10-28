/**
 * Response Interpreter - Routes Sunny's structured responses to correct UI actions
 * This is the "control plane" of the Learning OS
 */

import { SunnyControlResponse } from './sunny-ai';
import { Intent, IntentType, INTENT_TO_APP_MAP } from './nlu/IntentParser';

/**
 * Routing decision based on Sunny's response
 */
export interface RoutingDecision {
  shouldNavigate: boolean;
  destination?: string;       // Route to navigate to
  params?: Record<string, any>;
  message: string;            // Message to show before/after navigation
  appName?: string;           // Name of app being launched
  delay?: number;             // Delay before navigation (ms)
}

/**
 * Interpret Sunny's structured response and determine routing
 */
export function interpretResponse(response: SunnyControlResponse): RoutingDecision {
  // If action says to open an app, navigate
  if (response.action?.type === 'OPEN_APP' && response.action.route) {
    return {
      shouldNavigate: true,
      destination: response.action.route,
      params: response.action.params || {},
      message: response.message,
      appName: response.action.app,
      delay: 1000 // Give user 1 second to read message
    };
  }

  // If action says to launch game
  if (response.action?.type === 'LAUNCH_GAME') {
    return {
      shouldNavigate: true,
      destination: '/games',
      params: response.action.params || {},
      message: response.message,
      appName: 'GAMES',
      delay: 1000
    };
  }

  // If action says to start focus session
  if (response.action?.type === 'START_SESSION') {
    return {
      shouldNavigate: true,
      destination: '/focus',
      params: response.action.params || {},
      message: response.message,
      appName: 'FOCUS_SESSION',
      delay: 1000
    };
  }

  // If action says to show progress
  if (response.action?.type === 'UPDATE_PROGRESS') {
    return {
      shouldNavigate: true,
      destination: '/progress',
      params: {},
      message: response.message,
      appName: 'DASHBOARD',
      delay: 1000
    };
  }

  // Default: stay in chat
  return {
    shouldNavigate: false,
    message: response.message
  };
}

/**
 * Interpret intent object (from IntentParser) and determine routing
 */
export function interpretIntent(intent: Intent): RoutingDecision {
  // If intent has app routing info
  if (intent.app && intent.app.shouldNavigate) {
    return {
      shouldNavigate: true,
      destination: intent.app.route,
      params: {
        topic: intent.entities.topic,
        difficulty: intent.entities.difficulty,
        ...intent.entities
      },
      message: `Let's go! Opening ${intent.app.name}...`,
      appName: intent.app.name,
      delay: 500
    };
  }

  // Emotional intents don't navigate
  const emotionalIntents = [
    IntentType.feeling_sad,
    IntentType.feeling_frustrated,
    IntentType.feeling_bored,
    IntentType.celebrate
  ];

  if (emotionalIntents.includes(intent.type)) {
    return {
      shouldNavigate: false,
      message: getEmotionalResponse(intent)
    };
  }

  // Default: stay in chat
  return {
    shouldNavigate: false,
    message: `I understand you want to ${intent.type}. Let's work on that together!`
  };
}

/**
 * Get appropriate emotional response
 */
function getEmotionalResponse(intent: Intent): string {
  switch (intent.type) {
    case IntentType.feeling_sad:
      return "I'm sorry you're feeling sad 😔. It's okay to feel this way sometimes. Would you like to talk about it or maybe do something fun to cheer you up?";
    case IntentType.feeling_frustrated:
      return "I can see you're frustrated 😤. Learning can be challenging sometimes! Let's take a break or try something easier. You're doing great!";
    case IntentType.feeling_bored:
      return "Feeling bored? 🤔 Let's find something exciting to do! How about a game, a fun story, or learning something new you're interested in?";
    case IntentType.celebrate:
      return "Woohoo! 🎉🎊 That's amazing! I'm so proud of you! You're doing such a great job learning. Want to keep going or try something new?";
    default:
      return "I'm here to help! What would you like to do?";
  }
}

/**
 * Combine intent and structured response for best routing decision
 */
export function interpretCombined(
  intent: Intent | null,
  structuredResponse?: SunnyControlResponse
): RoutingDecision {
  // Prefer structured response if available (more intelligent)
  if (structuredResponse && structuredResponse.action) {
    return interpretResponse(structuredResponse);
  }

  // Fall back to intent-based routing
  if (intent) {
    return interpretIntent(intent);
  }

  // Ultimate fallback
  return {
    shouldNavigate: false,
    message: "I'm here to help! What would you like to learn about today?"
  };
}

/**
 * Check if intent should trigger app launch
 */
export function shouldLaunchApp(intent: IntentType): boolean {
  return Boolean(INTENT_TO_APP_MAP[intent]);
}

/**
 * Get app info for an intent
 */
export function getAppForIntent(intent: IntentType): { name: string; route: string } | null {
  return INTENT_TO_APP_MAP[intent] || null;
}
