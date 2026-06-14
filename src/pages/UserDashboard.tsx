import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ActivationKey, HwidResetLog } from '@/types/auth';
import { 
  KeyRound, LogOut, RotateCcw, Clock, Calendar, 
  AlertTriangle, Check, Copy, User, Zap, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UserDashboard = () => {
  const { user, userType, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const RESET_WINDOW_MS = 24 * 60 * 60 * 1000;
  
  const [keyData, setKeyData] = useState<ActivationKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [resetLogs, setResetLogs] = useState<HwidResetLog[]>([]);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [willDeductDays, setWillDeductDays] = useState(false);

  const getResetWindowState = (activationKey: ActivationKey, referenceDate = new Date()) => {
    const lastResetAtMs = activationKey.last_hwid_reset_at
      ? new Date(activationKey.last_hwid_reset_at).getTime()
      : Number.NaN;

    const withinResetWindow =
      Number.isFinite(lastResetAtMs) && referenceDate.getTime() - lastResetAtMs < RESET_WINDOW_MS;

    return {
      resetsInWindow: withinResetWindow ? activationKey.hwid_reset_count_today : 0,
      withinResetWindow,
    };
  };

  const fetchKeyData = useCallback(async (options?: { silent?: boolean }) => {
    try {
      const activationKey = user as ActivationKey;
      if (!activationKey?.id) return;

      let { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('id', activationKey.id)
        .maybeSingle();

      if (!data && activationKey.key_value) {
        await supabase.functions.invoke('firebase-stats', {
          body: { action: 'get_key', keyValue: activationKey.key_value },
        });

        const retryResult = await supabase
          .from('activation_keys')
          .select('*')
          .eq('key_value', activationKey.key_value)
          .maybeSingle();

        data = retryResult.data;
        error = retryResult.error;
      }

      if (data && activationKey.key_value) {
        await supabase.functions.invoke('firebase-stats', {
          body: { action: 'get_key', keyValue: activationKey.key_value },
        });

        const latestResult = await supabase
          .from('activation_keys')
          .select('*')
          .eq('key_value', activationKey.key_value)
          .maybeSingle();

        data = latestResult.data ?? data;
        error = latestResult.error ?? error;
      }

      if (error) throw error;
      if (!data) {
        if (!options?.silent) {
          toast({
            title: 'خطأ',
            description: 'لم يتم العثور على بيانات المفتاح',
            variant: 'destructive',
          });
        }
        return;
      }
      setKeyData(data as ActivationKey);

      // Fetch reset logs
      const { data: logs } = await supabase
        .from('hwid_reset_log')
        .select('*')
        .eq('activation_key_id', activationKey.id)
        .order('reset_at', { ascending: false })
        .limit(5);

      setResetLogs((logs as HwidResetLog[]) || []);
    } catch (error) {
      if (!options?.silent) {
        toast({
          title: 'خطأ',
          description: 'فشل في جلب بيانات المفتاح',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (!isAuthenticated || userType !== 'user') {
      navigate('/');
      return;
    }

    void fetchKeyData();

    const refreshData = () => {
      void fetchKeyData({ silent: true });
    };

    const intervalId = window.setInterval(refreshData, 5000);
    window.addEventListener('focus', refreshData);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchKeyData, isAuthenticated, navigate, userType]);

  const checkResetPenalty = () => {
    if (!keyData) return false;

    return getResetWindowState(keyData).resetsInWindow >= 1;
  };

  const handleResetHwidClick = () => {
    const willDeduct = checkResetPenalty();
    setWillDeductDays(willDeduct);
    setShowResetWarning(true);
  };

  const handleResetHwid = async () => {
    if (!keyData) return;

    setShowResetWarning(false);

    const now = new Date();
    const nowIso = now.toISOString();
    const today = nowIso.split('T')[0];
    const { resetsInWindow } = getResetWindowState(keyData, now);
    const shouldDeduct = resetsInWindow >= 1;
    const daysToDeduct = shouldDeduct ? 10 : 0;
    let remoteResetApplied = false;

    try {
      let newExpiresAt = keyData.expires_at;
      if (shouldDeduct) {
        const currentExpiry = new Date(keyData.expires_at);
        currentExpiry.setDate(currentExpiry.getDate() - daysToDeduct);
        newExpiresAt = currentExpiry.toISOString();
      }

      const { data: remoteKeyLookup, error: remoteLookupError } = await supabase.functions.invoke('firebase-stats', {
        body: { action: 'get_key', keyValue: keyData.key_value },
      });

      if (remoteLookupError) throw remoteLookupError;

      if (remoteKeyLookup?.key) {
        const { error: remoteResetError } = await supabase.functions.invoke('firebase-sync', {
          body: {
            action: 'update_hwid',
            firebaseId: keyData.key_value,
            keyData: {
              key_value: keyData.key_value,
              hwid: null,
            },
          },
        });

        if (remoteResetError) throw remoteResetError;
        remoteResetApplied = true;
      }

      const { error } = await supabase
        .from('activation_keys')
        .update({
          hwid: null,
          last_hwid_reset_at: nowIso,
          hwid_reset_count_today: resetsInWindow + 1,
          last_reset_date: today,
          expires_at: newExpiresAt,
        })
        .eq('id', keyData.id);

      if (error) throw error;

      // Log the reset
      await supabase
        .from('hwid_reset_log')
        .insert({
          activation_key_id: keyData.id,
          reset_by: 'user',
          days_deducted: daysToDeduct,
        });

      if (shouldDeduct) {
        toast({
          title: '⚠️ تم إعادة ضبط HWID مع خصم',
          description: `تم خصم ${daysToDeduct} أيام من اشتراكك لأنك قمت بإعادة الضبط مرتين خلال 24 ساعة`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: '✅ تم بنجاح',
          description: 'تم إعادة ضبط HWID بنجاح. تحذير: إعادة الضبط مرة أخرى خلال 24 ساعة ستخصم 10 أيام!',
        });
      }

      await fetchKeyData({ silent: true });
    } catch (error) {
      if (remoteResetApplied) {
        void fetchKeyData({ silent: true });
      }

      toast({
        title: 'خطأ',
        description: 'فشل في إعادة ضبط HWID',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    if (!keyData) return;
    navigator.clipboard.writeText(keyData.key_value);
    setCopiedKey(true);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ مفتاح التنشيط',
    });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getRemainingDays = () => {
    if (!keyData) return 0;
    const now = new Date();
    const expiry = new Date(keyData.expires_at);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center animate-pulse">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const remaining = getRemainingDays();
  const todayResets = keyData ? getResetWindowState(keyData).resetsInWindow : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <User className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">لوحة المستخدم</h1>
                <p className="text-muted-foreground">
                  مرحباً، <span className="text-primary font-semibold">{keyData?.username}</span>
                </p>
              </div>
            </div>
            
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>

          {/* Subscription Status Alert */}
          {remaining <= 7 && remaining > 0 && (
            <Card className="border-warning/50 bg-warning/10">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-warning" />
                <div>
                  <p className="font-semibold text-warning">تنبيه: اشتراكك ينتهي قريباً!</p>
                  <p className="text-sm text-muted-foreground">
                    متبقي {remaining} يوم فقط. تواصل مع المسؤول لتجديد الاشتراك.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {remaining <= 0 && (
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-4 flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">اشتراكك منتهي!</p>
                  <p className="text-sm text-muted-foreground">
                    يرجى التواصل مع المسؤول لتجديد الاشتراك.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Key Info Card */}
          <Card className="glass-effect animate-slide-up shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                مفتاح التنشيط الخاص بك
              </CardTitle>
              <CardDescription>معلومات اشتراكك الحالي في أداة AMPro Tool</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Key Value */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-info/10 rounded-2xl flex items-center justify-between border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <code className="text-lg font-mono font-bold">{keyData?.key_value}</code>
                </div>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} className="hover:bg-primary/10">
                  {copiedKey ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-primary" />
                    <p className="text-3xl font-bold text-primary">{remaining > 0 ? remaining : 0}</p>
                    <p className="text-sm text-muted-foreground">يوم متبقي</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-info" />
                    <p className="text-lg font-semibold">
                      {keyData && format(new Date(keyData.expires_at), 'dd MMM yyyy', { locale: ar })}
                    </p>
                    <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  </CardContent>
                </Card>
                
                <Card className={`bg-gradient-to-br ${remaining <= 0 ? 'from-destructive/5 to-destructive/10 border-destructive/20' : remaining <= 7 ? 'from-warning/5 to-warning/10 border-warning/20' : 'from-success/5 to-success/10 border-success/20'}`}>
                  <CardContent className="p-4 text-center">
                    <Badge 
                      variant={remaining <= 0 ? 'destructive' : remaining <= 7 ? 'secondary' : 'default'}
                      className="text-base px-4 py-1 mb-3"
                    >
                      {remaining <= 0 ? 'منتهي' : remaining <= 7 ? 'ينتهي قريباً' : 'نشط'}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">حالة الاشتراك</p>
                  </CardContent>
                </Card>
              </div>

              {/* HWID Section */}
              <Card className={`${todayResets >= 1 ? 'border-warning/50 bg-warning/5' : 'border-border'}`}>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        معرف الجهاز (HWID)
                        {todayResets >= 1 && (
                          <Badge variant="secondary" className="text-warning">
                            تم الإعادة {todayResets} مرة اليوم
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {keyData?.hwid ? 'مرتبط بجهاز' : 'غير مرتبط بجهاز - سيتم الربط عند استخدام الأداة'}
                      </p>
                    </div>
                    <Badge variant={keyData?.hwid ? 'default' : 'outline'} className="text-sm">
                      {keyData?.hwid ? 'مرتبط' : 'متاح'}
                    </Badge>
                  </div>
                  
                  {keyData?.hwid && (
                    <>
                      {/* Warning Box */}
                      <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-warning">⚠️ تحذير مهم</p>
                          <p className="text-muted-foreground mt-1">
                            إعادة ضبط HWID مرتين خلال 24 ساعة ستؤدي إلى <strong className="text-destructive">خصم 10 أيام</strong> من اشتراكك!
                          </p>
                          {todayResets >= 1 && (
                            <p className="text-destructive font-semibold mt-2">
                              🚨 لقد قمت بإعادة الضبط {todayResets} مرة اليوم. الإعادة التالية ستخصم 10 أيام!
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant={todayResets >= 1 ? "destructive" : "outline"}
                        className="w-full gap-2"
                        onClick={handleResetHwidClick}
                      >
                        <RotateCcw className="w-4 h-4" />
                        {todayResets >= 1 ? 'إعادة ضبط HWID (سيتم خصم 10 أيام!)' : 'إعادة ضبط HWID'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Reset History */}
              {resetLogs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">سجل إعادة الضبط</h3>
                  <div className="space-y-2">
                    {resetLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-3 rounded-lg flex items-center justify-between text-sm ${log.days_deducted > 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(log.reset_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.reset_by === 'user' ? 'بواسطتك' : 'بواسطة المسؤول'}
                          </Badge>
                        </div>
                        {log.days_deducted > 0 && (
                          <Badge variant="destructive">-{log.days_deducted} يوم</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tool Info */}
          <Card className="glass-effect">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">AMPro Tool - HI Pro Tool</h3>
              <p className="text-muted-foreground">أداة فك حظر واتساب الاحترافية</p>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://wa.me/967777966865', '_blank')}
                className="gap-2"
              >
                للتواصل والدعم الفني
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Warning Dialog */}
      <AlertDialog open={showResetWarning} onOpenChange={setShowResetWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-6 h-6" />
              {willDeductDays ? 'تحذير: سيتم خصم 10 أيام!' : 'تأكيد إعادة ضبط HWID'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {willDeductDays ? (
                <>
                  <p className="text-destructive font-semibold">
                    ⚠️ أنت على وشك إعادة ضبط HWID للمرة الثانية خلال 24 ساعة!
                  </p>
                  <p>
                    سيتم خصم <strong className="text-destructive">10 أيام</strong> من اشتراكك.
                  </p>
                  <p>
                    الأيام المتبقية بعد الخصم: <strong>{Math.max(0, remaining - 10)} يوم</strong>
                  </p>
                </>
              ) : (
                <>
                  <p>هل أنت متأكد من إعادة ضبط HWID؟</p>
                  <p className="text-warning">
                    تذكر: إعادة الضبط مرة أخرى خلال 24 ساعة ستخصم 10 أيام من اشتراكك!
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetHwid}
              className={willDeductDays ? 'bg-destructive hover:bg-destructive/90' : 'gradient-primary'}
            >
              {willDeductDays ? 'إعادة الضبط مع الخصم' : 'إعادة الضبط'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDashboard;
