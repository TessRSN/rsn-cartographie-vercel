import Link from "next/link"
import { useTranslations } from "next-intl"

export default function NotFound() {
  const t = useTranslations("entityPage")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <h1 className="text-4xl font-bold">{t("notFoundTitle")}</h1>
      <p className="text-lg text-base-content/70">{t("notFoundDescription")}</p>
      <Link href="/" className="btn btn-primary">
        {t("backToMap")}
      </Link>
    </div>
  )
}
