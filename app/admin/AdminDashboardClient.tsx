"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent 
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Store, 
  Building, 
  DollarSign 
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdminOverview from "./sections/Overview";
import AdminUsers from "./sections/Users";
import AdminContent from "./sections/Content";
import AdminMarketplace from "./sections/Marketplace";
import AdminBrokers from "./sections/Brokers";
import AdminFinance from "./sections/Finance";

const sections = [
  { id: "overview", icon: BarChart3, label: "Overview", path: "/admin" },
  { id: "users", icon: Users, label: "Users", path: "/admin/users" },
  { id: "content", icon: FileText, label: "Content", path: "/admin/content" },
  { id: "marketplace", icon: Store, label: "Marketplace", path: "/admin/marketplace" },
  { id: "brokers", icon: Building, label: "Brokers", path: "/admin/brokers" },
  { id: "finance", icon: DollarSign, label: "Finance", path: "/admin/finance" },
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => {
                const isActive = pathname === section.path;
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={section.path} data-testid={`nav-${section.id}`}>
                        <section.icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminDashboardClient() {
  const pathname = usePathname();

  // Determine which section to render based on pathname
  const renderSection = () => {
    switch (pathname) {
      case "/admin/users":
        return <AdminUsers />;
      case "/admin/content":
        return <AdminContent />;
      case "/admin/marketplace":
        return <AdminMarketplace />;
      case "/admin/brokers":
        return <AdminBrokers />;
      case "/admin/finance":
        return <AdminFinance />;
      default:
        return <AdminOverview />;
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
