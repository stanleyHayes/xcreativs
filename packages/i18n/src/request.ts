import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "./config";
import en from "../messages/en.json";
import fr from "../messages/fr.json";

// Static imports (not a dynamic `import(...)`) so the messages resolve from
// within this package after the monorepo split.
const messages = { en, fr };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = (await requestLocale) as Locale | undefined;
  const locale: Locale =
    requested && (locales as readonly string[]).includes(requested) ? requested : defaultLocale;
  return { locale, messages: messages[locale] };
});
