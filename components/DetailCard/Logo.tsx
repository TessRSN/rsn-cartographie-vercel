export function Logo({
  imageSrc,
  alt,
}: {
  imageSrc?: string | null;
  alt: string;
}) {
  if (!imageSrc) return null;
  return (
    <figure className="flex items-center justify-center w-full py-1">
      <div className="flex items-center justify-center h-20 w-full rounded-lg overflow-hidden dark:bg-white dark:p-2">
        <img
          src={imageSrc}
          alt={alt}
          className="max-h-16 max-w-full w-auto object-contain"
        />
      </div>
    </figure>
  );
}
