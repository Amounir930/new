import React from 'react';

// S8 FIX: Robust 500 Error Page (Pure HTML)
// Prevents "Minified React Error #31" during static generation of error pages.

export default function Custom500() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '72px', margin: '0 0 20px 0' }}>500</h1>
      <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>خطأ في الخادم</h2>
      <p style={{ color: '#666' }}>عفوًا! حدث خطأ غير متوقع في الخادم.</p>
    </div>
  );
}
