import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  ClipboardList,
  Target,
  FileText,
  BarChart3,
  LogOut,
  Sparkles,
  Mic,
  BookOpen,
  FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profileName, setProfileName] = useState<string>("");

  const { data: roles } = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });

  useEffect(() => {
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfileName(data?.full_name || user.email || "");
    });
  }, [user]);

  const isHR = roles?.includes("hr");

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/team", label: "Liderados", icon: Users },
    { to: "/meetings/new", label: "Nova 1:1", icon: MessagesSquare },
    { to: "/feedback/new", label: "Novo Feedback", icon: ClipboardList },
    { to: "/reports", label: "Relatórios", icon: FolderKanban },
    { to: "/recordings", label: "Gravações", icon: Mic },
    { to: "/legacy", label: "Feedbacks legados", icon: FileText },
    { to: "/manual", label: "Manual", icon: BookOpen },
  ] as const;

  const showBackButton = pathname !== "/dashboard" && pathname !== "/";

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-soft">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight">ClearIT · 1:1</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {isHR && (
            <>
              <div className="mt-4 px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                RH
              </div>
              <Link
                to="/analytics"
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname.startsWith("/analytics")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </>
          )}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-3 text-xs">
            <p className="truncate font-medium text-sidebar-foreground">{profileName}</p>
            <p className="truncate text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-soft">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-semibold tracking-tight">ClearIT · 1:1</span>
          </div>
          <div className="hidden flex-1 md:block">
            {showBackButton && <BackButton />}
          </div>
          {showBackButton && (
            <div className="md:hidden">
              <BackButton label="" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/manual"
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/manual")
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-primary/10 text-primary hover:bg-primary/20",
              )}
            >
              <BookOpen className="h-4 w-4" />
              Manual
            </Link>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
