export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type ProviderStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export type PricingModel =
  | 'FIXED'
  | 'HOURLY'
  | 'PER_ITEM'
  | 'SUBSCRIPTION'
  | 'INSPECTION_VARIABLE'
  | 'CUSTOM_QUOTATION'
  | 'TICK_WHAT_YOU_WANT'
  | 'LEAD_QUOTE';

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
  'DAILY' | 'MON_TO_SAT' | 'WEEKLY' | 'ALTERNATE_DAYS' | 'MONTHLY';

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

export interface ResidentBriefPreferences {
  diet?: 'VEG' | 'NON_VEG' | 'JAIN' | 'VEGAN';
  allergies?: string[];
  noOnionGarlic?: boolean;
  houseNotes?: string;
  pets?: string;
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
  preferences?: ResidentBriefPreferences;
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
  'SUBSCRIPTION' | 'PROVIDER_RULE' | 'CATEGORY_RULE' | 'MEMBERSHIP_TIER' | 'DEFAULT';

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
  averageAcceptanceMinutes?: number;
  acceptanceRate?: number;
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
  experienceYears?: number;
  gender?: 'FEMALE' | 'MALE' | 'OTHER';
  trustScore?: number;
  enabledServiceTypeIds?: string[];
  enabledTaskIds?: string[];
  membership?: ProviderMembership;
  documents?: {
    type: string;
    url: string;
    verified: boolean;
  }[];
}

export type CategoryMonetization = 'COMMISSION' | 'MEMBERSHIP';

export type CategoryMatching = 'DISPATCH' | 'LEAD_QUOTE' | 'BROWSE_ORDER' | 'SUBSCRIPTION';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  sortOrder: number;
  monetization: CategoryMonetization;
  matching: CategoryMatching;
  flatCommissionRate?: number;
  membershipMonthlyFee?: number;
  membershipGroupId?: string;
  supportsOneOffDispatch?: boolean;
  isActive?: boolean;
}

export interface ServiceTaskDefinition {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  estimatedMinutes: number;
}

export interface ServiceTypeSizeBand {
  label: string;
  multiplier: number;
  price: number;
  minutes: number;
}

export interface ServiceType {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  pricingModel: PricingModel;
  basePrice: number;
  estimatedDurationMinutes: number;
  availableTasks: ServiceTaskDefinition[];
  sizeBands?: ServiceTypeSizeBand[];
  tier?: 'BASIC' | 'SPECIAL' | 'CUSTOM';
  categoryCommissionRate?: number;
  isActive: boolean;
}

export interface ProviderPlan {
  id: string;
  categoryGroupId: string;
  name: string;
  monthlyFee: number;
  trialDays: number;
  gracePeriodDays: number;
  isActive: boolean;
}

export type JobRequestStatus = 'OPEN' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

export interface JobRequest {
  id: string;
  jobNumber: string;
  societyId: string;
  societyName: string;
  flatNumber: string;
  residentId: string;
  residentName: string;
  residentPhoneMasked: string;

  serviceTypeId: string;
  serviceTypeName: string;
  categoryId: string;
  categoryName: string;
  pricingModel?: PricingModel;

  status: JobRequestStatus;

  selectedTaskIds: string[];
  taskBreakdown: { id: string; name: string; price: number; minutes: number }[];
  sizeBandInput?: string;
  dishNotes?: string;
  kitchenReadinessConfirmed?: boolean;
  stylistGenderPreference?: 'ANY' | 'FEMALE' | 'MALE';
  requestType?: 'DISPATCH' | 'LEAD';
  requestNotes?: string;

  scheduledDate: string;
  scheduledSlot: string;
  estimatedDurationMinutes: number;

  lockedSubtotal: number;
  platformFee: number;
  totalResidentPrice: number;
  platformCommission: number;
  providerPayout: number;

  residentPreferences: ResidentBriefPreferences;
  doorOtp: string;

  notifiedProviderIds: string[];
  excludedProviderIds?: string[];
  claimedByProviderId?: string;
  claimedAt?: string;
  expiresAt: string;
  orderId?: string;

  rejectionReason?: string;
  cancelledBy?: string;
  cancelReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RecurringSchedule {
  id: string;
  scheduleNumber: string;
  residentId: string;
  residentName: string;
  societyId: string;
  flatNumber: string;
  serviceTypeId: string;
  serviceTypeName: string;
  categoryId: string;

  frequency: 'DAILY' | 'MON_TO_SAT' | 'WEEKLY' | 'ALTERNATE_DAYS';
  preferredSlot: string;
  selectedTaskIds: string[];
  sizeBandInput?: string;
  dishNotes?: string;
  kitchenReadinessConfirmed?: boolean;
  stylistGenderPreference?: 'ANY' | 'FEMALE' | 'MALE';
  residentPreferences?: ResidentBriefPreferences;
  quantity?: number;
  historyOrderIds?: string[];

  lockedPricePerVisit: number;
  providerPayoutPerVisit: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';

  nextDispatchDate: string;
  lastDispatchedJobId?: string;
  historyJobIds: string[];

  createdAt: string;
}

export type MembershipStatus = 'TRIAL' | 'ACTIVE' | 'GRACE' | 'LAPSED';

export interface MembershipInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAt: string;
  pdfUrl?: string;
}

export interface ProviderMembership {
  id: string;
  providerId: string;
  categoryGroupId: string;
  status: MembershipStatus;
  monthlyFee: number;

  trialStartDate: string;
  trialEndsAt: string;
  currentBillingPeriodStart: string;
  currentBillingPeriodEnd: string;
  gracePeriodEndsAt?: string;

  autoRenew: boolean;
  paymentMethodLast4?: string;
  invoices: MembershipInvoice[];

  updatedAt: string;
}

export interface ProviderDispatchNotification {
  id: string;
  providerId: string;
  jobRequestId: string;
  status: 'NEW' | 'VIEWED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

export type LeadQuoteStatus = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface LeadMilestone {
  title: string;
  amount: number;
  completed: boolean;
}

export interface LeadQuote {
  id: string;
  jobId: string;
  providerId: string;
  providerName: string;
  providerRating: number;
  providerExperienceYears: number;
  quotedAmount: number;
  estimatedDays: number;
  milestones: LeadMilestone[];
  scopeNotes: string;
  status: LeadQuoteStatus;
  createdAt: string;
}

export interface TiffinMenu {
  id: string;
  providerId: string;
  societyIds: string[];
  mealName: string;
  description: string;
  price: number;
  deliveryDate: string;
  cutoffAt: string;
  availableQuantity: number;
  isActive: boolean;
  createdAt: string;
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
  doorOtp?: string;
  jobRequestId?: string;
  isDoorOtpVerified?: boolean;
  mealPhotoUrl?: string;
  cookMissingIngredients?: boolean;
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
  customerFlat?: string;
  societyId?: string;
  societyName?: string;
  serviceName?: string;
  providerId: string;
  rating: number;
  comment: string;
  tags?: string[];
  isVerifiedPurchase: boolean;
  providerResponse?: {
    comment: string;
    respondedAt: string;
  };
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
  membershipMonthlyRevenue?: number;
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
