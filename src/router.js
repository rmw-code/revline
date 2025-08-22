import { useEffect, useState } from "react";

export function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const navigate = (path) => (window.location.hash = path);
  return { hash, path: hash.replace(/^#/, ""), navigate };
}
