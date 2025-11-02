/**
 * Health Check Endpoint
 * 
 * Returns system status for monitoring
 */

import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAIService } from '@/lib/ai-service';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'ok',
      database: 'checking',
      ai: 'checking',
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check database
  try {
    const supabase = getAdminClient();
    if (supabase) {
      const { error } = await supabase.from('users').select('id').limit(1);
      health.services.database = error ? 'error' : 'ok';
    } else {
      health.services.database = 'unavailable';
    }
  } catch (error) {
    health.services.database = 'error';
  }

  // Check AI service
  try {
    const aiService = getAIService();
    health.services.ai = aiService.isAvailable() ? 'ok' : 'demo_mode';
  } catch (error) {
    health.services.ai = 'error';
  }

  // Determine overall status
  const allOk = Object.values(health.services).every(s => s === 'ok' || s === 'demo_mode');
  health.status = allOk ? 'healthy' : 'degraded';

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
