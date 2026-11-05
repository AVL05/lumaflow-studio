import { useEffect } from "react";
import { getMetaTags, getRouteMeta, getStructuredData } from "../app/seo";

export function useDocumentMeta(pathname, search = "") {
  useEffect(() => {
    const meta = getRouteMeta(pathname, search);
    document.title = meta.title;
    document.head
      .querySelectorAll(
        'meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[data-lumaflow-seo]',
      )
      .forEach((node) => node.remove());
    for (const attributes of getMetaTags(meta)) {
      const node = document.createElement("meta");
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      document.head.append(node);
    }
    if (meta.canonical) {
      const canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = meta.canonical;
      document.head.append(canonical);
      const data = getStructuredData(pathname);
      if (data) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.dataset.lumaflowSeo = "";
        script.textContent = JSON.stringify(data);
        document.head.append(script);
      }
    }
  }, [pathname, search]);
}
