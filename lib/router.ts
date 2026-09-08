export type RouteName = 'health' | 'discover' | 'execute';

export function route(pathname: string, method: string): RouteName | null {
  if (pathname === '/api/health' && method === 'GET') return 'health';
  if (pathname === '/api/discover' && method === 'POST') return 'discover';
  if (pathname === '/api/action' && method === 'POST') return 'execute';
  return null;
}
