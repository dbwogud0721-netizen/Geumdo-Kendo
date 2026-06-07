import PageHeader from '@/components/PageHeader';
import { queryCollection } from '@/lib/firestore-rest';
import ResourcesClient from './ResourcesClient';

export const revalidate = 0;

interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
  description?: string;
  nickname: string;
  ip: string;
  secret: boolean;
  pwHash: string;
}

export default async function ResourcesPage() {
  const videos = await queryCollection<VideoItem>('videos', 'createdAt', 30);
  return (
    <>
      <PageHeader label="Videos" title="동영상" description="수련 영상 및 검도 관련 동영상을 공유하세요." />
      <ResourcesClient initialVideos={videos} />
    </>
  );
}
