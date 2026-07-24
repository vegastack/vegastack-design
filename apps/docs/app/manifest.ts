import type { MetadataRoute } from "next";
import { appName } from "@/lib/shared";
import { defaultDescription } from "@/lib/metadata";

export const revalidate = false;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appName,
    short_name: "VegaStack Design",
    description: defaultDescription,
    start_url: "/",
    display: "standalone",
    // Web manifests cannot resolve runtime CSS variables; these mirror the light/dark token builds.
    // eslint-disable-next-line no-restricted-syntax -- literal metadata value required
    background_color: "#fdfdfc",
    // eslint-disable-next-line no-restricted-syntax -- literal metadata value required
    theme_color: "#11100f",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
