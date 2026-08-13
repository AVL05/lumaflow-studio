import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function useCreateIntent(onCreate) {
  const location = useLocation();
  const createRef = useRef(onCreate);
  createRef.current = onCreate;

  useEffect(() => {
    if (new URLSearchParams(location.search).get("create") === "1") createRef.current();
  }, [location.key, location.search]);
}
