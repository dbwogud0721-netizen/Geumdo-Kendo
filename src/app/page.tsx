import Hero from '@/components/Hero';
import IntroSection from '@/components/IntroSection';
import DirectorSection from '@/components/DirectorSection';
import NoticeGallerySection from '@/components/NoticeGallerySection';
import LocationSection from '@/components/LocationSection';

export default function Home() {
  return (
    <>
      <Hero />
      <IntroSection />
      <DirectorSection />
      <NoticeGallerySection />
      <LocationSection />
    </>
  );
}