import { Outlet } from "react-router-dom";

import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:max-w-5xl md:px-8">
          <Outlet />
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
