export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type ProviderStatus = 
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type PricingModel = 
  | 'FIXED'
  | 'HOURLY'
  | 'PER_ITEM'
  | 'SUBSCRIPTION'
  | 'INSPECTION_VARIABLE'
  | 'CUSTOM_QUOTATION';

export type OrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REFUNDED';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED';

export type SubscriptionFrequency = 
  | 'DAILY'
  | 'MON_TO_SAT'
  | 'WEEKLY'
  | 'ALTERNATE_DAYS'
  | 'MONTHLY';

export type DiscountType = 'PERCENTAGE' | 'FLAT' | 'FIRST_ORDER' | 'SUBSCRIPTION';

export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type NoticeType = 'ANNOUNCEMENT' | 'MAINTENANCE' | 'ALERT' | 'SERVICE_UPDATE';
export type NoticePriority = 'NORMAL' | 'URGENT';

export interface SocietyNotice {
  id: string;
  societyId: string; // specific society.id or 'ALL'
  societyName: string;
  title: string;
  content: string;
  type: NoticeType;
  priority: NoticePriority;
  authorName: string;
  createdAt: string;
  isActive: boolean;
}

export interface Society {
  id: string;
  communityId: string;
  name: string;
  addressLine: string;
  locality?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  totalFlats: number;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  phone: string;
  role: UserRole;
  societyId: string;
  flatNumber: string;
  avatarUrl?: string;
  isOnboarded?: boolean;
  providerId?: string;
  walletBalance: number;
}

export type WalletTransactionType = 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  orderId?: string;
  note: string;
  createdAt: string;
}

export type CommissionReason = 
  | 'NEW_PROVIDER_PROMO' 
  | 'REPEAT_CUSTOMER' 
  | 'SUBSCRIPTION' 
  | 'PROVIDER_RULE' 
  | 'CATEGORY_RULE' 
  | 'DEFAULT';

export interface PlatformFeeRules {
  oneTimeFee: number;
  subscriptionFee: number;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  createdAt: string;
  isFlagged: boolean;
  flaggedReason?: string;
}

export interface ProviderLocation {
  label: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export type CoverageMode = 'RADIUS' | 'SELECTED_SOCIETIES';

export interface Provider {
  id: string;
  userId?: string;
  businessName: string;
  categoryId: string;
  categoryName?: string;
  description: string;
  avatarUrl?: string;
  phone: string;
  status: ProviderStatus;
  verifiedAt?: string;
  promoEndsAt?: string;
  acceptedTermsAt?: string;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  onTimeRate: number;
  supportedSocieties: string[]; // Society IDs
  startingPrice: number;
  startingPriceUnit: string;
  baseLocation?: ProviderLocation;
  maxServiceDistanceKm?: number;
  coverageMode?: CoverageMode;
  excludedSocietyIds?: string[];
  maxOrdersPerDay?: number;
  freeServiceRadiusKm?: number;
  travelChargePerKm?: number;
  maxTravelCharge?: number;
  workingHours?: {
    start: string;
    end: string;
    daysOff: string[];
  };
  isVacationMode?: boolean;
  vacationReason?: string;
  documents?: {
    type: string;
    url: string;
    verified: boolean;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
}

export interface Service {
  id: string;
  providerId: string;
  categoryId: string;
  name: string;
  description: string;
  pricingModel: PricingModel;
  basePrice: number;
  unitName: string;
  isSubscriptionSupported: boolean;
  pricingItems?: {
    name: string;
    price: number;
    unit: string;
  }[];
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerFlat: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  societyId: string;
  societyName: string;
  status: OrderStatus;
  scheduledDate: string;
  scheduledSlot: string;
  deliveryAddress: string;
  specialInstructions?: string;
  pricingModel: PricingModel;
  itemQuantity: number;
  subtotal: number;
  platformFee: number;
  travelCharge?: number;
  couponCode?: string;
  discountAmount: number;
  discountSource: 'PLATFORM' | 'PROVIDER';
  totalAmount: number;
  commissionPercentage: number;
  commissionReason?: CommissionReason;
  platformCommission: number;
  providerEarnings: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  walletDiscount?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  customerFlat: string;
  providerId: string;
  providerName: string;
  serviceId: string;
  serviceName: string;
  categoryName: string;
  societyId: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  scheduledTimeSlot: string;
  startDate: string;
  nextServiceDate: string;
  renewalDate: string;
  monthlyPrice: number;
  autoRenew: boolean;
  pausedUntil?: string;
  skippedDates?: string[];
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit: number;
  currentUsage: number;
  categoryId?: string;
  societyId?: string;
  isActive: boolean;
}

export interface CommissionRule {
  id: string;
  ruleType: 'DEFAULT' | 'CATEGORY' | 'SERVICE' | 'PROVIDER';
  targetId?: string;
  targetName?: string;
  commissionPercentage: number;
  notes: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  orderId: string;
  orderNumber: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  resolution?: string;
  resolutionType?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'FREE_REWORK' | 'MEDIATED_DISMISSED';
  refundAmount?: number;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface PayoutRecord {
  id: string;
  providerId: string;
  providerName: string;
  amount: number;
  method: 'UPI' | 'BANK_NEFT';
  accountDetails: string;
  status: 'PROCESSING' | 'COMPLETED';
  requestedAt: string;
  settledAt?: string;
  referenceId: string;
}

export interface MarketplaceAnalytics {
  totalGmv: number;
  monthlyRecurringGmv: number;
  platformCommissionRevenue: number;
  providerNetEarnings: number;
  totalOrders: number;
  completedOrders: number;
  activeSubscriptions: number;
  activeCustomers: number;
  activeProviders: number;
  disputeRatePct: number;
  repeatOrderRatePct: number;
}

export interface SocietyServiceRequest {
  id: string;
  societyId: string;
  societyName: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  userName: string;
  createdAt: string;
  notes?: string;
}
