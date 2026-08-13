export function BrandLogo({ alt = "", className = "" }) {
  return (
    <img
      src="/pwa-192x192.png"
      alt={alt}
      className={`shrink-0 object-contain ${className}`}
      draggable="false"
    />
  );
}
