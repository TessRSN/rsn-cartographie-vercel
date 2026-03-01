export function Logo({
  imageSrc,
  alt,
  variant = "logo",
}: {
  imageSrc?: string | null;
  alt: string;
  variant?: "logo" | "photo";
}) {
  if (!imageSrc) return null;
  const isPhoto = variant === "photo";
  return (
    <div style={{
      backgroundColor: isPhoto ? "transparent" : "#f1f5f9",
      borderRadius: "8px",
      padding: isPhoto ? "0" : "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: isPhoto ? "auto" : "100%",
      height: isPhoto ? "auto" : undefined,
      overflow: "hidden",
      flexShrink: 0,
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
          maxHeight: isPhoto ? "120px" : "80px",
          maxWidth: "100%",
          width: "auto",
          height: "auto",
          objectFit: isPhoto ? "cover" : "contain",
          borderRadius: isPhoto ? "8px" : undefined,
          display: "block",
        }}
      />
    </div>
  );
}
