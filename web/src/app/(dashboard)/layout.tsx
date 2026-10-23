import { AppSidebar } from "@/components/layout/app-sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1180px] px-4 py-6 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}
