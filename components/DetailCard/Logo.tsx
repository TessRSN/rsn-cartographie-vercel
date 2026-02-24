export function Logo({
  imageSrc,
  alt,
}: {
  imageSrc?: string | null;
  alt: string;
}) {
  if (!imageSrc) return null;
  return (
    <div style={{
      backgroundColor: "#f1f5f9",
      borderRadius: "8px",
      padding: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    }}>
      <img
        src={imageSrc}
        alt={alt}
        onError={(e) => {
          // Cache le conteneur entier si l'image ne charge pas
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent) parent.style.display = "none";
        }}
        style={{
          maxHeight: "80px",
          maxWidth: "100%",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}
