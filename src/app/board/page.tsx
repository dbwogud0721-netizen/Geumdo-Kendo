import PageHeader from '@/components/PageHeader';
import BoardClient from './BoardClient';

export default function BoardPage() {
  return (
    <>
      <PageHeader label="Community" title="커뮤니티" description="자유롭게 소통하는 공간입니다. 좋아요와 댓글을 남겨보세요." />
      <BoardClient />
    </>
  );
}
