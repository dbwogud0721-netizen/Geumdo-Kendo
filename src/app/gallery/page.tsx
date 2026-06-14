import PageHeader from '@/components/PageHeader';
import GalleryClient from './GalleryClient';

export default function GalleryPage() {
  return (
    <>
      <PageHeader label="Gallery" title="갤러리" description="금도검도관의 수련 모습을 담았습니다." />
      <GalleryClient />
    </>
  );
}
