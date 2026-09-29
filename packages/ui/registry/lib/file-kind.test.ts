import * as React from "react";
import { describe, expect, it } from "vitest";
import { fileKindOf, FileTypeIcon, formatBytes } from "./file-kind";

describe("formatBytes", () => {
  it("formats byte counts on a 1024 base, one decimal under 10", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(999)).toBe("999 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1229)).toBe("1.2 KB");
    expect(formatBytes(12 * 1024)).toBe("12 KB");
    expect(formatBytes(3.4 * 1024 ** 2)).toBe("3.4 MB");
    expect(formatBytes(2_516_582)).toBe("2.4 MB");
    expect(formatBytes(1.1 * 1024 ** 3)).toBe("1.1 GB");
    expect(formatBytes(2048)).toBe("2 KB");
  });
  it("takes a decimals option and steps up a unit rather than print 1024", () => {
    expect(formatBytes(1536, { decimals: 0 })).toBe("2 KB");
    expect(formatBytes(1234567, { decimals: 2 })).toBe("1.18 MB");
    expect(formatBytes(1024 * 1024 - 1)).toBe("1 MB");
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("fileKindOf", () => {
  it("detects kind by MIME", () => {
    expect(fileKindOf("image/png")).toBe("image");
    expect(fileKindOf("application/pdf")).toBe("pdf");
    expect(fileKindOf("video/mp4")).toBe("video");
    expect(fileKindOf("audio/mpeg")).toBe("audio");
    expect(fileKindOf("text/plain")).toBe("text");
    expect(fileKindOf("text/csv")).toBe("spreadsheet");
    expect(fileKindOf("application/zip")).toBe("archive");
    expect(
      fileKindOf(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("spreadsheet");
    expect(
      fileKindOf(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("document");
    expect(
      fileKindOf(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ),
    ).toBe("presentation");
    expect(fileKindOf("application/json")).toBe("code");
  });
  it("falls back to the extension when the type is missing or generic", () => {
    expect(fileKindOf("application/octet-stream", "a.xlsx")).toBe(
      "spreadsheet",
    );
    expect(fileKindOf("", "clip.MOV")).toBe("video");
    expect(fileKindOf(null, "notes.md")).toBe("text");
    expect(fileKindOf(undefined, "README")).toBe("other");
    expect(fileKindOf("application/x-unknown", "x.bin")).toBe("other");
  });
});

describe("FileTypeIcon", () => {
  it("resolves the icon for the kind, muted and hidden by default", () => {
    const element = FileTypeIcon({
      contentType: "application/octet-stream",
      name: "q3.xlsx",
      className: "size-4",
    }) as unknown as React.ReactElement<Record<string, unknown>>;
    expect(element.props["data-kind"]).toBe("spreadsheet");
    expect(element.props["aria-hidden"]).toBe(true);
    expect(element.props.className).toBe(
      "shrink-0 text-muted-foreground size-4",
    );
  });
});
