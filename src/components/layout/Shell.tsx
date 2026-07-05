import { ReactNode } from 'react';
import { Header } from './Header';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col font-sans transition-colors duration-300 selection:bg-accent/20">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}
