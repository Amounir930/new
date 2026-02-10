import './globals.css';
export const metadata = {
    title: 'Apex v2 - Launch Your Store in 60 Seconds',
    description: 'The fastest way to launch a multi-tenant e-commerce platform',
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className="antialiased">{children}</body>
    </html>);
}
