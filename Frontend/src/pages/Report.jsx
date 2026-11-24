import { useMemo, useState } from "react";
import useProducts from "../hooks/useProducts";
import BarChart from "../ui/Chart";
import Icon from "../ui/Icon";
import { Empty, Notice, PageHead, StatusPill } from "../ui/bits";
import { money } from "../utils/api";
import {
  addDays,
  fmtDate,
  fromInputDate,
  rangeFor,
  shiftAnchor,
  startOfDay,
  toInputDate,
} from "../utils/format";
import { getProfile, getTransactions } from "../utils/store";

const KINDS = [
  ["day", "Day"],
  ["week", "Week"],
  ["month", "Month"],
];

const inRange = (t, r) => {
  const d = new Date(t.date);
  return d >= r.start && d < r.end;
};

const sum = (list, type, id) =>
  list
    .filter((t) => t.type === type && (id === undefined || t.productId === id))
    .reduce((s, t) => s + t.qty, 0);

// Works out the stock position for one period.
// Closing stock = quantity today, minus everything received after the period, plus everything issued after it.
const build = (products, txs, range) => {
  const inPeriod = txs.filter((t) => inRange(t, range));
  const later = txs.filter((t) => new Date(t.date) >= range.end);

  const rows = products
    .filter((p) => new Date(p.createdAt) < range.end)
    .map((p) => {
      const closing = p.quantity - sum(later, "in", p._id) + sum(later, "out", p._id);
      const received = sum(inPeriod, "in", p._id);
      const issued = sum(inPeriod, "out", p._id);
      return { p, opening: closing - received + issued, received, issued, closing, value: closing * p.price };
    })
    .sort((a, b) => a.p.name.localeCompare(b.p.name));

  const total = (key) => rows.reduce((s, r) => s + r[key], 0);
  return {
    inPeriod,
    rows,
    opening: total("opening"),
    received: sum(inPeriod, "in"),
    issued: sum(inPeriod, "out"),
    closing: total("closing"),
    value: total("value"),
    count: inPeriod.length,
  };
};

const change = (now, before) => {
  const d = now - before;
  if (d === 0) return "No change";
  return `${d > 0 ? "+" : "−"}${Math.abs(d).toLocaleString()}`;
};

const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const Report = () => {
  const { products, loading, error } = useProducts();
  const [kind, setKind] = useState("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const profile = getProfile();
  const txs = useMemo(() => getTransactions(), []);

  const range = rangeFor(kind, anchor);
  const prevRange = rangeFor(kind, shiftAnchor(kind, anchor, -1));
  const isCurrent = range.end > new Date();
  const kindName = KINDS.find(([k]) => k === kind)[1].toLowerCase();

  const cur = useMemo(() => build(products, txs, range), [products, txs, range.start.getTime(), range.end.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const prev = useMemo(() => build(products, txs, prevRange), [products, txs, prevRange.start.getTime(), prevRange.end.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  // live numbers (today), not tied to the chosen period
  const live = useMemo(() => {
    const byCat = {};
    products.forEach((p) => {
      const c = (byCat[p.category] ||= { products: 0, units: 0, value: 0 });
      c.products += 1;
      c.units += p.quantity;
      c.value += p.quantity * p.price;
    });
    return {
      units: products.reduce((s, p) => s + p.quantity, 0),
      value: products.reduce((s, p) => s + p.quantity * p.price, 0),
      low: products.filter((p) => p.quantity > 0 && p.quantity <= 10).length,
      out: products.filter((p) => p.quantity <= 0).length,
      cats: Object.entries(byCat).sort((a, b) => b[1].value - a[1].value),
    };
  }, [products]);

  // one bar group per day in the period (not drawn for a single day)
  const chartData = useMemo(() => {
    if (kind === "day") return [];
    const out = [];
    for (let d = new Date(range.start); d < range.end; d = addDays(d, 1)) {
      const next = addDays(d, 1);
      const day = cur.inPeriod.filter((t) => new Date(t.date) >= d && new Date(t.date) < next);
      out.push({
        label: kind === "week" ? d.toLocaleDateString(undefined, { weekday: "short" }) : String(d.getDate()),
        in: sum(day, "in"),
        out: sum(day, "out"),
        date: new Date(d),
      });
    }
    return out;
  }, [cur, kind, range.start, range.end]);

  const pick = (e) => {
    if (e.target.value) setAnchor(fromInputDate(e.target.value));
  };

  const exportCsv = () => {
    const head = ["Product", "Category", "Price", "Opening", "Received", "Issued", "Closing", "Closing value"];
    const lines = cur.rows.map((r) =>
      [r.p.name, r.p.category, r.p.price, r.opening, r.received, r.issued, r.closing, r.value].map(csvCell).join(","),
    );
    const blob = new Blob([[head.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `stocksense-report-${kind}-${toInputDate(range.start)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHead title="Inventory Report" sub="Current stock position and past days, weeks and months.">
        <button className="btn btn-ghost" onClick={exportCsv} disabled={cur.rows.length === 0}>
          <Icon name="download" size={18} /> Export CSV
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="print" size={18} /> Print report
        </button>
      </PageHead>

      <Notice>{error}</Notice>

      <div className="period-bar no-print">
        <div className="segmented" role="group" aria-label="Report period">
          {KINDS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={kind === k ? "seg on" : "seg"}
              aria-pressed={kind === k}
              onClick={() => { setKind(k); setAnchor(startOfDay(new Date())); }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="stepper">
          <button className="btn btn-ghost btn-sq" onClick={() => setAnchor(shiftAnchor(kind, anchor, -1))} aria-label={`Previous ${kindName}`}>
            <Icon name="back" size={18} />
          </button>
          <button className="btn btn-ghost btn-sq" onClick={() => setAnchor(shiftAnchor(kind, anchor, 1))} disabled={isCurrent} aria-label={`Next ${kindName}`}>
            <Icon name="right" size={18} />
          </button>
        </div>
        <label className="jump">
          <span>Go to date</span>
          <input type="date" max={toInputDate(new Date())} value={toInputDate(anchor)} onChange={pick} />
        </label>
        <button className="btn btn-ghost" onClick={() => setAnchor(startOfDay(new Date()))} disabled={isCurrent}>
          Back to current {kindName}
        </button>
      </div>

      <section className="panel report-head">
        <h2>StockSense Inventory Report</h2>
        <dl>
          <div><dt>Period</dt><dd>{range.label} ({kindName})</dd></div>
          <div><dt>Generated</dt><dd>{fmtDate(new Date())}</dd></div>
          <div><dt>Prepared by</dt><dd>{profile.name || "—"}{profile.shop ? `, ${profile.shop}` : ""}</dd></div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>1. Summary for {range.label}</h2>
          {isCurrent ? <span className="muted small">This {kindName} is still in progress</span> : null}
        </div>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table className="plain">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th className="num">This {kindName}</th>
                  <th className="num">Previous {kindName}</th>
                  <th className="num">Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Opening stock (units)", cur.opening, prev.opening],
                  ["Units received (stock-in)", cur.received, prev.received],
                  ["Units issued (stock-out)", cur.issued, prev.issued],
                  ["Closing stock (units)", cur.closing, prev.closing],
                  ["Number of stock movements", cur.count, prev.count],
                ].map(([label, a, b]) => (
                  <tr key={label}>
                    <td data-label="Measure">{label}</td>
                    <td data-label={`This ${kindName}`} className="num">{a.toLocaleString()}</td>
                    <td data-label={`Previous ${kindName}`} className="num">{b.toLocaleString()}</td>
                    <td data-label="Change" className="num">{change(a, b)}</td>
                  </tr>
                ))}
                <tr>
                  <td data-label="Measure">Closing stock value</td>
                  <td data-label={`This ${kindName}`} className="num">{money(cur.value)}</td>
                  <td data-label={`Previous ${kindName}`} className="num">{money(prev.value)}</td>
                  <td data-label="Change" className="num">{cur.value === prev.value ? "No change" : `${cur.value > prev.value ? "+" : "−"}${money(Math.abs(cur.value - prev.value))}`}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small note">
          Previous {kindName}: {prevRange.label}. Values use today&apos;s prices.
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>2. Current inventory status</h2>
          <span className="muted small">Live, as of {fmtDate(new Date())}</span>
        </div>
        <div className="stats stats-4 flat">
          <div className="stat"><span className="stat-label">Products</span><span className="stat-value">{products.length}</span></div>
          <div className="stat"><span className="stat-label">Units in stock</span><span className="stat-value">{live.units.toLocaleString()}</span></div>
          <div className="stat"><span className="stat-label">Inventory value</span><span className="stat-value">{money(live.value)}</span></div>
          <div className="stat"><span className="stat-label">Low / out of stock</span><span className="stat-value">{live.low} / {live.out}</span></div>
        </div>
        {live.cats.length === 0 ? null : (
          <div className="table-wrap">
            <table className="plain">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Products</th>
                  <th className="num">Units</th>
                  <th className="num">Value</th>
                  <th className="num">Share of value</th>
                </tr>
              </thead>
              <tbody>
                {live.cats.map(([name, c]) => (
                  <tr key={name}>
                    <td data-label="Category">{name}</td>
                    <td data-label="Products" className="num">{c.products}</td>
                    <td data-label="Units" className="num">{c.units.toLocaleString()}</td>
                    <td data-label="Value" className="num">{money(c.value)}</td>
                    <td data-label="Share of value" className="num">{live.value ? Math.round((c.value / live.value) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {kind !== "day" ? (
        <section className="panel">
          <div className="panel-head">
            <h2>3. Daily stock movement</h2>
            <div className="key">
              <span><i className="swatch sw-in" /> Received</span>
              <span><i className="swatch sw-out" /> Issued</span>
            </div>
          </div>
          <BarChart data={chartData} labelEvery={kind === "month" ? 5 : 1} title={`Units received and issued per day, ${range.label}`} />
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-head">
          <h2>{kind === "day" ? "3" : "4"}. Stock by product</h2>
          <span className="muted small">Opening to closing for {range.label}</span>
        </div>
        {cur.rows.length === 0 ? (
          <Empty title="No products in this period" text="Nothing had been added to the inventory by then." />
        ) : (
          <div className="table-wrap">
            <table className="plain">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th className="num">Opening</th>
                  <th className="num">Received</th>
                  <th className="num">Issued</th>
                  <th className="num">Closing</th>
                  <th className="num">Value</th>
                  <th>Status now</th>
                </tr>
              </thead>
              <tbody>
                {cur.rows.map((r) => (
                  <tr key={r.p._id}>
                    <td data-label="Product">{r.p.name}</td>
                    <td data-label="Category">{r.p.category}</td>
                    <td data-label="Opening" className="num">{r.opening}</td>
                    <td data-label="Received" className="num">{r.received ? `+${r.received}` : "0"}</td>
                    <td data-label="Issued" className="num">{r.issued ? `−${r.issued}` : "0"}</td>
                    <td data-label="Closing" className="num"><strong>{r.closing}</strong></td>
                    <td data-label="Value" className="num">{money(r.value)}</td>
                    <td data-label="Status now"><StatusPill qty={r.p.quantity} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className="num">{cur.opening}</td>
                  <td className="num">+{cur.received}</td>
                  <td className="num">−{cur.issued}</td>
                  <td className="num">{cur.closing}</td>
                  <td className="num">{money(cur.value)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>{kind === "day" ? "4" : "5"}. Movement log</h2>
          <span className="muted small">{cur.count} {cur.count === 1 ? "entry" : "entries"}</span>
        </div>
        {cur.count === 0 ? (
          <Empty icon="report" title="No movements in this period" text="Stock-in and stock-out entries for this period will be listed here." />
        ) : (
          <div className="table-wrap">
            <table className="plain">
              <thead>
                <tr>
                  <th>Date and time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="num">Qty</th>
                  <th>Reason</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {cur.inPeriod.map((t) => (
                  <tr key={t.id}>
                    <td data-label="Date and time">{fmtDate(t.date)}</td>
                    <td data-label="Product">{t.productName}</td>
                    <td data-label="Type">{t.type === "in" ? "Stock-in" : "Stock-out"}</td>
                    <td data-label="Qty" className="num">{t.type === "in" ? "+" : "−"}{t.qty}</td>
                    <td data-label="Reason">{t.reason}</td>
                    <td data-label="Note">{t.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="muted small note">
        Stock movements are recorded in this browser, so earlier periods only reflect entries made here.
      </p>
    </>
  );
};

export default Report;
