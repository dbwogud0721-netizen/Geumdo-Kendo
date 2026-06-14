export const NAV_ITEMS = [
  { label: '홈', href: '/' },
  { label: '온라인 접수실', href: '/schedule' },
  { label: '동영상', href: '/resources' },
  { label: '갤러리', href: '/gallery' },
  { label: '공지사항', href: '/community' },
  { label: '커뮤니티', href: '/board' },
] as const;

export const KAKAO_OPEN_CHAT_URL = 'https://open.kakao.com/o/gWcaNdyi';

export const FEATURES = [
  {
    title: '부담 없는 시작',
    description: '처음 배우는 분도 기초부터 천천히 배웁니다.',
  },
  {
    title: '편한 수련 분위기',
    description: '딱딱한 분위기보다 함께 운동하는 즐거움을 중요하게 생각합니다.',
  },
  {
    title: '체력과 자신감',
    description: '꾸준한 수련으로 몸과 마음의 변화를 느낄 수 있습니다.',
  },
] as const;

export const SCHEDULE = [
  '2시부 ~ 2시 50분',
  '3시부 ~ 3시 50분',
  '4시 30분부 ~ 5시 20분',
  '6시 ~ 6시 50분',
  '8시 ~ 8시 50분',
] as const;

export const DIRECTOR = {
  name: '관장 조현희',
  intro:
    '안녕하세요. 금도검도관 관장 조현희입니다.\n검도는 몸과 마음을 함께 수련하는 소중한 배움의 길입니다.\n기본을 바탕으로 안전하게 지도하며,\n수련생 한 분 한 분의 성장에 맞춰 함께하겠습니다.\n부담 없이 믿고 맡길 수 있는 검도관이 되겠습니다.',
  credentials: ['???', '???', '???'],
} as const;

export const NOTICES = [
  { category: '공지', title: '2024년 신규 수련생 모집 안내', date: '2024.05.20' },
  { category: '안내', title: '수련 시 준비물 안내', date: '2024.05.15' },
  { category: '공지', title: '6월 승급 심사 일정 안내', date: '2024.05.10' },
  { category: '안내', title: '여름방학 단기 특강 안내', date: '2024.05.05' },
  { category: '갤러리', title: '5월 수련 사진 업데이트', date: '2024.05.01' },
] as const;

export const GALLERY = [
  { label: '수련 모습' },
  { label: '도장 내부' },
  { label: '예절 교육' },
] as const;

export const CONTACT = {
  phone: '02-971-5358',
  mobile: '010-3100-6851',
  hours: ['평일 15:00 - 22:00', '토요일 10:00 - 16:00'],
} as const;

export const ADDRESS = {
  jibun: '서울 노원구 하계동 61-7',
  road: '서울 노원구 공릉로58길 127, GS25건물 지하 1층',
  mapUrl:
    'https://map.naver.com/v5/search/%EC%84%9C%EC%9A%B8%20%EB%85%B8%EC%9B%90%EA%B5%AC%20%ED%95%98%EA%B3%84%EB%8F%99%2061-7',
} as const;