import PageHeader from '@/components/PageHeader';
import { queryCollection } from '@/lib/firestore-rest';
import CommunityClient from './CommunityClient';

export const revalidate = 30;

interface Post {
  id: string;
  category: string;
  title: string;
  content: string;
  nickname: string;
  ip: string;
  secret: boolean;
  pwHash: string;
}

export default async function CommunityPage() {
  const posts = await queryCollection<Post>('notices', 'createdAt', 30);
  return (
    <>
      <PageHeader label="Community" title="공지사항 · 게시판" description="누구나 자유롭게 글을 남길 수 있습니다." />
      <CommunityClient initialPosts={posts} />
    </>
  );
}
