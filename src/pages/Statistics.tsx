import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { 
  KeyRound, LogOut, Zap, Users, Activity, 
  TrendingUp, Calendar, Shield, ArrowLeft, ArrowRight,
  BarChart3, PieChart
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { AdminAccount, ActivationKey } from '@/types/auth';

const Statistics = () => {
  const { user, userType, logout, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser = user as AdminAccount;
  const dateLocale = language === 'ar' ? ar : enUS;
  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!isAuthenticated || (userType !== 'admin' && userType !== 'manager')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, userType, navigate]);

  const fetchData = async () => {
    try {
      // Fetch keys
      let query = supabase
        .from('activation_keys')
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: false });
      
      if (userType === 'admin') {
        query = query.eq('created_by', currentUser.id);
      }
      
      const { data: keysData } = await query;
      setKeys((keysData as ActivationKey[]) || []);

      // Fetch admin accounts for manager
      if (userType === 'manager') {
        const { data: adminsData } = await supabase
          .from('admin_accounts')
          .select('*')
          .order('created_at', { ascending: false });
        setAdminAccounts((adminsData as AdminAccount[]) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const now = new Date();
  
  const totalKeys = keys.length;
  const activeKeys = keys.filter(k => k.is_active && new Date(k.expires_at) > now).length;
  const expiredKeys = keys.filter(k => new Date(k.expires_at) <= now).length;
  const boundKeys = keys.filter(k => k.hwid).length;
  const unboundKeys = keys.filter(k => !k.hwid).length;

  // Keys expiring in 7 days
  const expiringIn7Days = keys.filter(k => {
    const expiry = new Date(k.expires_at);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 7;
  }).length;

  // Data for pie chart
  const statusData = [
    { name: language === 'ar' ? 'نشط' : 'Active', value: activeKeys, color: 'hsl(142, 76%, 36%)' },
    { name: language === 'ar' ? 'منتهي' : 'Expired', value: expiredKeys, color: 'hsl(0, 84%, 60%)' },
  ];

  const bindingData = [
    { name: language === 'ar' ? 'مرتبط' : 'Bound', value: boundKeys, color: 'hsl(221, 83%, 53%)' },
    { name: language === 'ar' ? 'غير مرتبط' : 'Unbound', value: unboundKeys, color: 'hsl(38, 92%, 50%)' },
  ];

  // Data for area chart (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(now, 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const createdCount = keys.filter(k => format(new Date(k.created_at), 'yyyy-MM-dd') === dateStr).length;
    return {
      date: format(date, 'dd MMM', { locale: dateLocale }),
      created: createdCount,
    };
  });

  // Admin performance data (for manager only)
  const adminPerformanceData = adminAccounts
    .filter(a => a.role === 'admin')
    .map(admin => {
      const adminKeys = keys.filter(k => k.created_by === admin.id);
      return {
        name: admin.username,
        total: adminKeys.length,
        active: adminKeys.filter(k => k.is_active && new Date(k.expires_at) > now).length,
        expired: adminKeys.filter(k => new Date(k.expires_at) <= now).length,
      };
    });

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
          <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-info/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <BarChart3 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'الإحصائيات التفصيلية' : 'Detailed Statistics'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'مرحباً،' : 'Welcome,'} <span className="text-primary font-semibold">{currentUser?.username}</span>
                  <Badge variant="secondary" className="mr-2 ml-2 bg-primary/10 text-primary border-primary/20">
                    {userType === 'admin' ? (language === 'ar' ? 'مسؤول' : 'Admin') : (language === 'ar' ? 'مدير' : 'Manager')}
                  </Badge>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <ThemeToggle />
              <LanguageToggle />
              <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2 border-primary/30 hover:bg-primary/10">
                <ArrowIcon className="w-4 h-4" />
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </Button>
              <Button variant="destructive" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4 text-center">
                <KeyRound className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-primary">{totalKeys}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إجمالي المفاتيح' : 'Total Keys'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-emerald-500/20">
              <CardContent className="p-4 text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-2xl font-bold text-emerald-500">{activeKeys}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'نشط' : 'Active'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-destructive/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-destructive" />
                <p className="text-2xl font-bold text-destructive">{expiredKeys}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'منتهي' : 'Expired'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-violet-500/20">
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-violet-500" />
                <p className="text-2xl font-bold text-violet-500">{boundKeys}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مرتبط' : 'Bound'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-amber-500/20">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                <p className="text-2xl font-bold text-amber-500">{expiringIn7Days}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'ينتهي قريباً' : 'Expiring Soon'}</p>
              </CardContent>
            </Card>

            {userType === 'manager' && (
              <Card className="glass-card border-info/20">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-info" />
                  <p className="text-2xl font-bold text-info">{adminAccounts.length}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المسؤولين' : 'Admins'}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Charts */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  {language === 'ar' ? 'حالة المفاتيح' : 'Keys Status'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'توزيع المفاتيح حسب الحالة' : 'Distribution by status'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-sm text-muted-foreground">
                      {language === 'ar' ? 'الحالة' : 'Status'}
                    </p>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={bindingData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {bindingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-sm text-muted-foreground">
                      {language === 'ar' ? 'الربط' : 'Binding'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Area Chart */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {language === 'ar' ? 'المفاتيح المنشأة' : 'Keys Created'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={last30Days}>
                      <defs>
                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stroke="hsl(221, 83%, 53%)"
                        fillOpacity={1}
                        fill="url(#colorCreated)"
                        name={language === 'ar' ? 'المنشأة' : 'Created'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Performance Chart (Manager only) */}
          {userType === 'manager' && adminPerformanceData.length > 0 && (
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {language === 'ar' ? 'أداء المسؤولين' : 'Admin Performance'}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? 'مقارنة المفاتيح المنشأة لكل مسؤول' : 'Keys created comparison per admin'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="total" 
                        name={language === 'ar' ? 'إجمالي' : 'Total'} 
                        fill="hsl(221, 83%, 53%)" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="active" 
                        name={language === 'ar' ? 'نشط' : 'Active'} 
                        fill="hsl(142, 76%, 36%)" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="expired" 
                        name={language === 'ar' ? 'منتهي' : 'Expired'} 
                        fill="hsl(0, 84%, 60%)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
