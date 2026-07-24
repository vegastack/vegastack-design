import {
  getOGFonts,
  getOGWordmarkDataUri,
  OGImage,
  OG_IMAGE_SIZE,
} from "@/lib/og";
import { homeOgDescription, homeOgTitle } from "@/lib/metadata";
import { ImageResponse } from "next/og";

export const revalidate = false;

export async function GET() {
  const [wordmarkSrc, fonts] = await Promise.all([
    getOGWordmarkDataUri(),
    getOGFonts(),
  ]);
  return new ImageResponse(
    <OGImage
      title={homeOgTitle}
      description={homeOgDescription}
      wordmarkSrc={wordmarkSrc}
    />,
    { ...OG_IMAGE_SIZE, fonts },
  );
}
