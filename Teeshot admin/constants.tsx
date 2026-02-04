
import React from 'react';
import { 
  Home, 
  CalendarDays, 
  CalendarRange, 
  Ticket, 
  Clock, 
  Gift, 
  Flag 
} from 'lucide-react';
import { EventType, EventStatus, ReservationStatus, Reservation, DiscountProduct, DiscountProductStatus, GolfCourseInfo } from './types';

export const SIDEBAR_MENU = [
  { id: 'home', label: '홈', icon: <Home size={20} /> },
  { 
    id: 'group_year', 
    label: '연 단체 예약', 
    icon: <CalendarDays size={20} />,
    subMenu: [
      { id: 'group_year_history', label: '신청내역', notice: 'N' },
      { id: 'group_year_history_confirmed', label: '예약내역' },
      { id: 'group_year_manage', label: '단체관리' }
    ]
  },
  { id: 'group_month', label: '월 단체 예약', icon: <CalendarRange size={20} /> },
  { 
    id: 'discount', 
    label: '할인 예약', 
    icon: <Ticket size={20} />,
    subMenu: [
      { id: 'discount_history', label: '예약내역', notice: 'N' },
      { id: 'discount_register', label: '할인등록' }
    ]
  },
  { 
    id: 'realtime', 
    label: '실시간 예약', 
    icon: <Clock size={20} />,
    subMenu: [
      { id: 'realtime_history', label: '예약내역', notice: 'N' }
    ]
  },
  { 
    id: 'event', 
    label: '이벤트', 
    icon: <Gift size={20} />, 
    badge: 'NEW', 
    subMenu: [
      { id: 'event_manage', label: '이벤트 관리', notice: 'N' }
    ]
  },
  { id: 'service', label: '골프장 서비스', icon: <Flag size={20} /> }
];

const BASE_EVENTS = [
  {
    golfCourse: '오창에딘버러(P9)',
    title: '3인 플레이 노캐디 이벤트',
    content: '오창에딘버러에서 3인 플레이 노캐디 이벤트를 진행합니다.',
    imageUrl: 'https://picsum.photos/seed/golf1/400/400',
    status: EventStatus.PUBLISHED,
    type: EventType.EVENT,
    startDate: '26.01.07',
    endDate: '26.01.31',
    regDate: '26.01.20',
    views: 125
  },
  {
    golfCourse: '에이원',
    title: '2026 신년맞이 1월 프로모션',
    content: '2026 신년맞이 1월 프로모션',
    imageUrl: 'https://picsum.photos/seed/golf2/400/400',
    status: EventStatus.PUBLISHED,
    type: EventType.DISCOUNT,
    startDate: '26.01.02',
    endDate: '26.01.30',
    regDate: '26.01.20',
    views: 342
  }
];

export const MOCK_EVENTS: any[] = Array.from({ length: 60 }).map((_, i) => ({
  ...BASE_EVENTS[i % BASE_EVENTS.length],
  id: (i + 1).toString(),
  views: Math.floor(Math.random() * 500) + 50
}));

export const MOCK_RESERVATIONS: Reservation[] = Array.from({ length: 20 }).map((_, i) => {
  const courses = ['이븐데일', '크리스밸리', '이븐데일', '크리스밸리', '크리스밸리'];
  const courseName = courses[i % courses.length];
  
  return {
    id: (584 - i).toString(),
    golfCourse: courseName,
    courseName: i % 2 === 0 ? '퍼플레이크' : '레이크A',
    reservationDate: '25.06.25 (수)',
    reservationTime: '09:40',
    userName: '김성민',
    userPhone: '010-1234-5678',
    peopleCount: '4인이상',
    greenFee: 180000,
    discountRate: 0,
    caddyFee: 120000,
    cartFee: 150000,
    requestDate: '25.06.25 (수) 09:40',
    status: i % 2 === 0 ? ReservationStatus.PENDING : ReservationStatus.CONFIRMED,
    cancelLimitDate: '25.06.25 (수) 17:00',
    cancelDate: '25.06.25 (수) 09:40'
  };
});

export const MOCK_DISCOUNT_PRODUCTS: DiscountProduct[] = Array.from({ length: 20 }).map((_, i) => {
  const courses = ['블랙스톤벨포레', '몽베르CC', '블루원상주', '인천그랜드', '대영베이스'];
  const statusOptions = [DiscountProductStatus.AVAILABLE, DiscountProductStatus.PENDING, DiscountProductStatus.CONFIRMED];
  const courseName = courses[i % courses.length];
  const originalFee = 140000;
  const discountRate = 15;
  const discounted = originalFee * (1 - discountRate / 100);

  return {
    id: (584 - i).toString(),
    golfCourse: courseName,
    courseName: '레이크A',
    holes: '18홀',
    reservationDate: '25.06.25 (수)',
    reservationTime: '09:40',
    userName: '김성민',
    peopleCount: '4인이상',
    originalGreenFee: originalFee,
    discountedPrice: discounted,
    discountRate: discountRate,
    caddyFee: 120000,
    cartFee: 150000,
    status: statusOptions[i % statusOptions.length],
    cancelLimitDate: '25.06.25 (수) 17:00'
  };
});

export const MOCK_ANNUAL_GROUPS = Array.from({ length: 20 }).map((_, i) => {
  // Removed '신청거절' (Rejected) from options to align with user request
  const statusOptions = ['예약신청', '신청승낙', '신청취소', '예약확정', '예약완료', '미선정', '계약만료'];
  return {
    id: (584 - i).toString(),
    golfCourse: '크리스밸리CC',
    groupName: '티샷 동호회',
    teamCount: 50,
    applicantName: '김성민',
    applicantType: 'S',
    contact: '010-1234-5678',
    applyDate: '25.06.25 (수) 09:40',
    processor: '티샷관리자',
    processDate: '25.06.25 (수) 09:40',
    status: statusOptions[i % statusOptions.length],
  };
});

export const MOCK_MONTHLY_GROUPS = Array.from({ length: 20 }).map((_, i) => {
  // Replaced '거절' (Rejected) with '신청승낙' (Accepted) to align with user request
  const statusOptions = ['예약완료', '예약신청', '신청취소', '신청승낙'];
  return {
    id: (584 - i).toString(),
    golfCourse: '크리스밸리CC',
    groupName: '티샷 월간회',
    teamCount: 12,
    applicantName: '김성민',
    applyDate: '25.06.25 (수) 09:40',
    status: statusOptions[i % statusOptions.length],
  };
});

export const MOCK_GOLF_COURSES: GolfCourseInfo[] = [
  {
    id: '655',
    clubCode: '0202030',
    name: '크리스밸리CC',
    address: '경기도 안성시 죽산면 걸미로 487',
    phone: '02-1234-5678',
    realtime: 'OPEN',
    annual: 'OPEN',
    monthly: 'CLOSE',
    contractStatus: '',
    regDate: '2026-01-07 10:09:18',
    homepage: 'https://www.creasvalley.com/',
    email: 'creasvalleycc@naver.com',
    reservationPhone: '02-1234-5678',
    fax: '651-481-230',
    bank: '신한은행',
    accountNumber: '325-6587-6984-65',
    accountHolder: '김명섭',
    imageUrl: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff47bc?q=80&w=1200&auto=format&fit=crop'
  },
  {
    id: '654',
    clubCode: '0304015',
    name: '내포(P9)',
    address: '충남 예산군 삽교읍 산수길 242',
    phone: '041-337-7155',
    realtime: 'CLOSE',
    annual: 'OPEN',
    monthly: 'CLOSE',
    contractStatus: '',
    regDate: '2025-10-02 17:26:58'
  },
  {
    id: '653',
    clubCode: '0305022',
    name: '하동골프클럽',
    address: '경남 하동군 횡천면 중마길 269',
    phone: '055-884-4003',
    realtime: 'CLOSE',
    annual: 'CLOSE',
    monthly: 'CLOSE',
    contractStatus: '',
    regDate: '2025-09-16 15:54:35'
  },
  {
    id: '652',
    clubCode: '0306020',
    name: '죽향(P9)',
    address: '전남 담양군 창평면 창평로 159',
    phone: '061-382-7200',
    realtime: 'CLOSE',
    annual: 'CLOSE',
    monthly: 'CLOSE',
    contractStatus: '',
    regDate: '2025-11-04 11:18:17'
  }
];
