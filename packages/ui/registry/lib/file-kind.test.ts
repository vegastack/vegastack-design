import * as React from "react";
import { describe, expect, it } from "vitest";
import {
  FILE_KIND_LABEL,
  FileKindTile,
  fileKindOf,
  FileTypeIcon,
  formatBytes,
} from "./file-kind";
import { renderToStaticMarkup } from "react-dom/server";

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
    expect(fileKindOf("text/csv")).toBe("data");
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
    expect(fileKindOf("application/json")).toBe("json");
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
  it("maps the media, table, Markdown and text files uploads carry", () => {
    for (const name of ["a.mov", "a.mp4", "a.webm", "a.mkv"])
      expect(fileKindOf("", name)).toBe("video");
    for (const name of ["a.mp3", "a.m4a", "a.wav", "a.ogg", "a.flac"])
      expect(fileKindOf("", name)).toBe("audio");
    expect(fileKindOf("video/quicktime", "clip.mov")).toBe("video");
    expect(fileKindOf("audio/x-m4a", "memo.m4a")).toBe("audio");
    expect(fileKindOf("", "rows.csv")).toBe("data");
    expect(fileKindOf("text/csv", "rows.csv")).toBe("data");
    for (const name of ["a.md", "a.mdx", "a.txt", "a.log"])
      expect(fileKindOf("", name)).toBe("text");
    expect(fileKindOf("text/markdown", "a.md")).toBe("text");
    expect(fileKindOf("", "a.json")).toBe("json");
    for (const name of ["a.yaml", "a.yml"])
      expect(fileKindOf("", name)).toBe("config");
    expect(fileKindOf("", "a.xml")).toBe("code");
    expect(fileKindOf("application/x-yaml", "a.yaml")).toBe("config");
    expect(fileKindOf("text/xml", "a.xml")).toBe("code");
  });
  it("treats text/plain as generic, so the extension decides", () => {
    expect(fileKindOf("text/plain", "rows.csv")).toBe("data");
    expect(fileKindOf("text/plain; charset=utf-8", "config.json")).toBe("json");
    expect(fileKindOf("text/plain", "notes.mdx")).toBe("text");
    expect(fileKindOf("text/plain", "README")).toBe("text");
    expect(fileKindOf("text/plain", "server.log")).toBe("text");
  });
});

describe("the kinds table", () => {
  const cases: Record<string, string[]> = {
    image: ["a.heic", "a.svg", "a.tiff"],
    pdf: ["a.pdf"],
    document: ["a.docx", "a.pages", "a.rtf", "a.dotx"],
    text: ["a.txt", "a.md", "a.log"],
    spreadsheet: ["a.xlsb", "a.numbers", "a.xltx"],
    data: ["a.csv", "a.tsv"],
    presentation: ["a.pptx", "a.ppsx", "a.potx", "a.key", "a.odp"],
    video: ["a.mov", "a.ogv"],
    audio: ["a.opus", "a.weba"],
    archive: ["a.7z", "a.tgz"],
    code: ["a.ts", "a.swift", "a.kt", "a.php", "a.sql"],
    json: ["a.json", "a.jsonc", "a.json5"],
    config: ["a.toml", "a.ini", "a.env", "a.conf"],
    script: ["a.sh", "a.zsh", "a.ps1", "a.bat"],
    cad: ["a.dwg", "a.dxf", "a.step", "a.stl", "a.skp"],
    photometric: ["a.ies", "a.ldt"],
    design: ["a.psd", "a.ai", "a.fig", "a.sketch", "a.afdesign"],
    ebook: ["a.epub", "a.mobi", "a.azw3"],
    email: ["a.eml", "a.msg"],
    calendar: ["a.ics", "a.vcs"],
    contact: ["a.vcf"],
    key: ["a.pem", "a.crt", "a.p12"],
    encrypted: ["a.gpg", "a.pgp"],
    font: ["a.ttf", "a.woff2"],
    other: ["a.bin", "README"],
  };
  it("resolves every extension in the table, and labels every kind", () => {
    for (const [kind, names] of Object.entries(cases))
      for (const name of names)
        expect([name, fileKindOf("", name)]).toEqual([name, kind]);
    expect(Object.keys(FILE_KIND_LABEL).sort()).toEqual(
      Object.keys(cases).sort(),
    );
  });
  it("resolves rtf the same way from its extension and its MIME type", () => {
    expect(fileKindOf("", "memo.rtf")).toBe("document");
    expect(fileKindOf("application/rtf")).toBe("document");
    expect(fileKindOf("text/rtf", "memo.rtf")).toBe("document");
  });
  it("reads vendor MIME types before their broad family", () => {
    expect(fileKindOf("image/vnd.dwg")).toBe("cad");
    expect(fileKindOf("image/vnd.adobe.photoshop")).toBe("design");
    expect(fileKindOf("application/epub+zip")).toBe("ebook");
    expect(fileKindOf("application/postscript", "logo.ai")).toBe("design");
    expect(fileKindOf("text/calendar")).toBe("calendar");
    expect(fileKindOf("text/vcard")).toBe("contact");
    expect(fileKindOf("message/rfc822")).toBe("email");
    expect(fileKindOf("application/x-pem-file", "server.key")).toBe("key");
    expect(fileKindOf("application/x-sh")).toBe("script");
    expect(fileKindOf("font/woff2")).toBe("font");
  });
  it("treats video/mp2t as generic, so a TypeScript file is code", () => {
    expect(fileKindOf("video/mp2t", "index.ts")).toBe("code");
    expect(fileKindOf("video/mp2t", "clip")).toBe("video");
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

describe("tinted kinds", () => {
  it("FileTypeIcon tinted colours the icon by kind; FileKindTile names the kind in its ink", () => {
    const sheet = renderToStaticMarkup(
      React.createElement(FileTypeIcon, { name: "q3.xlsx", tinted: true }),
    );
    expect(sheet).toContain("text-success-text");
    const plain = renderToStaticMarkup(
      React.createElement(FileTypeIcon, { name: "q3.xlsx" }),
    );
    expect(plain).toContain("text-muted-foreground");
    const tile = renderToStaticMarkup(
      React.createElement(FileKindTile, {
        contentType: "application/pdf",
        name: "spec.pdf",
      }),
    );
    expect(tile).toContain('data-kind="pdf"');
    expect(tile).toContain(">PDF</span>");
    expect(tile).toContain("text-destructive-text");
  });
});
