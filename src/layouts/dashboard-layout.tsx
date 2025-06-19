import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/utils/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex w-[100vw]">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex h-14 items-center border-b px-4 lg:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}