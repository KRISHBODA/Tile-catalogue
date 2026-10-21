"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid2X2,
  Layers,
  BookOpen,
  History,
  ArrowUpRight,
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
        <div className="workspace">
          <span className="workspace-icon">TC</span>
          <div>
            {app.workspace}
            <small>Local development</small>
          </div>
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
        <div className="sidebar-bottom">
          <div className="foundation">
            <span>PRODUCT LIBRARY · 02</span>
            <p>
              A considered start.
              <br />
              Built for your collections.
            </p>
            <div className="progress">
              <i />
            </div>
            <small>Product management · Milestone 02</small>
          </div>
          <div className="demo-dot">
            Local workspace <ArrowUpRight size={14} />
          </div>
        </div>
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
          <span className="demo-label">
            LOCAL STORAGE <span>·</span> LOCAL PREVIEW
          </span>
        </header>
        <main id="main">{children}</main>
        <footer>
          Tile Catalogue <span>Product library · Saved locally</span>
        </footer>
      </div>
    </div>
  );
}
