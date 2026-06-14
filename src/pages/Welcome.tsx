import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import BannerCarousel from '@/components/BannerCarousel';
import { 
  Smartphone, Shield, Zap, CheckCircle, 
  MessageCircle, Phone, ArrowLeft, Star,
  Unlock, Ban, AlertTriangle, Lock, ArrowRight
} from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const features = [
    { icon: Unlock, titleKey: 'welcome.feature1.title', descKey: 'welcome.feature1.desc' },
    { icon: Smartphone, titleKey: 'welcome.feature2.title', descKey: 'welcome.feature2.desc' },
    { icon: Shield, titleKey: 'welcome.feature3.title', descKey: 'welcome.feature3.desc' },
    { icon: Ban, titleKey: 'welcome.feature4.title', descKey: 'welcome.feature4.desc' },
    { icon: AlertTriangle, titleKey: 'welcome.feature5.title', descKey: 'welcome.feature5.desc' },
    { icon: Lock, titleKey: 'welcome.feature6.title', descKey: 'welcome.feature6.desc' },
  ];

  const whatsappIcons = [
    { num: 1, src: '/icon/WA/whatsapp-1.png', nameKey: 'welcome.wa1' },
    { num: 2, src: '/icon/WA/whatsapp-2.png', nameKey: 'welcome.wa2' },
    { num: 3, src: '/icon/WA/whatsapp-3.png', nameKey: 'welcome.wa3' },
    { num: 4, src: '/icon/WA/whatsapp-4.png', nameKey: 'welcome.wa4' },
    { num: 5, src: '/icon/WA/whatsapp-5.png', nameKey: 'welcome.wa5' },
    { num: 6, src: '/icon/WA/whatsapp-6.png', nameKey: 'welcome.wa6' },
  ];

  const ArrowIcon = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-accent/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-info/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Zap className="w-5 sm:w-6 h-5 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-info truncate">
                {t('welcome.title')}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t('welcome.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
            <LanguageToggle />
            <Button 
              onClick={() => navigate('/login')} 
              size="sm"
              className="gap-1 sm:gap-2 gradient-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow text-xs sm:text-sm px-2 sm:px-4"
            >
              <span className="hidden xs:inline">{t('welcome.login')}</span>
              <ArrowIcon className="w-3 sm:w-4 h-3 sm:h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Banner Section */}
      <section className="relative z-10 pt-6 sm:pt-8 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <BannerCarousel />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative z-10 py-10 sm:py-16 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <Badge variant="secondary" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
            <Star className="w-3 sm:w-4 h-3 sm:h-4 ml-1 sm:ml-2 text-warning" />
            {t('welcome.hero.badge')}
          </Badge>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold leading-tight px-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-info to-accent">
              {t('welcome.hero.title1')}
            </span>
            <br />
            <span className="text-foreground">{t('welcome.hero.title2')}</span>
          </h1>
          
          <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
            {t('welcome.hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="gap-2 gradient-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 text-sm sm:text-base h-10 sm:h-11"
            >
              {t('welcome.hero.start')}
              <ArrowIcon className="w-4 sm:w-5 h-4 sm:h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 hover:bg-primary/10 text-sm sm:text-base h-10 sm:h-11"
              onClick={() => window.open('https://wa.me/967777966865', '_blank')}
            >
              <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
              {t('welcome.hero.contact')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-10 sm:py-16 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('welcome.features.title')}</h2>
            <p className="text-sm sm:text-base text-muted-foreground px-2">{t('welcome.features.subtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-effect hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 group"
              >
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl sm:rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 sm:w-7 h-6 sm:h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">{t(feature.titleKey)}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t(feature.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Icons Section */}
      <section className="relative z-10 py-10 sm:py-16 px-3 sm:px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-lg sm:text-2xl font-bold mb-6 sm:mb-8">{t('welcome.supported.title')}</h2>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap justify-center gap-4 sm:gap-6">
            {whatsappIcons.map((icon) => (
              <div 
                key={icon.num}
                className="flex flex-col items-center gap-1 sm:gap-2 hover:scale-110 transition-transform cursor-pointer"
              >
                <img 
                  src={icon.src} 
                  alt={t(icon.nameKey)}
                  className="w-14 sm:w-20 h-14 sm:h-20 rounded-xl sm:rounded-2xl shadow-lg"
                />
                <span className="text-[10px] sm:text-sm text-muted-foreground">{t(icon.nameKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-10 sm:py-16 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { value: '1000+', labelKey: 'welcome.stats.users' },
              { value: '99%', labelKey: 'welcome.stats.success' },
              { value: '24/7', labelKey: 'welcome.stats.support' },
              { value: '5★', labelKey: 'welcome.stats.rating' },
            ].map((stat, index) => (
              <Card key={index} className="glass-effect text-center">
                <CardContent className="p-4 sm:p-6">
                  <p className="text-xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-info">
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-1 sm:mt-2">{t(stat.labelKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12 sm:py-20 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-effect overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-5" />
            <CardContent className="relative p-6 sm:p-8 md:p-12 text-center space-y-4 sm:space-y-6">
              <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                <CheckCircle className="w-8 sm:w-10 h-8 sm:h-10 text-primary-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">{t('welcome.cta.title')}</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
                {t('welcome.cta.desc')}
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="gap-2 gradient-primary shadow-lg shadow-primary/30 text-sm sm:text-base h-10 sm:h-11"
              >
                {t('welcome.hero.start')}
                <ArrowIcon className="w-4 sm:w-5 h-4 sm:h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-6 sm:py-8 px-3 sm:px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl gradient-primary flex items-center justify-center">
                <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold">{t('welcome.footer.title')}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{t('welcome.footer.subtitle')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                onClick={() => window.open('https://wa.me/967777966865', '_blank')}
              >
                <Phone className="w-3 sm:w-4 h-3 sm:h-4" />
                <span className="hidden sm:inline">967777966865</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                onClick={() => window.open('https://wa.me/967777966865', '_blank')}
              >
                <MessageCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                {t('welcome.footer.whatsapp')}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50 text-center text-[10px] sm:text-sm text-muted-foreground">
            {t('welcome.footer.copyright')}
            <br />
            {t('welcome.footer.dev')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
