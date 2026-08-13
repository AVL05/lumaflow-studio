import { useEffect } from "react";

export function useDocumentMeta(title, description) {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content");

    document.title = title;
    meta?.setAttribute("content", description);

    return () => {
      document.title = previousTitle;
      if (previousDescription) meta?.setAttribute("content", previousDescription);
    };
  }, [description, title]);
}
