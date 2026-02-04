
export enum EventStatus {
  PUBLISHED = '발행',
  DRAFT = '임시저장',
  ENDED = '종료',
  PENDING = '승인대기',
  REJECTED = '거절'
}

export enum EventType {
  DISCOUNT = '그린피 할인',
  EVENT = '이벤트·프로모션'
}

export interface GolfEvent {
  id: string;
  golfCourse: string;
  title: string;
  content: string;
  imageUrl: string;
  status: EventStatus;
  type: EventType;
  startDate: string;
  endDate: string;
  regDate: string;
  views: number;
}

export enum ReservationStatus {
  PENDING = '예약대기',
  CONFIRMED = '예약완료',
  CANCELLED = '예약취소',
  FINISHED = '예약종료',
  EXPIRED = '기한만료',
  VENDOR_CANCEL = '업체취소'
}

export interface Reservation {
  id: string;
  golfCourse: string;
  courseName: string;
  reservationDate: string;
  reservationTime: string;
  userName: string;
  userPhone: string;
  peopleCount: string;
  greenFee: number;
  discountRate: number;
  caddyFee: number;
  cartFee: number;
  requestDate: string;
  status: ReservationStatus;
  cancelLimitDate: string;
  cancelDate: string;
}

export enum DiscountProductStatus {
  PENDING = '예약대기',
  CONFIRMED = '예약완료',
  CANCELLED = '예약취소',
  FINISHED = '예약종료',
  EXPIRED = '기한만료',
  VENDOR_CANCEL = '업체취소',
  AVAILABLE = '예약가능'
}

export interface DiscountProduct {
  id: string;
  golfCourse: string;
  courseName: string;
  holes: string;
  reservationDate: string;
  reservationTime: string;
  peopleCount: string;
  originalGreenFee: number;
  discountedPrice: number;
  discountRate: number;
  caddyFee: number;
  cartFee: number;
  status: DiscountProductStatus;
  cancelLimitDate: string;
  // New fields from registration form
  minPeople?: string;
  cancelPolicy?: string;
  reservationCondition?: string;
  benefits?: string;
}

export interface DashboardStats {
  totalViews: number;
  activeGolfCourses: number;
  totalEvents: number;
}

export interface GolfCourseInfo {
  id: string;
  clubCode: string;
  name: string;
  address: string;
  phone: string;
  realtime: 'OPEN' | 'CLOSE';
  annual: 'OPEN' | 'CLOSE';
  monthly: 'OPEN' | 'CLOSE';
  contractStatus: string;
  regDate: string;
  // Detail fields
  homepage?: string;
  email?: string;
  reservationPhone?: string;
  fax?: string;
  bank?: string;
  accountNumber?: string;
  accountHolder?: string;
  imageUrl?: string;
}
