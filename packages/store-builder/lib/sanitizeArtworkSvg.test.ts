// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { sanitizeArtworkSvg } from "./sanitizeArtworkSvg";
import GarmentArtworkPreview from "../components/GarmentArtworkPreview/GarmentArtworkPreview";

function parse(svg: string) {
  const container = document.createElement("div");
  container.innerHTML = svg;
  return container;
}

describe("artwork SVG sanitization", () => {
  it("sanitizes stored snapshots at the actual product preview insertion point", () => {
    const markup = renderToStaticMarkup(
      createElement(GarmentArtworkPreview, {
        garmentImageUrl: "/blank.png",
        garmentName: "Tee",
        artworkSvg: '<svg xmlns="http://www.w3.org/2000/svg"><image href="missing" onerror="alert(1)"/><path d="M0 0L10 10"/></svg>',
        surfaceHex: "#ffffff",
        decorationProfileId: "upper-front",
      }),
    );
    const container = parse(markup);
    expect(container.querySelector("[onerror]")).toBeNull();
    expect(container.querySelector("svg path")).not.toBeNull();
  });

  it("removes scripts, event handlers, HTML, CSS, and SVG link mutations", () => {
    const output = sanitizeArtworkSvg(`<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
      <script>alert(1)</script>
      <style>body { display:none }</style>
      <foreignObject><img src="x" onerror="alert(1)"></foreignObject>
      <image href="javascript:alert(1)" onerror="alert(1)" />
      <a href="javascript:alert(1)"><text>Click</text></a>
      <set attributeName="href" to="javascript:alert(1)" />
      <animate attributeName="href" values="javascript:alert(1)" />
      <path style="position:fixed" d="M0 0L10 10" fill="#fff" />
    </svg>`);
    const container = parse(output);

    expect(container.querySelector("script, style, foreignObject, a, set, animate, img")).toBeNull();
    expect(container.querySelector("[onload], [onerror], [style]")).toBeNull();
    expect(output).not.toContain("javascript:");
    expect(container.querySelector("path")?.getAttribute("fill")).toBe("#fff");
  });

  it("preserves template text, paths, embedded images, and editor attributes", () => {
    const output = sanitizeArtworkSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs><path id="arc" d="M0 0L100 100"/></defs>
      <text id="Line1" font-family="College" data-artwork-editor-element="Line1">
        <textPath href="#arc">Team &amp; Club</textPath>
      </text>
      <image href="data:image/png;base64,iVBORw0KGgo=" width="10" height="10" />
      <image href="https://example.convex.cloud/api/storage/example" />
    </svg>`);
    const container = parse(output);

    expect(container.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(container.querySelector("textPath")?.getAttribute("href")).toBe("#arc");
    expect(container.querySelector("text")?.getAttribute("data-artwork-editor-element")).toBe("Line1");
    expect(container.querySelector("text")?.textContent).toContain("Team & Club");
    expect(container.querySelectorAll("image[href]")).toHaveLength(2);
  });

  it.each([
    "<svg><g/onload=alert(1)//<p>",
    '<svg><image href="jav&#x61;script:alert(1)" /></svg>',
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
  ])("handles malformed and encoded payloads safely: %s", (payload) => {
    const container = parse(sanitizeArtworkSvg(payload));
    expect(container.querySelector("[onload], [onerror], script, math, img")).toBeNull();
    expect(container.innerHTML).not.toContain("javascript:");
  });
});
