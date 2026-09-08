import type { VercelRequest, VercelResponse } from '@vercel/node';
import { redisConfigured } from '../lib/redis.js';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: 'sketchup-agent',
    version: '0.1.0',
    bridge_storage: redisConfigured() ? 'configured' : 'not_configured'
  });
}
