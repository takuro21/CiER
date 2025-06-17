import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "../providers/QueryProvider";
import { AuthProvider } from "../contexts/AuthContext";
import PWAInstaller from "../components/PWAInstaller";
import ErrorSuppressor from "../components/ErrorSuppressor";
import Layout from "../components/Layout";
import Script from "next/script";

// React DevTools早期抑制
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Immediately suppress React DevTools hook
  try {
    Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
      get() { return { isDisabled: true, supportsFiber: true, inject: () => {}, onCommitFiberRoot: () => {}, onCommitFiberUnmount: () => {} }; },
      set() {},
      configurable: false,
    });
  } catch (e) {}
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CiER - 美容室予約プラットフォーム",
  description: "紹介システム付きの美容室予約プラットフォーム",
  keywords: "美容室, 予約, 紹介, CiER, ヘアサロン",
  authors: [{ name: "CiER Team" }],
  creator: "CiER",
  publisher: "CiER",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo symbol_favicon_16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo symbol_favicon_32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo symbol_favicon_48.png", sizes: "48x48", type: "image/png" }
    ],
    shortcut: ["/logo symbol_favicon_32.png"],
    apple: [
      { url: "/logo symbol_icon_64.png", sizes: "64x64", type: "image/png" }
    ],
    other: [
      { rel: "icon", type: "image/png", sizes: "192x192", url: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", url: "/icon-512.png" }
    ]
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#8B5CF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* 最強エラー抑制スクリプト - 最優先読み込み */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="/error-suppressor.js"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={process.env.NODE_ENV === 'development'}
      >
        <QueryProvider>
          <AuthProvider>
            <PWAInstaller />
            {children}
            {process.env.NODE_ENV === 'development' && (
              <noscript>
                <div style={{ 
                  position: 'fixed', 
                  top: 0, 
                  width: '100%', 
                  backgroundColor: '#f59e0b', 
                  color: 'white', 
                  padding: '10px', 
                  textAlign: 'center',
                  zIndex: 9999 
                }}>
                  JavaScriptを有効にしてください
                </div>
              </noscript>
            )}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
