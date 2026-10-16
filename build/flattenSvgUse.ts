/// <reference lib="dom" />

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { Plugin } from "vite";

const svgNamespace = "http://www.w3.org/2000/svg";
const inkscapeNamespace = "http://www.inkscape.org/namespaces/inkscape";
const xlinkNamespace = "http://www.w3.org/1999/xlink";

/**
 * Vite plugin that flattens <use> elements in SVG files into their referenced content.
 * Usage:
 * - In your Vite config, add the plugin:
 * <pre>
 *   import { flattenSvgUse } from "./build/flattenSvgUse.ts";
 *   export default defineConfig({
 *     plugins: [flattenSvgUse(), ...otherPlugins],
 *   });
 * </pre>
 *
 * - In your code, import SVG files as usual. The plugin will automatically flatten <use> elements.
 * - Optional query parameter `?raw` can be added to the import to skip flattening and get the raw SVG content.
 *
 * Example:
 * <pre>
 *   import myIcon from "./icon.svg"; // Flattens <use> elements
 *   import rawIcon from "./icon.svg?raw"; // Gets raw SVG content without flattening
 * </pre>
 *
 * The plugin ensures that all IDs in the flattened SVG are unique and rewrites references accordingly.
 */
export function flattenSvgUse(): Plugin {
  let isBuild = false;
  return {
    name: "flatten-svg-use",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    async load(id) {
      const [file, query = ""] = id.split("?", 2);
      if (!file.endsWith(".svg") || query.split("&").includes("raw")) return null;

      const source = await readFile(file, "utf8");
      if (!/<use[\s>]/i.test(source)) return null;
      const xml = flattenSvgDocument(source);
      if (!isBuild) {
        const dataUrl = `data:image/svg+xml,${encodeURIComponent(xml)}`;
        return `export default ${JSON.stringify(dataUrl)};`;
      }

      const asset = this.emitFile({ type: "asset", name: basename(file), source: xml });
      return `export default import.meta.ROLLUP_FILE_URL_${asset};`;
    },
  };
}

export function flattenSvgDocument(source: string) {
  const document = new DOMParser({
    onError(level, message) {
      if (level !== "warning") throw new Error(`Unable to parse SVG: ${message}`);
    },
  }).parseFromString(source, "image/svg+xml");
  const svg = document.documentElement;
  if (!svg || svg.localName !== "svg") {
    throw new Error("SVG file does not have an <svg> root element");
  }

  const ids = new Set<string>();
  const elements = Array.from(document.getElementsByTagName("*"));
  for (const element of elements) {
    const id = element.getAttribute("id");
    if (id) ids.add(id);
  }

  let cloneNumber = 0;
  expandUses(svg, document, ids, new Map(), () => ++cloneNumber, new Set());
	return new XMLSerializer().serializeToString(document);
}

const NODE_TYPE_ELEMENT = 1;

function expandUses(
  root: HTMLElement,
  document: Document,
  ids: Set<string>,
  originalIds: Map<string, string>,
  nextCloneNumber: () => number,
  referenceStack: Set<string>,
) {
	for (const child of Array.from(root.childNodes)) {
	  if (child.nodeType !== NODE_TYPE_ELEMENT) continue;
    const element = child as HTMLElement;
    if (element.localName === "use") {
      const expanded = expandUse(
        element,
        root,
        document,
        ids,
        originalIds,
        nextCloneNumber,
        referenceStack,
      );
      if (expanded) root.replaceChild(expanded, element);
    } else {
      expandUses(element, document, ids, originalIds, nextCloneNumber, referenceStack);
    }
  }
}

function expandUse(
  use: HTMLElement,
  scope: HTMLElement,
  document: Document,
  ids: Set<string>,
  originalIds: Map<string, string>,
  nextCloneNumber: () => number,
  referenceStack: Set<string>,
) {
  const href = use.getAttribute("href") ?? use.getAttributeNS(xlinkNamespace, "href");
  if (!href?.startsWith("#")) return null;

  const referenceId = decodeURIComponent(href.slice(1));
  const canonicalReferenceId = originalIds.get(referenceId) ?? referenceId;
  if (referenceStack.has(canonicalReferenceId)) {
    throw new Error(`Circular SVG <use> reference involving #${canonicalReferenceId}`);
  }
  const template = findById(scope, referenceId) ?? findById(document, referenceId);
  if (!template) throw new Error(`<use> references missing SVG element #${referenceId}`);

  const instanceLabel = getLabel(use);
  const cloneNumber = nextCloneNumber();
  const clone = template.cloneNode(true) as HTMLElement;
  const idMap = assignCloneIds(clone, ids, originalIds, cloneNumber);
  rewriteReferences(clone, idMap);
  prefixCloneLabels(clone, instanceLabel);

  const group = document.createElementNS(svgNamespace, "g");
  for (const attribute of Array.from(use.attributes)) {
    const isHref =
      attribute.localName === "href" &&
      (attribute.namespaceURI === xlinkNamespace || attribute.namespaceURI === null);
    if (
      isHref ||
      attribute.localName === "x" ||
      attribute.localName === "y" ||
      attribute.localName === "width" ||
      attribute.localName === "height"
    ) {
      continue;
    }
    group.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
  }

  const x = use.getAttribute("x") ?? "0";
  const y = use.getAttribute("y") ?? "0";
  const offset = `translate(${x} ${y})`;
  const transform = use.getAttribute("transform");
  group.setAttribute("transform", transform ? `${transform} ${offset}` : offset);
  group.appendChild(clone.localName === "symbol" ? materializeSymbol(clone, document) : clone);

  referenceStack.add(canonicalReferenceId);
  try {
    expandUses(group, document, ids, originalIds, nextCloneNumber, referenceStack);
  } finally {
    referenceStack.delete(canonicalReferenceId);
  }
  return group;
}

function materializeSymbol(symbol: HTMLElement, document: Document) {
  const group = document.createElementNS(svgNamespace, "g");
  for (const attribute of Array.from(symbol.attributes)) {
    if (
      attribute.localName !== "viewBox" &&
      attribute.localName !== "preserveAspectRatio" &&
      attribute.localName !== "width" &&
      attribute.localName !== "height"
    ) {
      group.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
    }
  }
  while (symbol.firstChild) group.appendChild(symbol.firstChild);
  return group;
}

function assignCloneIds(
  root: HTMLElement,
  ids: Set<string>,
  originalIds: Map<string, string>,
  cloneNumber: number,
) {
  const idMap = new Map<string, string>();
  for (const element of [root, ...Array.from(root.getElementsByTagName("*"))]) {
    const id = element.getAttribute("id");
    if (!id) continue;
    const cloneId = `${id}-use-${cloneNumber}`;
    if (ids.has(cloneId)) throw new Error(`Duplicate generated SVG id "${cloneId}"`);
    ids.add(cloneId);
    idMap.set(id, cloneId);
    originalIds.set(cloneId, originalIds.get(id) ?? id);
    element.setAttribute("id", cloneId);
  }
  return idMap;
}

function rewriteReferences(root: HTMLElement, idMap: Map<string, string>) {
  for (const element of [root, ...Array.from(root.getElementsByTagName("*"))]) {
    for (const attribute of Array.from(element.attributes)) {
      const value =
        attribute.localName === "aria-labelledby" || attribute.localName === "aria-describedby"
          ? attribute.value
              .split(/\s+/)
              .map((id) => idMap.get(id) ?? id)
              .join(" ")
          : attribute.value
              .replace(/url\(#([^)]+)\)/g, (_match, id: string) => `url(#${idMap.get(id) ?? id})`)
              .replace(/^#(.+)$/, (_match, id: string) => `#${idMap.get(id) ?? id}`);
      if (value !== attribute.value) {
        element.setAttributeNS(attribute.namespaceURI, attribute.name, value);
      }
    }
  }
}

function prefixCloneLabels(root: HTMLElement, instanceLabel: string | null) {
  if (!instanceLabel) return;
  for (const element of [root, ...Array.from(root.getElementsByTagName("*"))]) {
    const label = getLabel(element);
    if (label) setLabel(element, `${instanceLabel}_${label}`);
  }
}

function getLabel(element: HTMLElement) {
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.localName === "label") return attribute.value;
  }
  return null;
}

function setLabel(element: HTMLElement, label: string) {
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.localName === "label") {
      element.setAttributeNS(attribute.namespaceURI, attribute.name, label);
      return;
    }
  }
  element.setAttributeNS(inkscapeNamespace, "inkscape:label", label);
}

function findById(document: Document | HTMLElement, id: string): HTMLElement | null {
  if (document.nodeType === NODE_TYPE_ELEMENT && (document as HTMLElement).getAttribute("id") === id) {
    return document as HTMLElement;
  }
  return (
    Array.from(document.getElementsByTagName("*")).find(
      (element) => element.getAttribute("id") === id,
    ) ?? null
  );
}
