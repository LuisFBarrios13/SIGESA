import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import type { UserProfile } from '../../types';

interface LayoutProps {
  user: UserProfile | null;
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
  <div className="bg-background text-on-surface">
    <Sidebar />
    <main className="ml-64 min-h-screen">
      <div className="p-6 space-y-5">{children}</div>
    </main>
  </div>
);

export default Layout;