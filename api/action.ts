import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  return res.status(501).json({
    ok: false,
    status: 'executor_not_connected',
    message: 'Batch execution endpoint is reserved for the SketchUp plugin bridge.'
  });
}
