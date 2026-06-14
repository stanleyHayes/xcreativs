import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

// The portal owns authentication (login, SSO, the whole /portal tree). Auth is a
// Bearer token in localStorage, which is origin-scoped — so login must happen on
// the portal origin. This marketing route just forwards visitors there, keeping
// any old /login links and bookmarks working. Configure the portal origin via
// NEXT_PUBLIC_PORTAL_URL (e.g. https://portal.xcreativs.com); falls back to the
// dev portal on :3002.
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:3002";

export default async function LoginRedirect() {
  const locale = await getLocale();
  const prefix = locale === "en" ? "" : `/${locale}`;
  redirect(`${PORTAL_URL}${prefix}/login`);
}
