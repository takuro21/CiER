'use client';

import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function Layout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  maxWidth = 'lg'
}: LayoutProps) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-4xl';
      case 'xl': return 'max-w-6xl';
      case '2xl': return 'max-w-7xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-4xl';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeader && <Header />}
      <main className="flex-1 py-4 sm:py-6 lg:py-8">
        <div className={`${getMaxWidthClass()} mx-auto px-4 sm:px-6 lg:px-8`}>
          {children}
        </div>
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
