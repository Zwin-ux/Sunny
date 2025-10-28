/**
 * Action Validation - Safety checks for Sunny's actions
 * Ensures that apps and activities launched are appropriate
 */

import { SunnyAction } from '../sunny-ai';

/**
 * Action validation result
 */
export interface ActionValidationResult {
  safe: boolean;
  concerns: string[];
  blockedReason?: string;
}

/**
 * Blocklist of dangerous or inappropriate terms
 */
const DANGEROUS_TERMS = [
  // Violence/weapons
  'hack', 'bomb', 'weapon', 'gun', 'knife', 'kill', 'murder', 'attack',
  // Inappropriate
  'sex', 'porn', 'adult', 'xxx',
  // Dangerous activities
  'hurt', 'harm', 'damage', 'destroy', 'break into',
  // Illegal
  'steal', 'rob', 'cheat', 'lie to parents', 'skip school',
  // Self-harm
  'hurt myself', 'self-harm', 'suicide',
  // Bypassing safety
  'disable safety', 'turn off filter', 'bypass', 'override'
];

/**
 * Allowed app names
 */
const ALLOWED_APPS = [
  'GAMES',
  'STORY_BUILDER',
  'FOCUS_SESSION',
  'ROBOT_BUILDER',
  'ART_STUDIO',
  'CREATOR_LAB',
  'DASHBOARD',
  'QUIZ_LAB',
  'CHAT'
];

/**
 * Allowed routes
 */
const ALLOWED_ROUTES = [
  '/chat',
  '/games',
  '/stories',
  '/focus',
  '/builder',
  '/art',
  '/create',
  '/progress',
  '/quiz',
  '/dashboard'
];

/**
 * Check if action params contain dangerous content
 */
function checkParams(params: Record<string, any>): {
  safe: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];
  const paramsString = JSON.stringify(params).toLowerCase();

  for (const term of DANGEROUS_TERMS) {
    if (paramsString.includes(term)) {
      concerns.push(`dangerous_term: ${term}`);
    }
  }

  return {
    safe: concerns.length === 0,
    concerns
  };
}

/**
 * Check if app name is allowed
 */
function checkAppName(appName: string | undefined): {
  safe: boolean;
  concern?: string;
} {
  if (!appName) {
    return { safe: true }; // No app specified is okay
  }

  if (!ALLOWED_APPS.includes(appName)) {
    return {
      safe: false,
      concern: `unknown_app: ${appName}`
    };
  }

  return { safe: true };
}

/**
 * Check if route is allowed
 */
function checkRoute(route: string | undefined): {
  safe: boolean;
  concern?: string;
} {
  if (!route) {
    return { safe: true }; // No route specified is okay
  }

  if (!ALLOWED_ROUTES.includes(route)) {
    return {
      safe: false,
      concern: `unknown_route: ${route}`
    };
  }

  return { safe: true };
}

/**
 * Check if action type is appropriate for the age group
 */
function checkActionType(action: SunnyAction): {
  safe: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];

  // All action types are safe for now
  // Future: Could add age restrictions on certain action types

  // Example age restriction logic:
  // if (action.type === 'ADVANCED_CODING' && userAge < 8) {
  //   concerns.push('action_type_too_advanced');
  // }

  return {
    safe: concerns.length === 0,
    concerns
  };
}

/**
 * Validate game parameters for safety
 */
function validateGameParams(params: Record<string, any>): {
  safe: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];

  // Check difficulty level is appropriate
  const validDifficulties = ['beginner', 'easy', 'medium', 'hard', 'advanced', 'expert'];
  if (params.difficulty && !validDifficulties.includes(params.difficulty)) {
    concerns.push('invalid_difficulty');
  }

  // Check game type is valid
  const validGameTypes = [
    'pattern-recognition',
    'math-challenge',
    'memory-match',
    'word-builder',
    'science-experiment',
    'creative-challenge'
  ];
  if (params.gameType && !validGameTypes.includes(params.gameType)) {
    concerns.push('invalid_game_type');
  }

  // Check for dangerous content in game params
  const paramCheck = checkParams(params);
  concerns.push(...paramCheck.concerns);

  return {
    safe: concerns.length === 0,
    concerns
  };
}

/**
 * Validate story parameters for safety
 */
function validateStoryParams(params: Record<string, any>): {
  safe: boolean;
  concerns: string[];
} {
  const concerns: string[] = [];

  // Check story theme for appropriateness
  if (params.theme) {
    const themeCheck = checkParams({ theme: params.theme });
    if (!themeCheck.safe) {
      concerns.push('inappropriate_story_theme');
    }
  }

  // Check protagonist name (should not be inappropriate)
  if (params.protagonist) {
    const protagonistCheck = checkParams({ protagonist: params.protagonist });
    if (!protagonistCheck.safe) {
      concerns.push('inappropriate_protagonist');
    }
  }

  return {
    safe: concerns.length === 0,
    concerns
  };
}

/**
 * Main action validation function
 */
export function validateAction(action: SunnyAction): ActionValidationResult {
  const concerns: string[] = [];

  // 1. Check app name
  const appCheck = checkAppName(action.app);
  if (!appCheck.safe && appCheck.concern) {
    concerns.push(appCheck.concern);
    return {
      safe: false,
      concerns,
      blockedReason: `App "${action.app}" is not allowed`
    };
  }

  // 2. Check route
  const routeCheck = checkRoute(action.route);
  if (!routeCheck.safe && routeCheck.concern) {
    concerns.push(routeCheck.concern);
    return {
      safe: false,
      concerns,
      blockedReason: `Route "${action.route}" is not allowed`
    };
  }

  // 3. Check action type
  const actionTypeCheck = checkActionType(action);
  concerns.push(...actionTypeCheck.concerns);

  // 4. Check params for dangerous content
  if (action.params) {
    const paramsCheck = checkParams(action.params);
    concerns.push(...paramsCheck.concerns);

    if (!paramsCheck.safe) {
      return {
        safe: false,
        concerns,
        blockedReason: 'Action parameters contain inappropriate content'
      };
    }

    // Specific validation for games
    if (action.app === 'GAMES') {
      const gameCheck = validateGameParams(action.params);
      concerns.push(...gameCheck.concerns);
      if (!gameCheck.safe) {
        return {
          safe: false,
          concerns,
          blockedReason: 'Game parameters are not appropriate'
        };
      }
    }

    // Specific validation for stories
    if (action.app === 'STORY_BUILDER') {
      const storyCheck = validateStoryParams(action.params);
      concerns.push(...storyCheck.concerns);
      if (!storyCheck.safe) {
        return {
          safe: false,
          concerns,
          blockedReason: 'Story parameters are not appropriate'
        };
      }
    }
  }

  return {
    safe: concerns.length === 0,
    concerns
  };
}

/**
 * Get user-friendly message when action is blocked
 */
export function getBlockedActionMessage(action: SunnyAction, reason?: string): string {
  return `Hmm, I can't do that right now. 🤔 Let's try something else fun! How about a game or a story?`;
}

/**
 * Log blocked action for security monitoring
 */
export async function logBlockedAction(
  userId: string,
  action: SunnyAction,
  concerns: string[],
  timestamp: Date = new Date()
): Promise<void> {
  console.warn('Blocked action logged:', {
    userId,
    actionType: action.type,
    app: action.app,
    concerns,
    timestamp: timestamp.toISOString()
  });

  // TODO: Log to Supabase for security monitoring
  // const supabase = getAdminClient();
  // await supabase.from('blocked_actions').insert({
  //   user_id: userId,
  //   action_type: action.type,
  //   action_app: action.app,
  //   concerns: concerns,
  //   timestamp: timestamp.toISOString()
  // });
}

/**
 * Sanitize action params (remove dangerous content)
 */
export function sanitizeActionParams(params: Record<string, any>): Record<string, any> {
  const sanitized = { ...params };

  // Remove keys with dangerous terms
  for (const key of Object.keys(sanitized)) {
    const value = String(sanitized[key]).toLowerCase();
    for (const term of DANGEROUS_TERMS) {
      if (value.includes(term)) {
        delete sanitized[key];
        break;
      }
    }
  }

  return sanitized;
}
