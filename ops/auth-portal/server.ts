import { serve } from 'bun';
import { env } from '../../packages/config/src/index.ts';

const PORT = 8080;
const COOKIE_NAME = 'apex_auth_session';
const SESSION_VALUE = Bun.hash(env.JWT_SECRET || 'default_secret').toString();

const EMAIL = env.SUPER_ADMIN_EMAIL || 'admin@60sec.shop';
const PASSWORD = env.SUPER_ADMIN_PASSWORD || 'Admin@60SecShop!2026';

console.log(`🛡️  Apex Auth Portal starting on port ${PORT}...`);

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const cookies = req.headers.get('Cookie') || '';
    const isAuthenticated = cookies.includes(`${COOKIE_NAME}=${SESSION_VALUE}`);

    // 1. ForwardAuth Endpoint
    if (url.pathname === '/auth') {
      if (isAuthenticated) {
        return new Response('OK', { status: 200 });
      }
      // For dashboard/admin access, redirect to /login
      return new Response('Redirect', {
        status: 302,
        headers: { Location: '/login' },
      });
    }

    // 2. Login Page (GET)
    if (url.pathname === '/login' && req.method === 'GET') {
      return new Response(getLoginHTML(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // 3. Login Logic (POST)
    if (url.pathname === '/login' && req.method === 'POST') {
      try {
        const formData = await req.formData();
        const email = formData.get('email');
        const password = formData.get('password');

        if (email === EMAIL && password === PASSWORD) {
          console.log(`✅ Successful login for ${email}`);
          return new Response('OK', {
            status: 302,
            headers: {
              Location: '/dashboard/',
              'Set-Cookie': `${COOKIE_NAME}=${SESSION_VALUE}; Path=/; HttpOnly; SameSite=Lax`,
            },
          });
        }

        console.warn(`❌ Failed login attempt for ${email}`);
        return new Response(
          getLoginHTML('Invalid credentials. Please try again.'),
          {
            headers: { 'Content-Type': 'text/html' },
          }
        );
      } catch (_e) {
        return new Response('Bad Request', { status: 400 });
      }
    }

    // Default: Redirect to login
    return new Response('', {
      status: 302,
      headers: { Location: '/login' },
    });
  },
});

function getLoginHTML(error = '') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex Admin Access</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #000000;
            --accent: #3b82f6;
            --bg: #f8fafc;
            --card-bg: rgba(255, 255, 255, 0.8);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .container {
            background: var(--card-bg);
            backdrop-filter: blur(12px);
            padding: 2.5rem;
            border-radius: 20px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.05);
            width: 100%;
            max-width: 420px;
            border: 1px solid rgba(255,255,255,0.3);
            animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        h1 { font-weight: 600; font-size: 1.8rem; margin-bottom: 0.5rem; text-align: center; color: var(--primary); }
        p.subtitle { text-align: center; color: #64748b; margin-bottom: 2rem; font-size: 0.95rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #475569; font-weight: 500; }
        input {
            width: 100%;
            padding: 0.8rem 1rem;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            background: white;
            font-family: inherit;
            transition: all 0.2s;
            font-size: 1rem;
        }
        input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        button {
            width: 100%;
            padding: 0.9rem;
            border: none;
            border-radius: 10px;
            background: var(--primary);
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 1rem;
        }
        button:hover { background: #1a1a1a; transform: translateY(-1px); }
        button:active { transform: translateY(0); }
        .error {
            background: #fef2f2;
            color: #b91c1c;
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
            border: 1px solid #fee2e2;
            text-align: center;
        }
        .footer { text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Admin Access</h1>
        <p class="subtitle">Enter your credentials to continue</p>
        
        ${error ? `<div class="error">${error}</div>` : ''}

        <form action="/login" method="POST">
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" placeholder="admin@60sec.shop" required>
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" placeholder="••••••••••••" required>
            </div>
            <button type="submit">Sign In</button>
        </form>

        <div class="footer">
            Protected by Apex Security
        </div>
    </div>
</body>
</html>
    `;
}
