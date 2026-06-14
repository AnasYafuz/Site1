import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLoginProtection } from '@/hooks/useLoginProtection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { KeyRound, ShieldCheck, User, Lock, ArrowRight, ArrowLeft, Zap, AlertTriangle, Timer } from 'lucide-react';

const Login = () => {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminLockTimer, setAdminLockTimer] = useState(0);
  const [userLockTimer, setUserLockTimer] = useState(0);
  
  const { loginAsAdmin, loginAsUser } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const adminProtection = useLoginProtection('admin');
  const userProtection = useLoginProtection('user');

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;
  const BackArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  // Timer for admin lock
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = adminProtection.getRemainingLockTime();
      setAdminLockTimer(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [adminProtection]);

  // Timer for user lock
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = userProtection.getRemainingLockTime();
      setUserLockTimer(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [userProtection]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adminProtection.isLocked()) {
      toast({
        title: language === 'ar' ? 'تم حظر تسجيل الدخول' : 'Login Blocked',
        description: language === 'ar' 
          ? `يرجى الانتظار ${adminProtection.formatRemainingTime(adminLockTimer)}` 
          : `Please wait ${adminProtection.formatRemainingTime(adminLockTimer)}`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const result = await loginAsAdmin(adminUsername, adminPassword);

    if (result.success) {
      adminProtection.resetAttempts();
      toast({
        title: t('login.success'),
        description: t('login.welcome'),
      });
      navigate('/admin');
    } else {
      const { locked, remainingAttempts } = adminProtection.recordFailedAttempt();
      
      if (locked) {
        const lockTime = adminProtection.attempts.lockCount >= 1 ? '30' : '15';
        toast({
          title: language === 'ar' ? 'تم حظر تسجيل الدخول' : 'Login Blocked',
          description: language === 'ar' 
            ? `تم حظرك لمدة ${lockTime} دقيقة بسبب المحاولات الفاشلة` 
            : `You are blocked for ${lockTime} minutes due to failed attempts`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('login.failed'),
          description: language === 'ar' 
            ? `${result.error} - المحاولات المتبقية: ${remainingAttempts}`
            : `${result.error} - Remaining attempts: ${remainingAttempts}`,
          variant: 'destructive',
        });
      }
    }

    setLoading(false);
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userProtection.isLocked()) {
      toast({
        title: language === 'ar' ? 'تم حظر تسجيل الدخول' : 'Login Blocked',
        description: language === 'ar' 
          ? `يرجى الانتظار ${userProtection.formatRemainingTime(userLockTimer)}` 
          : `Please wait ${userProtection.formatRemainingTime(userLockTimer)}`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const result = await loginAsUser(userUsername, userPassword);

    if (result.success) {
      userProtection.resetAttempts();
      toast({
        title: t('login.success'),
        description: t('login.welcome_user'),
      });
      navigate('/user');
    } else {
      const { locked, remainingAttempts } = userProtection.recordFailedAttempt();
      
      if (locked) {
        const lockTime = userProtection.attempts.lockCount >= 1 ? '30' : '15';
        toast({
          title: language === 'ar' ? 'تم حظر تسجيل الدخول' : 'Login Blocked',
          description: language === 'ar' 
            ? `تم حظرك لمدة ${lockTime} دقيقة بسبب المحاولات الفاشلة` 
            : `You are blocked for ${lockTime} minutes due to failed attempts`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('login.failed'),
          description: language === 'ar' 
            ? `${result.error} - المحاولات المتبقية: ${remainingAttempts}`
            : `${result.error} - Remaining attempts: ${remainingAttempts}`,
          variant: 'destructive',
        });
      }
    }

    setLoading(false);
  };

  const renderLockAlert = (isLocked: boolean, lockTimer: number, formatTime: (s: number) => string) => {
    if (!isLocked || lockTimer <= 0) return null;
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          {language === 'ar' 
            ? `تم حظر تسجيل الدخول. يرجى الانتظار: ${formatTime(lockTimer)}`
            : `Login blocked. Please wait: ${formatTime(lockTimer)}`
          }
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-info/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Top Bar */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 left-3 sm:left-4 z-20 flex items-center justify-between">
        <Link 
          to="/"
          className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackArrowIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('welcome.back')}</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
      
      <Card className="w-full max-w-md glass-effect animate-scale-in relative z-10 shadow-2xl shadow-primary/10 mx-2">
        <CardHeader className="text-center space-y-3 sm:space-y-4 px-4 sm:px-6">
          <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 rounded-2xl sm:rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/40">
            <Zap className="w-8 sm:w-10 h-8 sm:h-10 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
              {t('login.title')}
            </CardTitle>
            <CardDescription className="mt-2 text-sm">{t('login.subtitle')}</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-12">
              <TabsTrigger value="admin" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <ShieldCheck className="w-3 sm:w-4 h-3 sm:h-4" />
                {t('login.admin_tab')}
              </TabsTrigger>
              <TabsTrigger value="user" className="gap-1 sm:gap-2 text-xs sm:text-sm data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                <User className="w-3 sm:w-4 h-3 sm:h-4" />
                {t('login.user_tab')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin">
              {renderLockAlert(adminProtection.isLocked(), adminLockTimer, adminProtection.formatRemainingTime)}
              <form onSubmit={handleAdminLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username" className="text-sm">{t('login.username')}</Label>
                  <div className="relative">
                    <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="admin-username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder={t('login.username_placeholder')}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-10 sm:h-12 bg-muted/50 text-sm`}
                      required
                      disabled={adminProtection.isLocked()}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm">{t('login.password')}</Label>
                  <div className="relative">
                    <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder={t('login.password_placeholder')}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-10 sm:h-12 bg-muted/50 text-sm`}
                      required
                      disabled={adminProtection.isLocked()}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-10 sm:h-12 gradient-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow text-sm sm:text-base" 
                  disabled={loading || adminProtection.isLocked()}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {t('login.loading')}
                    </div>
                  ) : (
                    t('login.submit')
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="user">
              {renderLockAlert(userProtection.isLocked(), userLockTimer, userProtection.formatRemainingTime)}
              <form onSubmit={handleUserLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-username" className="text-sm">{t('login.username')}</Label>
                  <div className="relative">
                    <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="user-username"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value)}
                      placeholder={t('login.username_placeholder')}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-10 sm:h-12 bg-muted/50 text-sm`}
                      required
                      disabled={userProtection.isLocked()}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user-password" className="text-sm">{t('login.password')}</Label>
                  <div className="relative">
                    <Lock className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                    <Input
                      id="user-password"
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder={t('login.password_placeholder')}
                      className={`${language === 'ar' ? 'pr-10' : 'pl-10'} h-10 sm:h-12 bg-muted/50 text-sm`}
                      required
                      disabled={userProtection.isLocked()}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-10 sm:h-12 gradient-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow text-sm sm:text-base" 
                  disabled={loading || userProtection.isLocked()}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {t('login.loading')}
                    </div>
                  ) : (
                    t('login.submit')
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
