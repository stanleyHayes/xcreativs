import { getRequestConfig } from "next-intl/server";
import { Locale, defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = ((await requestLocale) ?? defaultLocale) as Locale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
