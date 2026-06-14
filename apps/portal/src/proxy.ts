import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@xc/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  // Default to English; opt into French via the selector (NEXT_LOCALE cookie).
  // No Accept-Language auto-redirect — keeps portal URLs predictable.
  localeDetection: false,
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*|offline|manifest\\.json|sw\\.js).*)"],
};
