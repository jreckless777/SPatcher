import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'id';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'SnipePatcher',
    'theme.toggle': 'Toggle theme',
    'lang.toggle': 'Toggle language',
    'guide.title': 'Design System',
    'guide.subtitle': 'This is a placeholder page to validate the "Quiet Signal" design tokens. Focus on typography, whitespace, and sparingly used accent colors.',
    'guide.typography': 'Typography & Numbers',
    'guide.heading1': 'Heading 1',
    'guide.heading1.val': 'Wallet Analysis',
    'guide.body': 'Body Text',
    'guide.body.val': 'On-chain intelligence platform to analyze tokens, monitor whale movements, and find signals amidst blockchain network noise.',
    'guide.numbers': 'Tabular Numbers (For Balances)',
    'guide.profit': 'Total Profit:',
    'guide.loss': 'Total Loss:',
    'guide.components': 'Basic Components',
    'guide.buttons': 'Buttons',
    'guide.btn.primary': 'Primary Action',
    'guide.btn.secondary': 'Secondary Action',
    'guide.btn.ghost': 'Ghost Button',
    'guide.badges': 'Status Badges',
    'guide.badge.success': 'Profit +12%',
    'guide.badge.error': 'Loss -4.2%',
    'guide.badge.neutral': 'Hold',
    'guide.surfaces': 'Surface Elevations',
    'guide.surface.base': 'Base Surface',
    'guide.surface.base.desc': 'Main application background. Uses warm charcoal (dark) or soft off-white cream (light).',
    'guide.surface.elevated': 'Elevated Surface',
    'guide.surface.elevated.desc': 'Used for cards, panel containers, and secondary components standing out from the background.',
    'guide.surface.elevated2': 'Elevated 2',
    'guide.surface.elevated2.desc': 'Used for interactive states like hover states, table row highlights, or active elements.',
  },
  id: {
    'app.title': 'SnipePatcher',
    'theme.toggle': 'Ganti tema',
    'lang.toggle': 'Ganti bahasa',
    'guide.title': 'Sistem Desain',
    'guide.subtitle': 'Ini adalah halaman placeholder untuk memvalidasi token desain "Quiet Signal". Fokus pada tipografi, ruang (whitespace), dan warna aksen yang digunakan secara hemat.',
    'guide.typography': 'Tipografi & Angka',
    'guide.heading1': 'Heading 1',
    'guide.heading1.val': 'Analisis Wallet',
    'guide.body': 'Body Text',
    'guide.body.val': 'Platform intelijen on-chain untuk menganalisis token, memantau pergerakan paus, dan menemukan sinyal di tengah kebisingan jaringan blockchain.',
    'guide.numbers': 'Angka Tabular (Untuk Saldo)',
    'guide.profit': 'Total Profit:',
    'guide.loss': 'Total Loss:',
    'guide.components': 'Komponen Dasar',
    'guide.buttons': 'Tombol',
    'guide.btn.primary': 'Aksi Utama',
    'guide.btn.secondary': 'Aksi Sekunder',
    'guide.btn.ghost': 'Tombol Ghost',
    'guide.badges': 'Badge Status',
    'guide.badge.success': 'Profit +12%',
    'guide.badge.error': 'Rugi -4.2%',
    'guide.badge.neutral': 'Tahan',
    'guide.surfaces': 'Elevasi Permukaan (Surfaces)',
    'guide.surface.base': 'Base Surface',
    'guide.surface.base.desc': 'Latar belakang utama aplikasi. Menggunakan warna charcoal hangat (dark) atau off-white krem (light).',
    'guide.surface.elevated': 'Elevated Surface',
    'guide.surface.elevated.desc': 'Digunakan untuk kartu, kontainer panel, dan komponen sekunder yang menonjol dari latar belakang.',
    'guide.surface.elevated2': 'Elevated 2',
    'guide.surface.elevated2.desc': 'Digunakan untuk status interaktif seperti hover states, highlight baris tabel, atau elemen aktif.',
  }
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language') as Language;
      if (stored === 'en' || stored === 'id') return stored;
    }
    return 'id'; // Default to Indonesian
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'id' : 'en'));

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
