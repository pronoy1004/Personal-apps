export { auth as middleware } from "@/auth";

export const config = {
  // Protect everything except: the auth API, Next internals, static assets,
  // the public portfolio (/me) and the CV/asset files it links to.
  matcher: [
    "/((?!api/auth|me|_next/static|_next/image|favicon.ico|manifest.json|logo.svg|icon-192.png|icon-512.png|.*\\.pdf$).*)",
  ],
};
