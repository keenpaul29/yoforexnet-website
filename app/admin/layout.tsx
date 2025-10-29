import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Admin Panel - YoForex',
    template: '%s | Admin - YoForex',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
