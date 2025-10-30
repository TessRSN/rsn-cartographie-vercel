export function Logo({
  imageSrc,
  alt,
}: {
  imageSrc?: string | null;
  alt: string;
}) {
  return (
    <figure>
      {imageSrc ? (
        <img src={imageSrc} alt={alt} width={200} height={200} />
      ) : (
        <div className="w-96  flex items-center justify-center"></div>
      )}
    </figure>
  );
}
