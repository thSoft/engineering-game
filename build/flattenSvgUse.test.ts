import { readFile } from "node:fs/promises";
import { DOMParser } from "@xmldom/xmldom";
import { describe, expect, test } from "vitest";
import { flattenSvgDocument } from "./flattenSvgUse.ts";

const parser = new DOMParser();

describe("flattenSvgDocument", () => {
  test("expands instances, labels cloned descendants, and preserves instance transforms", () => {
    const output = flattenSvgDocument(`
      <svg xmlns="http://www.w3.org/2000/svg"
           xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
           xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <g id="template" transform="translate(3 4)">
            <rect id="shape" inkscape:label="valve" />
          </g>
        </defs>
        <use id="clone" x="10" y="20" transform="scale(2)" xlink:href="#template"
             inkscape:label="c4" />
      </svg>
    `);
    const document = parser.parseFromString(output, "image/svg+xml");
    const valve = findByLabel(document, "c4_valve");
    const instance = findByLabel(document, "c4");

    expect(document.getElementsByTagName("use").length).toBe(0);
    expect(instance?.getAttribute("transform")).toBe("scale(2) translate(10 20)");
    expect(valve?.getAttribute("id")).toBe("shape-use-1");
    expect(findById(document, "shape")).not.toBeNull();
  });

  test("flattens the windchest and keyboard SVG assets", async () => {
    const [windchest, keyboard] = await Promise.all([
      readFile(new URL("../src/parts/windchest/windchest.svg", import.meta.url), "utf8"),
      readFile(new URL("../src/parts/organKeyboard/organKeyboard.svg", import.meta.url), "utf8"),
    ]);

    for (const source of [windchest, keyboard]) {
      const flattened = flattenSvgDocument(source);
      expect(flattened).not.toMatch(/<use[\s>]/);
    }

    const flattenedWindchest = parser.parseFromString(
      flattenSvgDocument(windchest),
      "image/svg+xml",
    );
    expect(findByLabel(flattenedWindchest, "c4_valve")).not.toBeNull();

    const flattenedKeyboard = parser.parseFromString(flattenSvgDocument(keyboard), "image/svg+xml");
    const hook = findByLabel(flattenedKeyboard, "actionTriggered_c4_hook");
    expect(hook).not.toBeNull();
    if (!hook) throw new Error("Flattened keyboard SVG is missing the C4 hook");
    for (
      let element: Element | null = hook;
      element && element !== flattenedKeyboard.documentElement;
      element = element.parentElement
    ) {
      expect(element.localName).not.toBe("symbol");
    }
  });

  test("reports missing and circular references", () => {
    expect(() =>
      flattenSvgDocument('<svg xmlns="http://www.w3.org/2000/svg"><use href="#missing" /></svg>'),
    ).toThrow("references missing SVG element #missing");

    expect(() =>
      flattenSvgDocument(`
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs><g id="loop"><use href="#loop" /></g></defs>
          <use href="#loop" />
        </svg>
      `),
    ).toThrow("Circular SVG");
  });
});

function findByLabel(document: Document, label: string) {
  return (
    Array.from(document.getElementsByTagName("*")).find((element) =>
      Array.from(element.attributes).some(
        (attribute) => attribute.localName === "label" && attribute.value === label,
      ),
    ) ?? null
  );
}

function findById(document: Document, id: string) {
  return (
    Array.from(document.getElementsByTagName("*")).find(
      (element) => element.getAttribute("id") === id,
    ) ?? null
  );
}
