import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redisConfigured } from '../lib/redis.js';
import { sketchupSessionConfigured } from '../lib/config/sketchupSession.js';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: 'sketchup-agent',
    version: '0.3.0',
    bridge_storage: redisConfigured() ? 'configured' : 'not_configured',
    sketchup_session: sketchupSessionConfigured() ? 'configured' : 'not_configured'
  });
}
