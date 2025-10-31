export function Logo({
  imageSrc,
  alt,
}: {
  imageSrc?: string | null;
  alt: string;
}) {
  return (
    <figure className="avatar">
      {imageSrc ? (
        <img src={imageSrc} alt={alt} className="bg-base-content rounded" />
      ) : (
        <div className="w-96  flex items-center justify-center"></div>
      )}
    </figure>
  );
}
