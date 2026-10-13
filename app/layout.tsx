import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './global.css';
export const metadata: Metadata = {
  title: 'C’Floral | Quản lý thu chi',
  description: 'Quản lý đơn hàng và thu chi tiệm hoa C’Floral',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
