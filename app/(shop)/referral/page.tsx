'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.swadkerala.swadkerala&pcampaignid=web_share';
const APP_STORE_URL =
  'https://apps.apple.com/in/app/swadkerala/id6759081528';
const DEEP_LINK_BASE = 'https://www.swadkerala.com/referal';
const DEEP_LINK_SCHEME = 'swadkerala';
const APP_PACKAGE = 'com.swadkerala.swadkerala';

function getDeviceType(
  userAgent: string,
): 'android' | 'ios' | 'desktop' {
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  return 'desktop';
}

function buildAndroidIntentUrl(path: string): string {
  return `intent://${path}#Intent;scheme=${DEEP_LINK_SCHEME};package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
}

function getStoreUrl(device: 'android' | 'ios' | 'desktop'): string {
  return device === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
}

export default function ReferralPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    'redirecting' | 'fallback' | 'prompt'
  >('redirecting');
  const deviceRef = useRef('');
  const deepLinkRef = useRef('');
  const storeUrlRef = useRef('');

  const openApp = useCallback(() => {
    const link = deepLinkRef.current;
    const store = storeUrlRef.current;
    window.location.href = link;

    const timer = setTimeout(() => {
      document.removeEventListener('visibilitychange', onVis);
      if (document.visibilityState !== 'hidden') {
        setStatus('fallback');
        window.location.href = store;
      }
    }, 1500);

    function onVis() {
      if (document.visibilityState === 'hidden') {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVis);
      }
    }
    document.addEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent;
    const dev = getDeviceType(ua);
    const referrerId = searchParams.get('referrerId') || '';

    deviceRef.current = dev;

    if (dev === 'desktop') {
      window.location.href = referrerId
        ? `/?referrerId=${referrerId}`
        : `/`;
      return;
    }

    const link = referrerId
      ? `${DEEP_LINK_BASE}?referrerId=${referrerId}`
      : DEEP_LINK_BASE;
    const store = getStoreUrl(dev);

    deepLinkRef.current = link;
    storeUrlRef.current = store;

    if (dev === 'android') {
      const intentPath = referrerId
        ? `refer?referrerId=${referrerId}`
        : 'refer';
      window.location.href = buildAndroidIntentUrl(intentPath);
    } else {
      window.location.href = link;
    }

    const timer = setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        setStatus('prompt');
      }
    }, 1500);

    function onVis() {
      if (document.visibilityState === 'hidden') {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVis);
      }
    }
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <img
        src="/swadkerala-logo.png"
        alt="SwadKerala"
        width={80}
        height={80}
        style={{ borderRadius: 16, marginBottom: 24 }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {status === 'redirecting' && (
        <>
          <div
            style={{
              width: 32,
              height: 32,
              border: '3px solid rgba(255,255,255,0.2)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: 16,
            }}
          />
          <p style={{ fontSize: 16, opacity: 0.8 }}>Opening SwadKerala...</p>
        </>
      )}

      {status === 'prompt' && (
        <>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Open in SwadKerala
          </p>
          <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 28 }}>
            You were invited to join SwadKerala!
          </p>
          <button
            onClick={openApp}
            style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: 12,
              padding: '14px 36px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 16,
              width: '100%',
              maxWidth: 280,
            }}
          >
            Open in App
          </button>
          <button
            onClick={() => {
              window.location.href = storeUrlRef.current;
            }}
            style={{
              background: 'transparent',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '12px 36px',
              fontSize: 14,
              cursor: 'pointer',
              width: '100%',
              maxWidth: 280,
            }}
          >
            {deviceRef.current === 'ios'
              ? 'Download on App Store'
              : 'Get on Play Store'}
          </button>
        </>
      )}

      {status === 'fallback' && (
        <p style={{ fontSize: 16, opacity: 0.8 }}>Redirecting to store...</p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
