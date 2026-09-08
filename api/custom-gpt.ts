import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listCustomGptActions, runCustomGptAction } from '../lib/custom-gpt-router.js';

const ROUTER_VERSION = '0.2.0';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, router_version: ROUTER_VERSION, error: 'POST required' });
  }

  const action = req.body?.action;
  if (typeof action !== 'string' || !action) {
    return res.status(400).json({
      ok: false,
      router_version: ROUTER_VERSION,
      error: 'action is required',
      allowedActions: listCustomGptActions()
    });
  }

  const input = req.body?.input ?? {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return res.status(400).json({
      ok: false,
      router_version: ROUTER_VERSION,
      action,
      error: 'input must be an object'
    });
  }

  try {
    const result = await runCustomGptAction(action, input);
    return res.status(200).json({
      ok: true,
      router_version: ROUTER_VERSION,
      endpoint: 'custom-gpt',
      action,
      result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CUSTOM_GPT_REQUEST_FAILED';
    const clientErrors = new Set([
      'UNKNOWN_CUSTOM_GPT_ACTION',
      'COMMAND_REQUIRED',
      'UNSUPPORTED_COMMAND',
      'COMMAND_ID_REQUIRED',
      'SKETCHUP_SESSION_NOT_CONFIGURED',
      'COMMAND_RESULT_SESSION_MISMATCH'
    ]);
    return res.status(clientErrors.has(message) ? 400 : 500).json({
      ok: false,
      router_version: ROUTER_VERSION,
      endpoint: 'custom-gpt',
      action,
      error: message,
      allowedActions: listCustomGptActions()
    });
  }
}
