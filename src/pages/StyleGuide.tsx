import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

export function StyleGuide() {
  const { t } = useLanguage();

  return (
    <div className="space-y-16 animate-in fade-in duration-500 fill-mode-both pb-10">
      <section className="space-y-6 pt-10 sm:pt-12 pb-8">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-text-primary">
          {t('guide.title')} <br className="hidden sm:block" />
          <span className="text-accent">{t('app.title')}</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl leading-[1.75]">
          {t('guide.subtitle')}
        </p>
      </section>

      <div className="h-px w-full bg-divider" />

      <section className="space-y-10">
        <h2 className="text-2xl font-medium tracking-tight text-text-primary">{t('guide.typography')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wider">{t('guide.heading1')}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-text-primary">{t('guide.heading1.val')}</h1>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wider">{t('guide.body')}</p>
              <p className="text-base text-text-secondary leading-[1.75]">
                {t('guide.body.val')}
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wider">{t('guide.numbers')}</p>
              <div className="font-mono text-lg space-y-2">
                <p className="text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span className="text-text-secondary mr-4">{t('guide.profit')}</span> 
                  <span className="text-status-success">+1,234,567.89 SOL</span>
                </p>
                <p className="text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <span className="text-text-secondary mr-4">{t('guide.loss')}</span> 
                  <span className="text-status-error">-42.10 SOL</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-divider" />

      <section className="space-y-10">
        <h2 className="text-2xl font-medium tracking-tight text-text-primary">{t('guide.components')}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-secondary">{t('guide.buttons')}</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">{t('guide.btn.primary')}</Button>
              <Button variant="secondary">{t('guide.btn.secondary')}</Button>
              <Button variant="ghost">{t('guide.btn.ghost')}</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-secondary">{t('guide.badges')}</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="success">{t('guide.badge.success')}</Badge>
              <Badge variant="error">{t('guide.badge.error')}</Badge>
              <Badge variant="neutral">{t('guide.badge.neutral')}</Badge>
            </div>
          </div>
        </div>
      </section>
      
      <div className="h-px w-full bg-divider" />
      
      <section className="space-y-10">
        <h2 className="text-2xl font-medium tracking-tight text-text-primary">{t('guide.surfaces')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-bg-base border border-divider shadow-sm">
            <p className="text-sm font-medium text-text-primary">{t('guide.surface.base')}</p>
            <p className="text-xs text-text-secondary mt-2 leading-[1.75]">
              {t('guide.surface.base.desc')}
            </p>
          </div>
          <div className="p-6 rounded-xl bg-bg-elevated border border-divider shadow-sm">
            <p className="text-sm font-medium text-text-primary">{t('guide.surface.elevated')}</p>
            <p className="text-xs text-text-secondary mt-2 leading-[1.75]">
              {t('guide.surface.elevated.desc')}
            </p>
          </div>
          <div className="p-6 rounded-xl bg-bg-elevated-2 border border-divider shadow-sm">
            <p className="text-sm font-medium text-text-primary">{t('guide.surface.elevated2')}</p>
            <p className="text-xs text-text-secondary mt-2 leading-[1.75]">
              {t('guide.surface.elevated2.desc')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
