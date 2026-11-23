import { NextResponse } from 'next/server';

// Lightweight health endpoint for K8s probes + ALB target health check.
// Route handler returns immediately and never touches Vendure/Hygraph, so it
// stays fast even when upstreams are slow. `force-dynamic` keeps it from being
// prerendered/cached so probes always get a fresh 200.
// Repoint liveness/readiness/startup probes and the ALB healthcheck-path here
// instead of `/`, which runs a full SSR render and adds unwanted Vendure load.
export const dynamic = 'force-dynamic';

export function GET() {
  return new NextResponse('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  });
}
