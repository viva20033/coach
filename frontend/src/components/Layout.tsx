import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-mobile mx-auto pb-24 safe-top">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
