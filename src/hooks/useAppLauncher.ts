/**
 * App Launcher Hook - Navigate between Learning OS apps
 * This enables Sunny to launch different apps from chat
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { INTENT_TO_APP_MAP } from '@/lib/nlu/IntentParser';

/**
 * App launcher hook for Learning OS navigation
 */
export function useAppLauncher() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Launch an app with optional parameters
   */
  const launchApp = useCallback((
    app: string,
    params?: Record<string, any>
  ) => {
    console.log(`🚀 Launching app: ${app}`, params);

    // Find route for this app
    const appEntry = Object.entries(INTENT_TO_APP_MAP).find(
      ([_, mapping]) => mapping.name === app
    );

    if (!appEntry) {
      console.error(`Unknown app: ${app}`);
      return false;
    }

    const route = appEntry[1].route;

    // Build URL with params
    const url = new URL(route, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    // Navigate
    router.push(url.pathname + url.search);
    return true;
  }, [router]);

  /**
   * Launch app by route directly
   */
  const navigateToRoute = useCallback((
    route: string,
    params?: Record<string, any>
  ) => {
    console.log(`🚀 Navigating to: ${route}`, params);

    const url = new URL(route, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }

    router.push(url.pathname + url.search);
  }, [router]);

  /**
   * Return to chat
   */
  const returnToChat = useCallback(() => {
    console.log('🚀 Returning to chat');
    router.push('/chat');
  }, [router]);

  /**
   * Get current params from URL
   */
  const getCurrentParams = useCallback(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  /**
   * Launch with delay (gives user time to read message)
   */
  const launchAppWithDelay = useCallback((
    app: string,
    params?: Record<string, any>,
    delayMs: number = 1000
  ) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const result = launchApp(app, params);
        resolve(result);
      }, delayMs);
    });
  }, [launchApp]);

  return {
    launchApp,
    navigateToRoute,
    returnToChat,
    getCurrentParams,
    launchAppWithDelay
  };
}
