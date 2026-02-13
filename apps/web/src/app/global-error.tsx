'use client';

// S8 FIX: Robust Global Error Handler (Pure HTML)
// Replaces default Next.js error page to prevent React #31 crashes during static build.
// Must be pure HTML/CSS to be strictly dependency-free.

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1 style={{ fontSize: '72px', margin: '0 0 20px 0' }}>500</h1>
                    <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>خطأ في الخادم</h2>
                    <p style={{ color: '#666' }}>عفوًا! حدث خطأ غير متوقع.</p>
                    <button
                        onClick={() => reset()}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        حاول مرة أخرى
                    </button>
                </div>
            </body>
        </html>
    );
}
