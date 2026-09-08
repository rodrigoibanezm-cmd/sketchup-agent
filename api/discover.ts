import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  return res.status(501).json({
    ok: false,
    status: 'discovery_not_implemented',
    message: 'Discovery endpoint is reserved for intake -> structured schema resolution.'
  });
}
