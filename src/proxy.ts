import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login"];

// Rotas que têm autenticação própria (segredo de cron, assinatura de
// webhook) em vez de cookie de sessão — sempre passam direto pelo proxy, a
// própria rota decide se aceita a chamada ou não.
const SELF_AUTHENTICATED_PREFIXES = ["/api/cron/", "/api/webhooks/", "/api/debug-mercadopago"];

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("session")?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (SELF_AUTHENTICATED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const authenticated = await isAuthenticated(req);

  if (!isPublicRoute && !authenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isPublicRoute && authenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
