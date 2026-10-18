import DOMPurify from "dompurify";

/** Apply at every HTML insertion, including artwork saved before this protection existed. */
export function sanitizeArtworkSvg(svg: string): string {
  if (!DOMPurify.isSupported) return "";

  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Artwork does not need HTML, page-wide CSS, navigation, or mutable links.
    FORBID_TAGS: ["foreignObject", "style", "a", "animate", "animateMotion", "animateTransform", "set"],
    FORBID_ATTR: ["style"],
    RETURN_TRUSTED_TYPE: false,
  });
}
