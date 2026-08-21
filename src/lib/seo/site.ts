const configured = import.meta.env.PUBLIC_SITE_URL as string | undefined;

export const siteName = "Ambient Atlas";
export const siteOrigin = (configured ?? "").replace(/\/+$/, "");

export function absolute(path: string): string | null {
  if (!siteOrigin) return null;
  return siteOrigin + (path.startsWith("/") ? path : `/${path}`);
}
