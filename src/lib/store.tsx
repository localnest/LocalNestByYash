'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserRole, Society, Category, Provider, Service, Order, 
  Subscription, Coupon, CommissionRule, Review, Complaint, 
  PricingModel, OrderStatus, SubscriptionStatus, ComplaintStatus,
  UserProfile, SocietyNotice, NoticeType, PayoutRecord,
  WalletTransaction, ChatMessage, PlatformFeeRules, CommissionReason
} from './types';
import { 
  INITIAL_SOCIETIES, INITIAL_CATEGORIES, INITIAL_PROVIDERS, 
  INITIAL_SERVICES, INITIAL_ORDERS, INITIAL_SUBSCRIPTIONS, 
  INITIAL_COUPONS, INITIAL_COMMISSION_RULES, INITIAL_REVIEWS, 
  INITIAL_COMPLAINTS, INITIAL_PROFILES, INITIAL_NOTICES, INITIAL_PAYOUTS,
  INITIAL_WALLET_TRANSACTIONS, INITIAL_CHAT_MESSAGES, INITIAL_PLATFORM_FEE_RULES
} from './mockData';
import { PLATFORM_CONFIG } from './config';

import { filterContactDetails, resolveCommissionRate } from './retentionUtils';
export { filterContactDetails };

interface MarketplaceContextType {
  // Auth & Session
  currentUser: UserProfile | null;
  users: UserProfile[];
  login: (email: string, password?: string) => { success: boolean; message: string; user?: UserProfile };
  loginWithGoogle: (roleChoice: 'CUSTOMER' | 'PROVIDER', googleEmail?: string, googleName?: string) => { success: boolean; user: UserProfile; needsOnboarding: boolean };
  register: (params: { email: string; password?: string; fullName: string; role: UserRole; phone?: string }) => { success: boolean; user?: UserProfile; message: string };
  logout: () => void;
  completeResidentOnboarding: (data: { societyId: string; towerWing: string; flatNumber: string; phone: string; fullName: string }) => void;
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
  validateCoupon: (code: string, subtotal: number, categoryId?: string) => {
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
    isSubscription?: boolean;
    subscriptionFrequency?: any;
  }) => { success: boolean; orderId?: string; orderNumber?: string; message: string };

  updateOrderStatus: (orderId: string, newStatus: OrderStatus, notes?: string, rejectionReason?: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Actions: Subscriptions
  updateSubscriptionStatus: (subscriptionId: string, status: SubscriptionStatus) => void;
  pauseSubscription: (subscriptionId: string, pausedUntil: string) => void;
  resumeSubscription: (subscriptionId: string) => void;
  skipNextDelivery: (subscriptionId: string, dateToSkip: string) => void;

  // Actions: Reviews
  submitReview: (orderId: string, providerId: string, rating: number, comment: string) => { success: boolean; message: string };

  // Actions: Support & Complaints
  createComplaint: (orderId: string, category: string, description: string) => { success: boolean; ticketNumber: string };
  updateComplaintStatus: (
    ticketId: string, 
    status: ComplaintStatus, 
    resolution?: string, 
    adminNotes?: string,
    resolutionType?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'FREE_REWORK' | 'MEDIATED_DISMISSED',
    refundAmount?: number
  ) => void;

  // Actions: Provider Management
  updateProviderStatus: (providerId: string, status: Provider['status'], reason?: string) => void;
  updateProviderAvailability: (
    providerId: string,
    workingHours: { start: string; end: string; daysOff: string[] },
    isVacationMode: boolean,
    vacationReason?: string
  ) => void;
  addService: (newService: Omit<Service, 'id'>) => void;
  requestPayout: (
    providerId: string, 
    amount: number, 
    method: 'UPI' | 'BANK_NEFT', 
    accountDetails: string
  ) => { success: boolean; message: string };

  // Actions: Admin & Commission
  updateCommissionRule: (ruleId: string, percentage: number) => void;
  createCoupon: (coupon: Omit<Coupon, 'id' | 'currentUsage'>) => void;
  toggleCouponActive: (couponId: string) => void;
  addSociety: (society: Omit<Society, 'id'>) => void;
  updatePlatformFeeRules: (rules: PlatformFeeRules) => void;

  // Wallet
  getWalletBalance: (userId: string) => number;
  getWalletStreak: (userId: string) => { completedCount: number; nextStreakAt: number; remaining: number };

  // Chat
  sendChatMessage: (orderId: string, text: string) => { success: boolean; blocked?: boolean; message: string };
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

  // Notifications
  notifications: string[];
  dismissNotification: (index: number) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [societies, setSocieties] = useState<Society[]>(INITIAL_SOCIETIES);
  const [selectedSociety, setSelectedSociety] = useState<Society>(INITIAL_SOCIETIES[0]);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [providers, setProviders] = useState<Provider[]>(INITIAL_PROVIDERS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>(INITIAL_COMMISSION_RULES);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [activeProviderId, setActiveProviderId] = useState<string>('prov-raj-laundry');
  const [notices, setNotices] = useState<SocietyNotice[]>(INITIAL_NOTICES);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUTS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [platformFeeRules, setPlatformFeeRules] = useState<PlatformFeeRules>(INITIAL_PLATFORM_FEE_RULES);
  const [notifications, setNotifications] = useState<string[]>([
    'Welcome to Greenfield Heights pilot marketplace! Secure logins for Residents, Providers, and Administrators.'
  ]);

  // Load from local storage on client if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('hg_user');
      if (savedUser) {
        const u: UserProfile = JSON.parse(savedUser);
        setCurrentUser(u);
        if (u.providerId) setActiveProviderId(u.providerId);
        if (u.societyId) {
          const s = INITIAL_SOCIETIES.find(soc => soc.id === u.societyId);
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
      if (savedProviders) setProviders(JSON.parse(savedProviders));

      const savedServices = localStorage.getItem('hg_services');
      if (savedServices) setServices(JSON.parse(savedServices));

      const savedWallet = localStorage.getItem('hg_wallet_txns');
      if (savedWallet) setWalletTransactions(JSON.parse(savedWallet));

      const savedChat = localStorage.getItem('hg_chat_messages');
      if (savedChat) setChatMessages(JSON.parse(savedChat));

      const savedFeeRules = localStorage.getItem('hg_fee_rules');
      if (savedFeeRules) setPlatformFeeRules(JSON.parse(savedFeeRules));
    } catch {
      // fallback to initial
    }
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
      localStorage.setItem('hg_wallet_txns', JSON.stringify(walletTransactions));
      localStorage.setItem('hg_chat_messages', JSON.stringify(chatMessages));
      localStorage.setItem('hg_fee_rules', JSON.stringify(platformFeeRules));
    } catch {
      // ignore
    }
  }, [currentUser, users, orders, subscriptions, providers, services, walletTransactions, chatMessages, platformFeeRules]);

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev.slice(0, 4)]);
  };

  const dismissNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // --------------------------------------------------------------------------
  // WALLET HELPERS
  // --------------------------------------------------------------------------
  const getWalletBalance = (userId: string): number => {
    return walletTransactions
      .filter(t => t.userId === userId)
      .reduce((sum, t) => {
        if (t.type === 'EARNED' || t.type === 'ADJUSTMENT') return sum + t.amount;
        if (t.type === 'REDEEMED' || t.type === 'EXPIRED') return sum - t.amount;
        return sum;
      }, 0);
  };

  const getWalletStreak = (userId: string) => {
    const completedCount = orders.filter(o => o.customerId === userId && o.status === 'COMPLETED').length;
    const nextStreakAt = (Math.floor(completedCount / PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL) + 1) * PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL;
    const remaining = nextStreakAt - completedCount;
    return { completedCount, nextStreakAt, remaining };
  };

  const addWalletTransaction = (txn: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
    const newTxn: WalletTransaction = {
      ...txn,
      id: `wt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWalletTransactions(prev => [newTxn, ...prev]);
    // Also update user's walletBalance for currentUser (denormalized convenience)
    if (currentUser && currentUser.id === txn.userId) {
      const delta = (txn.type === 'EARNED' || txn.type === 'ADJUSTMENT') ? txn.amount : -txn.amount;
      const updated = { ...currentUser, walletBalance: Math.max(0, currentUser.walletBalance + delta) };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    }
    return newTxn;
  };

  // --------------------------------------------------------------------------
  // CHAT
  // --------------------------------------------------------------------------
  const sendChatMessage = (orderId: string, text: string): { success: boolean; blocked?: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Not logged in.' };

    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    // Check if chat is allowed
    const allowedStatuses: OrderStatus[] = ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED'];
    if (!allowedStatuses.includes(order.status)) {
      return { success: false, message: 'Chat is not available for this order status.' };
    }

    // Check read-only window after completion
    if (order.status === 'COMPLETED') {
      const completedAt = new Date(order.updatedAt).getTime();
      const daysSinceCompletion = (Date.now() - completedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceCompletion > PLATFORM_CONFIG.CHAT_READ_ONLY_DAYS_AFTER_COMPLETION) {
        return { success: false, message: 'Chat is read-only. The order was completed more than 7 days ago.' };
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
      setChatMessages(prev => [...prev, flaggedMsg]);
      return { 
        success: false, 
        blocked: true, 
        message: 'For your safety and to keep your booking protected, please keep contact details inside LocalNest.' 
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
    setChatMessages(prev => [...prev, newMsg]);
    return { success: true, message: 'Message sent.' };
  };

  const getOrderMessages = (orderId: string): ChatMessage[] => {
    // Non-admins see only unflagged messages for their order
    if (currentUser?.role === 'ADMIN') {
      return chatMessages.filter(m => m.orderId === orderId);
    }
    return chatMessages.filter(m => m.orderId === orderId && !m.isFlagged);
  };

  const markFlaggedReviewed = (messageId: string) => {
    setChatMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, flaggedReason: `[REVIEWED] ${m.flaggedReason}` } : m
    ));
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION LOGIC
  // --------------------------------------------------------------------------
  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'No account found with this email. Please check or register.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Invalid password. Please try again or use the test credentials.' };
    }

    setCurrentUser(user);
    if (user.providerId) {
      setActiveProviderId(user.providerId);
    }
    if (user.societyId) {
      const s = societies.find(soc => soc.id === user.societyId);
      if (s) setSelectedSociety(s);
    }

    addNotification(`Signed in successfully as ${user.fullName} (${user.role}).`);
    return { success: true, message: 'Login successful.', user };
  };

  const loginWithGoogle = (roleChoice: 'CUSTOMER' | 'PROVIDER', googleEmail?: string, googleName?: string) => {
    const email = (googleEmail || (roleChoice === 'CUSTOMER' ? 'rahul.google@gmail.com' : 'rajesh.google@gmail.com')).toLowerCase();
    const name = googleName || (roleChoice === 'CUSTOMER' ? 'Rahul Sharma' : 'Rajesh Kumar');

    const existing = users.find(u => u.email.toLowerCase() === email);
    if (existing) {
      setCurrentUser(existing);
      if (existing.providerId) setActiveProviderId(existing.providerId);
      if (existing.societyId) {
        const s = societies.find(soc => soc.id === existing.societyId);
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
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      isOnboarded: false,
      walletBalance: 0,
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    addNotification(`Google verification confirmed. Please complete the quick onboarding details.`);
    return { success: true, user: newUser, needsOnboarding: true };
  };

  const register = (params: { email: string; password?: string; fullName: string; role: UserRole; phone?: string }) => {
    const cleanEmail = params.email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
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

    setUsers(prev => [newUser, ...prev]);
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
  const completeResidentOnboarding = (data: { societyId: string; towerWing: string; flatNumber: string; phone: string; fullName: string }) => {
    if (!currentUser) return;
    const soc = societies.find(s => s.id === data.societyId) || selectedSociety;
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
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    addNotification(`Welcome to ${soc.name}! Welcome coupon WELCOME100 is ready to use on your first booking.`);
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
  }) => {
    if (!currentUser) return;

    const newProviderId = `prov-${Date.now()}`;
    const cat = categories.find(c => c.id === data.categoryId);
    const now = new Date().toISOString();
    const promoEndsAt = new Date(Date.now() + PLATFORM_CONFIG.NEW_PROVIDER_PROMO_DAYS * 24 * 3600 * 1000).toISOString();

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
      supportedSocieties: data.supportedSocieties.length > 0 ? data.supportedSocieties : [selectedSociety.id],
      startingPrice: data.basePrice,
      startingPriceUnit: data.unitName,
      promoEndsAt,
      acceptedTermsAt: data.acceptedTerms ? now : undefined,
      documents: [
        { type: data.documentType, url: data.documentName, verified: false }
      ],
      avatarUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80',
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

    setProviders(prev => [newProv, ...prev]);
    setServices(prev => [newSrv, ...prev]);
    setActiveProviderId(newProviderId);
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

    addNotification(`Provider profile created for ${data.businessName}. Your account is under verification by the society operations desk.`);
  };

  // --------------------------------------------------------------------------
  // COMMISSION RESOLUTION (tiered with context)
  // --------------------------------------------------------------------------
  const getCommissionRateWithReason = (
    categoryId: string | undefined,
    providerId: string | undefined,
    customerId: string,
    pricingModel: PricingModel,
    existingOrders: Order[]
  ): { rate: number; reason: CommissionReason } => {
    const provider = providers.find(p => p.id === providerId);
    return resolveCommissionRate({
      categoryId,
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
    const coupon = coupons.find(c => c.code.toUpperCase() === cleanCode);

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
      return { valid: false, discount: 0, message: 'Coupon only applies to selected service categories.' };
    }
    if (subtotal < coupon.minOrderValue) {
      return { 
        valid: false, 
        discount: 0, 
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon.` 
      };
    }
    if (coupon.usageLimit && coupon.currentUsage >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: 'This coupon has reached its total usage limit.' };
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
    isSubscription?: boolean;
    subscriptionFrequency?: any;
  }) => {
    const service = services.find(s => s.id === params.serviceId);
    if (!service) return { success: false, message: 'Service not found.' };

    const provider = providers.find(p => p.id === service.providerId);
    if (!provider) return { success: false, message: 'Provider not found.' };

    const custName = currentUser?.fullName || 'Rahul Sharma';
    const custPhone = currentUser?.phone || '+91 98765 43210';
    const custFlat = currentUser?.flatNumber || 'Tower A - 402';
    const custId = currentUser?.id || 'usr-customer-1';

    // Platform fee from configurable rules
    const platformFee = params.isSubscription 
      ? platformFeeRules.subscriptionFee 
      : platformFeeRules.oneTimeFee;

    let discountAmount = 0;
    let couponApplied: Coupon | undefined;

    if (params.couponCode) {
      const val = validateCoupon(params.couponCode, params.subtotal, service.categoryId);
      if (val.valid && val.coupon) {
        discountAmount = val.discount;
        couponApplied = val.coupon;
        setCoupons(prev => prev.map(c => c.id === couponApplied?.id ? { ...c, currentUsage: c.currentUsage + 1 } : c));
      }
    }

    // Wallet redemption — capped at 20% of subtotal
    const maxWalletRedemption = Math.floor(params.subtotal * PLATFORM_CONFIG.LOYALTY_REDEMPTION_CAP_RATIO);
    const walletDiscount = Math.min(params.walletAmountToUse || 0, maxWalletRedemption, getWalletBalance(custId));

    const totalAmount = Math.max(0, params.subtotal + platformFee - discountAmount - walletDiscount);

    // Commission with tiered logic
    const { rate: commRate, reason: commReason } = getCommissionRateWithReason(
      service.categoryId,
      provider.id,
      custId,
      params.pricingModel,
      orders
    );
    const platformCommission = Math.round((params.subtotal * commRate) / 100);
    const providerEarnings = params.subtotal - platformCommission;

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

    setOrders(prev => [newOrder, ...prev]);

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
      setSubscriptions(prev => [newSub, ...prev]);
      addNotification(`New subscription started with ${provider.businessName}! Delivery begins ${params.scheduledDate}.`);
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

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, notes?: string, rejectionReason?: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        if (newStatus === 'COMPLETED' && ord.status !== 'COMPLETED') {
          setProviders(pList => pList.map(p => 
            p.id === ord.providerId ? { ...p, completedOrders: p.completedOrders + 1 } : p
          ));
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
          const prevCompleted = orders.filter(o => o.customerId === ord.customerId && o.status === 'COMPLETED').length;
          const newCompleted = prevCompleted + 1;
          if (newCompleted % PLATFORM_CONFIG.LOYALTY_STREAK_INTERVAL === 0) {
            addWalletTransaction({
              userId: ord.customerId,
              type: 'ADJUSTMENT',
              amount: PLATFORM_CONFIG.LOYALTY_STREAK_BONUS,
              orderId: ord.id,
              note: `Streak bonus! ${newCompleted}th completed order milestone`,
            });
            addNotification(`🎉 Streak achieved! ₹${PLATFORM_CONFIG.LOYALTY_STREAK_BONUS} LocalNest credits added to your wallet!`);
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
    }));
    if (newStatus === 'REJECTED') {
      addNotification(`Order request declined${rejectionReason ? `: ${rejectionReason}` : ''}. Resident notified and refund initiated.`);
    } else {
      addNotification(`Order status updated to ${newStatus.replace('_', ' ')}.`);
    }
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'CANCELLED',
          updatedAt: new Date().toISOString(),
          specialInstructions: reason ? `${ord.specialInstructions || ''} [Cancellation: ${reason}]` : ord.specialInstructions,
        };
      }
      return ord;
    }));
    addNotification('Order has been cancelled. Any eligible refund will be credited to source.');
  };

  const updateSubscriptionStatus = (subscriptionId: string, status: SubscriptionStatus) => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === subscriptionId ? { ...sub, status } : sub
    ));
    addNotification(`Subscription status updated to ${status}.`);
  };

  const pauseSubscription = (subscriptionId: string, pausedUntil: string) => {
    setSubscriptions(prev => prev.map(sub =>
      sub.id === subscriptionId ? { ...sub, status: 'PAUSED' as SubscriptionStatus, pausedUntil } : sub
    ));
    addNotification(`Subscription paused until ${new Date(pausedUntil).toLocaleDateString()}.`);
  };

  const resumeSubscription = (subscriptionId: string) => {
    setSubscriptions(prev => prev.map(sub =>
      sub.id === subscriptionId ? { ...sub, status: 'ACTIVE' as SubscriptionStatus, pausedUntil: undefined } : sub
    ));
    addNotification('Subscription resumed successfully.');
  };

  const skipNextDelivery = (subscriptionId: string, dateToSkip: string) => {
    setSubscriptions(prev => prev.map(sub =>
      sub.id === subscriptionId 
        ? { ...sub, skippedDates: [...(sub.skippedDates || []), dateToSkip] } 
        : sub
    ));
    addNotification(`Delivery on ${new Date(dateToSkip).toLocaleDateString()} has been skipped.`);
  };

  const submitReview = (orderId: string, providerId: string, rating: number, comment: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'COMPLETED') {
      return { success: false, message: 'Reviews can only be submitted for completed orders.' };
    }
    const alreadyReviewed = reviews.some(r => r.orderId === orderId);
    if (alreadyReviewed) {
      return { success: false, message: 'You have already submitted a review for this order.' };
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      orderId,
      customerId: currentUser?.id || 'usr-customer-1',
      customerName: currentUser?.fullName || 'Resident',
      providerId,
      rating,
      comment,
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    setReviews(prev => [newReview, ...prev]);

    setProviders(prev => prev.map(p => {
      if (p.id === providerId) {
        const provReviews = [...reviews.filter(r => r.providerId === providerId), newReview];
        const avg = provReviews.reduce((sum, r) => sum + r.rating, 0) / provReviews.length;
        return {
          ...p,
          rating: Number(avg.toFixed(2)),
          reviewCount: provReviews.length,
        };
      }
      return p;
    }));

    addNotification('Thank you for your rating! Your verified review has been posted.');
    return { success: true, message: 'Review successfully recorded.' };
  };

  const createComplaint = (orderId: string, category: string, description: string) => {
    const order = orders.find(o => o.id === orderId);
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

    setComplaints(prev => [newComp, ...prev]);
    if (order && order.status !== 'COMPLETED') {
      updateOrderStatus(orderId, 'DISPUTED');
    }
    addNotification(`Support ticket #${ticketNumber} created. Our team will review within 2 hours.`);
    return { success: true, ticketNumber };
  };

  const updateComplaintStatus = (
    ticketId: string, 
    status: ComplaintStatus, 
    resolution?: string, 
    adminNotes?: string,
    resolutionType?: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'FREE_REWORK' | 'MEDIATED_DISMISSED',
    refundAmount?: number
  ) => {
    const complaint = complaints.find(c => c.id === ticketId);
    setComplaints(prev => prev.map(c => 
      c.id === ticketId ? { 
        ...c, 
        status, 
        resolution: resolution || c.resolution,
        adminNotes: adminNotes || c.adminNotes,
        resolutionType: resolutionType || c.resolutionType,
        refundAmount: refundAmount !== undefined ? refundAmount : c.refundAmount,
        resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : c.resolvedAt,
        resolvedBy: currentUser?.fullName || 'Marketplace Operations Desk',
      } : c
    ));

    // If full refund, update corresponding order and reverse wallet credits if any were earned
    if (complaint && (resolutionType === 'FULL_REFUND' || resolutionType === 'PARTIAL_REFUND')) {
      setOrders(prev => prev.map(o => {
        if (o.id === complaint.orderId || o.orderNumber === complaint.orderNumber) {
          return {
            ...o,
            paymentStatus: 'REFUNDED',
            status: 'REFUNDED' as OrderStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      }));

      // Reverse any wallet credits earned on the refunded order
      const earnedOnOrder = walletTransactions.filter(
        t => t.orderId === complaint.orderId && t.type === 'EARNED'
      );
      earnedOnOrder.forEach(t => {
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

  const updateProviderAvailability = (
    providerId: string,
    workingHours: { start: string; end: string; daysOff: string[] },
    isVacationMode: boolean,
    vacationReason?: string
  ) => {
    setProviders(prev => prev.map(p => p.id === providerId ? {
      ...p,
      workingHours,
      isVacationMode,
      vacationReason: vacationReason !== undefined ? vacationReason : p.vacationReason,
    } : p));
    addNotification(
      isVacationMode 
        ? 'Vacation Mode enabled. New bookings are paused.' 
        : 'Provider working hours and active schedule updated.'
    );
  };

  const requestPayout = (
    providerId: string, 
    amount: number, 
    method: 'UPI' | 'BANK_NEFT', 
    accountDetails: string
  ) => {
    const prov = providers.find(p => p.id === providerId);
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
    setPayouts(prev => [newPayout, ...prev]);
    addNotification(`Withdrawal request of ₹${amount} initiated! Payout reference: ${newPayout.referenceId}`);
    return { success: true, message: `Withdrawal initiated for ₹${amount}` };
  };

  const updateProviderStatus = (providerId: string, status: Provider['status'], reason?: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? {
        ...p,
        status,
        verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : p.verifiedAt,
        promoEndsAt: status === 'VERIFIED' && !p.promoEndsAt 
          ? new Date(Date.now() + PLATFORM_CONFIG.NEW_PROVIDER_PROMO_DAYS * 24 * 3600 * 1000).toISOString()
          : p.promoEndsAt,
      } : p
    ));
    addNotification(`Provider verification status updated to ${status}.`);
  };

  const addService = (newService: Omit<Service, 'id'>) => {
    const id = `srv-${Date.now()}`;
    setServices(prev => [...prev, { ...newService, id }]);
    addNotification(`Service "${newService.name}" created successfully.`);
  };

  const updateCommissionRule = (ruleId: string, percentage: number) => {
    setCommissionRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, commissionPercentage: percentage } : r
    ));
    addNotification(`Commission rate updated to ${percentage}%.`);
  };

  const createCoupon = (coupon: Omit<Coupon, 'id' | 'currentUsage'>) => {
    const id = `cpn-${Date.now()}`;
    setCoupons(prev => [...prev, { ...coupon, id, currentUsage: 0 }]);
    addNotification(`Coupon code "${coupon.code}" created.`);
  };

  const toggleCouponActive = (couponId: string) => {
    setCoupons(prev => prev.map(c => 
      c.id === couponId ? { ...c, isActive: !c.isActive } : c
    ));
  };

  const addSociety = (society: Omit<Society, 'id'>) => {
    const id = `soc-${Date.now()}`;
    setSocieties(prev => [...prev, { ...society, id }]);
    addNotification(`Society "${society.name}" registered to platform.`);
  };

  const updatePlatformFeeRules = (rules: PlatformFeeRules) => {
    setPlatformFeeRules(rules);
    addNotification(`Platform fee rules updated: One-time ₹${rules.oneTimeFee}, Subscription ₹${rules.subscriptionFee}.`);
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
    setNotices(prev => [newNotice, ...prev]);
    const audience = params.societyId === 'ALL' ? 'All Societies' : params.societyName;
    addNotification(`Notice "${params.title}" posted to ${audience}.`);
  };

  const deactivateNotice = (noticeId: string) => {
    setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, isActive: false } : n));
    addNotification('Notice has been deactivated.');
  };

  return (
    <MarketplaceContext.Provider value={{
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
      createComplaint,
      updateComplaintStatus,
      updateProviderStatus,
      updateProviderAvailability,
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
    }}>
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
