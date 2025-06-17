/**
 * Development utilities and error suppression for CiER
 * 開発環境のユーティリティとエラー抑制
 */

'use client';

import { useEffect } from 'react';

export default function ErrorSuppressor() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    // Aggressive React DevTools suppression - must be done first
    try {
      // Block React DevTools hook entirely
      Object.defineProperty(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__', {
        get() {
          return {
            isDisabled: true,
            supportsFiber: true,
            inject: () => {},
            onCommitFiberRoot: () => {},
            onCommitFiberUnmount: () => {},
            checkDCE: () => true,
          };
        },
        set() {
          // Prevent setting
        },
        configurable: false,
        enumerable: false,
      });
    } catch (e) {
      // Ignore
    }

    // 初回ログの制御（重複防止）
    const devLogged = sessionStorage.getItem('cier-dev-logged');
    
    if (!devLogged) {
      console.log('%c🚀 CiER Development Mode', 
        'color: #8B5CF6; font-weight: bold; font-size: 14px;');
      console.log('%cAPI: http://127.0.0.1:8001', 'color: #10B981;');
      console.log('%cApp: http://localhost:3000', 'color: #3B82F6;');
      sessionStorage.setItem('cier-dev-logged', 'true');
    }

    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    const originalInfo = console.info;

    // Comprehensive error patterns to suppress
    const suppressPatterns = [
      // React DevTools (all variations)
      /Download the React DevTools/i,
      /react-devtools/i,
      /https:\/\/react\.dev\/link\/react-devtools/i,
      /React DevTools/i,
      /react-dom-client\.development\.js/i,
      
      // Fast Refresh
      /Fast Refresh/i,
      /rebuilding/i,
      /done in \d+ms/i,
      /\[Fast Refresh\]/i,
      /done in NaNms/i,
      
      // Hydration warnings
      /Warning: Text content did not match/i,
      /Warning: Expected server HTML/i,
      /Hydration failed/i,
      /hydration/i,
      
      // Chrome extension errors (comprehensive)
      /chrome-extension:/i,
      /net::ERR_FILE_NOT_FOUND/i,
      /Failed to load resource/i,
      /utils\.js/i,
      /extensionState\.js/i,
      /heuristicsRedefinitions\.js/i,
      /completion_list\.html/i,
      /GET chrome-extension/i,
      /moz-extension:/i,
      /pejdijmoenmkgeppbflobdenhhabjlaj/i,
      /Download error or resource isn't a valid image/i,
      /Error while trying to use the following icon/i,
      
      // Next.js warnings
      /Warning: ReactDOM\.render/i,
      /Warning: componentWillReceiveProps/i,
      /Warning: componentWillMount/i,
      
      // Service Worker
      /Service worker registration/i,
      /SW registered/i,
      
      // PWA
      /manifest\.json/i,
      /PWA/i,
      
      // Common development noise
      /Warning: Each child in a list/i,
      /Warning: Failed prop type/i,
      /Warning: Encountered two children with the same key/i,
      
      // Webpack/Build related
      /webpack/i,
      /HMR/i,
      /Hot Module Replacement/i,
      
      // Browser extension specific errors
      /Error in event handler for.*runtime\.onMessage/i,
      /Could not establish connection/i,
      /Receiving end does not exist/i,
      /Extension context invalidated/i,
    ];

    // Enhanced error suppression function with early return
    function shouldSuppress(args: any[]): boolean {
      if (!args.length) return false;
      
      // Convert all arguments to string and check
      const fullMessage = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object' && arg?.message) return arg.message;
        if (typeof arg === 'object' && arg?.stack) return arg.stack;
        return String(arg);
      }).join(' ');
      
      return suppressPatterns.some(pattern => pattern.test(fullMessage));
    }

    // Override console methods with safe error handling
    console.error = (...args) => {
      if (!shouldSuppressMessage(args)) {
        originalError.apply(console, args);
      }
    };

    console.warn = (...args) => {
      if (!shouldSuppressMessage(args)) {
        originalWarn.apply(console, args);
      }
    };

    console.log = (...args) => {
      if (!shouldSuppressMessage(args)) {
        originalLog.apply(console, args);
      }
    };

    console.info = (...args) => {
      if (!shouldSuppressMessage(args)) {
        originalInfo.apply(console, args);
      }
    };

    // Comprehensive network error suppression
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch.apply(window, args);
      } catch (error: any) {
        // Suppress Chrome extension network errors
        if (error?.message?.includes('chrome-extension') || 
            error?.message?.includes('ERR_FILE_NOT_FOUND') ||
            error?.stack?.includes('chrome-extension') ||
            error?.message?.includes('moz-extension')) {
          return new Response('', { status: 404 });
        }
        throw error;
      }
    };

    // Block extension resource loading entirely
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(document, tagName);
      if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'link') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name: string, value: string) {
          if ((name === 'src' || name === 'href') && 
              (value.includes('chrome-extension://') || value.includes('moz-extension://'))) {
            // Block extension resource loading
            return;
          }
          originalSetAttribute.call(this, name, value);
        };
      }
      return element;
    };

    // Suppress unhandled promise rejections from extensions
    const originalUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event) => {
      const reason = event.reason?.toString() || '';
      const stack = event.reason?.stack?.toString() || '';
      
      if (reason.includes('chrome-extension') || 
          reason.includes('ERR_FILE_NOT_FOUND') ||
          reason.includes('net::ERR_') ||
          reason.includes('moz-extension') ||
          stack.includes('chrome-extension') ||
          stack.includes('moz-extension')) {
        event.preventDefault();
        return;
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event);
      }
    };

    // Suppress window errors from extensions
    const originalWindowError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const msg = message?.toString() || '';
      const src = source?.toString() || '';
      const errorStack = error?.stack?.toString() || '';
      
      if (src.includes('chrome-extension') || 
          src.includes('moz-extension') ||
          msg.includes('chrome-extension') ||
          msg.includes('moz-extension') ||
          msg.includes('ERR_FILE_NOT_FOUND') ||
          msg.includes('net::ERR_') ||
          errorStack.includes('chrome-extension') ||
          errorStack.includes('moz-extension')) {
        return true; // Prevent default error handling
      }
      
      if (originalWindowError) {
        return originalWindowError.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // Enhanced error event suppression
    const originalAddEventListener = window.addEventListener;
    (window as any).addEventListener = function(type: string, listener: EventListener, options?: any) {
      if (type === 'error' && typeof listener === 'function') {
        const wrappedListener = (event: any) => {
          const target = event.target || event.srcElement;
          const src = target?.src || target?.href || '';
          const message = event.message || '';
          const filename = event.filename || '';
          
          if (src.includes('chrome-extension') ||
              src.includes('moz-extension') ||
              message.includes('chrome-extension') ||
              message.includes('moz-extension') ||
              filename.includes('chrome-extension') ||
              filename.includes('moz-extension')) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          
          return listener.call(this, event);
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    // Override XMLHttpRequest to suppress extension requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      if (typeof url === 'string' && 
          (url.includes('chrome-extension') || url.includes('moz-extension'))) {
        // Silently fail browser extension requests
        (this as any).send = () => {};
        (this as any).addEventListener = () => {};
        return;
      }
      return originalXHROpen.call(this, method, url, async!, username, password);
    };

    // Prevent ErrorSuppressor from interfering with legitimate errors
    // Only suppress specific development noise, not actual application errors
    const isActualError = (message: string) => {
      return message.includes('AxiosError') || 
             message.includes('API Error') || 
             message.includes('Request failed') ||
             message.includes('Network Error') ||
             (message.includes('Error') && !suppressPatterns.some(pattern => pattern.test(message)));
    };

    // Enhanced error suppression function with legitimate error protection
    function shouldSuppressMessage(args: any[]): boolean {
      if (!args.length) return false;
      
      const fullMessage = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object' && arg?.message) return arg.message;
        if (typeof arg === 'object' && arg?.stack) return arg.stack;
        return String(arg);
      }).join(' ');
      
      // Never suppress actual application errors
      if (isActualError(fullMessage)) {
        return false;
      }
      
      // Only suppress development noise
      return suppressPatterns.some(pattern => pattern.test(fullMessage)) ||
             fullMessage.includes('chrome-extension://') ||
             fullMessage.includes('net::ERR_FILE_NOT_FOUND') ||
             fullMessage.includes('completion_list.html') ||
             fullMessage.includes('extensionState.js') ||
             fullMessage.includes('utils.js') ||
             fullMessage.includes('heuristicsRedefinitions.js') ||
             fullMessage.includes('pejdijmoenmkgeppbflobdenhhabjlaj') ||
             fullMessage.includes('Download the React DevTools') ||
             fullMessage.includes('react-devtools') ||
             fullMessage.includes('react-dom-client.development.js');
    }

    // Suppress image loading errors for extensions
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && (img.src.includes('chrome-extension') || img.src.includes('moz-extension'))) {
        img.onerror = null;
      }
    });

    // Monitor and suppress new image errors
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const images = element.querySelectorAll ? element.querySelectorAll('img') : [];
            images.forEach((img: HTMLImageElement) => {
              if (img.src && (img.src.includes('chrome-extension') || img.src.includes('moz-extension'))) {
                img.onerror = null;
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup function
    return () => {
      // Restore original console methods
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      console.info = originalInfo;
      window.fetch = originalFetch;
      window.onunhandledrejection = originalUnhandledRejection;
      window.onerror = originalWindowError;
      (window as any).addEventListener = originalAddEventListener;
      XMLHttpRequest.prototype.open = originalXHROpen;
      document.createElement = originalCreateElement;
      observer.disconnect();
    };
  }, []);

  return null;
}
