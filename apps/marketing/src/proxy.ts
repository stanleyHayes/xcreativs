import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@xc/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  // Don't auto-redirect based on the browser's Accept-Language. The site
  // defaults to English; visitors opt into French via the language selector,
  // which navigates to the /fr URL prefix (that's what renders French under
  // as-needed) and sets the NEXT_LOCALE cookie to persist the choice. Keeps
  // URLs predictable and stops French-locale browsers being forced to /fr.
  localeDetection: false,
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*|offline|manifest\\.json|sw\\.js).*)"],
};
