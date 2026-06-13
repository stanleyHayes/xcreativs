import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@xc/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*|offline|manifest\\.json|sw\\.js).*)"],
};
