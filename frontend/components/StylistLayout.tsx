'use client';

import StylistHeader from './StylistHeader';
import StylistFooter from './StylistFooter';

interface StylistLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function StylistLayout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  maxWidth = 'full'
}: StylistLayoutProps) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-4xl';
      case 'xl': return 'max-w-6xl';
      case '2xl': return 'max-w-7xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-full';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeader && <StylistHeader />}
      <main className="flex-1 py-4">
        <div className={`${getMaxWidthClass()} mx-auto px-4`}>
          {children}
        </div>
      </main>
      {showFooter && <StylistFooter />}
    </div>
  );
}
