import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// NOTE: Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`, but
// proxy.ts forces Node.js runtime which @opennextjs/cloudflare does not support.
// Keep using middleware.ts (Edge runtime) until OpenNext adds proxy.ts support.
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
