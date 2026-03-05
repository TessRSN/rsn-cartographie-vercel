import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg text-base-content/70">
        Cette entité n&apos;existe pas ou n&apos;est pas encore approuvée.
      </p>
      <Link href="/" className="btn btn-primary">
        Retour à la cartographie
      </Link>
    </div>
  )
}
