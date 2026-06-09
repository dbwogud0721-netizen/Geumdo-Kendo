import PageHeader from '@/components/PageHeader';
import { queryCollection } from '@/lib/firestore-rest';
import GalleryClient from './GalleryClient';

export const revalidate = 30;

import type { GalleryItem } from '@/hooks/useGallery';

export default async function GalleryPage() {
  const photos = await queryCollection<GalleryItem>('gallery', 'createdAt', 20);
  return (
    <>
      <PageHeader label="Gallery" title="갤러리" description="금도검도관의 수련 모습을 담았습니다." />
      <GalleryClient initialPhotos={photos} />
    </>
  );
}
