import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import classes from './layout.module.css';
import { Sidebar } from '../components/Sidebar';

const SIDEBAR_COLLAPSED_KEY = '@NotePlus:sidebarCollapsed';

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className={classes.layout}>
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((atual) => !atual)} />
      <main className={classes.content} data-collapsed={collapsed}>
        <Outlet />
      </main>
    </div>
  )
}
