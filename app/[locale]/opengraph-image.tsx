import { ImageResponse } from "next/og";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return [{ id: locale, alt: locale === "fr" ? "Cartographie RSN" : "RSN Cartography" }];
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "meta" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #1a365d 0%, #2b6cb0 60%, #3182ce 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px 100px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 100,
            fontSize: 28,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.7)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          RSN · {locale === "fr" ? "Réseau en santé numérique" : "Digital Health Network"}
        </div>

        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            marginBottom: 32,
            marginTop: 80,
          }}
        >
          {t("siteTitle")}
        </div>

        <div
          style={{
            fontSize: 36,
            color: "rgba(255, 255, 255, 0.92)",
            lineHeight: 1.35,
            maxWidth: 980,
            fontWeight: 400,
          }}
        >
          {t("siteDescription")}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 100,
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.6)",
            fontWeight: 500,
          }}
        >
          cartographie.rsn.quebec
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
