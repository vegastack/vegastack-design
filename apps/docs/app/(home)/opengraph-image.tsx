import { ImageResponse } from 'next/og';
import { OGImage, OG_IMAGE_SIZE, OG_IMAGE_CONTENT_TYPE } from '@/lib/og';
import { defaultDescription } from '@/lib/metadata';
import { appName } from '@/lib/shared';

export const revalidate = false;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OGImage title={appName} description={defaultDescription} />,
    OG_IMAGE_SIZE,
  );
}
