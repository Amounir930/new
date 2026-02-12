import React from 'react';

// S8 FIX: Robust Global Error Page (Pure HTML)
// Fallback for any other build errors to prevent crashes.

function Error({ statusCode }: { statusCode?: number }) {
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
      <h1 style={{ fontSize: '72px', margin: '0 0 20px 0' }}>
        {statusCode ? statusCode : 'Error'}
      </h1>
      <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>حدث خطأ ما</h2>
      <p style={{ color: '#666' }}>
        {statusCode ? `حدث خطأ ${statusCode} في الخادم` : 'حدث خطأ في المتصفح'}
      </p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
