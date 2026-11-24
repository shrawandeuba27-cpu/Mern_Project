// Everything here lives in the browser (localStorage), because the backend
// has no routes for transactions or profiles and we are not changing it.

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // storage full or blocked
  }
};

// ---- who is logged in ----
export const getUser = () => {
  const saved = read("user", null);
  if (saved?.id) return saved;
  // Sessions created before this update only have a token: read the id from it.
  try {
    const token = localStorage.getItem("token");
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return { id: payload.id, name: localStorage.getItem("userName") || "", email: "" };
  } catch {
    return { id: "guest", name: localStorage.getItem("userName") || "", email: "" };
  }
};

// ---- profile ----
const profileKey = () => `stocksense:profile:${getUser().id}`;

export const getProfile = () => {
  const user = getUser();
  return {
    name: user.name || "",
    phone: "",
    shop: "",
    location: "",
    bio: "",
    image: "",
    ...read(profileKey(), {}),
    email: user.email || "",
  };
};

export const saveProfile = (profile) => {
  const { email, ...rest } = profile; // email is the login identity, never edited here
  void email;
  const ok = write(profileKey(), rest);
  if (ok && rest.name) {
    localStorage.setItem("userName", rest.name);
    const user = getUser();
    write("user", { ...user, name: rest.name });
  }
  window.dispatchEvent(new Event("stocksense:profile"));
  return ok;
};

// ---- transactions (stock movements) ----
const txKey = () => `stocksense:tx:${getUser().id}`;

export const getTransactions = () => read(txKey(), []);

export const addTransaction = (tx) => {
  const list = getTransactions();
  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    ...tx,
  });
  write(txKey(), list.slice(0, 2000));
};

export const MOVE_REASONS = {
  in: ["Purchased", "Received", "Customer return", "Opening stock", "Manual edit"],
  out: ["Sold", "Damaged", "Expired", "Removed", "Manual edit"],
};
