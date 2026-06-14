import PageHeader from '@/components/PageHeader';
import ResourcesClient from './ResourcesClient';

export default function ResourcesPage() {
  return (
    <>
      <PageHeader label="Videos" title="동영상" description="수련 영상 및 검도 관련 동영상을 공유하세요." />
      <ResourcesClient />
    </>
  );
}
