import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

// Translations dictionary
export const translations: Translations = {
  // Welcome page
  'welcome.title': { ar: 'AMPro Tool', en: 'AMPro Tool' },
  'welcome.subtitle': { ar: 'HI Pro Tool', en: 'HI Pro Tool' },
  'welcome.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'welcome.hero.badge': { ar: 'الأداة الأولى لفك حظر واتساب', en: 'The #1 WhatsApp Unban Tool' },
  'welcome.hero.title1': { ar: 'AMPro Tool', en: 'AMPro Tool' },
  'welcome.hero.title2': { ar: 'أداة فك الحظر الاحترافية', en: 'Professional Unban Tool' },
  'welcome.hero.description': { ar: 'الحل الأمثل لفك جميع أنواع حظر واتساب بأسرع وقت وأعلى جودة. دعم فني متواصل وتحديثات مستمرة.', en: 'The optimal solution for all types of WhatsApp bans with the fastest time and highest quality. Continuous technical support and updates.' },
  'welcome.hero.start': { ar: 'ابدأ الآن', en: 'Start Now' },
  'welcome.hero.contact': { ar: 'تواصل معنا', en: 'Contact Us' },
  'welcome.features.title': { ar: 'مميزات الأداة', en: 'Tool Features' },
  'welcome.features.subtitle': { ar: 'أقوى أداة لفك حظر واتساب بجميع أنواعه', en: 'The most powerful tool to unban all types of WhatsApp' },
  'welcome.feature1.title': { ar: 'فك حظر واتساب الرسمي', en: 'Unban Official WhatsApp' },
  'welcome.feature1.desc': { ar: 'إزالة الحظر من تطبيق واتساب الرسمي', en: 'Remove ban from official WhatsApp app' },
  'welcome.feature2.title': { ar: 'فك حظر النسخ المعدلة', en: 'Unban Modified Versions' },
  'welcome.feature2.desc': { ar: 'دعم جميع نسخ واتساب المعدلة', en: 'Support all modified WhatsApp versions' },
  'welcome.feature3.title': { ar: 'فك حظر واتساب الأعمال', en: 'Unban WhatsApp Business' },
  'welcome.feature3.desc': { ar: 'حل مشاكل حظر حسابات الأعمال', en: 'Solve business account ban issues' },
  'welcome.feature4.title': { ar: 'فك حظر السيرفر', en: 'Unban Server' },
  'welcome.feature4.desc': { ar: 'معالجة حظر السيرفر المشدد', en: 'Handle strict server bans' },
  'welcome.feature5.title': { ar: 'فك حظر الانتهاك', en: 'Unban Violation' },
  'welcome.feature5.desc': { ar: 'حل مشاكل حظر الانتهاك', en: 'Solve violation ban issues' },
  'welcome.feature6.title': { ar: 'فك حظر إباحي', en: 'Unban Adult Content' },
  'welcome.feature6.desc': { ar: 'معالجة جميع أنواع الحظر', en: 'Handle all types of bans' },
  'welcome.supported.title': { ar: 'نسخ واتساب المدعومة', en: 'Supported WhatsApp Versions' },
  'welcome.stats.users': { ar: 'مستخدم نشط', en: 'Active Users' },
  'welcome.stats.success': { ar: 'نسبة النجاح', en: 'Success Rate' },
  'welcome.stats.support': { ar: 'دعم فني', en: 'Tech Support' },
  'welcome.stats.rating': { ar: 'تقييم العملاء', en: 'Customer Rating' },
  'welcome.cta.title': { ar: 'جاهز للبدء؟', en: 'Ready to Start?' },
  'welcome.cta.desc': { ar: 'احصل على مفتاح التنشيط الآن واستمتع بفك حظر واتساب بكل سهولة', en: 'Get your activation key now and enjoy unbanning WhatsApp easily' },
  'welcome.footer.title': { ar: 'AMPro Tool - HI Pro Tool', en: 'AMPro Tool - HI Pro Tool' },
  'welcome.footer.subtitle': { ar: 'أداة فك الحظر الاحترافية', en: 'Professional Unban Tool' },
  'welcome.footer.whatsapp': { ar: 'واتساب', en: 'WhatsApp' },
  'welcome.footer.copyright': { ar: '© 2026 AMPro Tool. جميع الحقوق محفوظة.', en: '© 2026 AMPro Tool. All rights reserved.' },
  'welcome.footer.dev': { ar: '© تم التطوير بواسطة علي الهمداني.', en: '© Developed by Ali Alhamdani.' },
  'welcome.wa1': { ar: 'واتساب الرسمي', en: 'Official WhatsApp' },
  'welcome.wa2': { ar: 'واتساب الأعمال', en: 'WhatsApp Business' },
  'welcome.wa3': { ar: 'GB واتساب', en: 'GB WhatsApp' },
  'welcome.wa4': { ar: 'YO واتساب', en: 'YO WhatsApp' },
  'welcome.wa5': { ar: 'FM واتساب', en: 'FM WhatsApp' },
  'welcome.wa6': { ar: 'واتساب الذهبي', en: 'Gold WhatsApp' },
  'welcome.back': { ar: 'العودة للرئيسية', en: 'Back to Home' },

  // Login page
  'login.title': { ar: 'AMPro Tool', en: 'AMPro Tool' },
  'login.subtitle': { ar: 'قم بتسجيل الدخول للمتابعة', en: 'Login to continue' },
  'login.admin_tab': { ar: 'المسؤول / المدير', en: 'Admin / Manager' },
  'login.user_tab': { ar: 'المستخدم', en: 'User' },
  'login.username': { ar: 'اسم المستخدم', en: 'Username' },
  'login.username_placeholder': { ar: 'أدخل اسم المستخدم', en: 'Enter username' },
  'login.password': { ar: 'كلمة المرور', en: 'Password' },
  'login.password_placeholder': { ar: 'أدخل كلمة المرور', en: 'Enter password' },
  'login.submit': { ar: 'تسجيل الدخول', en: 'Login' },
  'login.loading': { ar: 'جاري تسجيل الدخول...', en: 'Logging in...' },
  'login.success': { ar: 'تم تسجيل الدخول بنجاح', en: 'Login successful' },
  'login.welcome': { ar: 'مرحباً بك في لوحة التحكم', en: 'Welcome to the dashboard' },
  'login.welcome_user': { ar: 'مرحباً بك', en: 'Welcome' },
  'login.failed': { ar: 'فشل تسجيل الدخول', en: 'Login failed' },

  // Admin Dashboard
  'admin.title': { ar: 'لوحة التحكم', en: 'Dashboard' },
  'admin.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  'admin.total_keys': { ar: 'إجمالي المفاتيح', en: 'Total Keys' },
  'admin.active_keys': { ar: 'نشط', en: 'Active' },
  'admin.bound_keys': { ar: 'مرتبط', en: 'Bound' },
  'admin.expired_keys': { ar: 'منتهي', en: 'Expired' },
  'admin.remaining_quota': { ar: 'تراخيص متبقية من', en: 'Remaining licenses from' },
  'admin.deleted_keys': { ar: 'مفاتيح في سلة المهملات', en: 'Keys in trash' },
  'admin.keys_tab': { ar: 'المفاتيح', en: 'Keys' },
  'admin.trash_tab': { ar: 'المهملات', en: 'Trash' },
  'admin.activity_tab': { ar: 'النشاطات', en: 'Activity' },
  'admin.activation_keys': { ar: 'مفاتيح التنشيط', en: 'Activation Keys' },
  'admin.my_keys': { ar: 'المفاتيح التي قمت بإنشائها', en: 'Keys you created' },
  'admin.all_keys': { ar: 'إدارة جميع مفاتيح التنشيط (المحلية + السيرفر)', en: 'Manage all activation keys (local + server)' },
  'admin.search': { ar: 'بحث بالمفتاح أو اسم المستخدم', en: 'Search by key or username' },
  'admin.refresh': { ar: 'تحديث', en: 'Refresh' },
  'admin.export': { ar: 'تصدير', en: 'Export' },
  'admin.import': { ar: 'استيراد', en: 'Import' },
  'admin.new_key': { ar: 'مفتاح جديد', en: 'New Key' },
  'admin.key_value': { ar: 'مفتاح التنشيط', en: 'Activation Key' },
  'admin.username': { ar: 'اسم المستخدم', en: 'Username' },
  'admin.created_at': { ar: 'تاريخ الإنشاء', en: 'Created At' },
  'admin.expires_at': { ar: 'تاريخ الانتهاء', en: 'Expires At' },
  'admin.hwid': { ar: 'HWID', en: 'HWID' },
  'admin.created_by': { ar: 'أنشئ بواسطة', en: 'Created By' },
  'admin.status': { ar: 'الحالة', en: 'Status' },
  'admin.actions': { ar: 'الإجراءات', en: 'Actions' },
  'admin.expired': { ar: 'منتهي', en: 'Expired' },
  'admin.days_remaining': { ar: 'يوم', en: 'days' },
  'admin.server': { ar: 'سيرفر', en: 'Server' },
  'admin.local': { ar: 'محلي', en: 'Local' },
  'admin.admin_management': { ar: 'إدارة المسؤولين', en: 'Admin Management' },
  'admin.admin_accounts': { ar: 'حسابات المسؤولين', en: 'Admin Accounts' },
  'admin.manage_admins_desc': { ar: 'إدارة حسابات المسؤولين وصلاحياتهم', en: 'Manage admin accounts and permissions' },
  'admin.add_admin': { ar: 'إضافة مسؤول', en: 'Add Admin' },
  'admin.role': { ar: 'الصلاحية', en: 'Role' },
  'admin.quota': { ar: 'الحصة', en: 'Quota' },
  'admin.stats': { ar: 'الإحصائيات', en: 'Statistics' },
  'admin.admin_role': { ar: 'مسؤول', en: 'Admin' },
  'admin.manager_role': { ar: 'مدير', en: 'Manager' },
  'admin.create_key_title': { ar: 'إنشاء مفتاح تنشيط جديد', en: 'Create New Activation Key' },
  'admin.create_key_desc': { ar: 'أدخل بيانات المفتاح الجديد', en: 'Enter new key details' },
  'admin.key_type': { ar: 'نوع المفتاح', en: 'Key Type' },
  'admin.auto': { ar: 'تلقائي', en: 'Automatic' },
  'admin.manual': { ar: 'يدوي', en: 'Manual' },
  'admin.expiry_date': { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  'admin.create': { ar: 'إنشاء', en: 'Create' },
  'admin.edit_key_title': { ar: 'تعديل مفتاح التنشيط', en: 'Edit Activation Key' },
  'admin.edit_key_desc': { ar: 'تعديل بيانات المفتاح', en: 'Edit key details' },
  'admin.new_password_hint': { ar: 'كلمة المرور الجديدة (اتركه فارغاً للإبقاء على القديمة)', en: 'New password (leave empty to keep current)' },
  'admin.save': { ar: 'حفظ التغييرات', en: 'Save Changes' },
  'admin.cancel': { ar: 'إلغاء', en: 'Cancel' },
  'admin.delete_confirm_title': { ar: 'تأكيد الحذف النهائي', en: 'Confirm Permanent Delete' },
  'admin.delete_confirm_desc': { ar: 'سيتم حذف المفتاح نهائياً ولا يمكن استعادته. أدخل الرمز 780 للتأكيد.', en: 'The key will be permanently deleted. Enter code 780 to confirm.' },
  'admin.confirm_code': { ar: 'رمز التأكيد', en: 'Confirmation Code' },
  'admin.delete_permanent': { ar: 'حذف نهائي', en: 'Delete Permanently' },
  'admin.import_title': { ar: 'استيراد مفاتيح', en: 'Import Keys' },
  'admin.import_desc': { ar: 'قم برفع ملف CSV يحتوي على المفاتيح (مفتاح, اسم مستخدم, كلمة مرور, مدة)', en: 'Upload a CSV file containing keys (key, username, password, duration)' },
  'admin.new_admin_title': { ar: 'إضافة مسؤول جديد', en: 'Add New Admin' },
  'admin.new_admin_desc': { ar: 'إنشاء حساب مسؤول جديد', en: 'Create a new admin account' },
  'admin.select_role': { ar: 'اختر الصلاحية', en: 'Select Role' },
  'admin.license_quota': { ar: 'حصة التراخيص', en: 'License Quota' },

  // User Dashboard
  'user.title': { ar: 'لوحة المستخدم', en: 'User Dashboard' },
  'user.welcome': { ar: 'مرحباً،', en: 'Welcome,' },
  'user.logout': { ar: 'تسجيل الخروج', en: 'Logout' },
  'user.expiry_warning': { ar: 'تنبيه: اشتراكك ينتهي قريباً!', en: 'Warning: Your subscription expires soon!' },
  'user.expiry_message': { ar: 'متبقي {days} يوم فقط. تواصل مع المسؤول لتجديد الاشتراك.', en: 'Only {days} days remaining. Contact admin to renew.' },
  'user.expired': { ar: 'اشتراكك منتهي!', en: 'Your subscription has expired!' },
  'user.expired_message': { ar: 'يرجى التواصل مع المسؤول لتجديد الاشتراك.', en: 'Please contact admin to renew subscription.' },
  'user.your_key': { ar: 'مفتاح التنشيط الخاص بك', en: 'Your Activation Key' },
  'user.key_info': { ar: 'معلومات اشتراكك الحالي في أداة AMPro Tool', en: 'Your current subscription info for AMPro Tool' },
  'user.days_remaining': { ar: 'يوم متبقي', en: 'Days Remaining' },
  'user.expiry_date': { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  'user.status': { ar: 'حالة الاشتراك', en: 'Subscription Status' },
  'user.active': { ar: 'نشط', en: 'Active' },
  'user.expires_soon': { ar: 'ينتهي قريباً', en: 'Expires Soon' },
  'user.hwid_title': { ar: 'معرف الجهاز (HWID)', en: 'Device ID (HWID)' },
  'user.hwid_bound': { ar: 'مرتبط بجهاز', en: 'Bound to device' },
  'user.hwid_available': { ar: 'غير مرتبط بجهاز - سيتم الربط عند استخدام الأداة', en: 'Not bound - will be bound when using the tool' },
  'user.bound': { ar: 'مرتبط', en: 'Bound' },
  'user.available': { ar: 'متاح', en: 'Available' },
  'user.reset_warning': { ar: 'تحذير مهم', en: 'Important Warning' },
  'user.reset_message': { ar: 'إعادة ضبط HWID مرتين خلال 24 ساعة ستؤدي إلى خصم 10 أيام من اشتراكك!', en: 'Resetting HWID twice within 24 hours will deduct 10 days from your subscription!' },
  'user.reset_today': { ar: 'لقد قمت بإعادة الضبط {count} مرة اليوم. الإعادة التالية ستخصم 10 أيام!', en: 'You have reset {count} time(s) today. Next reset will deduct 10 days!' },
  'user.reset_hwid': { ar: 'إعادة ضبط HWID', en: 'Reset HWID' },
  'user.reset_hwid_penalty': { ar: 'إعادة ضبط HWID (سيتم خصم 10 أيام!)', en: 'Reset HWID (10 days will be deducted!)' },
  'user.reset_history': { ar: 'سجل إعادة الضبط', en: 'Reset History' },
  'user.by_you': { ar: 'بواسطتك', en: 'By you' },
  'user.by_admin': { ar: 'بواسطة المسؤول', en: 'By admin' },
  'user.loading': { ar: 'جاري التحميل...', en: 'Loading...' },

  // Common
  'common.error': { ar: 'خطأ', en: 'Error' },
  'common.success': { ar: 'تم بنجاح', en: 'Success' },
  'common.copied': { ar: 'تم النسخ', en: 'Copied' },
  'common.key_copied': { ar: 'تم نسخ مفتاح التنشيط', en: 'Activation key copied' },
  'common.language': { ar: 'العربية', en: 'English' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (!translation) return key;
    
    let text = translation[language];
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
