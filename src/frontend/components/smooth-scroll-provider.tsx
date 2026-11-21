"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const isDashboard =
      ["/admin", "/college", "/student"].some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ) && pathname !== "/admin/login" && pathname !== "/college/login";

    if (isDashboard) return;

    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      anchors: true,
      lerp: 0.12,
      respectReducedMotion: true,
    });

    return () => lenis.destroy();
  }, [pathname]);

  return children;
}
