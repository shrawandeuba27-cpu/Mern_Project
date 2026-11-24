import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { Avatar } from "./bits";
import { clearSession } from "../utils/api";
import { getProfile } from "../utils/store";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/products", label: "Products", icon: "box" },
  { to: "/stock-in", label: "Stock-in", icon: "down" },
  { to: "/stock-out", label: "Stock-out", icon: "up" },
  { to: "/reports", label: "Reports", icon: "report" },
  { to: "/profile", label: "Profile", icon: "user" },
];

const Layout = () => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(getProfile());
  const navigate = useNavigate();

  // the avatar in the corner updates as soon as the profile page saves
  useEffect(() => {
    const refresh = () => setProfile(getProfile());
    window.addEventListener("stocksense:profile", refresh);
    return () => window.removeEventListener("stocksense:profile", refresh);
  }, []);

  const logout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <div className="shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="side-brand">
          <span className="logo-mark">
            <Icon name="box" size={20} />
          </span>
          <span className="brand-name">StockSense</span>
        </div>

        <nav className="side-nav" aria-label="Main" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <Icon name={l.icon} />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <NavLink to="/profile" className="side-user" onClick={() => setOpen(false)}>
            <Avatar profile={profile} size={38} />
            <span className="side-user-text">
              <strong>{profile.name || "Your account"}</strong>
              <small>{profile.shop || profile.email || "Inventory manager"}</small>
            </span>
          </NavLink>
          <button type="button" className="nav-link logout" onClick={logout}>
            <Icon name="logout" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {open ? <div className="scrim" onClick={() => setOpen(false)} /> : null}

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <span className="topbar-brand">StockSense</span>
          <NavLink to="/profile" className="topbar-user" aria-label="Profile">
            <Avatar profile={profile} size={36} />
          </NavLink>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
