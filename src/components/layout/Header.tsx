import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-divider bg-bg-base/80 backdrop-blur-sm transition-colors duration-300">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Minimal Logo Placeholder */}
          <div className="relative h-6 w-6 shrink-0 rounded-md border border-divider bg-bg-elevated shadow-sm">
            <div className="absolute bottom-1.5 left-1.5 h-1.5 w-1.5 rounded-[2px] bg-accent" />
          </div>
          <span className="text-sm font-medium tracking-wide text-text-primary">
            {t('app.title')}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent font-medium text-xs uppercase"
            aria-label={t('lang.toggle')}
            title={t('lang.toggle')}
          >
            {language}
          </button>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={t('theme.toggle')}
            title={t('theme.toggle')}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
