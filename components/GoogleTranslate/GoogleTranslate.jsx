'use client';
import { useEffect, useState } from 'react';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'हिंदी (Hindi)', value: 'hi' },
  { label: 'मराठी (Marathi)', value: 'mr' },
  { label: 'தமிழ் (Tamil)', value: 'ta' },
  { label: 'తెలుగు (Telugu)', value: 'te' },
  { label: 'ಕನ್ನಡ (Kannada)', value: 'kn' },
  { label: 'മലയാളം (Malayalam)', value: 'ml' },
  { label: 'ગુજરાતી (Gujarati)', value: 'gu' },
  { label: 'বাংলা (Bengali)', value: 'bn' },
  { label: 'ਪੰਜਾਬੀ (Punjabi)', value: 'pa' },
];

export default function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Add script silently to DOM
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=initGoogleTranslate';
      script.async = true;
      document.body.appendChild(script);

      window.initGoogleTranslate = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: languages.map(l => l.value).join(','),
            autoDisplay: false
          },
          'google_translate_element'
        );
      };
    }
    
    // Attempt to read current language from googtrans cookie
    const match = document.cookie.match(/(^|;) ?googtrans=([^;]*)(;|$)/);
    if (match && match[2]) {
      const parts = match[2].split('/');
      if (parts.length > 2) {
        setCurrentLang(parts[2]);
      }
    }
  }, []);

  const changeLanguage = (langCode) => {
    setIsOpen(false);
    
    // Set cookie for Google Translate
    if (langCode === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      const hostname = window.location.hostname;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${hostname}`;
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
    }
    
    // Reload to apply native translation cleanly
    window.location.reload();
  };

  return (
    <>
      {/* Hidden google translate container */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* Floating Custom UI */}
      <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 10000 }}>
        {isOpen && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #eaeaea',
            borderRadius: '12px',
            padding: '8px 0',
            marginBottom: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '350px',
            overflowY: 'auto',
            minWidth: '180px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ 
              padding: '8px 16px', 
              fontSize: '12px', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              color: 'var(--bark, #687763)', 
              letterSpacing: '0.5px' 
            }}>
              Choose Language
            </div>
            {languages.map(lang => (
              <button
                key={lang.value}
                onClick={() => changeLanguage(lang.value)}
                style={{
                  background: currentLang === lang.value ? 'var(--mist, #f0f5ef)' : 'transparent',
                  border: 'none',
                  borderLeft: currentLang === lang.value ? '4px solid var(--leaf, #4A7C3F)' : '4px solid transparent',
                  padding: '12px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: currentLang === lang.value ? 'var(--soil, #2d1808)' : '#444',
                  fontWeight: currentLang === lang.value ? '600' : '500',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseOver={(e) => {
                  if (currentLang !== lang.value) {
                    e.currentTarget.style.background = '#f9f9f9';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = currentLang === lang.value ? 'var(--mist, #f0f5ef)' : 'transparent';
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'var(--soil, #2d1808)',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(45, 24, 8, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(45, 24, 8, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(45, 24, 8, 0.3)';
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🌐</span> 
          <span>{languages.find(l => l.value === currentLang)?.label.split(' ')[0] || 'English'}</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        /* Totally hide the original Google Translate iframe/banner */
        .skiptranslate iframe, .goog-te-banner-frame {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        /* Hide the tooltip showing original text on hover */
        #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
        /* Remove the yellow highlight on hover */
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}} />
    </>
  );
}
