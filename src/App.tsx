import React, { useState, useEffect } from 'react';
import { Trash2, Cookie, History, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export default function App() {
  const [domain, setDomain] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isExtension, setIsExtension] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if running as a Chrome extension
    if (window.chrome && chrome.tabs) {
      setIsExtension(true);
      // Auto-fill current domain
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            // Strip www. for broader matching, keep base domain
            const hostname = url.hostname.replace(/^www\./, '');
            setDomain(hostname);
          } catch (e) {
            console.error("Invalid URL", e);
          }
        }
      });
    }
  }, []);

  const showStatus = (type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const clearCookies = async () => {
    if (!domain) return showStatus('error', 'Please enter a domain.');
    setIsLoading(true);

    if (isExtension && chrome.cookies) {
      chrome.cookies.getAll({ domain: domain }, (cookies) => {
        if (cookies.length === 0) {
          showStatus('info', `No cookies found for ${domain}`);
          setIsLoading(false);
          return;
        }

        let deletedCount = 0;
        cookies.forEach((cookie) => {
          const protocol = cookie.secure ? 'https:' : 'http:';
          const cookieUrl = `${protocol}//${cookie.domain}${cookie.path}`;
          chrome.cookies.remove({ url: cookieUrl, name: cookie.name }, () => {
            deletedCount++;
            if (deletedCount === cookies.length) {
              showStatus('success', `Deleted ${deletedCount} cookies for ${domain}`);
              setIsLoading(false);
            }
          });
        });
      });
    } else {
      // Mock behavior for web preview
      setTimeout(() => {
        showStatus('success', `[Preview] Deleted cookies for ${domain}`);
        setIsLoading(false);
      }, 600);
    }
  };

  const clearHistory = async () => {
    if (!domain) return showStatus('error', 'Please enter a domain.');
    setIsLoading(true);

    if (isExtension && chrome.history) {
      chrome.history.search({ text: domain, startTime: 0, maxResults: 10000 }, (results) => {
        if (results.length === 0) {
          showStatus('info', `No history found for ${domain}`);
          setIsLoading(false);
          return;
        }

        let deletedCount = 0;
        results.forEach((item) => {
          if (item.url) {
            chrome.history.deleteUrl({ url: item.url }, () => {
              deletedCount++;
              if (deletedCount === results.length) {
                showStatus('success', `Deleted ${deletedCount} history items for ${domain}`);
                setIsLoading(false);
              }
            });
          }
        });
      });
    } else {
      // Mock behavior for web preview
      setTimeout(() => {
        showStatus('success', `[Preview] Deleted history for ${domain}`);
        setIsLoading(false);
      }, 600);
    }
  };

  const clearBoth = () => {
    if (!domain) return showStatus('error', 'Please enter a domain.');
    clearCookies();
    setTimeout(clearHistory, 100);
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 font-sans">
      {/* Extension Popup Container */}
      <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="bg-zinc-900 p-4 text-white flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="font-semibold text-sm">Site Data Cleaner</h1>
            <p className="text-xs text-zinc-400">Manage your privacy</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {!isExtension && (
            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs flex gap-2 items-start border border-blue-100">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Preview Mode:</strong> Chrome APIs are mocked. To use this extension, build the app and load the <code className="bg-blue-100 px-1 rounded">dist</code> folder in Chrome.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="domain" className="text-xs font-medium text-zinc-700 uppercase tracking-wider">
              Target Domain
            </label>
            <input
              id="domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., example.com"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={clearCookies}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <Cookie className="w-4 h-4 text-amber-500" />
                Clear Cookies
              </span>
            </button>

            <button
              onClick={clearHistory}
              disabled={isLoading}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                Clear History
              </span>
            </button>

            <button
              onClick={clearBoth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-12 bg-zinc-50 border-t border-zinc-100 px-4 flex items-center">
          {status.message ? (
            <div className={`text-xs flex items-center gap-1.5 ${
              status.type === 'error' ? 'text-red-600' : 
              status.type === 'success' ? 'text-emerald-600' : 'text-zinc-600'
            }`}>
              {status.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
              {status.message}
            </div>
          ) : (
            <span className="text-xs text-zinc-400">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
}
