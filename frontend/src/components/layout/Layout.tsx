// Single Responsibility: composes the two-panel layout

import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import type { UserProfile } from '../../types';

interface LayoutProps {
  user: UserProfile;
  children: ReactNode;
}

const Layout = ({ user, children }: LayoutProps) => (
  <div className="bg-background text-on-surface">
    <Sidebar />
    <main className="ml-64 min-h-screen">
      <TopBar user={user} />
      <div className="p-6 space-y-5">{children}</div>
    </main>
  </div>
);

export default Layout;