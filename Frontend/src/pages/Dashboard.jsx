import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import BarChart from "../ui/Chart";
import { Empty, Notice, PageHead, StatusPill } from "../ui/bits";
import { LOW_STOCK, money, stockStatus } from "../utils/api";
import { addDays, fmtDate } from "../utils/format";
import { getProfile, getTransactions } from "../utils/store";

const Dashboard = () => {
  const { products, loading, error } = useProducts();
  const [txs] = useState(getTransactions);
  const profile = getProfile();

  const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
  const totalValue = products.reduce((s, p) => s + p.quantity * p.price, 0);
  const attention = products
    .filter((p) => stockStatus(p.quantity) !== "in")
    .sort((a, b) => a.quantity - b.quantity);

  const categories = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const c = (map[p.category] ||= { products: 0, units: 0 });
      c.products += 1;
      c.units += p.quantity;
    });
    return Object.entries(map).sort((a, b) => b[1].units - a[1].units);
  }, [products]);

  // last 7 days, today included
  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i - 6);
      const next = addDays(d, 1);
      const day = txs.filter((t) => new Date(t.date) >= d && new Date(t.date) < next);
      return {
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        in: day.filter((t) => t.type === "in").reduce((s, t) => s + t.qty, 0),
        out: day.filter((t) => t.type === "out").reduce((s, t) => s + t.qty, 0),
      };
    });
  }, [txs]);

  const first = (profile.name || "").split(" ")[0];

  return (
    <>
      <PageHead title="Dashboard" sub={`${first ? `Welcome, ${first}. ` : ""}Inventory overview as of ${fmtDate(new Date())}.`}>
        <Link className="btn btn-ghost" to="/reports">View full report</Link>
      </PageHead>

      <Notice>{error}</Notice>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">Total products</span>
          <span className="stat-value">{loading ? "…" : products.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Stock quantity</span>
          <span className="stat-value">{loading ? "…" : totalUnits.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Inventory value</span>
          <span className="stat-value">{loading ? "…" : money(totalValue)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Low or out of stock</span>
          <span className="stat-value">{loading ? "…" : attention.length}</span>
        </div>
      </div>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Stock movement, last 7 days</h2>
            <div className="key">
              <span><i className="swatch sw-in" /> Received</span>
              <span><i className="swatch sw-out" /> Issued</span>
            </div>
          </div>
          <BarChart data={week} title="Units received and issued in the last 7 days" />
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Stock by category</h2></div>
          {categories.length === 0 ? (
            <Empty title="No products yet" text="Add products to see them here." />
          ) : (
            <div className="table-wrap">
              <table className="plain">
                <thead>
                  <tr><th>Category</th><th className="num">Products</th><th className="num">Units</th></tr>
                </thead>
                <tbody>
                  {categories.map(([name, c]) => (
                    <tr key={name}>
                      <td data-label="Category">{name}</td>
                      <td data-label="Products" className="num">{c.products}</td>
                      <td data-label="Units" className="num">{c.units.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Running low</h2>
            <span className="muted small">{LOW_STOCK} units or fewer</span>
          </div>
          {attention.length === 0 ? (
            <Empty title="All stocked up" text="Nothing is low or out of stock." />
          ) : (
            <ul className="feed">
              {attention.slice(0, 6).map((p) => (
                <li key={p._id}>
                  <div>
                    <Link to={`/product/${p._id}`} className="row-title">{p.name}</Link>
                    <span className="muted small">{p.category}</span>
                  </div>
                  <span className="feed-qty">{p.quantity}</span>
                  <StatusPill qty={p.quantity} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Latest movements</h2>
            <Link to="/reports" className="link-sm">Open reports</Link>
          </div>
          {txs.length === 0 ? (
            <Empty icon="history" title="No movements yet" text="Stock-in and stock-out will show here." />
          ) : (
            <ul className="feed">
              {txs.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <div>
                    <strong>{t.productName}</strong>
                    <span className="muted small">{t.type === "in" ? "Stock-in" : "Stock-out"} · {t.reason} · {fmtDate(t.date)}</span>
                  </div>
                  <span className={`feed-qty ${t.type === "in" ? "text-good" : "text-bad"}`}>{t.type === "in" ? "+" : "−"}{t.qty}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
};

export default Dashboard;
