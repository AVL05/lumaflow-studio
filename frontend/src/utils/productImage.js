// Version of the marketing screenshots in public/product (content hash computed at build time
// in vite.config.js). It changes the URL whenever a screenshot is regenerated under the same
// name, so the PWA's CacheFirst image cache and CDNs fetch the new file after a deploy.
const version = typeof __PRODUCT_IMAGES_VERSION__ === "string" ? __PRODUCT_IMAGES_VERSION__ : "";

export function productImage(name) {
  return `/product/${name}${version ? `?v=${version}` : ""}`;
}
