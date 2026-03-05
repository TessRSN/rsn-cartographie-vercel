/**
 * Layout for /entite/* pages.
 * Overrides the root layout's overflow-hidden to allow scrolling.
 */
export default function EntiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="h-full overflow-y-auto">{children}</div>
}
