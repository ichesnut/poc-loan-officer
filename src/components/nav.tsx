"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Group,
  Settings,
  Shield,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["admin", "branch_manager"] },
  { href: "/admin/groups", label: "Groups", icon: Group, roles: ["admin", "branch_manager"] },
  {
    href: "/admin/permissions",
    label: "Permissions",
    icon: Shield,
    roles: ["admin"],
  },
  { href: "/admin/config", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return session?.user?.role && item.roles.includes(session.user.role);
  });

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          Loan Officer
        </Link>
        <nav className="flex items-center gap-1">
          {session ? (
            <>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                      "gap-1.5"
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
              <div className="ml-2 flex items-center gap-2 border-l border-border pl-2">
                <span className="text-xs text-muted-foreground">
                  {session.user.name ?? session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                  title="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "default", size: "sm" }))}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
