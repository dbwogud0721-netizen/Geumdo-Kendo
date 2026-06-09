import Hero from '@/components/Hero';
import IntroSection from '@/components/IntroSection';
import DirectorSection from '@/components/DirectorSection';
import NoticeGallerySection from '@/components/NoticeGallerySection';
import LocationSection from '@/components/LocationSection';
import { queryCollection } from '@/lib/firestore-rest';

export const revalidate = 30;

interface Notice { id: string; category: string; title: string; date: string; }
interface GalleryItem { id: string; url: string; label: string; }

export default async function Home() {
  const [notices, gallery] = await Promise.all([
    queryCollection<Notice>('notices', 'createdAt', 5, 30),
    queryCollection<GalleryItem>('gallery', 'createdAt', 3, 30),
  ]);
  return (
    <>
      <Hero />
      <IntroSection />
      <DirectorSection />
      <NoticeGallerySection notices={notices} gallery={gallery} />
      <LocationSection />
    </>
  );
}
