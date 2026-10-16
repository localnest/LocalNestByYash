'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Society,
  Category,
  Provider,
  Service,
  Order,
  Subscription,
  Coupon,
  CommissionRule,
  Review,
  Complaint,
  PricingModel,
  OrderStatus,
  SubscriptionStatus,
  ComplaintStatus,
  UserProfile,
  SocietyNotice,
  NoticeType,
  PayoutRecord,
  WalletTransaction,
  ChatMessage,
  PlatformFeeRules,
  CommissionReason,
  ProviderLocation,
  CoverageMode,
  SocietyServiceRequest,
  ServiceType,
  JobRequest,
  RecurringSchedule,
  ProviderMembership,
  MembershipInvoice,
  LeadQuote,
  ResidentBriefPreferences,
  ProviderPlan,
  ProviderDispatchNotification,
  TiffinMenu,
} from './types';
import { isSocietyCovered, calculateTravelCharge, calculateHaversineDistance } from './geo';
export { isSocietyCovered, calculateTravelCharge, calculateHaversineDistance };
import {
  INITIAL_SOCIETIES,
  INITIAL_CATEGORIES,
  INITIAL_PROVIDERS,
  INITIAL_SERVICES,
  INITIAL_ORDERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_COUPONS,
  INITIAL_COMMISSION_RULES,
  INITIAL_REVIEWS,
  INITIAL_COMPLAINTS,
  INITIAL_PROFILES,
  INITIAL_NOTICES,
  INITIAL_PAYOUTS,
  INITIAL_WALLET_TRANSACTIONS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_PLATFORM_FEE_RULES,
  INITIAL_SERVICE_TYPES,
  INITIAL_PROVIDER_MEMBERSHIPS,
  INITIAL_JOB_REQUESTS,
  INITIAL_RECURRING_SCHEDULES,
  INITIAL_LEAD_QUOTES,
} from './mockData';
import { PLATFORM_CONFIG } from './config';

import { filterContactDetails, resolveCommissionRate } from './retentionUtils';
export { filterContactDetails };
import { Language, TranslationDictionary, TRANSLATIONS } from './i18n';
export type { Language, TranslationDictionary };
import { atomicClaimJob } from './dispatchClaim';
import {
  isProviderEligibleForJob,
  calculateTickWhatYouWantPricing,
  anonymizeFeedbackComment,
  calculateMissingIngredientsSettlement,
  resolveMembershipStatus,
  chooseRotatingTiffinMenu,
  parseSlotStartMinutes,
} from './dispatchUtils';

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function nextRecurringDate(dateString: string, frequency: RecurringSchedule['frequency']): string {
  const interval = frequency === 'ALTERNATE_DAYS' ? 2 : frequency === 'WEEKLY' ? 7 : 1;
  let nextDate = addDaysToDateString(dateString, interval);
  if (frequency === 'MON_TO_SAT' && new Date(`${nextDate}T12:00:00`).getDay() === 0) {
    nextDate = addDaysToDateString(nextDate, 1);
  }
  return nextDate;
}

function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function validateAppointment(dateString: string, slot: string): string | undefined {
  const date = new Date(`${dateString}T12:00:00`);
  const today = formatLocalDate(new Date());
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
    !Number.isFinite(date.getTime()) ||
    formatLocalDate(date) !== dateString ||
    dateString < today
  ) {
    return 'Choose a valid date that is not in the past.';
  }
  const startMinute = parseSlotStartMinutes(slot);
  if (!Number.isFinite(startMinute)) return 'Choose a valid time slot.';
  const now = new Date();
  if (dateString === today && startMinute <= now.getHours() * 60 + now.getMinutes()) {
    return 'Choose a future time slot.';
  }
  return undefined;
}

interface MarketplaceContextType {
  // Auth & Session
  currentUser: UserProfile | null;
  users: UserProfile[];
  login: (
    email: string,
    password?: string,
  ) => { success: boolean; message: string; user?: UserProfile };
  loginWithGoogle: (
    roleChoice: 'CUSTOMER' | 'PROVIDER',
    googleEmail?: string,
    googleName?: string,
  ) => { success: boolean; user: UserProfile; needsOnboarding: boolean };
  register: (params: {
    email: string;
    password?: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  }) => { success: boolean; user?: UserProfile; message: string };
  logout: () => void;
  completeResidentOnboarding: (data: {
    societyId: string;
    towerWing: string;
    flatNumber: string;
    phone: string;
    fullName: string;
  }) => void;
  completeProviderOnboarding: (data: {
    businessName: string;
    categoryId: string;
    phone: string;
    supportedSocieties: string[];
    description: string;
    serviceTitle: string;
    pricingModel: PricingModel;
    basePrice: number;
    unitName: string;
    documentType: string;
    documentName: string;
    acceptedTerms: boolean;
    baseLocation?: ProviderLocation;
    maxServiceDistanceKm?: number;
    coverageMode?: CoverageMode;
    excludedSocietyIds?: string[];
    maxOrdersPerDay?: number;
    freeServiceRadiusKm?: number;
    travelChargePerKm?: number;
    maxTravelCharge?: number;
  }) => void;

  // Active Society & Provider
  selectedSociety: Society;
  setSelectedSociety: (society: Society) => void;
  activeProviderId: string;
  setActiveProviderId: (id: string) => void;

  // Data collections
  societies: Society[];
  categories: Category[];
  providers: Provider[];
  services: Service[];
  orders: Order[];
  subscriptions: Subscription[];
  coupons: Coupon[];
  commissionRules: CommissionRule[];
  reviews: Review[];
  complaints: Complaint[];
  payouts: PayoutRecord[];
  walletTransactions: WalletTransaction[];
  chatMessages: ChatMessage[];
  platformFeeRules: PlatformFeeRules;

  // Coupon Engine
  validateCoupon: (
    code: string,
    subtotal: number,
    categoryId?: string,
  ) => {
    valid: boolean;
    discount: number;
    message: string;
    coupon?: Coupon;
  };

  // Actions: Booking & Orders
  createOrder: (params: {
    serviceId: string;
    scheduledDate: string;
    scheduledSlot: string;
    deliveryAddress: string;
    specialInstructions?: string;
    pricingModel: PricingModel;
    itemQuantity: number;
    subtotal: number;
    couponCode?: string;
    walletAmountToUse?: number;
    travelCharge?: number;
    isSubscription?: boolean;
    subscriptionFrequency?: 'DAILY' | 'MON_TO_SAT' | 'WEEKLY' | 'ALTERNATE_DAYS';
  }) => { success: boolean; orderId?: string; orderNumber?: string; message: string };

  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    rejectionReason?: string,
  ) => void;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Actions: Subscriptions
  updateSubscriptionStatus: (subscriptionId: string, status: SubscriptionStatus) => void;
  pauseSubscription: (subscriptionId: string, pausedUntil: string) => void;
  resumeSubscription: (subscriptionId: string) => void;
  skipNextDelivery: (subscriptionId: string, dateToSkip: string) => void;

  // Actions: Reviews
  submitReview: (
    orderIdOrParams:
      | string
      | {
          orderId: string;
          providerId: string;
          rating: number;
          comment: string;
          tags?: string[];
          customerFlat?: string;
          privacyOption?: 'FULL_FLAT' | 'TOWER_ONLY' | 'ANONYMOUS';
        },
    providerId?: string,
    rating?: number,
    comment?: string,
    tags?: string[],
    customerFlat?: string,
  ) => { success: boolean; message: string };
  respondToReview: (
    reviewId: string,
    replyComment: string,
  ) => { success: boolean; message: string };

  // Actions: Support & Complaints
  createComplaint: (
    orderId: string,
    category: string,
    description: string,
  ) => { success: boolean; ticketNumber: string };
  updateComplaintStatus: (
    ticketId: string,
    status: ComplaintStatus,
    resolution?: string,
    adminNotes?: string,
    resolutionType?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'FREE_REWORK' | 'MEDIATED_DISMISSED',
    refundAmount?: number,
  ) => void;

  // Actions: Provider Management
  updateProviderStatus: (providerId: string, status: Provider['status'], reason?: string) => void;
  updateProviderAvailability: (
    providerId: string,
    workingHours: { start: string; end: string; daysOff: string[] },
    isVacationMode: boolean,
    vacationReason?: string,
  ) => void;
  updateProviderServiceArea: (
    providerId: string,
    data: {
      baseLocation?: ProviderLocation;
      maxServiceDistanceKm?: number;
      coverageMode?: CoverageMode;
      supportedSocieties?: string[];
      excludedSocietyIds?: string[];
      maxOrdersPerDay?: number;
      freeServiceRadiusKm?: number;
      travelChargePerKm?: number;
      maxTravelCharge?: number;
    },
  ) => void;
  updateProviderCapabilities: (
    providerId: string,
    serviceTypeIds: string[],
    taskIds: string[],
  ) => void;
  settleCookMissingIngredients: (orderId: string) => { success: boolean; error?: string };
  saveCookMealPhoto: (orderId: string, photoUrl: string) => { success: boolean; error?: string };
  serviceRequests: SocietyServiceRequest[];
  createServiceRequest: (params: {
    societyId: string;
    societyName: string;
    categoryId: string;
    categoryName: string;
    notes?: string;
  }) => { success: boolean; message: string };
  addService: (newService: Omit<Service, 'id'>) => void;
  requestPayout: (
    providerId: string,
    amount: number,
    method: 'UPI' | 'BANK_NEFT',
    accountDetails: string,
  ) => { success: boolean; message: string };

  // Actions: Admin & Commission
  updateCommissionRule: (ruleId: string, percentage: number) => void;
  createCoupon: (coupon: Omit<Coupon, 'id' | 'currentUsage'>) => void;
  toggleCouponActive: (couponId: string) => void;
  addSociety: (society: Omit<Society, 'id'>) => void;
  updatePlatformFeeRules: (rules: PlatformFeeRules) => void;

  // Wallet
  getWalletBalance: (userId: string) => number;
  getWalletStreak: (userId: string) => {
    completedCount: number;
    nextStreakAt: number;
    remaining: number;
  };

  // Chat
  sendChatMessage: (
    orderId: string,
    text: string,
  ) => { success: boolean; blocked?: boolean; message: string };
  getOrderMessages: (orderId: string) => ChatMessage[];
  markFlaggedReviewed: (messageId: string) => void;

  // Society Notices
  notices: SocietyNotice[];
  createNotice: (params: {
    societyId: string;
    societyName: string;
    title: string;
    content: string;
    type: NoticeType;
    priority: 'NORMAL' | 'URGENT';
    authorName: string;
  }) => void;
  deactivateNotice: (noticeId: string) => void;

  // Uber-style Dispatch & Monetization
  serviceTypes: ServiceType[];
  jobRequests: JobRequest[];
  recurringSchedules: RecurringSchedule[];
  providerMemberships: ProviderMembership[];
  providerPlans: ProviderPlan[];
  tiffinMenus: TiffinMenu[];
  dispatchNotifications: ProviderDispatchNotification[];
  dispatchTimeoutMinutes: number;
  leadQuotes: LeadQuote[];

  createJobRequest: (params: {
    serviceTypeId: string;
    scheduledDate: string;
    scheduledSlot: string;
    selectedTaskIds?: string[];
    sizeBandInput?: string;
    dishNotes?: string;
    kitchenReadinessConfirmed?: boolean;
    stylistGenderPreference?: 'ANY' | 'FEMALE' | 'MALE';
    residentPreferences?: ResidentBriefPreferences;
    excludedProviderIds?: string[];
  }) => { success: boolean; jobRequest?: JobRequest; error?: string };
  createLeadRequest: (params: {
    serviceTypeId: string;
    scheduledDate: string;
    scheduledSlot: string;
    requestNotes: string;
  }) => { success: boolean; jobRequest?: JobRequest; error?: string };
  publishTiffinMenu: (menu: Omit<TiffinMenu, 'id' | 'providerId' | 'createdAt' | 'isActive'>) => {
    success: boolean;
    error?: string;
  };
  orderTiffinMenu: (
    menuId: string,
    quantity: number,
    deliveryDate?: string,
    societyId?: string,
  ) => { success: boolean; order?: Order; error?: string };

  claimJob: (
    jobId: string,
    providerId: string,
  ) => { success: boolean; status: string; order?: Order; error?: string };
  cancelJobRequest: (jobId: string, reason?: string) => void;
  cancelClaimedJob: (
    jobId: string,
    providerId: string,
    reason?: string,
  ) => { success: boolean; error?: string };
  cancelClaimedJobByResident: (
    jobId: string,
    reason?: string,
  ) => { success: boolean; error?: string };
  expireJobRequest: (jobId: string) => boolean;
  reDispatchJob: (jobId: string) => void;
  verifyDoorOtp: (orderId: string, enteredOtp: string) => { success: boolean; error?: string };

  createRecurringSchedule: (
    schedule: Omit<RecurringSchedule, 'id' | 'scheduleNumber' | 'createdAt' | 'historyJobIds'>,
  ) => RecurringSchedule;
  updateRecurringSchedule: (id: string, updates: Partial<RecurringSchedule>) => void;
  dispatchRecurringScheduleOccurrence: (scheduleId: string) => {
    success: boolean;
    jobRequest?: JobRequest;
    order?: Order;
    error?: string;
  };

  renewProviderMembership: (
    providerId: string,
    months?: number,
  ) => { success: boolean; invoice?: MembershipInvoice };
  failProviderMembershipRenewal: (providerId: string) => { success: boolean; error?: string };
  updateProviderPlan: (planId: string, updates: Partial<ProviderPlan>) => void;
  updateProviderMembership: (providerId: string, updates: Partial<ProviderMembership>) => void;
  updateDispatchTimeout: (minutes: number) => { success: boolean; error?: string };
  moderateReview: (reviewId: string) => void;
  updateCategoryFlags: (categoryId: string, updates: Partial<Category>) => void;
  updateServiceType: (serviceTypeId: string, updates: Partial<ServiceType>) => void;
  addServiceType: (serviceType: Omit<ServiceType, 'id'>) => void;
  updateResidentPreferences: (residentId: string, prefs: ResidentBriefPreferences) => void;

  submitLeadQuote: (quote: Omit<LeadQuote, 'id' | 'createdAt' | 'status'>) => LeadQuote | undefined;
  acceptLeadQuote: (leadQuoteId: string) => { success: boolean; order?: Order };

  // Notifications
  notifications: string[];
  dismissNotification: (index: number) => void;

  // Language / i18n
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [societies, setSocieties] = useState<Society[]>(INITIAL_SOCIETIES);
  const [selectedSociety, setSelectedSociety] = useState<Society>(INITIAL_SOCIETIES[0]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [serviceRequests, setServiceRequests] = useState<SocietyServiceRequest[]>([]);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(INITIAL_SERVICE_TYPES);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>(INITIAL_JOB_REQUESTS);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>(
    INITIAL_RECURRING_SCHEDULES,
  );
  const [providerMemberships, setProviderMemberships] = useState<ProviderMembership[]>(
    INITIAL_PROVIDER_MEMBERSHIPS,
  );
  const [providerPlans, setProviderPlans] = useState<ProviderPlan[]>([
    {
      id: 'plan-home-services',
      categoryGroupId: 'home-services',
      name: 'Home Services',
      monthlyFee: 499,
      trialDays: 60,
      gracePeriodDays: 5,
      isActive: true,
    },
    {
      id: 'plan-trades',
      categoryGroupId: 'trades',
      name: 'Skilled Trades',
      monthlyFee: 799,
      trialDays: 60,
      gracePeriodDays: 5,
      isActive: true,
    },
    {
      id: 'plan-projects',
      categoryGroupId: 'projects',
      name: 'Home Projects',
      monthlyFee: 999,
      trialDays: 60,
      gracePeriodDays: 5,
      isActive: true,
    },
  ]);
  const [dispatchNotifications, setDispatchNotifications] = useState<
    ProviderDispatchNotification[]
  >([]);
  const [dispatchTimeoutMinutes, setDispatchTimeoutMinutes] = useState(15);
  const [leadQuotes, setLeadQuotes] = useState<LeadQuote[]>(INITIAL_LEAD_QUOTES);
  const [tiffinMenus, setTiffinMenus] = useState<TiffinMenu[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [commissionRules, setCommissionRules] =
    useState<CommissionRule[]>(INITIAL_COMMISSION_RULES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [activeProviderId, setActiveProviderId] = useState<string>('prov-raj-laundry');
  const [notices, setNotices] = useState<SocietyNotice[]>(INITIAL_NOTICES);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUTS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(
    INITIAL_WALLET_TRANSACTIONS,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [platformFeeRules, setPlatformFeeRules] = useState<PlatformFeeRules>(
    INITIAL_PLATFORM_FEE_RULES,
  );
  const [notifications, setNotifications] = useState<string[]>([
    'Welcome to Greenfield Heights pilot marketplace! Secure logins for Residents, Providers, and Administrators.',
  ]);

  // Language State
  const [language, setLanguageState] = useState<Language>('en');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('hg_language', lang);
    } catch {
      // ignore
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Load from local storage on client if available
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedUser = localStorage.getItem('hg_user');
        if (savedUser) {
          const u: UserProfile = JSON.parse(savedUser);
          setCurrentUser(u);
          if (u.providerId) setActiveProviderId(u.providerId);
          if (u.societyId) {
            const s = INITIAL_SOCIETIES.find((soc) => soc.id === u.societyId);
            if (s) setSelectedSociety(s);
          }
        }

        const savedUsers = localStorage.getItem('hg_all_users');
        if (savedUsers) setUsers(JSON.parse(savedUsers));

        const savedOrders = localStorage.getItem('hg_orders');
        if (savedOrders) setOrders(JSON.parse(savedOrders));

        const savedSubs = localStorage.getItem('hg_subs');
        if (savedSubs) setSubscriptions(JSON.parse(savedSubs));

        const savedProviders = localStorage.getItem('hg_providers');
        if (savedProviders) {
          const parsed = JSON.parse(savedProviders);
          const merged = parsed.map((p: Provider) => {
            const init = INITIAL_PROVIDERS.find((ip) => ip.id === p.id);
            if (init && !p.baseLocation) {
              return {
                ...init,
                ...p,
                baseLocation: init.baseLocation,
                maxServiceDistanceKm: init.maxServiceDistanceKm,
                coverageMode: init.coverageMode,
                excludedSocietyIds: init.excludedSocietyIds || [],
                maxOrdersPerDay: init.maxOrdersPerDay,
                freeServiceRadiusKm: init.freeServiceRadiusKm,
                travelChargePerKm: init.travelChargePerKm,
                maxTravelCharge: init.maxTravelCharge,
              };
            }
            return p;
          });
          setProviders(merged);
        }

        const savedCategories = localStorage.getItem('hg_categories');
        if (savedCategories) {
          const parsedCats = JSON.parse(savedCategories);
          // Ensure new categories exist
          const mergedCats = INITIAL_CATEGORIES.map((ic) => {
            const found = parsedCats.find((pc: { id: string }) => pc.id === ic.id);
            return found ? { ...ic, ...found } : ic;
          });
          setCategories(mergedCats);
        }

        const savedServiceTypes = localStorage.getItem('hg_service_types');
        if (savedServiceTypes) setServiceTypes(JSON.parse(savedServiceTypes));

        const savedJobRequests = localStorage.getItem('hg_job_requests');
        if (savedJobRequests) setJobRequests(JSON.parse(savedJobRequests));

        const savedSchedules = localStorage.getItem('hg_recurring_schedules');
        if (savedSchedules) setRecurringSchedules(JSON.parse(savedSchedules));

        const savedMemberships = localStorage.getItem('hg_provider_memberships');
        if (savedMemberships) setProviderMemberships(JSON.parse(savedMemberships));

        const savedPlans = localStorage.getItem('hg_provider_plans');
        if (savedPlans) setProviderPlans(JSON.parse(savedPlans));

        const savedDispatchNotifications = localStorage.getItem('hg_dispatch_notifications');
        if (savedDispatchNotifications)
          setDispatchNotifications(JSON.parse(savedDispatchNotifications));

        const savedDispatchTimeout = localStorage.getItem('hg_dispatch_timeout');
        if (savedDispatchTimeout) {
          const parsedTimeout = Number(savedDispatchTimeout);
          if (Number.isFinite(parsedTimeout) && parsedTimeout >= 10 && parsedTimeout <= 15) {
            setDispatchTimeoutMinutes(parsedTimeout);
          }
        }

        const savedLeadQuotes = localStorage.getItem('hg_lead_quotes');
        if (savedLeadQuotes) setLeadQuotes(JSON.parse(savedLeadQuotes));

        const savedTiffinMenus = localStorage.getItem('hg_tiffin_menus');
        if (savedTiffinMenus) setTiffinMenus(JSON.parse(savedTiffinMenus));

        const savedRequests = localStorage.getItem('hg_service_requests');
        if (savedRequests) setServiceRequests(JSON.parse(savedRequests));

        const savedServices = localStorage.getItem('hg_services');
        if (savedServices) setServices(JSON.parse(savedServices));

        const savedWallet = localStorage.getItem('hg_wallet_txns');
        if (savedWallet) setWalletTransactions(JSON.parse(savedWallet));

        const savedChat = localStorage.getItem('hg_chat_messages');
        if (savedChat) setChatMessages(JSON.parse(savedChat));

        const savedFeeRules = localStorage.getItem('hg_fee_rules');
        if (savedFeeRules) setPlatformFeeRules(JSON.parse(savedFeeRules));

        const savedReviews = localStorage.getItem('hg_reviews');
        if (savedReviews) setReviews(JSON.parse(savedReviews));

        const savedLang = localStorage.getItem('hg_language') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'hi' || savedLang === 'mr')) {
          setLanguageState(savedLang);
        }
      } catch {
        // fallback to initial
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('hg_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('hg_user');
      }
      localStorage.setItem('hg_all_users', JSON.stringify(users));
      localStorage.setItem('hg_orders', JSON.stringify(orders));
      localStorage.setItem('hg_subs', JSON.stringify(subscriptions));
      localStorage.setItem('hg_providers', JSON.stringify(providers));
      localStorage.setItem('hg_services', JSON.stringify(services));
      localStorage.setItem('hg_categories', JSON.stringify(categories));
      localStorage.setItem('hg_service_types', JSON.stringify(serviceTypes));
      localStorage.setItem('hg_job_requests', JSON.stringify(jobRequests));
      localStorage.setItem('hg_recurring_schedules', JSON.stringify(recurringSchedules));
      localStorage.setItem('hg_provider_memberships', JSON.stringify(providerMemberships));
      localStorage.setItem('hg_provider_plans', JSON.stringify(providerPlans));
      localStorage.setItem('hg_dispatch_notifications', JSON.stringify(dispatchNotifications));
      localStorage.setItem('hg_dispatch_timeout', String(dispatchTimeoutMinutes));
      localStorage.setItem('hg_lead_quotes', JSON.stringify(leadQuotes));
      localStorage.setItem('hg_tiffin_menus', JSON.stringify(tiffinMenus));
      localStorage.setItem('hg_wallet_txns', JSON.stringify(walletTransactions));
      localStorage.setItem('hg_chat_messages', JSON.stringify(chatMessages));
      localStorage.setItem('hg_fee_rules', JSON.stringify(platformFeeRules));
      localStorage.setItem('hg_service_requests', JSON.stringify(serviceRequests));
      localStorage.setItem('hg_reviews', JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [
    currentUser,
    users,
    orders,
    subscriptions,
    providers,
    services,
    categories,
    serviceTypes,
    jobRequests,
    recurringSchedules,
    providerMemberships,
    providerPlans,
    dispatchNotifications,
    dispatchTimeoutMinutes,
    leadQuotes,
    tiffinMenus,
    walletTransactions,
    chatMessages,
    platformFeeRules,
    serviceRequests,
    reviews,
  ]);

  const addNotification = (msg: string) => {
    setNotifications((prev) => [msg, ...prev.slice(0, 4)]);
  };

  const dismissNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  // --------------------------------------------------------------------------
  // WALLET HELPERS
  // --------------------------------------------------------------------------
  const getWalletBalance = (userId: string): number => {
    return walletTransactions
      .filter((t) => t.userId === userId)
      .reduce((sum, t) => {
        if (t.type === 'EARNED' || t.type === 'ADJUSTMENT') return sum + t.amount;
        if (t.type === 'REDEEMED' || t.type === 'EXPIRED') return sum - t.amount;
        return sum;
      }, 0);
  };

  const getWalletStreak = (userId: string) => {
    const completedCount = orders.filter(
      (o) => o.customerId === userId && o.status === 'COMPLETED',
    ).length;
    const nextStreakAt =
      (Math.floor(completedCount / PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL) + 1) *
      PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL;
    const remaining = nextStreakAt - completedCount;
    return { completedCount, nextStreakAt, remaining };
  };

  const addWalletTransaction = (txn: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
    const newTxn: WalletTransaction = {
      ...txn,
      id: `wt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWalletTransactions((prev) => [newTxn, ...prev]);
    // Also update user's walletBalance for currentUser (denormalized convenience)
    if (currentUser && currentUser.id === txn.userId) {
      const delta = txn.type === 'EARNED' || txn.type === 'ADJUSTMENT' ? txn.amount : -txn.amount;
      const updated = {
        ...currentUser,
        walletBalance: Math.max(0, currentUser.walletBalance + delta),
      };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    }
    return newTxn;
  };

  // --------------------------------------------------------------------------
  // CHAT
  // --------------------------------------------------------------------------
  const sendChatMessage = (
    orderId: string,
    text: string,
  ): { success: boolean; blocked?: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    // Check if chat is allowed
    const allowedStatuses: OrderStatus[] = [
      'PENDING',
      'ACCEPTED',
      'SCHEDULED',
      'IN_PROGRESS',
      'COMPLETED',
      'DISPUTED',
    ];
    if (!allowedStatuses.includes(order.status)) {
      return { success: false, message: 'Chat is not available for this order status.' };
    }

    // Check read-only window after completion
    if (order.status === 'COMPLETED') {
      const completedAt = new Date(order.updatedAt).getTime();
      const daysSinceCompletion = (Date.now() - completedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceCompletion > PLATFORM_CONFIG.CHAT_READ_ONLY_DAYS_AFTER_COMPLETION) {
        return {
          success: false,
          message: 'Chat is read-only. The order was completed more than 7 days ago.',
        };
      }
    }

    // Filter for contact details
    const filterResult = filterContactDetails(text);
    if (filterResult.blocked) {
      // Save flagged attempt (not delivered to other party)
      const flaggedMsg: ChatMessage = {
        id: `chat-${Date.now()}`,
        orderId,
        senderId: currentUser.id,
        senderRole: currentUser.role,
        text: '[BLOCKED]',
        createdAt: new Date().toISOString(),
        isFlagged: true,
        flaggedReason: text, // store original text for admin
      };
      setChatMessages((prev) => [...prev, flaggedMsg]);
      return {
        success: false,
        blocked: true,
        message:
          'For your safety and to keep your booking protected, please keep contact details inside LocalNest.',
      };
    }

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      orderId,
      senderId: currentUser.id,
      senderRole: currentUser.role,
      text,
      createdAt: new Date().toISOString(),
      isFlagged: false,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    return { success: true, message: 'Message sent.' };
  };

  const getOrderMessages = (orderId: string): ChatMessage[] => {
    // Non-admins see only unflagged messages for their order
    if (currentUser?.role === 'ADMIN') {
      return chatMessages.filter((m) => m.orderId === orderId);
    }
    return chatMessages.filter((m) => m.orderId === orderId && !m.isFlagged);
  };

  const markFlaggedReviewed = (messageId: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, flaggedReason: `[REVIEWED] ${m.flaggedReason}` } : m,
      ),
    );
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION LOGIC
  // --------------------------------------------------------------------------
  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return {
        success: false,
        message: 'No account found with this email. Please check or register.',
      };
    }

    if (password && user.password && user.password !== password) {
      return {
        success: false,
        message: 'Invalid password. Please try again or use the test credentials.',
      };
    }

    setCurrentUser(user);
    if (user.providerId) {
      setActiveProviderId(user.providerId);
    }
    if (user.societyId) {
      const s = societies.find((soc) => soc.id === user.societyId);
      if (s) setSelectedSociety(s);
    }

    addNotification(`Signed in successfully as ${user.fullName} (${user.role}).`);
    return { success: true, message: 'Login successful.', user };
  };

  const loginWithGoogle = (
    roleChoice: 'CUSTOMER' | 'PROVIDER',
    googleEmail?: string,
    googleName?: string,
  ) => {
    const email = (
      googleEmail ||
      (roleChoice === 'CUSTOMER' ? 'rahul.google@gmail.com' : 'rajesh.google@gmail.com')
    ).toLowerCase();
    const name = googleName || (roleChoice === 'CUSTOMER' ? 'Yash Khandagale' : 'Rajesh Kumar');

    const existing = users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      setCurrentUser(existing);
      if (existing.providerId) setActiveProviderId(existing.providerId);
      if (existing.societyId) {
        const s = societies.find((soc) => soc.id === existing.societyId);
        if (s) setSelectedSociety(s);
      }
      addNotification(`Signed in with Google as ${existing.fullName}.`);
      return { success: true, user: existing, needsOnboarding: !existing.isOnboarded };
    }

    const newUser: UserProfile = {
      id: `usr-g-${Date.now()}`,
      email,
      fullName: name,
      phone: '',
      role: roleChoice,
      societyId: selectedSociety.id,
      flatNumber: '',
      avatarUrl:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      isOnboarded: false,
      walletBalance: 0,
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    addNotification(`Google verification confirmed. Please complete the quick onboarding details.`);
    return { success: true, user: newUser, needsOnboarding: true };
  };

  const register = (params: {
    email: string;
    password?: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  }) => {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email already exists. Please log in.',
      };
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      password: params.password || 'password123',
      fullName: params.fullName,
      phone: params.phone || '',
      role: params.role,
      societyId: selectedSociety.id,
      flatNumber: '',
      isOnboarded: false,
      walletBalance: 0,
    };

    setUsers((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    addNotification(`Account registered! Please complete your society profile.`);
    return { success: true, user: newUser, message: 'Registration successful.' };
  };

  const logout = () => {
    setCurrentUser(null);
    addNotification('You have been signed out.');
  };

  // --------------------------------------------------------------------------
  // ONBOARDING LOGIC
  // --------------------------------------------------------------------------
  const completeResidentOnboarding = (data: {
    societyId: string;
    towerWing: string;
    flatNumber: string;
    phone: string;
    fullName: string;
  }) => {
    if (!currentUser) return;
    const soc = societies.find((s) => s.id === data.societyId) || selectedSociety;
    const flatCombined = `${data.towerWing} - ${data.flatNumber}`;

    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: data.fullName || currentUser.fullName,
      phone: data.phone,
      societyId: data.societyId,
      flatNumber: flatCombined,
      isOnboarded: true,
    };

    setCurrentUser(updatedUser);
    setSelectedSociety(soc);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    addNotification(
      `Welcome to ${soc.name}! Welcome coupon WELCOME100 is ready to use on your first booking.`,
    );
  };

  const completeProviderOnboarding = (data: {
    businessName: string;
    categoryId: string;
    phone: string;
    supportedSocieties: string[];
    description: string;
    serviceTitle: string;
    pricingModel: PricingModel;
    basePrice: number;
    unitName: string;
    documentType: string;
    documentName: string;
    acceptedTerms: boolean;
    baseLocation?: ProviderLocation;
    maxServiceDistanceKm?: number;
    coverageMode?: CoverageMode;
    excludedSocietyIds?: string[];
    maxOrdersPerDay?: number;
    freeServiceRadiusKm?: number;
    travelChargePerKm?: number;
    maxTravelCharge?: number;
  }) => {
    if (!currentUser) return;

    const newProviderId = `prov-${Date.now()}`;
    const cat = categories.find((c) => c.id === data.categoryId);
    const now = new Date().toISOString();

    const newProv: Provider = {
      id: newProviderId,
      userId: currentUser.id,
      businessName: data.businessName,
      categoryId: data.categoryId,
      categoryName: cat?.name || 'Home Services',
      description: data.description,
      phone: data.phone,
      status: 'PENDING',
      rating: 0,
      reviewCount: 0,
      completedOrders: 0,
      onTimeRate: 100,
      supportedSocieties:
        data.supportedSocieties.length > 0 ? data.supportedSocieties : [selectedSociety.id],
      startingPrice: data.basePrice,
      startingPriceUnit: data.unitName,
      acceptedTermsAt: data.acceptedTerms ? now : undefined,
      baseLocation: data.baseLocation,
      maxServiceDistanceKm: data.maxServiceDistanceKm ?? 10,
      coverageMode: data.coverageMode || 'RADIUS',
      excludedSocietyIds: data.excludedSocietyIds || [],
      maxOrdersPerDay: data.maxOrdersPerDay,
      freeServiceRadiusKm: data.freeServiceRadiusKm,
      travelChargePerKm: data.travelChargePerKm,
      maxTravelCharge: data.maxTravelCharge,
      documents: [{ type: data.documentType, url: data.documentName, verified: false }],
      avatarUrl:
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80',
    };

    const newSrv: Service = {
      id: `srv-${Date.now()}`,
      providerId: newProviderId,
      categoryId: data.categoryId,
      name: data.serviceTitle,
      description: data.description,
      pricingModel: data.pricingModel,
      basePrice: data.basePrice,
      unitName: data.unitName,
      isSubscriptionSupported: data.pricingModel === 'SUBSCRIPTION',
      isActive: true,
    };

    const updatedUser: UserProfile = {
      ...currentUser,
      phone: data.phone,
      providerId: newProviderId,
      isOnboarded: true,
    };

    setProviders((prev) => [newProv, ...prev]);
    setServices((prev) => [newSrv, ...prev]);
    setActiveProviderId(newProviderId);
    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));

    addNotification(
      `Provider profile created for ${data.businessName}. Your account is under verification by the society operations desk.`,
    );
  };

  // --------------------------------------------------------------------------
  // COMMISSION RESOLUTION (tiered with context)
  // --------------------------------------------------------------------------
  const getCommissionRateWithReason = (
    categoryId: string | undefined,
    providerId: string | undefined,
    customerId: string,
    pricingModel: PricingModel,
    existingOrders: Order[],
  ): { rate: number; reason: CommissionReason } => {
    const provider = providers.find((p) => p.id === providerId);
    const category = categories.find((c) => c.id === categoryId);
    return resolveCommissionRate({
      categoryId,
      categoryRate: category?.flatCommissionRate,
      monetization: category?.monetization,
      provider,
      customerId,
      pricingModel,
      existingOrders,
      commissionRules,
    });
  };

  // Coupon Validation Engine
  const validateCoupon = (code: string, subtotal: number, categoryId?: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid coupon code.' };
    }
    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: 'This coupon is no longer active.' };
    }
    if (coupon.societyId && coupon.societyId !== selectedSociety.id) {
      return { valid: false, discount: 0, message: 'This offer is not valid in your society.' };
    }
    if (coupon.categoryId && categoryId && coupon.categoryId !== categoryId) {
      return {
        valid: false,
        discount: 0,
        message: 'Coupon only applies to selected service categories.',
      };
    }
    if (subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`,
      };
    }
    if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
      return {
        valid: false,
        discount: 0,
        message: 'This coupon has reached its total usage limit.',
      };
    }

    let discount = 0;
    if (coupon.discountType === 'FLAT' || coupon.discountType === 'FIRST_ORDER') {
      discount = coupon.discountValue;
    } else if (coupon.discountType === 'PERCENTAGE' || coupon.discountType === 'SUBSCRIPTION') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    return {
      valid: true,
      discount,
      message: `Coupon "${coupon.code}" applied! You save ₹${discount}.`,
      coupon,
    };
  };

  // Create Order & Booking
  const createOrder = (params: {
    serviceId: string;
    scheduledDate: string;
    scheduledSlot: string;
    deliveryAddress: string;
    specialInstructions?: string;
    pricingModel: PricingModel;
    itemQuantity: number;
    subtotal: number;
    couponCode?: string;
    walletAmountToUse?: number;
    travelCharge?: number;
    isSubscription?: boolean;
    subscriptionFrequency?: 'DAILY' | 'MON_TO_SAT' | 'WEEKLY' | 'ALTERNATE_DAYS';
  }) => {
    const service = services.find((s) => s.id === params.serviceId);
    if (!service) return { success: false, message: 'Service not found.' };

    const provider = providers.find((p) => p.id === service.providerId);
    if (!provider) return { success: false, message: 'Provider not found.' };

    const custName = currentUser?.fullName || 'Yash Khandagale';
    const custPhone = currentUser?.phone || '+91 98765 43210';
    const custFlat = currentUser?.flatNumber || 'Tower A - 402';
    const custId = currentUser?.id || 'usr-customer-1';

    // Platform fee from configurable rules
    const platformFee = params.isSubscription
      ? platformFeeRules.subscriptionFee
      : platformFeeRules.oneTimeFee;

    const travelCharge = params.travelCharge || 0;

    let discountAmount = 0;
    let couponApplied: Coupon | undefined;

    if (params.couponCode) {
      const val = validateCoupon(params.couponCode, params.subtotal, service.categoryId);
      if (val.valid && val.coupon) {
        discountAmount = val.discount;
        couponApplied = val.coupon;
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === couponApplied?.id ? { ...c, currentUsage: c.currentUsage + 1 } : c,
          ),
        );
      }
    }

    // Wallet redemption — capped at 20% of subtotal
    const maxWalletRedemption = Math.floor(
      params.subtotal * PLATFORM_CONFIG.LOYALTY_REDEMPTION_CAP_RATIO,
    );
    const walletDiscount = Math.min(
      params.walletAmountToUse || 0,
      maxWalletRedemption,
      getWalletBalance(custId),
    );

    // Total includes travelCharge
    const totalAmount = Math.max(
      0,
      params.subtotal + platformFee + travelCharge - discountAmount - walletDiscount,
    );

    // Commission with tiered logic - COMMISSION ONLY APPLIES TO SUBTOTAL, NOT TRAVEL CHARGE
    const { rate: commRate, reason: commReason } = getCommissionRateWithReason(
      service.categoryId,
      provider.id,
      custId,
      params.pricingModel,
      orders,
    );
    const platformCommission = Math.round((params.subtotal * commRate) / 100);
    // Provider keeps 100% of travelCharge
    const providerEarnings = params.subtotal - platformCommission + travelCharge;

    const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderId = `ord-${Date.now()}`;

    const newOrder: Order = {
      id: newOrderId,
      orderNumber,
      customerId: custId,
      customerName: custName,
      customerPhone: custPhone,
      customerFlat: custFlat,
      providerId: provider.id,
      providerName: provider.businessName,
      serviceId: service.id,
      serviceName: service.name,
      categoryName: provider.categoryName || 'Home Services',
      societyId: selectedSociety.id,
      societyName: selectedSociety.name,
      status: 'PENDING',
      scheduledDate: params.scheduledDate,
      scheduledSlot: params.scheduledSlot,
      deliveryAddress: params.deliveryAddress || `${custFlat}, ${selectedSociety.name}`,
      specialInstructions: params.specialInstructions,
      pricingModel: params.pricingModel,
      itemQuantity: params.itemQuantity,
      subtotal: params.subtotal,
      platformFee,
      travelCharge: travelCharge > 0 ? travelCharge : undefined,
      couponCode: couponApplied?.code,
      discountAmount,
      discountSource: 'PLATFORM',
      walletDiscount: walletDiscount > 0 ? walletDiscount : undefined,
      totalAmount,
      commissionPercentage: commRate,
      commissionReason: commReason,
      platformCommission,
      providerEarnings,
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Deduct wallet if used
    if (walletDiscount > 0) {
      addWalletTransaction({
        userId: custId,
        type: 'REDEEMED',
        amount: walletDiscount,
        orderId: newOrderId,
        note: `Credits redeemed on order ${orderNumber}`,
      });
    }

    if (params.isSubscription) {
      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        customerId: custId,
        customerName: custName,
        customerFlat: custFlat,
        providerId: provider.id,
        providerName: provider.businessName,
        serviceId: service.id,
        serviceName: service.name,
        categoryName: provider.categoryName || 'Recurring Service',
        societyId: selectedSociety.id,
        status: 'ACTIVE',
        frequency: params.subscriptionFrequency || 'DAILY',
        scheduledTimeSlot: params.scheduledSlot,
        startDate: params.scheduledDate,
        nextServiceDate: params.scheduledDate,
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        monthlyPrice: params.subtotal,
        autoRenew: true,
        skippedDates: [],
        createdAt: new Date().toISOString(),
      };
      setSubscriptions((prev) => [newSub, ...prev]);
      addNotification(
        `New subscription started with ${provider.businessName}! Delivery begins ${params.scheduledDate}.`,
      );
    } else {
      addNotification(`Booking confirmed! Order #${orderNumber} sent to ${provider.businessName}.`);
    }

    return {
      success: true,
      orderId: newOrderId,
      orderNumber,
      message: 'Booking successfully placed with secure Razorpay payment!',
    };
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    rejectionReason?: string,
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          if (newStatus === 'COMPLETED' && ord.status !== 'COMPLETED') {
            setProviders((pList) =>
              pList.map((p) =>
                p.id === ord.providerId ? { ...p, completedOrders: p.completedOrders + 1 } : p,
              ),
            );
            // Earn wallet credits: 3% of subtotal, rounded down
            const earnAmount = Math.floor(ord.subtotal * PLATFORM_CONFIG.LOYALTY_EARN_RATE);
            if (earnAmount > 0) {
              addWalletTransaction({
                userId: ord.customerId,
                type: 'EARNED',
                amount: earnAmount,
                orderId: ord.id,
                note: `${Math.round(PLATFORM_CONFIG.LOYALTY_EARN_RATE * 100)}% loyalty reward on order ${ord.orderNumber}`,
              });
            }
            // Streak bonus: every Nth completed order
            const prevCompleted = orders.filter(
              (o) => o.customerId === ord.customerId && o.status === 'COMPLETED',
            ).length;
            const newCompleted = prevCompleted + 1;
            if (newCompleted % PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL === 0) {
              addWalletTransaction({
                userId: ord.customerId,
                type: 'ADJUSTMENT',
                amount: PLATFORM_CONFIG.LOYALTY_STREAK_BONUS,
                orderId: ord.id,
                note: `Streak bonus! ${newCompleted}th completed order milestone`,
              });
              addNotification(
                `🎉 Streak achieved! ₹${PLATFORM_CONFIG.LOYALTY_STREAK_BONUS} LocalNest credits added to your wallet!`,
              );
            }
          }
          return {
            ...ord,
            status: newStatus,
            rejectionReason: rejectionReason || ord.rejectionReason,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      }),
    );
    if (newStatus === 'REJECTED') {
      addNotification(
        `Order request declined${rejectionReason ? `: ${rejectionReason}` : ''}. Resident notified and refund initiated.`,
      );
    } else {
      addNotification(`Order status updated to ${newStatus.replace('_', ' ')}.`);
    }
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'CANCELLED',
            updatedAt: new Date().toISOString(),
            specialInstructions: reason
              ? `${ord.specialInstructions || ''} [Cancellation: ${reason}]`
              : ord.specialInstructions,
          };
        }
        return ord;
      }),
    );
    addNotification('Order has been cancelled. Any eligible refund will be credited to source.');
  };

  const updateSubscriptionStatus = (subscriptionId: string, status: SubscriptionStatus) => {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === subscriptionId ? { ...sub, status } : sub)),
    );
    addNotification(`Subscription status updated to ${status}.`);
  };

  const pauseSubscription = (subscriptionId: string, pausedUntil: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? { ...sub, status: 'PAUSED' as SubscriptionStatus, pausedUntil }
          : sub,
      ),
    );
    addNotification(`Subscription paused until ${new Date(pausedUntil).toLocaleDateString()}.`);
  };

  const resumeSubscription = (subscriptionId: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? { ...sub, status: 'ACTIVE' as SubscriptionStatus, pausedUntil: undefined }
          : sub,
      ),
    );
    addNotification('Subscription resumed successfully.');
  };

  const skipNextDelivery = (subscriptionId: string, dateToSkip: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscriptionId
          ? { ...sub, skippedDates: [...(sub.skippedDates || []), dateToSkip] }
          : sub,
      ),
    );
    addNotification(`Delivery on ${new Date(dateToSkip).toLocaleDateString()} has been skipped.`);
  };

  const submitReview = (
    orderIdOrParams:
      | string
      | {
          orderId: string;
          providerId: string;
          rating: number;
          comment: string;
          tags?: string[];
          customerFlat?: string;
          privacyOption?: 'FULL_FLAT' | 'TOWER_ONLY' | 'ANONYMOUS';
        },
    argProviderId?: string,
    argRating?: number,
    argComment?: string,
    argTags?: string[],
    argCustomerFlat?: string,
  ) => {
    const isObj = typeof orderIdOrParams === 'object';
    const orderId = isObj ? orderIdOrParams.orderId : orderIdOrParams;
    const providerId = isObj ? orderIdOrParams.providerId : argProviderId || '';
    const rating = isObj ? orderIdOrParams.rating : argRating || 5;
    const comment = isObj ? orderIdOrParams.comment : argComment || '';
    const tags = isObj ? orderIdOrParams.tags : argTags;
    const customerFlat = isObj ? orderIdOrParams.customerFlat : argCustomerFlat;
    const privacyOption = isObj ? orderIdOrParams.privacyOption : 'FULL_FLAT';

    const order = orders.find((o) => o.id === orderId);
    if (
      currentUser?.role !== 'CUSTOMER' ||
      !order ||
      order.customerId !== currentUser.id ||
      order.status !== 'COMPLETED'
    ) {
      return { success: false, message: 'Reviews can only be submitted for completed orders.' };
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || providerId !== order.providerId) {
      return { success: false, message: 'Review rating or provider is invalid.' };
    }
    const alreadyReviewed = reviews.some((r) => r.orderId === orderId);
    if (alreadyReviewed) {
      return { success: false, message: 'You have already submitted a review for this order.' };
    }

    const flatStr = customerFlat || order.customerFlat || currentUser?.flatNumber || '';
    let displayName = currentUser?.fullName || order.customerName || 'Verified Resident';
    let displayFlat = flatStr;

    if (privacyOption === 'TOWER_ONLY' && flatStr) {
      const towerMatch =
        flatStr.match(/Tower\s+[A-Za-z0-9]+/i) || flatStr.match(/Wing\s+[A-Za-z0-9]+/i);
      displayFlat = towerMatch ? `${towerMatch[0]} Resident` : 'Society Resident';
    } else if (privacyOption === 'ANONYMOUS') {
      displayName = 'Verified Resident';
      displayFlat = 'Greenfield Neighbor';
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      orderId,
      customerId: currentUser?.id || order.customerId || 'usr-customer-1',
      customerName: displayName,
      customerFlat: displayFlat,
      societyId: order.societyId || selectedSociety.id,
      societyName: order.societyName || selectedSociety.name,
      serviceName: order.serviceName,
      providerId,
      rating,
      comment: anonymizeFeedbackComment(comment, [
        ...users.map((user) => user.fullName),
        ...providers.map((provider) => provider.businessName),
      ]),
      tags: tags && tags.length > 0 ? tags : undefined,
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [newReview, ...prev]);

    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === providerId) {
          const provReviews = [...reviews.filter((r) => r.providerId === providerId), newReview];
          const avg = provReviews.reduce((sum, r) => sum + r.rating, 0) / provReviews.length;
          return {
            ...p,
            rating: Number(avg.toFixed(1)),
            reviewCount: provReviews.length,
          };
        }
        return p;
      }),
    );

    addNotification('Thank you! Your verified neighbor review and rating have been posted.');
    return { success: true, message: 'Review successfully recorded.' };
  };

  const respondToReview = (reviewId: string, replyComment: string) => {
    if (!replyComment.trim()) {
      return { success: false, message: 'Response cannot be empty.' };
    }
    const review = reviews.find((item) => item.id === reviewId);
    if (
      currentUser?.role !== 'PROVIDER' ||
      !review ||
      providers.find((provider) => provider.id === review.providerId)?.id !== currentUser.providerId
    ) {
      return {
        success: false,
        message: 'Only the reviewed provider can respond to this feedback.',
      };
    }
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            providerResponse: {
              comment: replyComment.trim(),
              respondedAt: new Date().toISOString(),
            },
          };
        }
        return r;
      }),
    );
    addNotification('Your response to the neighbor review has been published.');
    return { success: true, message: 'Response published successfully.' };
  };

  const createComplaint = (orderId: string, category: string, description: string) => {
    const order = orders.find((o) => o.id === orderId);
    const ticketNumber = `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newComp: Complaint = {
      id: `comp-${Date.now()}`,
      ticketNumber,
      customerId: order?.customerId || currentUser?.id || 'usr-customer-1',
      customerName: order?.customerName || currentUser?.fullName || 'Resident',
      providerId: order?.providerId || 'prov-raj-laundry',
      providerName: order?.providerName || 'Local Provider',
      orderId,
      orderNumber: order?.orderNumber || 'ORD-N/A',
      category,
      description,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) => [newComp, ...prev]);
    if (order && order.status !== 'COMPLETED') {
      updateOrderStatus(orderId, 'DISPUTED');
    }
    addNotification(
      `Support ticket #${ticketNumber} created. Our team will review within 2 hours.`,
    );
    return { success: true, ticketNumber };
  };

  const updateComplaintStatus = (
    ticketId: string,
    status: ComplaintStatus,
    resolution?: string,
    adminNotes?: string,
    resolutionType?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'FREE_REWORK' | 'MEDIATED_DISMISSED',
    refundAmount?: number,
  ) => {
    const complaint = complaints.find((c) => c.id === ticketId);
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === ticketId
          ? {
              ...c,
              status,
              resolution: resolution || c.resolution,
              adminNotes: adminNotes || c.adminNotes,
              resolutionType: resolutionType || c.resolutionType,
              refundAmount: refundAmount !== undefined ? refundAmount : c.refundAmount,
              resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : c.resolvedAt,
              resolvedBy: currentUser?.fullName || 'Marketplace Operations Desk',
            }
          : c,
      ),
    );

    // If full refund, update corresponding order and reverse wallet credits if any were earned
    if (complaint && (resolutionType === 'FULL_REFUND' || resolutionType === 'PARTIAL_REFUND')) {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === complaint.orderId || o.orderNumber === complaint.orderNumber) {
            return {
              ...o,
              paymentStatus: 'REFUNDED',
              status: 'REFUNDED' as OrderStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return o;
        }),
      );

      // Reverse any wallet credits earned on the refunded order
      const earnedOnOrder = walletTransactions.filter(
        (t) => t.orderId === complaint.orderId && t.type === 'EARNED',
      );
      earnedOnOrder.forEach((t) => {
        addWalletTransaction({
          userId: t.userId,
          type: 'ADJUSTMENT',
          amount: -t.amount,
          orderId: t.orderId,
          note: `Credits reversed due to refund on ${complaint.orderNumber}`,
        });
      });

      addNotification(`Refund of ₹${refundAmount || 'full amount'} approved and processing.`);
    }
    addNotification(`Support ticket #${complaint?.ticketNumber} status updated to ${status}.`);
  };

  const updateProviderServiceArea = (
    providerId: string,
    data: {
      baseLocation?: ProviderLocation;
      maxServiceDistanceKm?: number;
      coverageMode?: CoverageMode;
      supportedSocieties?: string[];
      excludedSocietyIds?: string[];
      maxOrdersPerDay?: number;
      freeServiceRadiusKm?: number;
      travelChargePerKm?: number;
      maxTravelCharge?: number;
    },
  ) => {
    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === providerId) {
          return {
            ...p,
            ...data,
            supportedSocieties: data.supportedSocieties || p.supportedSocieties,
          };
        }
        return p;
      }),
    );
    addNotification('Service area and travel distance settings updated.');
  };

  const updateProviderCapabilities = (
    providerId: string,
    serviceTypeIds: string[],
    taskIds: string[],
  ) => {
    if (
      currentUser?.role !== 'PROVIDER' ||
      currentUser.providerId !== providerId ||
      activeProviderId !== providerId
    )
      return;
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === providerId
          ? {
              ...provider,
              enabledServiceTypeIds: [...new Set(serviceTypeIds)],
              enabledTaskIds: [...new Set(taskIds)],
            }
          : provider,
      ),
    );
    addNotification('Provider service types and skills updated.');
  };

  const settleCookMissingIngredients = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (
      currentUser?.role !== 'PROVIDER' ||
      !order ||
      order.providerId !== activeProviderId ||
      order.status !== 'COMPLETED' ||
      order.cookMissingIngredients ||
      order.pricingModel !== 'TICK_WHAT_YOU_WANT'
    ) {
      return {
        success: false,
        error: 'This completed cook job is not eligible for an ingredient settlement.',
      };
    }
    const job = jobRequests.find((item) => item.orderId === orderId);
    if (job?.categoryId !== 'cat-cook')
      return { success: false, error: 'This settlement only applies to Cook (Basic) jobs.' };
    const settlement = calculateMissingIngredientsSettlement(
      order.totalAmount,
      order.providerEarnings,
    );
    setOrders((prev) =>
      prev.map((item) =>
        item.id === orderId
          ? {
              ...item,
              cookMissingIngredients: true,
              providerEarnings: settlement.adjustedProviderPayout,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    addWalletTransaction({
      userId: order.customerId,
      type: 'ADJUSTMENT',
      amount: settlement.residentCredit,
      orderId,
      note: 'Partial LocalNest credit: ingredients were not ready for the cook visit.',
    });
    addNotification(
      `Cook settlement applied: ₹${settlement.residentCredit} resident credit; provider payout reduced.`,
    );
    return { success: true };
  };

  const saveCookMealPhoto = (orderId: string, photoUrl: string) => {
    const order = orders.find((item) => item.id === orderId);
    const job = jobRequests.find((item) => item.orderId === orderId);
    const isInlineImage =
      /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/]+=*$/i.test(photoUrl) &&
      photoUrl.length <= 160_000;
    let validUrl = false;
    if (!isInlineImage) {
      try {
        const url = new URL(photoUrl);
        validUrl = ['https:', 'http:'].includes(url.protocol);
      } catch {
        validUrl = false;
      }
    }
    if (
      currentUser?.role !== 'PROVIDER' ||
      !order ||
      order.providerId !== activeProviderId ||
      order.status !== 'COMPLETED' ||
      job?.categoryId !== 'cat-cook' ||
      (!isInlineImage && !validUrl)
    ) {
      return {
        success: false,
        error: 'Only the assigned provider can add a finished-meal photo to a completed Cook job.',
      };
    }
    setOrders((prev) =>
      prev.map((item) =>
        item.id === orderId
          ? { ...item, mealPhotoUrl: photoUrl, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    addNotification(`Finished-meal photo saved for order ${order.orderNumber}.`);
    return { success: true };
  };

  const createServiceRequest = (params: {
    societyId: string;
    societyName: string;
    categoryId: string;
    categoryName: string;
    notes?: string;
  }) => {
    const newReq: SocietyServiceRequest = {
      id: `req-${Date.now()}`,
      societyId: params.societyId,
      societyName: params.societyName,
      categoryId: params.categoryId,
      categoryName: params.categoryName,
      userId: currentUser?.id || 'usr-guest',
      userName: currentUser?.fullName || 'Resident',
      createdAt: new Date().toISOString(),
      notes: params.notes,
    };
    setServiceRequests((prev) => [newReq, ...prev]);
    addNotification(
      `Demand registered for ${params.categoryName} in ${params.societyName}. Operations desk will recruit providers for your cluster.`,
    );
    return { success: true, message: 'Request submitted successfully' };
  };

  const updateProviderAvailability = (
    providerId: string,
    workingHours: { start: string; end: string; daysOff: string[] },
    isVacationMode: boolean,
    vacationReason?: string,
  ) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              workingHours,
              isVacationMode,
              vacationReason: vacationReason !== undefined ? vacationReason : p.vacationReason,
            }
          : p,
      ),
    );
    addNotification(
      isVacationMode
        ? 'Vacation Mode enabled. New bookings are paused.'
        : 'Provider working hours and active schedule updated.',
    );
  };

  const requestPayout = (
    providerId: string,
    amount: number,
    method: 'UPI' | 'BANK_NEFT',
    accountDetails: string,
  ) => {
    const prov = providers.find((p) => p.id === providerId);
    const newPayout: PayoutRecord = {
      id: `pay-${Date.now()}`,
      providerId,
      providerName: prov?.businessName || 'Provider',
      amount,
      method,
      accountDetails,
      status: 'PROCESSING',
      requestedAt: new Date().toISOString(),
      referenceId: `${method}-${Math.floor(10000000 + Math.random() * 90000000)}`,
    };
    setPayouts((prev) => [newPayout, ...prev]);
    addNotification(
      `Withdrawal request of ₹${amount} initiated! Payout reference: ${newPayout.referenceId}`,
    );
    return { success: true, message: `Withdrawal initiated for ₹${amount}` };
  };

  const updateProviderStatus = (
    providerId: string,
    status: Provider['status'],
    _reason?: string,
  ) => {
    const provider = providers.find((item) => item.id === providerId);
    const category = provider && categories.find((item) => item.id === provider.categoryId);
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              status,
              verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : p.verifiedAt,
            }
          : p,
      ),
    );
    if (
      status === 'VERIFIED' &&
      category?.monetization === 'MEMBERSHIP' &&
      !providerMemberships.some((membership) => membership.providerId === providerId)
    ) {
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + 60);
      const plan =
        providerPlans.find(
          (item) => item.categoryGroupId === (category.membershipGroupId || 'trades'),
        ) || providerPlans.find((item) => item.isActive);
      const membership: ProviderMembership = {
        id: `mem-${providerId}`,
        providerId,
        categoryGroupId: category.membershipGroupId || plan?.categoryGroupId || 'trades',
        status: 'TRIAL',
        monthlyFee: plan?.monthlyFee ?? category.membershipMonthlyFee ?? 799,
        trialStartDate: now.toISOString().slice(0, 10),
        trialEndsAt: trialEnd.toISOString(),
        currentBillingPeriodStart: now.toISOString(),
        currentBillingPeriodEnd: trialEnd.toISOString(),
        gracePeriodEndsAt: new Date(
          trialEnd.getTime() + (plan?.gracePeriodDays ?? 5) * 24 * 60 * 60 * 1000,
        ).toISOString(),
        autoRenew: true,
        invoices: [],
        updatedAt: now.toISOString(),
      };
      setProviderMemberships((prev) => [...prev, membership]);
    }
    addNotification(`Provider verification status updated to ${status}.`);
  };

  const addService = (newService: Omit<Service, 'id'>) => {
    const id = `srv-${Date.now()}`;
    setServices((prev) => [...prev, { ...newService, id }]);
    addNotification(`Service "${newService.name}" created successfully.`);
  };

  const updateCommissionRule = (ruleId: string, percentage: number) => {
    setCommissionRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, commissionPercentage: percentage } : r)),
    );
    addNotification(`Commission rate updated to ${percentage}%.`);
  };

  const createCoupon = (coupon: Omit<Coupon, 'id' | 'currentUsage'>) => {
    const id = `cpn-${Date.now()}`;
    setCoupons((prev) => [...prev, { ...coupon, id, currentUsage: 0 }]);
    addNotification(`Coupon code "${coupon.code}" created.`);
  };

  const toggleCouponActive = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === couponId ? { ...c, isActive: !c.isActive } : c)),
    );
  };

  const addSociety = (society: Omit<Society, 'id'>) => {
    const id = `soc-${Date.now()}`;
    setSocieties((prev) => [...prev, { ...society, id }]);
    addNotification(`Society "${society.name}" registered to platform.`);
  };

  const updatePlatformFeeRules = (rules: PlatformFeeRules) => {
    setPlatformFeeRules(rules);
    addNotification(
      `Platform fee rules updated: One-time ₹${rules.oneTimeFee}, Subscription ₹${rules.subscriptionFee}.`,
    );
  };

  const createNotice = (params: {
    societyId: string;
    societyName: string;
    title: string;
    content: string;
    type: NoticeType;
    priority: 'NORMAL' | 'URGENT';
    authorName: string;
  }) => {
    const newNotice: SocietyNotice = {
      id: `notif-${Date.now()}`,
      societyId: params.societyId,
      societyName: params.societyName,
      title: params.title,
      content: params.content,
      type: params.type,
      priority: params.priority,
      authorName: params.authorName,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setNotices((prev) => [newNotice, ...prev]);
    const audience = params.societyId === 'ALL' ? 'All Societies' : params.societyName;
    addNotification(`Notice "${params.title}" posted to ${audience}.`);
  };

  const deactivateNotice = (noticeId: string) => {
    setNotices((prev) => prev.map((n) => (n.id === noticeId ? { ...n, isActive: false } : n)));
    addNotification('Notice has been deactivated.');
  };

  // --------------------------------------------------------------------------
  // UBER-STYLE DISPATCH & MONETIZATION ACTIONS
  // --------------------------------------------------------------------------
  const createJobRequest = (params: {
    serviceTypeId: string;
    scheduledDate: string;
    scheduledSlot: string;
    selectedTaskIds?: string[];
    sizeBandInput?: string;
    dishNotes?: string;
    kitchenReadinessConfirmed?: boolean;
    stylistGenderPreference?: 'ANY' | 'FEMALE' | 'MALE';
    residentPreferences?: ResidentBriefPreferences;
    excludedProviderIds?: string[];
    residentId?: string;
    societyId?: string;
    flatNumber?: string;
  }) => {
    if (currentUser?.role !== 'CUSTOMER')
      return { success: false, error: 'Sign in as a resident to request a service.' };
    const sType = serviceTypes.find((st) => st.id === params.serviceTypeId);
    if (!sType) return { success: false, error: 'Service type not found.' };

    const cat = categories.find((c) => c.id === sType.categoryId);
    if (!cat) return { success: false, error: 'Category not found.' };
    if (cat.isActive === false || sType.isActive === false)
      return { success: false, error: 'This service is currently unavailable.' };
    if (cat.matching !== 'DISPATCH' && !cat.supportsOneOffDispatch)
      return { success: false, error: 'This category uses a different booking flow.' };
    const scheduleError = validateAppointment(params.scheduledDate, params.scheduledSlot);
    if (scheduleError) return { success: false, error: scheduleError };

    const resident = users.find((u) => u.id === params.residentId) || currentUser;
    const resId = resident?.id || 'usr-customer-1';
    const soc = societies.find((society) => society.id === params.societyId) || selectedSociety;
    const resFlat = params.flatNumber || resident?.flatNumber || 'Tower A - 402';
    const selectedTaskIds = [...new Set(params.selectedTaskIds || [])];
    const availableTaskIds = new Set(sType.availableTasks.map((task) => task.id));
    if (selectedTaskIds.some((taskId) => !availableTaskIds.has(taskId))) {
      return { success: false, error: 'One or more selected tasks are no longer available.' };
    }
    if (
      sType.pricingModel === 'TICK_WHAT_YOU_WANT' &&
      sType.availableTasks.length &&
      !selectedTaskIds.length
    ) {
      return { success: false, error: 'Select at least one task.' };
    }
    if (sType.categoryId === 'cat-cook' && !params.kitchenReadinessConfirmed) {
      return { success: false, error: 'Confirm that ingredients, gas and cookware will be ready.' };
    }

    const pricing = calculateTickWhatYouWantPricing(
      sType,
      selectedTaskIds,
      params.sizeBandInput,
      params.dishNotes,
    );

    if (
      sType.sizeBands?.length &&
      !sType.sizeBands.some((band) => band.label === params.sizeBandInput)
    ) {
      return { success: false, error: 'Choose a valid household size.' };
    }
    const platformFee = platformFeeRules.oneTimeFee;
    const lockedSubtotal = pricing.subtotal;
    const totalResidentPrice = lockedSubtotal + platformFee;

    const categoryRule = commissionRules.find(
      (rule) => rule.ruleType === 'CATEGORY' && rule.targetId === cat.id && rule.isActive,
    );
    const commissionPct =
      cat.monetization === 'COMMISSION'
        ? (cat.flatCommissionRate ??
          categoryRule?.commissionPercentage ??
          PLATFORM_CONFIG.DEFAULT_COMMISSION_RATE)
        : 0;
    const platformCommission = Math.round((lockedSubtotal * commissionPct) / 100);
    const providerPayout = lockedSubtotal - platformCommission;

    const doorOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date().toISOString();
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const jobNumber = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newJob: JobRequest = {
      id: jobId,
      jobNumber,
      societyId: soc.id,
      societyName: soc.name,
      flatNumber: resFlat,
      residentId: resId,
      residentName: 'Resident',
      residentPhoneMasked: 'Contact available after acceptance in LocalNest',
      serviceTypeId: sType.id,
      serviceTypeName: sType.name,
      categoryId: cat.id,
      categoryName: cat.name,
      pricingModel: sType.pricingModel,
      status: 'OPEN',
      selectedTaskIds,
      taskBreakdown: pricing.taskBreakdown,
      sizeBandInput: params.sizeBandInput,
      dishNotes: params.dishNotes,
      kitchenReadinessConfirmed: params.kitchenReadinessConfirmed,
      stylistGenderPreference: params.stylistGenderPreference,
      excludedProviderIds: params.excludedProviderIds,
      scheduledDate: params.scheduledDate,
      scheduledSlot: params.scheduledSlot,
      estimatedDurationMinutes: pricing.durationMinutes,
      lockedSubtotal,
      platformFee,
      totalResidentPrice,
      platformCommission,
      providerPayout,
      residentPreferences: params.residentPreferences || resident?.preferences || {},
      doorOtp,
      notifiedProviderIds: [],
      expiresAt: new Date(Date.now() + dispatchTimeoutMinutes * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };

    const allCommitments = orders
      .filter((order) => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(order.status))
      .map((order) => ({
        providerId: order.providerId,
        date: order.scheduledDate,
        slot: order.scheduledSlot,
        durationMinutes:
          jobRequests.find((j) => j.orderId === order.id)?.estimatedDurationMinutes || 60,
      }));

    const eligibleProviders = providers.filter((p) => {
      if (params.excludedProviderIds?.includes(p.id)) return false;
      const mem = providerMemberships.find((m) => m.providerId === p.id) || p.membership;
      const res = isProviderEligibleForJob(p, mem, newJob, cat, allCommitments, societies);
      return res.eligible;
    });

    newJob.notifiedProviderIds = eligibleProviders.map((provider) => provider.id);

    setJobRequests((prev) => [newJob, ...prev]);
    setDispatchNotifications((prev) => [
      ...eligibleProviders.map((provider) => ({
        id: `dn-${jobId}-${provider.id}`,
        providerId: provider.id,
        jobRequestId: jobId,
        status: 'NEW' as const,
        createdAt: now,
      })),
      ...prev,
    ]);
    addNotification(
      eligibleProviders.length
        ? `Request ${jobNumber} broadcast to ${eligibleProviders.length} eligible providers.`
        : `Request ${jobNumber} is open, but no provider currently matches this slot. You can choose another time.`,
    );
    return { success: true, jobRequest: newJob };
  };

  const createLeadRequest = (params: {
    serviceTypeId: string;
    scheduledDate: string;
    scheduledSlot: string;
    requestNotes: string;
  }) => {
    const service = serviceTypes.find((item) => item.id === params.serviceTypeId);
    const category = service && categories.find((item) => item.id === service.categoryId);
    if (
      currentUser?.role !== 'CUSTOMER' ||
      !service ||
      !category ||
      category.isActive === false ||
      service.isActive === false ||
      category.matching !== 'LEAD_QUOTE'
    ) {
      return { success: false, error: 'Choose an active lead / quote service.' };
    }
    if (!params.requestNotes.trim())
      return { success: false, error: 'Describe the project scope for providers.' };
    const scheduleError = validateAppointment(params.scheduledDate, params.scheduledSlot);
    if (scheduleError) return { success: false, error: scheduleError };
    const now = new Date().toISOString();
    const eligibleProviderIds = providers
      .filter((provider) => {
        if (provider.status !== 'VERIFIED' || provider.isVacationMode) return false;
        if (!provider.enabledServiceTypeIds?.includes(service.id)) return false;
        if (!isSocietyCovered(provider, selectedSociety, societies)) return false;
        const membership =
          providerMemberships.find((item) => item.providerId === provider.id) ||
          provider.membership;
        return (
          category.monetization !== 'MEMBERSHIP' ||
          Boolean(
            membership &&
            ['ACTIVE', 'TRIAL', 'GRACE'].includes(resolveMembershipStatus(membership)),
          )
        );
      })
      .map((provider) => provider.id);
    const job: JobRequest = {
      id: `lead-job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      jobNumber: `LEAD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      societyId: selectedSociety.id,
      societyName: selectedSociety.name,
      flatNumber: currentUser.flatNumber,
      residentId: currentUser.id,
      residentName: 'Resident',
      residentPhoneMasked: 'Contact through LocalNest',
      serviceTypeId: service.id,
      serviceTypeName: service.name,
      categoryId: category.id,
      categoryName: category.name,
      pricingModel: 'LEAD_QUOTE',
      requestType: 'LEAD',
      requestNotes: params.requestNotes.trim(),
      status: 'OPEN',
      selectedTaskIds: [],
      taskBreakdown: [],
      scheduledDate: params.scheduledDate,
      scheduledSlot: params.scheduledSlot,
      estimatedDurationMinutes: service.estimatedDurationMinutes,
      lockedSubtotal: 0,
      platformFee: 0,
      totalResidentPrice: 0,
      platformCommission: 0,
      providerPayout: 0,
      residentPreferences: currentUser.preferences || {},
      doorOtp: '',
      notifiedProviderIds: eligibleProviderIds,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now,
    };
    setJobRequests((prev) => [job, ...prev]);
    addNotification(
      `Project ${job.jobNumber} shared with ${eligibleProviderIds.length} eligible providers. Up to three quotes can respond.`,
    );
    return { success: true, jobRequest: job };
  };

  const publishTiffinMenu = (
    menu: Omit<TiffinMenu, 'id' | 'providerId' | 'createdAt' | 'isActive'>,
  ) => {
    const provider = providers.find((item) => item.id === activeProviderId);
    if (
      currentUser?.role !== 'PROVIDER' ||
      currentUser.providerId !== provider?.id ||
      !provider ||
      provider.status !== 'VERIFIED' ||
      provider.categoryId !== 'cat-tiffin'
    ) {
      return { success: false, error: 'Only a verified Tiffin provider can publish a menu.' };
    }
    const deliveryDate = new Date(`${menu.deliveryDate}T12:00:00`);
    if (
      !menu.mealName.trim() ||
      menu.price <= 0 ||
      !Number.isInteger(menu.availableQuantity) ||
      menu.availableQuantity < 1 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(menu.deliveryDate) ||
      menu.deliveryDate < formatLocalDate(new Date()) ||
      !Number.isFinite(deliveryDate.getTime()) ||
      formatLocalDate(deliveryDate) !== menu.deliveryDate ||
      !Number.isFinite(new Date(menu.cutoffAt).getTime()) ||
      new Date(menu.cutoffAt).getTime() <= Date.now() ||
      new Date(menu.cutoffAt).getTime() > new Date(`${menu.deliveryDate}T23:59:59`).getTime() ||
      !menu.societyIds.length
    ) {
      return {
        success: false,
        error:
          'Provide a meal name, positive price, stock, a society, a delivery date from today onward and a future cutoff no later than delivery day.',
      };
    }
    const created: TiffinMenu = {
      ...menu,
      id: `menu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      providerId: provider.id,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setTiffinMenus((prev) => [created, ...prev]);
    addNotification('Today’s Tiffin menu is available to residents in the selected societies.');
    return { success: true };
  };

  const orderTiffinMenu = (
    menuId: string,
    quantity: number,
    deliveryDate = formatLocalDate(new Date()),
    societyId = selectedSociety.id,
  ) => {
    const menu = tiffinMenus.find((item) => item.id === menuId);
    const provider = menu && providers.find((item) => item.id === menu.providerId);
    if (
      currentUser?.role !== 'CUSTOMER' ||
      !menu ||
      !provider ||
      provider.status !== 'VERIFIED' ||
      !menu.isActive
    )
      return { success: false, error: 'Menu is unavailable.' };
    if (!menu.societyIds.includes(societyId))
      return { success: false, error: 'This menu is not available in the resident’s society.' };
    const cutoffAt = new Date(menu.cutoffAt).getTime();
    if (
      menu.deliveryDate !== deliveryDate ||
      deliveryDate < formatLocalDate(new Date()) ||
      !Number.isFinite(cutoffAt) ||
      cutoffAt <= Date.now()
    ) {
      return { success: false, error: 'The ordering cutoff for this menu has passed.' };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > menu.availableQuantity) {
      return { success: false, error: 'Requested quantity is not available.' };
    }
    const category = categories.find((item) => item.id === 'cat-tiffin');
    const society = societies.find((item) => item.id === societyId);
    if (!society) return { success: false, error: 'The resident’s society could not be found.' };
    const subtotal = menu.price * quantity;
    const commissionRate = category?.flatCommissionRate ?? PLATFORM_CONFIG.DEFAULT_COMMISSION_RATE;
    const now = new Date().toISOString();
    const order: Order = {
      id: `ord-menu-${Date.now()}`,
      orderNumber: `TIF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: currentUser.id,
      customerName: 'Resident',
      customerPhone: 'Contact through LocalNest',
      customerFlat: currentUser.flatNumber,
      providerId: provider.id,
      providerName: provider.businessName,
      serviceId: menu.id,
      serviceName: menu.mealName,
      categoryName: category?.name || 'Daily Tiffin',
      societyId: society.id,
      societyName: society.name,
      status: 'ACCEPTED',
      scheduledDate: menu.deliveryDate,
      scheduledSlot: 'Meal delivery',
      deliveryAddress: `${currentUser.flatNumber}, ${society.name}`,
      pricingModel: 'FIXED',
      itemQuantity: quantity,
      subtotal,
      platformFee: platformFeeRules.oneTimeFee,
      totalAmount: subtotal + platformFeeRules.oneTimeFee,
      commissionPercentage: commissionRate,
      commissionReason: 'CATEGORY_RULE',
      platformCommission: Math.round((subtotal * commissionRate) / 100),
      providerEarnings: subtotal - Math.round((subtotal * commissionRate) / 100),
      paymentStatus: 'PAID',
      discountAmount: 0,
      discountSource: 'PLATFORM',
      createdAt: now,
      updatedAt: now,
    };
    setTiffinMenus((prev) =>
      prev.map((item) =>
        item.id === menuId
          ? {
              ...item,
              availableQuantity: item.availableQuantity - quantity,
              isActive: item.availableQuantity - quantity > 0,
            }
          : item,
      ),
    );
    setOrders((prev) => [order, ...prev]);
    addNotification(`Tiffin order ${order.orderNumber} confirmed in mock escrow.`);
    return { success: true, order };
  };

  const claimJob = (jobId: string, providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (!provider) return { success: false, status: 'NOT_FOUND', error: 'Provider not found.' };
    if (
      currentUser?.role !== 'PROVIDER' ||
      currentUser.providerId !== providerId ||
      activeProviderId !== providerId
    ) {
      return {
        success: false,
        status: 'INELIGIBLE',
        error: 'Only the signed-in provider can accept this request.',
      };
    }
    const job = jobRequests.find((request) => request.id === jobId);
    if (!job) return { success: false, status: 'NOT_FOUND', error: 'Job request not found.' };
    if (!job.notifiedProviderIds.includes(providerId)) {
      return {
        success: false,
        status: 'INELIGIBLE',
        error: 'This request was not offered to this provider.',
      };
    }
    const category = categories.find((item) => item.id === job.categoryId);
    if (!category)
      return { success: false, status: 'INELIGIBLE', error: 'The job category is unavailable.' };
    const commitments = orders
      .filter(
        (order) =>
          order.providerId === providerId &&
          !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(order.status),
      )
      .map((order) => ({
        providerId: order.providerId,
        date: order.scheduledDate,
        slot: order.scheduledSlot,
        durationMinutes:
          jobRequests.find((request) => request.orderId === order.id)?.estimatedDurationMinutes ||
          60,
      }));
    const eligibility = isProviderEligibleForJob(
      provider,
      providerMemberships.find((membership) => membership.providerId === providerId) ||
        provider.membership,
      job,
      category,
      commitments,
      societies,
    );
    if (!eligibility.eligible) {
      return {
        success: false,
        status: 'INELIGIBLE',
        error: `This request is no longer available to you (${eligibility.reason || 'eligibility changed'}).`,
      };
    }

    const result = atomicClaimJob(
      jobId,
      providerId,
      provider,
      jobRequests,
      orders,
      (updatedJobs, newOrder) => {
        setJobRequests(updatedJobs);
        setOrders((prev) => [newOrder, ...prev]);
        setDispatchNotifications((prev) =>
          prev.map((notification) =>
            notification.jobRequestId === jobId
              ? {
                  ...notification,
                  status: providerId === notification.providerId ? 'CLAIMED' : 'EXPIRED',
                }
              : notification,
          ),
        );
      },
    );

    if (result.success && result.createdOrder) {
      addNotification(
        `You accepted Job #${result.claimedJob?.jobNumber}! Assigned to ${result.claimedJob?.flatNumber}. Door OTP required on entry.`,
      );
      return { success: true, status: 'CLAIMED', order: result.createdOrder };
    } else {
      return { success: false, status: result.status, error: result.message };
    }
  };

  const verifyDoorOtp = (orderId: string, enteredOtp: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };
    if (currentUser?.role !== 'PROVIDER' || order.providerId !== activeProviderId) {
      return { success: false, error: 'Only the assigned provider can verify the door OTP.' };
    }
    const job = jobRequests.find((request) => request.orderId === orderId);

    if (
      !job ||
      job.status !== 'CLAIMED' ||
      job.claimedByProviderId !== activeProviderId ||
      order.status !== 'ACCEPTED'
    ) {
      return { success: false, error: 'This order is not awaiting OTP verification.' };
    }
    if (
      !/^\d{4}$/.test(enteredOtp.trim()) ||
      !job.doorOtp ||
      job.doorOtp.trim() !== enteredOtp.trim()
    ) {
      return {
        success: false,
        error: 'Incorrect 4-digit Door OTP. Ask the resident for the code on their screen.',
      };
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              isDoorOtpVerified: true,
              status: 'IN_PROGRESS',
            }
          : o,
      ),
    );

    addNotification(`Door OTP verified for order ${order.orderNumber}! Service started.`);
    return { success: true };
  };

  const cancelJobRequest = (jobId: string, reason?: string) => {
    const job = jobRequests.find((request) => request.id === jobId);
    if (!job || job.status !== 'OPEN' || job.residentId !== currentUser?.id) return;
    const now = new Date().toISOString();
    setJobRequests((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'CANCELLED',
              cancelledBy: 'RESIDENT',
              cancelReason: reason || 'Cancelled by resident',
              updatedAt: now,
            }
          : j,
      ),
    );
    setDispatchNotifications((prev) =>
      prev.map((n) => (n.jobRequestId === jobId ? { ...n, status: 'CANCELLED' } : n)),
    );
    addNotification(`Job request cancelled.`);
  };

  const expireJobRequest = (jobId: string) => {
    const job = jobRequests.find((request) => request.id === jobId);
    if (!job || job.status !== 'OPEN' || new Date(job.expiresAt).getTime() > Date.now())
      return false;
    if (
      walletTransactions.some(
        (transaction) =>
          transaction.orderId === jobId && transaction.note.includes('mock escrow refund'),
      )
    )
      return false;
    const now = new Date().toISOString();
    setJobRequests((prev) =>
      prev.map((request) =>
        request.id === jobId ? { ...request, status: 'EXPIRED', updatedAt: now } : request,
      ),
    );
    setDispatchNotifications((prev) =>
      prev.map((n) => (n.jobRequestId === jobId ? { ...n, status: 'EXPIRED' } : n)),
    );
    addWalletTransaction({
      userId: job.residentId,
      type: 'ADJUSTMENT',
      amount: job.totalResidentPrice,
      orderId: job.id,
      note: `Dispatch request ${job.jobNumber} expired; mock escrow refund`,
    });
    addNotification(
      `Request ${job.jobNumber} expired. ₹${job.totalResidentPrice} was returned as LocalNest credit; choose another slot to retry.`,
    );
    return true;
  };

  const cancelClaimedJob = (jobId: string, providerId: string, reason?: string) => {
    const job = jobRequests.find((request) => request.id === jobId);
    const order = job?.orderId ? orders.find((item) => item.id === job.orderId) : undefined;
    const provider = providers.find((item) => item.id === providerId);
    if (
      currentUser?.role !== 'PROVIDER' ||
      currentUser.providerId !== providerId ||
      activeProviderId !== providerId ||
      !job ||
      job.status !== 'CLAIMED' ||
      job.claimedByProviderId !== providerId ||
      !order ||
      !provider
    ) {
      return {
        success: false,
        error: 'This accepted request cannot be cancelled by this provider.',
      };
    }
    const now = new Date().toISOString();
    const updatedJob: JobRequest = {
      ...job,
      status: 'OPEN',
      claimedByProviderId: undefined,
      claimedAt: undefined,
      orderId: undefined,
      notifiedProviderIds: [],
      expiresAt: new Date(Date.now() + dispatchTimeoutMinutes * 60 * 1000).toISOString(),
      rejectionReason: reason || 'Provider cancelled after accepting',
      updatedAt: now,
    };
    const category = categories.find((item) => item.id === job.categoryId);
    if (!category) return { success: false, error: 'Job category not found.' };
    const commitments = orders
      .filter((item) => item.providerId !== providerId || item.id !== order.id)
      .filter((item) => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(item.status))
      .map((item) => ({
        providerId: item.providerId,
        date: item.scheduledDate,
        slot: item.scheduledSlot,
        durationMinutes:
          jobRequests.find((request) => request.orderId === item.id)?.estimatedDurationMinutes ||
          60,
      }));
    const eligibleProviderIds = providers
      .filter((candidate) => candidate.id !== providerId)
      .filter(
        (candidate) =>
          isProviderEligibleForJob(
            candidate,
            providerMemberships.find((membership) => membership.providerId === candidate.id) ||
              candidate.membership,
            updatedJob,
            category,
            commitments,
            societies,
          ).eligible,
      )
      .map((candidate) => candidate.id);
    updatedJob.notifiedProviderIds = eligibleProviderIds;
    setProviders((prev) =>
      prev.map((item) =>
        item.id === providerId
          ? { ...item, trustScore: Math.max(0, (item.trustScore ?? 100) - 10) }
          : item,
      ),
    );
    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              status: 'CANCELLED',
              updatedAt: now,
              rejectionReason: reason || 'Provider cancelled after accepting',
            }
          : item,
      ),
    );
    setJobRequests((prev) => prev.map((item) => (item.id === jobId ? updatedJob : item)));
    setDispatchNotifications((prev) => [
      ...eligibleProviderIds.map((id) => ({
        id: `dn-${jobId}-${Date.now()}-${id}`,
        providerId: id,
        jobRequestId: jobId,
        status: 'NEW' as const,
        createdAt: now,
      })),
      ...prev.filter((notification) => notification.jobRequestId !== jobId),
    ]);
    addNotification(
      `Provider cancellation was recorded, a reliability penalty applied, and ${eligibleProviderIds.length} other providers were notified.`,
    );
    return { success: true };
  };

  const cancelClaimedJobByResident = (jobId: string, reason?: string) => {
    const job = jobRequests.find((request) => request.id === jobId);
    if (!job || job.status !== 'CLAIMED' || job.residentId !== currentUser?.id || !job.orderId) {
      return { success: false, error: 'This request cannot be cancelled from this account.' };
    }
    cancelOrder(job.orderId, reason || 'Resident requested cancellation');
    setJobRequests((prev) =>
      prev.map((request) =>
        request.id === jobId
          ? {
              ...request,
              status: 'CANCELLED',
              cancelledBy: 'RESIDENT',
              cancelReason: reason || 'Resident requested cancellation',
              updatedAt: new Date().toISOString(),
            }
          : request,
      ),
    );
    setDispatchNotifications((prev) =>
      prev.map((notification) =>
        notification.jobRequestId === jobId
          ? { ...notification, status: 'CANCELLED' }
          : notification,
      ),
    );
    return { success: true };
  };

  const reDispatchJob = (jobId: string) => {
    const job = jobRequests.find((request) => request.id === jobId);
    if (!job || !['OPEN', 'EXPIRED'].includes(job.status)) return;
    const now = new Date().toISOString();
    const retried: JobRequest = {
      ...job,
      status: 'OPEN',
      notifiedProviderIds: [],
      expiresAt: new Date(Date.now() + dispatchTimeoutMinutes * 60 * 1000).toISOString(),
      updatedAt: now,
    };
    const category = categories.find((item) => item.id === retried.categoryId);
    if (!category) return;
    const pool = providers.filter(
      (provider) =>
        isProviderEligibleForJob(
          provider,
          providerMemberships.find((membership) => membership.providerId === provider.id) ||
            provider.membership,
          retried,
          category,
          orders
            .filter((order) => !['CANCELLED', 'REJECTED', 'REFUNDED'].includes(order.status))
            .map((order) => ({
              providerId: order.providerId,
              date: order.scheduledDate,
              slot: order.scheduledSlot,
              durationMinutes:
                jobRequests.find((request) => request.orderId === order.id)
                  ?.estimatedDurationMinutes || 60,
            })),
          societies,
        ).eligible,
    );
    retried.notifiedProviderIds = pool.map((provider) => provider.id);
    setJobRequests((prev) => prev.map((item) => (item.id === jobId ? retried : item)));
    setDispatchNotifications((prev) => [
      ...pool.map((provider) => ({
        id: `dn-${jobId}-${Date.now()}-${provider.id}`,
        providerId: provider.id,
        jobRequestId: jobId,
        status: 'NEW' as const,
        createdAt: now,
      })),
      ...prev.filter((notification) => notification.jobRequestId !== jobId),
    ]);
    addNotification(`Request re-broadcast to ${pool.length} eligible providers.`);
  };

  const createRecurringSchedule = (
    schedule: Omit<RecurringSchedule, 'id' | 'scheduleNumber' | 'createdAt' | 'historyJobIds'>,
  ) => {
    const newSchedule: RecurringSchedule = {
      ...schedule,
      id: `rec-${Date.now()}`,
      scheduleNumber: `SCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      historyJobIds: [],
      historyOrderIds: schedule.historyOrderIds || [],
      createdAt: new Date().toISOString(),
    };
    setRecurringSchedules((prev) => [newSchedule, ...prev]);
    addNotification(
      `Recurring schedule ${newSchedule.scheduleNumber} created! Services will dispatch automatically.`,
    );
    return newSchedule;
  };

  const updateRecurringSchedule = (id: string, updates: Partial<RecurringSchedule>) => {
    const schedule = recurringSchedules.find((item) => item.id === id);
    if (
      !schedule ||
      (currentUser?.role !== 'ADMIN' &&
        (currentUser?.role !== 'CUSTOMER' || schedule.residentId !== currentUser.id))
    )
      return;
    setRecurringSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const dispatchRecurringScheduleOccurrence = (scheduleId: string) => {
    const s = recurringSchedules.find((rec) => rec.id === scheduleId);
    if (!s) return { success: false, error: 'Schedule not found.' };
    if (s.status !== 'ACTIVE')
      return { success: false, error: 'This recurring schedule is paused or cancelled.' };
    if (currentUser?.role !== 'CUSTOMER' || currentUser.id !== s.residentId) {
      return { success: false, error: 'Only the resident who owns this schedule can dispatch it.' };
    }
    const nextOccurrenceTime = new Date(`${s.nextDispatchDate}T00:00:00`).getTime();
    if (
      !Number.isFinite(nextOccurrenceTime) ||
      nextOccurrenceTime - Date.now() > 8 * 60 * 60 * 1000
    ) {
      return {
        success: false,
        error: 'Recurring occurrences are dispatched the night before their scheduled date.',
      };
    }
    const category = categories.find((item) => item.id === s.categoryId);
    if (!category) return { success: false, error: 'Schedule category not found.' };
    if (category.matching === 'BROWSE_ORDER') {
      const previousOrders = (s.historyOrderIds || [])
        .map((id) => orders.find((order) => order.id === id))
        .filter((order): order is Order => Boolean(order));
      const existingOrder = previousOrders.find(
        (order) => order.scheduledDate === s.nextDispatchDate,
      );
      if (existingOrder) return { success: true, order: existingOrder };
      const menu = chooseRotatingTiffinMenu(
        tiffinMenus,
        s.societyId,
        s.nextDispatchDate,
        previousOrders[previousOrders.length - 1]?.providerId,
        Date.now(),
        s.quantity || 1,
      );
      if (!menu) {
        updateRecurringSchedule(scheduleId, {
          nextDispatchDate: nextRecurringDate(s.nextDispatchDate, s.frequency),
        });
        addNotification(
          `No Tiffin kitchen had stock for ${s.nextDispatchDate}; the resident was notified and no payment was captured.`,
        );
        return {
          success: false,
          error: 'No Tiffin kitchen had an available menu for this occurrence.',
        };
      }
      const tiffinOrder = orderTiffinMenu(
        menu.id,
        s.quantity || 1,
        s.nextDispatchDate,
        s.societyId,
      );
      if (!tiffinOrder.success || !tiffinOrder.order)
        return { success: false, error: tiffinOrder.error || 'Tiffin order failed.' };
      updateRecurringSchedule(scheduleId, {
        historyOrderIds: [...(s.historyOrderIds || []), tiffinOrder.order.id],
        nextDispatchDate: nextRecurringDate(s.nextDispatchDate, s.frequency),
      });
      return { success: true, order: tiffinOrder.order };
    }
    const existingOccurrence = s.historyJobIds
      .map((id) => jobRequests.find((job) => job.id === id))
      .find((job) => job?.scheduledDate === s.nextDispatchDate);
    if (existingOccurrence) return { success: true, jobRequest: existingOccurrence };

    const previousJobs = s.historyJobIds
      .map((id) => jobRequests.find((job) => job.id === id))
      .filter((job): job is JobRequest => Boolean(job));
    const res = createJobRequest({
      serviceTypeId: s.serviceTypeId,
      scheduledDate: s.nextDispatchDate,
      scheduledSlot: s.preferredSlot,
      selectedTaskIds: s.selectedTaskIds,
      sizeBandInput: s.sizeBandInput,
      dishNotes: s.dishNotes,
      kitchenReadinessConfirmed: s.kitchenReadinessConfirmed,
      stylistGenderPreference: s.stylistGenderPreference,
      residentPreferences: s.residentPreferences,
      residentId: s.residentId,
      societyId: s.societyId,
      flatNumber: s.flatNumber,
      excludedProviderIds: previousJobs
        .map((job) => job.claimedByProviderId)
        .filter((id): id is string => Boolean(id)),
    });

    if (res.success && res.jobRequest) {
      const nextDate = nextRecurringDate(s.nextDispatchDate, s.frequency);
      updateRecurringSchedule(scheduleId, {
        lastDispatchedJobId: res.jobRequest.id,
        historyJobIds: [...s.historyJobIds, res.jobRequest.id],
        nextDispatchDate: nextDate,
      });
      return { success: true, jobRequest: res.jobRequest };
    }
    return { success: false, error: res.error };
  };

  const renewProviderMembership = (providerId: string, months = 1) => {
    const mem = providerMemberships.find((m) => m.providerId === providerId);
    if (
      currentUser?.role !== 'PROVIDER' ||
      currentUser.providerId !== providerId ||
      !mem ||
      !Number.isInteger(months) ||
      months < 1 ||
      months > 12
    )
      return { success: false };

    const invId = `inv-mem-${Date.now()}`;
    const invNumber = `INV-MEM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fee = (mem.monthlyFee || 499) * months;

    const invoice: MembershipInvoice = {
      id: invId,
      invoiceNumber: invNumber,
      amount: fee,
      paidAt: new Date().toISOString(),
      pdfUrl: '#',
    };

    const currentEnd = new Date(
      mem.currentBillingPeriodEnd > new Date().toISOString()
        ? mem.currentBillingPeriodEnd
        : new Date(),
    );
    currentEnd.setMonth(currentEnd.getMonth() + months);

    setProviderMemberships((prev) =>
      prev.map((m) =>
        m.providerId === providerId
          ? {
              ...m,
              status: 'ACTIVE',
              currentBillingPeriodEnd: currentEnd.toISOString().split('T')[0],
              gracePeriodEndsAt: undefined,
              invoices: [invoice, ...m.invoices],
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    );

    addNotification(
      `Membership renewed successfully for ₹${fee}. Active until ${currentEnd.toISOString().split('T')[0]}.`,
    );
    return { success: true, invoice };
  };

  const failProviderMembershipRenewal = (providerId: string) => {
    const membership = providerMemberships.find((item) => item.providerId === providerId);
    if (currentUser?.role !== 'PROVIDER' || currentUser.providerId !== providerId || !membership) {
      return { success: false, error: 'Membership not found for this provider.' };
    }
    const plan = providerPlans.find((item) => item.categoryGroupId === membership.categoryGroupId);
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + (plan?.gracePeriodDays ?? 5));
    setProviderMemberships((prev) =>
      prev.map((item) =>
        item.providerId === providerId
          ? {
              ...item,
              status: 'GRACE',
              gracePeriodEndsAt: graceEnd.toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    addNotification(
      `Membership renewal failed. Grace period ends ${graceEnd.toLocaleDateString()}.`,
    );
    return { success: true };
  };

  const updateCategoryFlags = (categoryId: string, updates: Partial<Category>) => {
    if (currentUser?.role !== 'ADMIN') return;
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c)));
    addNotification(`Category settings updated.`);
  };

  const updateServiceType = (serviceTypeId: string, updates: Partial<ServiceType>) => {
    if (currentUser?.role !== 'ADMIN') return;
    setServiceTypes((prev) =>
      prev.map((st) => (st.id === serviceTypeId ? { ...st, ...updates } : st)),
    );
    addNotification(`Service catalog updated.`);
  };

  const addServiceType = (serviceType: Omit<ServiceType, 'id'>) => {
    if (currentUser?.role !== 'ADMIN') return;
    const created = {
      ...serviceType,
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setServiceTypes((prev) => [created, ...prev]);
    addNotification(`Service type "${created.name}" added to the platform catalog.`);
  };

  const updateProviderPlan = (planId: string, updates: Partial<ProviderPlan>) => {
    if (currentUser?.role !== 'ADMIN') return;
    setProviderPlans((prev) =>
      prev.map((plan) => (plan.id === planId ? { ...plan, ...updates } : plan)),
    );
    addNotification('Provider membership plan updated.');
  };

  const updateProviderMembership = (providerId: string, updates: Partial<ProviderMembership>) => {
    if (currentUser?.role !== 'ADMIN') return;
    setProviderMemberships((prev) =>
      prev.map((membership) =>
        membership.providerId === providerId
          ? { ...membership, ...updates, updatedAt: new Date().toISOString() }
          : membership,
      ),
    );
    addNotification('Provider membership adjusted by an administrator.');
  };

  const updateDispatchTimeout = (minutes: number) => {
    if (currentUser?.role !== 'ADMIN')
      return { success: false, error: 'Only an administrator can change dispatch timeout.' };
    if (!Number.isInteger(minutes) || minutes < 10 || minutes > 15) {
      return { success: false, error: 'Timeout must be between 10 and 15 minutes.' };
    }
    setDispatchTimeoutMinutes(minutes);
    addNotification(`Dispatch timeout set to ${minutes} minutes.`);
    return { success: true };
  };

  const moderateReview = (reviewId: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    setReviews((prev) => prev.filter((review) => review.id !== reviewId));
    addNotification('Review removed from resident-visible feedback.');
  };
  const updateResidentPreferences = (residentId: string, prefs: ResidentBriefPreferences) => {
    if (currentUser && currentUser.id === residentId) {
      setCurrentUser((prev) => (prev ? { ...prev, preferences: prefs } : null));
    }
    setUsers((prev) => prev.map((u) => (u.id === residentId ? { ...u, preferences: prefs } : u)));
    addNotification(`Household brief preferences saved.`);
  };

  const submitLeadQuote = (
    quote: Omit<LeadQuote, 'id' | 'createdAt' | 'status'>,
  ): LeadQuote | undefined => {
    const job = jobRequests.find(
      (request) => request.id === quote.jobId && request.requestType === 'LEAD',
    );
    const provider = providers.find((item) => item.id === quote.providerId);
    const category = job && categories.find((item) => item.id === job.categoryId);
    if (
      !job ||
      job.status !== 'OPEN' ||
      !provider ||
      !job.notifiedProviderIds.includes(provider.id)
    )
      return undefined;
    if (
      leadQuotes.filter(
        (existing) => existing.jobId === quote.jobId && existing.status === 'SUBMITTED',
      ).length >= 3
    )
      return undefined;
    if (
      leadQuotes.some(
        (existing) => existing.jobId === quote.jobId && existing.providerId === quote.providerId,
      )
    )
      return undefined;
    const membership =
      providerMemberships.find((item) => item.providerId === provider.id) || provider.membership;
    if (
      currentUser?.role !== 'PROVIDER' ||
      currentUser.providerId !== provider.id ||
      (category?.monetization === 'MEMBERSHIP' &&
        (!membership ||
          !['ACTIVE', 'TRIAL', 'GRACE'].includes(resolveMembershipStatus(membership))))
    )
      return undefined;
    if (
      quote.quotedAmount <= 0 ||
      !Number.isInteger(quote.estimatedDays) ||
      quote.estimatedDays < 1
    )
      return undefined;
    const newLeadQuote: LeadQuote = {
      ...quote,
      id: `lq-${Date.now()}`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    };
    setLeadQuotes((prev) => [newLeadQuote, ...prev]);
    addNotification(`Quotation bid of ₹${quote.quotedAmount} submitted.`);
    return newLeadQuote;
  };

  const acceptLeadQuote = (leadQuoteId: string) => {
    const quote = leadQuotes.find((q) => q.id === leadQuoteId);
    const job = quote && jobRequests.find((request) => request.id === quote.jobId);
    if (
      !quote ||
      !job ||
      job.status !== 'OPEN' ||
      job.residentId !== currentUser?.id ||
      quote.status !== 'SUBMITTED'
    )
      return { success: false };
    const provider = providers.find((item) => item.id === quote.providerId);
    if (!provider) return { success: false };

    const orderNumber = `ORD-QUOTE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: `ord-lead-${Date.now()}`,
      orderNumber,
      customerId: currentUser?.id || 'usr-customer-1',
      customerName: 'Resident',
      customerPhone: 'Contact through LocalNest',
      customerFlat: job.flatNumber,
      providerId: quote.providerId,
      providerName: provider.businessName,
      serviceId: job.serviceTypeId,
      serviceName: job.serviceTypeName,
      categoryName: job.categoryName,
      societyId: job.societyId,
      societyName: job.societyName,
      scheduledDate: job.scheduledDate,
      scheduledSlot: job.scheduledSlot,
      pricingModel: 'LEAD_QUOTE',
      itemQuantity: 1,
      subtotal: quote.quotedAmount,
      platformFee: 0,
      totalAmount: quote.quotedAmount,
      platformCommission: 0,
      providerEarnings: quote.quotedAmount,
      commissionPercentage: 0,
      commissionReason: 'MEMBERSHIP_TIER',
      discountAmount: 0,
      discountSource: 'PLATFORM',
      deliveryAddress: `${job.flatNumber}, ${job.societyName}`,
      specialInstructions: `${job.requestNotes}\nMilestones: ${quote.milestones.map((milestone) => `${milestone.title}: ₹${milestone.amount}`).join('; ')}`,
      status: 'ACCEPTED',
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const acceptedAt = new Date().toISOString();
    setLeadQuotes((prev) =>
      prev.map((item) =>
        item.jobId === job.id
          ? { ...item, status: item.id === quote.id ? 'ACCEPTED' : 'REJECTED' }
          : item,
      ),
    );
    setJobRequests((prev) =>
      prev.map((item) =>
        item.id === job.id
          ? {
              ...item,
              status: 'CLAIMED',
              claimedByProviderId: provider.id,
              claimedAt: acceptedAt,
              orderId: newOrder.id,
              updatedAt: acceptedAt,
            }
          : item,
      ),
    );
    setOrders((prev) => [newOrder, ...prev]);
    addNotification(
      `Quote accepted! A mock milestone escrow order was created under ${orderNumber}.`,
    );
    return { success: true, order: newOrder };
  };

  return (
    <MarketplaceContext.Provider
      value={{
        currentUser,
        users,
        login,
        loginWithGoogle,
        register,
        logout,
        completeResidentOnboarding,
        completeProviderOnboarding,
        selectedSociety,
        setSelectedSociety,
        activeProviderId,
        setActiveProviderId,
        societies,
        categories,
        providers,
        services,
        serviceTypes,
        jobRequests,
        recurringSchedules,
        providerMemberships,
        providerPlans,
        tiffinMenus,
        dispatchNotifications,
        dispatchTimeoutMinutes,
        leadQuotes,
        createJobRequest,
        createLeadRequest,
        publishTiffinMenu,
        orderTiffinMenu,
        claimJob,
        cancelJobRequest,
        cancelClaimedJob,
        cancelClaimedJobByResident,
        expireJobRequest,
        reDispatchJob,
        verifyDoorOtp,
        createRecurringSchedule,
        updateRecurringSchedule,
        dispatchRecurringScheduleOccurrence,
        renewProviderMembership,
        failProviderMembershipRenewal,
        updateProviderPlan,
        updateProviderMembership,
        updateDispatchTimeout,
        moderateReview,
        updateCategoryFlags,
        updateServiceType,
        addServiceType,
        updateResidentPreferences,
        submitLeadQuote,
        acceptLeadQuote,
        orders,
        subscriptions,
        coupons,
        commissionRules,
        reviews,
        complaints,
        payouts,
        walletTransactions,
        chatMessages,
        platformFeeRules,
        validateCoupon,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        updateSubscriptionStatus,
        pauseSubscription,
        resumeSubscription,
        skipNextDelivery,
        submitReview,
        respondToReview,
        createComplaint,
        updateComplaintStatus,
        updateProviderStatus,
        updateProviderAvailability,
        updateProviderServiceArea,
        updateProviderCapabilities,
        settleCookMissingIngredients,
        saveCookMealPhoto,
        serviceRequests,
        createServiceRequest,
        addService,
        requestPayout,
        updateCommissionRule,
        createCoupon,
        toggleCouponActive,
        addSociety,
        updatePlatformFeeRules,
        getWalletBalance,
        getWalletStreak,
        sendChatMessage,
        getOrderMessages,
        markFlaggedReviewed,
        notices,
        createNotice,
        deactivateNotice,
        notifications,
        dismissNotification,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
