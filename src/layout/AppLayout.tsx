import OfflineBanner from "@/components/pwa/OfflineBanner";
import UpdatePrompt from "@/components/pwa/UpdatePrompt";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { cn } from "@/utils";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />

      <div
        className={cn(
          // min-w-0: a wide table scrolls inside its container instead of
          // stretching the column (and the whole page) past the viewport.
          "min-w-0 flex-1 transition-[margin] duration-300 ease-in-out",
          isExpanded || isHovered ? "xl:ms-64" : "xl:ms-20",
          isMobileOpen ? "ms-0" : "",
        )}
      >
        <AppHeader />
        <main className="mx-auto max-w-(--breakpoint-2xl) px-4 py-5 md:px-6 md:py-6">
          <OfflineBanner />
          <Outlet />
        </main>
      </div>
      <UpdatePrompt />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
