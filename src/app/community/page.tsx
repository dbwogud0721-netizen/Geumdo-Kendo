import PageHeader from '@/components/PageHeader';
import { queryCollection } from '@/lib/firestore-rest';
import type { Notice } from '@/hooks/useNotices';
import CommunityClient from './CommunityClient';

export const revalidate = 30;

export default async function CommunityPage() {
  const notices = await queryCollection<Notice>('notices', 'createdAt', 30);
  return (
    <>
      <PageHeader label="Community" title="공지사항 · 게시판" description="누구나 자유롭게 글을 남길 수 있습니다." />
      <CommunityClient initialNotices={notices} />
    </>
  );
}
