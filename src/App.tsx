import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Shell } from './components/layout/Shell';
import { TokenAnalysis } from './pages/TokenAnalysis';

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Shell>
          <TokenAnalysis />
        </Shell>
      </ThemeProvider>
    </LanguageProvider>
  );
}
