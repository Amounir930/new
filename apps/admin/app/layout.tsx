import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@apex/ui/dist/index.css' // Import shared styles
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Apex Admin - Store Builder',
    description: 'Manage your Apex v2 store templates and content',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" dir="ltr">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
