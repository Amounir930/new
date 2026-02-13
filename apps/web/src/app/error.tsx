'use client';

// S8 FIX: Robust Segment Error Handler (Pure HTML)

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            height: '70vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>حدث خطأ ما</h2>
            <p style={{ color: '#666' }}>نعتذر عن هذا الخطأ.</p>
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
    );
}
