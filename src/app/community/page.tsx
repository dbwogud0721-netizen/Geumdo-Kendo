import PageHeader from '@/components/PageHeader';
import CommunityClient from './CommunityClient';

export default function CommunityPage() {
  return (
    <>
      <PageHeader label="Community" title="공지사항 · 게시판" description="누구나 자유롭게 글을 남길 수 있습니다." />
      <CommunityClient />
    </>
  );
}
