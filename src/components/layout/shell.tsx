"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid2X2,
  Layers,
  BookOpen,
  History,
  PanelLeftClose,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { app, navigation } from "@/config/app";
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const icons = { products: Grid2X2, builder: BookOpen, history: History };
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <Layers size={26} />
          <span>
            {app.name}
            <small>THE MATERIAL WORKSPACE</small>
          </span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {navigation.map((n) => {
            const Icon = icons[n.icon];
            return (
              <Link
                key={n.href}
                onClick={() => setOpen(false)}
                href={n.href}
                aria-current={path === n.href ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{n.label}</span>
                {n.icon !== "products" && <small>Next</small>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <PanelLeftClose size={20} /> : <Menu size={20} />}
          </button>
          <span>
            Workspace <span className="breadcrumb">/</span>{" "}
            <strong>
              {navigation.find((n) => n.href === path)?.label || "Products"}
            </strong>
          </span>

        </header>
        <main id="main">{children}</main>

      </div>
    </div>
  );
}
