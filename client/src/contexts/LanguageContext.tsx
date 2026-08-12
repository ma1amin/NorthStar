import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Locale = "en" | "ar";

const copy = {
  en: {
    explore: "Explore",
    search: "Search",
    collections: "Collections",
    graph: "Graph",
    signIn: "Sign in",
    profile: "Profile",
    moderation: "Moderation",
    logOut: "Log out",
    submit: "Submit a resource",
    commandSearch: "Search pages and actions…",
    signInRequired: "Sign in required",
    signInToViewProfile: "Sign in to view profile",
    browseResources: "Browse resources",
    member: "Member",
    administrator: "Administrator",
    reputation: "reputation",
    editProfile: "Edit profile",
    yourNorthStarPath: "Your NorthStar path",
    pathHeading: "Turn activity into useful community context.",
    pathDescription: "These steps are optional, but they make your contributions easier to understand, verify, and revisit.",
    started: "started",
    profileContextAdded: "Profile context added",
    addProfileContext: "Add profile context",
    keepIdentityCurrent: "Keep your identity current for collaborators.",
    shareWhatExplore: "Share what you explore or build.",
    buildPersonalMap: "Build a personal map",
    saveResources: "Save resources and assemble reusable stacks.",
    keepContributing: "Keep contributing",
    makeFirstContribution: "Make a first contribution",
    everySubmissionHuman: "Every submission enters human moderation.",
    editYourProfile: "Edit your profile",
    identityContext: "Keep your identity and context current for the community.",
    displayName: "Display name",
    avatarUrl: "Avatar URL",
    bio: "Bio",
    bioPlaceholder: "What do you explore or build?",
    cancel: "Cancel",
    saving: "Saving…",
    saveProfile: "Save profile",
    reputationActivity: "Reputation activity",
    verifiedContributionSignals: "A transparent record of verified contribution signals.",
    contributions: "Contributions",
    collectionsTab: "Collections",
    bookmarks: "Bookmarks",
    approved: "Approved",
    needsRevision: "Needs revision",
    pendingModeration: "Pending moderation",
    published: "Published",
    inReview: "In review",
    submitFirstResource: "Submit your first resource",
    yourCollections: "Your collections",
    curateStacks: "Curate reusable stacks of resources for yourself or the community.",
    newCollection: "New collection",
    public: "Public",
    private: "Private",
    noDescription: "No description yet.",
    openCollection: "Open collection",
    noCollections: "You haven’t created any collections yet.",
    createFirstCollection: "Create your first collection",
    humanOversight: "Human oversight",
    moderationCommandCenter: "Moderation command center",
    moderationIntro: "Review resource submissions, graph suggestions, and community signals before they become part of NorthStar’s public knowledge layer.",
    submissions: "Submissions",
    graphEdges: "Graph edges",
    reportTriage: "Report triage",
    reportTriageDetail: "Assess community quality concerns",
    bulkDecisions: "Bulk decisions",
    bulkDecisionsDetail: "Reject selected pending submissions safely",
    editSuggestions: "Edit suggestions",
    editSuggestionsDetail: "Review contributor corrections",
    aiReviewDrafts: "AI review drafts",
    aiReviewDraftsDetail: "Generate non-publishing context",
    userManagement: "User management",
    userManagementDetail: "Manage platform roles safely",
    relationships: "Relationships",
    resources: "Resources",
    history: "History",
    pending: "Pending",
    approve: "Approve",
    reject: "Reject",
    pendingGraphEdge: "Pending graph edge",
    moderationHistory: "Moderation history",
    moderationHistoryDetail: "A read-only record of recent moderation actions.",
  },
  ar: {
    explore: "استكشاف",
    search: "بحث",
    collections: "المجموعات",
    graph: "الرسم البياني",
    signIn: "تسجيل الدخول",
    profile: "الملف الشخصي",
    moderation: "الإشراف",
    logOut: "تسجيل الخروج",
    submit: "إضافة مورد",
    commandSearch: "ابحث في الصفحات والإجراءات…",
    signInRequired: "تسجيل الدخول مطلوب",
    signInToViewProfile: "سجّل الدخول لعرض الملف الشخصي",
    browseResources: "استكشاف الموارد",
    member: "عضو",
    administrator: "مدير",
    reputation: "سمعة",
    editProfile: "تعديل الملف الشخصي",
    yourNorthStarPath: "مسارك في نورث ستار",
    pathHeading: "حوّل نشاطك إلى سياق مجتمعي مفيد.",
    pathDescription: "هذه الخطوات اختيارية، لكنها تجعل مساهماتك أسهل للفهم والتحقق والعودة إليها.",
    started: "مكتملة",
    profileContextAdded: "تمت إضافة سياق الملف",
    addProfileContext: "أضف سياقاً لملفك",
    keepIdentityCurrent: "حافظ على معلوماتك محدثة للمتعاونين.",
    shareWhatExplore: "شارك ما تستكشفه أو تبنيه.",
    buildPersonalMap: "ابنِ خريطتك الشخصية",
    saveResources: "احفظ الموارد وأنشئ مجموعات قابلة لإعادة الاستخدام.",
    keepContributing: "واصل المساهمة",
    makeFirstContribution: "قدّم أول مساهمة",
    everySubmissionHuman: "تدخل كل مساهمة في مراجعة بشرية.",
    editYourProfile: "عدّل ملفك الشخصي",
    identityContext: "حافظ على هويتك وسياقك محدثين للمجتمع.",
    displayName: "الاسم الظاهر",
    avatarUrl: "رابط الصورة الشخصية",
    bio: "نبذة",
    bioPlaceholder: "ما الذي تستكشفه أو تبنيه؟",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ…",
    saveProfile: "حفظ الملف الشخصي",
    reputationActivity: "نشاط السمعة",
    verifiedContributionSignals: "سجل شفاف لإشارات المساهمة التي تم التحقق منها.",
    contributions: "المساهمات",
    collectionsTab: "المجموعات",
    bookmarks: "المحفوظات",
    approved: "مقبول",
    needsRevision: "يحتاج إلى تعديل",
    pendingModeration: "بانتظار الإشراف",
    published: "منشور",
    inReview: "قيد المراجعة",
    submitFirstResource: "أضف أول مورد لك",
    yourCollections: "مجموعاتك",
    curateStacks: "نظّم مجموعات موارد قابلة لإعادة الاستخدام لك أو للمجتمع.",
    newCollection: "مجموعة جديدة",
    public: "عامة",
    private: "خاصة",
    noDescription: "لا يوجد وصف بعد.",
    openCollection: "فتح المجموعة",
    noCollections: "لم تنشئ أي مجموعات بعد.",
    createFirstCollection: "أنشئ أول مجموعة لك",
    humanOversight: "إشراف بشري",
    moderationCommandCenter: "مركز قيادة الإشراف",
    moderationIntro: "راجع طلبات الموارد واقتراحات الرسم البياني وإشارات المجتمع قبل إضافتها إلى طبقة المعرفة العامة في نورث ستار.",
    submissions: "الطلبات",
    graphEdges: "روابط الرسم البياني",
    reportTriage: "فرز البلاغات",
    reportTriageDetail: "تقييم مخاوف جودة المجتمع",
    bulkDecisions: "قرارات جماعية",
    bulkDecisionsDetail: "رفض الطلبات المحددة بأمان",
    editSuggestions: "اقتراحات التعديل",
    editSuggestionsDetail: "مراجعة تصحيحات المساهمين",
    aiReviewDrafts: "مسودات مراجعة الذكاء الاصطناعي",
    aiReviewDraftsDetail: "إنشاء سياق لا ينشر تلقائياً",
    userManagement: "إدارة المستخدمين",
    userManagementDetail: "إدارة أدوار المنصة بأمان",
    relationships: "العلاقات",
    resources: "الموارد",
    history: "السجل",
    pending: "قيد الانتظار",
    approve: "موافقة",
    reject: "رفض",
    pendingGraphEdge: "رابط رسم بياني قيد المراجعة",
    moderationHistory: "سجل الإشراف",
    moderationHistoryDetail: "سجل للقراءة فقط لأحدث إجراءات الإشراف.",
  },
} as const;

type CopyKey = keyof typeof copy.en;
type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: CopyKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function getInitialLocale(getItem: (key: string) => string | null): Locale {
  return getItem("northstar-locale") === "ar" ? "ar" : "en";
}

export function syncLocale(
  locale: Locale,
  documentLike: { documentElement: { lang: string; dir: string } },
  setItem: (key: string, value: string) => void
) {
  documentLike.documentElement.lang = locale;
  documentLike.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  setItem("northstar-locale", locale);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    typeof window !== "undefined" ? getInitialLocale((key) => window.localStorage.getItem(key)) : "en"
  );

  useEffect(() => {
    syncLocale(locale, document, (key, value) => window.localStorage.setItem(key, value));
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale((current) => (current === "en" ? "ar" : "en")),
      t: (key: CopyKey) => copy[locale][key],
    }),
    [locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
