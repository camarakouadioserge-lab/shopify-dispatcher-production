import Link from "next/link";
import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "@/lib/auth/session";

type AppShellProps = {
  user: AuthenticatedUser;
  children: ReactNode;
};

const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/orders", label: "Commandes" },
  { href: "/dashboard/closers", label: "Closers" },
  { href: "/dashboard/assignments", label: "Affectations" },
  { href: "/dashboard/expenses", label: "Dépenses" },
  { href: "/dashboard/audit", label: "Audit" }
];

const closerLinks = [{ href: "/workspace", label: "Mes commandes" }];

export function AppShell({ user, children }: AppShellProps) {
  const links = user.role === UserRole.CLOSER ? closerLinks : [...adminLinks, ...closerLinks];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <h1>Dispatcher Pro</h1>
          <p className="muted">Shopify, dispatch, livraisons et appels.</p>
        </div>

        <nav className="sidebarNav">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/api/auth/logout" method="post">
          <button className="secondaryButton" type="submit">
            Déconnexion
          </button>
        </form>
      </aside>

      <div className="shellBody">
        <header className="topbar">
          <div>
            <strong>{user.name}</strong>
            <div className="muted">{user.email}</div>
          </div>
          <div className="badge">{user.role}</div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
