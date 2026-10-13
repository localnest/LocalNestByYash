export type Language = 'en' | 'hi' | 'mr';

export interface TranslationDictionary {
  // General / Common
  languageName: string;
  selectLanguage: string;
  signOut: string;
  pilot: string;
  search: string;
  all: string;
  cancel: string;
  save: string;
  close: string;
  back: string;
  view: string;
  verified: string;
  status: string;
  date: string;
  time: string;
  address: string;
  price: string;
  flat: string;
  actions: string;
  confirm: string;
  loading: string;

  // Order Statuses
  statusPending: string;
  statusAccepted: string;
  statusInProgress: string;
  statusCompleted: string;
  statusCancelled: string;
  statusRejected: string;
  statusDisputed: string;

  // Customer Navigation
  navHome: string;
  navExplore: string;
  navOrders: string;
  navSubscriptions: string;
  navOffers: string;
  navNotices: string;
  navSupport: string;
  navWallet: string;

  // Customer Home & Explore
  heroTitle: string;
  heroSubtitle: string;
  verifiedNeighbors: string;
  bookNow: string;
  bookSlot: string;
  bookAgain: string;
  viewProfileAndRates: string;
  startingFrom: string;
  onVacation: string;
  vacationNotice: string;
  verifiedProvider: string;
  ordersCompleted: string;
  onTimeRate: string;
  kmAway: string;

  // Customer Orders & Tracker
  myOrdersTitle: string;
  noOrdersYet: string;
  orderNumber: string;
  rateAndReview: string;
  reviewSubmitted: string;
  chatWithProvider: string;
  raiseDispute: string;
  stepPending: string;
  stepAccepted: string;
  stepInProgress: string;
  stepCompleted: string;

  // Customer Reviews
  verifiedNeighborReview: string;
  experienceQuestion: string;
  whatStoodOut: string;
  detailedFeedback: string;
  publishReview: string;
  reviewSuccess: string;

  // Provider Navigation
  navOverview: string;
  navProviderOrders: string;
  navManifest: string;
  navProviderSubs: string;
  navProviderServices: string;
  navEarnings: string;
  navProviderReviews: string;

  // Provider Overview & Actions
  providerHubTitle: string;
  societyReputation: string;
  operatingHoursVacation: string;
  editServiceArea: string;
  pendingRequestsAlert: string;
  viewRequests: string;
  acceptOrder: string;
  declineOrder: string;
  startWork: string;
  markCompleted: string;
  activeOrders: string;
  allTimeEarnings: string;
  requestBankPayout: string;

  // Provider Reviews
  residentReviewsTitle: string;
  residentReviewsSubtitle: string;
  replyToResident: string;
  publishReply: string;
  praiseBadgesEarned: string;
  yourResponse: string;

  // Dispatch marketplace
  dispatchTitle: string;
  dispatchSubtitle: string;
  findingProvider: string;
  residentRequests: string;
  recurringSchedulesTitle: string;
  householdPreferencesTitle: string;
  providerInboxTitle: string;
  providerSkillsTitle: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    languageName: 'English',
    selectLanguage: 'Language',
    signOut: 'Sign Out',
    pilot: 'Pilot',
    search: 'Search services, providers...',
    all: 'All',
    cancel: 'Cancel',
    save: 'Save Changes',
    close: 'Close',
    back: 'Back',
    view: 'View',
    verified: 'Verified',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    address: 'Address',
    price: 'Price',
    flat: 'Flat / Unit',
    actions: 'Actions',
    confirm: 'Confirm',
    loading: 'Loading...',

    // Statuses
    statusPending: 'Pending',
    statusAccepted: 'Accepted',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    statusRejected: 'Declined',
    statusDisputed: 'In Dispute',

    // Customer Nav
    navHome: 'Home',
    navExplore: 'Explore Services',
    navOrders: 'My Orders',
    navSubscriptions: 'Subscriptions',
    navOffers: 'Offers',
    navNotices: 'Society Notices',
    navSupport: 'Support & Tickets',
    navWallet: 'My Wallet',

    // Customer Home & Explore
    heroTitle: 'Trusted Doorstep Services For Your Society',
    heroSubtitle: 'Directly verified providers with fixed society prices and neighbor ratings.',
    verifiedNeighbors: 'Verified by neighbors',
    bookNow: 'Book Now',
    bookSlot: 'Book Slot',
    bookAgain: 'Book Again',
    viewProfileAndRates: 'View Profile & Rates',
    startingFrom: 'Starting from',
    onVacation: 'On Vacation (Paused)',
    vacationNotice: 'Currently taking a short break. Resuming orders soon.',
    verifiedProvider: 'Verified Provider',
    ordersCompleted: 'orders completed',
    onTimeRate: 'on-time',
    kmAway: 'km away',

    // Customer Orders
    myOrdersTitle: 'My Society Bookings',
    noOrdersYet: 'No bookings found yet. Explore local providers to schedule service.',
    orderNumber: 'Order',
    rateAndReview: 'Rate & Review Provider',
    reviewSubmitted: 'Review Submitted',
    chatWithProvider: 'Chat with Provider',
    raiseDispute: 'Report Issue / Dispute',
    stepPending: 'Order Placed',
    stepAccepted: 'Provider Confirmed',
    stepInProgress: 'Service In Progress',
    stepCompleted: 'Fulfilled & Settled',

    // Customer Reviews
    verifiedNeighborReview: 'Verified Neighbor Review',
    experienceQuestion: 'How was your experience?',
    whatStoodOut: 'What stood out? (Tap tags)',
    detailedFeedback: 'Detailed Neighbor Feedback',
    publishReview: 'Publish Verified Review',
    reviewSuccess: 'Review Published to Society!',

    // Provider Nav
    navOverview: 'Overview',
    navProviderOrders: 'Orders',
    navManifest: 'Delivery Sheet',
    navProviderSubs: 'Subscriptions',
    navProviderServices: 'Services',
    navEarnings: 'Earnings',
    navProviderReviews: 'Reviews & Ratings',

    // Provider Overview
    providerHubTitle: 'Provider Operations Center',
    societyReputation: 'SOCIETY REPUTATION',
    operatingHoursVacation: 'Operating Hours & Vacation',
    editServiceArea: 'Service Area & Radius',
    pendingRequestsAlert: 'You have new booking requests awaiting action!',
    viewRequests: 'View Requests',
    acceptOrder: 'Accept Order',
    declineOrder: 'Decline',
    startWork: 'Start Work',
    markCompleted: 'Mark Completed',
    activeOrders: 'Active Orders',
    allTimeEarnings: 'All-Time Net Earnings',
    requestBankPayout: 'Request Bank Payout',

    // Provider Reviews
    residentReviewsTitle: 'Resident Reviews & Society Reputation',
    residentReviewsSubtitle:
      'Verified feedback from gated society residents who booked your services.',
    replyToResident: 'Reply to Resident',
    publishReply: 'Publish Reply',
    praiseBadgesEarned: 'Praise Badges Earned From Neighbors',
    yourResponse: 'Your Response',
    dispatchTitle: 'Book a service. LocalNest finds your provider.',
    dispatchSubtitle: 'Providers rotate on every request; no provider selection or favorites.',
    findingProvider: 'Finding your provider...',
    residentRequests: 'Your dispatch requests',
    recurringSchedulesTitle: 'Recurring schedules',
    householdPreferencesTitle: 'Resident preferences shared with each provider',
    providerInboxTitle: 'New requests for you',
    providerSkillsTitle: 'Services you perform',
  },

  hi: {
    languageName: 'हिंदी',
    selectLanguage: 'भाषा',
    signOut: 'लॉग आउट',
    pilot: 'पायलट',
    search: 'सेवाएं, प्रदाता खोजें...',
    all: 'सभी',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    close: 'बंद करें',
    back: 'पीछे जाएं',
    view: 'देखें',
    verified: 'सत्यापित',
    status: 'स्थिति',
    date: 'तारीख',
    time: 'समय',
    address: 'पता',
    price: 'मूल्य',
    flat: 'फ्लैट नंबर',
    actions: 'कार्रवाई',
    confirm: 'पुष्टि करें',
    loading: 'लोड हो रहा है...',

    // Statuses
    statusPending: 'लंबित',
    statusAccepted: 'स्वीकृत',
    statusInProgress: 'कार्य प्रगति पर',
    statusCompleted: 'पूर्ण हुआ',
    statusCancelled: 'रद्द किया गया',
    statusRejected: 'अस्वीकृत',
    statusDisputed: 'विवाद दर्ज',

    // Customer Nav
    navHome: 'होम',
    navExplore: 'सेवाएं खोजें',
    navOrders: 'मेरे ऑर्डर्स',
    navSubscriptions: 'मासिक योजना',
    navOffers: 'ऑफ़र्स',
    navNotices: 'सोसायटी सूचनाएं',
    navSupport: 'सहायता केंद्र',
    navWallet: 'मेरा वॉलेट',

    // Customer Home & Explore
    heroTitle: 'आपकी सोसायटी के लिए भरोसेमंद द्वार-सेवाएं',
    heroSubtitle:
      'सोसायटी द्वारा सत्यापित प्रदाता, पारदर्शी दरें और पड़ोसियों की वास्तविक समीक्षाएं।',
    verifiedNeighbors: 'पड़ोसियों द्वारा सत्यापित',
    bookNow: 'अभी बुक करें',
    bookSlot: 'समय चुनें और बुक करें',
    bookAgain: 'पुनः बुक करें',
    viewProfileAndRates: 'प्रोफ़ाइल और दरें देखें',
    startingFrom: 'शुरुआती दर',
    onVacation: 'अवकाश पर (बुकिंग रुकी है)',
    vacationNotice: 'वर्तमान में छोटे अवकाश पर हैं। जल्द ही नई बुकिंग शुरू होगी।',
    verifiedProvider: 'सत्यापित सेवा प्रदाता',
    ordersCompleted: 'ऑर्डर्स पूर्ण किए',
    onTimeRate: 'समय पर सेवा',
    kmAway: 'किमी दूर',

    // Customer Orders
    myOrdersTitle: 'मेरे सोसायटी ऑर्डर्स',
    noOrdersYet: 'अभी तक कोई बुकिंग नहीं मिली। सेवाएं खोजने के लिए सूची देखें।',
    orderNumber: 'ऑर्डर',
    rateAndReview: 'रेटिंग और समीक्षा दें',
    reviewSubmitted: 'समीक्षा जमा हो गई',
    chatWithProvider: 'प्रदाता से चैट करें',
    raiseDispute: 'समस्या या विवाद दर्ज करें',
    stepPending: 'ऑर्डर दर्ज हुआ',
    stepAccepted: 'प्रदाता द्वारा स्वीकार',
    stepInProgress: 'काम शुरू हुआ',
    stepCompleted: 'सेवा पूर्ण व संपन्न',

    // Customer Reviews
    verifiedNeighborReview: 'सत्यापित पड़ोसी समीक्षा',
    experienceQuestion: 'आपका सेवा अनुभव कैसा रहा?',
    whatStoodOut: 'क्या खास लगा? (टैग्स चुनें)',
    detailedFeedback: 'पड़ोसियों के लिए विस्तृत फीडबैक',
    publishReview: 'सत्यापित समीक्षा प्रकाशित करें',
    reviewSuccess: 'समीक्षा सोसायटी में प्रकाशित हो गई!',

    // Provider Nav
    navOverview: 'अवलोकन',
    navProviderOrders: 'ऑर्डर्स',
    navManifest: 'डिलीवरी शीट',
    navProviderSubs: 'सदस्यता',
    navProviderServices: 'मेरी सेवाएं',
    navEarnings: 'कमाई व भुगतान',
    navProviderReviews: 'समीक्षा और रेटिंग',

    // Provider Overview
    providerHubTitle: 'सेवा प्रदाता संचालन केंद्र',
    societyReputation: 'सोसायटी प्रतिष्ठा व रेटिंग',
    operatingHoursVacation: 'काम के घंटे और छुट्टी',
    editServiceArea: 'कार्यक्षेत्र और दायरा',
    pendingRequestsAlert: 'आपके पास नई बुकिंग अनुरोध निर्णय के लिए प्रतीक्षारत हैं!',
    viewRequests: 'अनुरोध देखें',
    acceptOrder: 'ऑर्डर स्वीकार करें',
    declineOrder: 'अस्वीकार करें',
    startWork: 'काम शुरू करें',
    markCompleted: 'काम पूर्ण चिह्नित करें',
    activeOrders: 'सक्रिय ऑर्डर्स',
    allTimeEarnings: 'कुल शुद्ध कमाई',
    requestBankPayout: 'बैंक में पैसे निकालें',

    // Provider Reviews
    residentReviewsTitle: 'निवासी समीक्षाएं और प्रतिष्ठा',
    residentReviewsSubtitle:
      'सोसायटी के निवासियों द्वारा दी गई वास्तविक रेटिंग। अच्छी रेटिंग से आपको अधिक काम मिलता है।',
    replyToResident: 'निवासी को उत्तर दें',
    publishReply: 'उत्तर प्रकाशित करें',
    praiseBadgesEarned: 'पड़ोसियों से मिले प्रशंसा बैज',
    yourResponse: 'आपका उत्तर',
    dispatchTitle: 'सेवा बुक करें। LocalNest सेवा प्रदाता ढूंढेगा।',
    dispatchSubtitle:
      'हर अनुरोध पर प्रदाता बदलते हैं; किसी खास प्रदाता का चयन या पसंदीदा सूची नहीं।',
    findingProvider: 'आपके लिए प्रदाता खोजा जा रहा है...',
    residentRequests: 'आपके सेवा अनुरोध',
    recurringSchedulesTitle: 'बार-बार होने वाली सेवाएं',
    householdPreferencesTitle: 'हर सेवा प्रदाता के साथ साझा की जाने वाली निवासी प्राथमिकताएं',
    providerInboxTitle: 'आपके लिए नए अनुरोध',
    providerSkillsTitle: 'आप कौन-सी सेवाएं देते हैं',
  },

  mr: {
    languageName: 'मराठी',
    selectLanguage: 'भाषा',
    signOut: 'बाहेर पडा (Sign Out)',
    pilot: 'पायलट',
    search: 'सेवा किंवा प्रदाता शोधा...',
    all: 'सर्व',
    cancel: 'रद्द करा',
    save: 'बदल जतन करा',
    close: 'बंद करा',
    back: 'मागे जा',
    view: 'पहा',
    verified: 'सत्यापित',
    status: 'स्थिती',
    date: 'तारीख',
    time: 'वेळ',
    address: 'पत्ता',
    price: 'दर / किंमत',
    flat: 'फ्लॅट क्रमांक',
    actions: 'कृती',
    confirm: 'निश्चित करा',
    loading: 'लोड होत आहे...',

    // Statuses
    statusPending: 'प्रलंबित',
    statusAccepted: 'स्वीकारले',
    statusInProgress: 'काम चालू आहे',
    statusCompleted: 'पूर्ण झाले',
    statusCancelled: 'रद्द केले',
    statusRejected: 'नाकारले',
    statusDisputed: 'तक्रार दाखल',

    // Customer Nav
    navHome: 'मुख्यपृष्ठ',
    navExplore: 'सेवा शोधा',
    navOrders: 'माझे ऑर्डर्स',
    navSubscriptions: 'मासिक योजना',
    navOffers: 'सवलती (Offers)',
    navNotices: 'सोसायटी सूचना',
    navSupport: 'मदत व तक्रारी',
    navWallet: 'माझे पाकीट',

    // Customer Home & Explore
    heroTitle: 'आपल्या सोसायटीसाठी विश्वासार्ह घरपोच सेवा',
    heroSubtitle: 'सोसायटी पडताळलेले प्रदाता, पारदर्शक दर आणि शेजाऱ्यांची खरी मते.',
    verifiedNeighbors: 'शेजाऱ्यांनी पडताळलेले',
    bookNow: 'आत्ता बुक करा',
    bookSlot: 'वेळ निवडून बुक करा',
    bookAgain: 'पुन्हा बुक करा',
    viewProfileAndRates: 'माहिती व दर पहा',
    startingFrom: 'किमान दर',
    onVacation: 'सुट्टीवर (बुकिंग थांबवले आहे)',
    vacationNotice: 'सध्या अल्प सुट्टीवर आहोत. लवकरच नवीन बुकिंग स्वीकारले जाईल.',
    verifiedProvider: 'सत्यापित सेवा प्रदाता',
    ordersCompleted: 'ऑर्डर्स पूर्ण केल्या',
    onTimeRate: 'वेळेवर सेवा',
    kmAway: 'किमी अंतरावर',

    // Customer Orders
    myOrdersTitle: 'माझे सोसायटी ऑर्डर्स',
    noOrdersYet: 'अद्याप एकही ऑर्डर नाही. सेवा बुक करण्यासाठी शोधावर टॅप करा.',
    orderNumber: 'ऑर्डर',
    rateAndReview: 'रेटिंग व अभिप्राय द्या',
    reviewSubmitted: 'अभिप्राय नोंदवला',
    chatWithProvider: 'प्रदात्याशी बोला (चॅट)',
    raiseDispute: 'तक्रार नोंदवा',
    stepPending: 'ऑर्डर नोंदवली',
    stepAccepted: 'प्रदात्याने स्वीकारली',
    stepInProgress: 'काम सुरू झाले',
    stepCompleted: 'सेवा पूर्ण झाली',

    // Customer Reviews
    verifiedNeighborReview: 'सत्यापित शेजारी अभिप्राय',
    experienceQuestion: 'आपला कामाचा अनुभव कसा होता?',
    whatStoodOut: 'काय विशेष आवडले? (टॅग्ज निवडा)',
    detailedFeedback: 'शेजाऱ्यांसाठी सविस्तर अभिप्राय',
    publishReview: 'अभिप्राय प्रकाशित करा',
    reviewSuccess: 'अभिप्राय सोसायटीत प्रकाशित झाला!',

    // Provider Nav
    navOverview: 'आढावा',
    navProviderOrders: 'ऑर्डर्स',
    navManifest: 'वितरण पत्रक',
    navProviderSubs: 'मासिक ग्राहक',
    navProviderServices: 'माझ्या सेवा',
    navEarnings: 'कमाई व देयके',
    navProviderReviews: 'अभिप्राय व रेटिंग',

    // Provider Overview
    providerHubTitle: 'सेवा प्रदाता नियंत्रण केंद्र',
    societyReputation: 'सोसायटीतील पत व रेटिंग',
    operatingHoursVacation: 'कामाचे तास व सुट्टी',
    editServiceArea: 'कार्यक्षेत्र व अंतर मर्यादा',
    pendingRequestsAlert: 'नवीन बुकिंग विनंत्या आपल्या मंजुरीची वाट पाहत आहेत!',
    viewRequests: 'विनंत्या पहा',
    acceptOrder: 'ऑर्डर स्वीकारा',
    declineOrder: 'नाकारा',
    startWork: 'काम सुरू करा',
    markCompleted: 'काम पूर्ण झाले',
    activeOrders: 'सक्रिय ऑर्डर्स',
    allTimeEarnings: 'एकूण निव्वळ कमाई',
    requestBankPayout: 'बँकेत पैसे पाठवा',

    // Provider Reviews
    residentReviewsTitle: 'नागरिकांचे अभिप्राय व पत',
    residentReviewsSubtitle:
      'सोसायटीतील रहिवाशांनी दिलेले खरे अभिप्राय. चांगल्या रेटिंगमुळे नवीन ग्राहक मिळतात.',
    replyToResident: 'नागरिकाला उत्तर द्या',
    publishReply: 'उत्तर प्रकाशित करा',
    praiseBadgesEarned: 'शेजाऱ्यांकडून मिळालेले कौतुक बॅज',
    yourResponse: 'आपले उत्तर',
    dispatchTitle: 'सेवा बुक करा. LocalNest तुमच्यासाठी सेवा प्रदाता शोधेल.',
    dispatchSubtitle: 'प्रत्येक विनंतीसाठी प्रदाता बदलतात; विशिष्ट प्रदाता निवडता येत नाही.',
    findingProvider: 'तुमच्यासाठी प्रदाता शोधत आहे...',
    residentRequests: 'तुमच्या सेवा विनंत्या',
    recurringSchedulesTitle: 'नियमित सेवा वेळापत्रक',
    householdPreferencesTitle: 'प्रत्येक प्रदात्यासोबत शेअर होणाऱ्या रहिवासी पसंती',
    providerInboxTitle: 'तुमच्यासाठी नवीन विनंत्या',
    providerSkillsTitle: 'तुम्ही देत असलेल्या सेवा',
  },
};

export const LANGUAGE_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
];
