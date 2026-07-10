import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenChange={setSidebarExpanded}
      />
      <main
        className="pt-4 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-[padding] duration-300 ease-in-out"
        style={{ paddingLeft: sidebarExpanded ? '304px' : undefined }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
