export function getConfiguredSketchupSessionId() {
  const sessionId = String(process.env.SKETCHUP_SESSION_ID || '').trim();
  if (!sessionId) throw new Error('SKETCHUP_SESSION_NOT_CONFIGURED');
  return sessionId;
}

export function sketchupSessionConfigured() {
  return Boolean(String(process.env.SKETCHUP_SESSION_ID || '').trim());
}
