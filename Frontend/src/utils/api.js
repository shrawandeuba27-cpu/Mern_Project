import axios from "axios";

// Same backend URL the project already used everywhere.
export const API = "";

// The backend only accepts these five categories (see productSchema.js).
export const CATEGORIES = ["Electronics", "Clothing", "Food", "Accessories", "Other"];

// The backend has no "minimum stock" field, so low stock is decided here.
export const LOW_STOCK = 10;

export const CURRENCY = "Rs. ";

export const money = (n) =>
  CURRENCY +
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

export const authHeader = () => ({
  Authorization: "Bearer " + localStorage.getItem("token"),
});

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("user");
};

export const stockStatus = (qty) => {
  if (qty <= 0) return "out";
  if (qty <= LOW_STOCK) return "low";
  return "in";
};

export const errorText = (err, fallback) =>
  err.response?.data?.message || (err.response ? fallback : "Cannot reach the server");

// ---- product calls: these only use the routes that already exist ----
export const fetchProducts = async () => {
  const res = await axios.get(`${API}/product`, { headers: authHeader() });
  return res.data.result;
};

export const fetchProduct = async (id) => {
  const res = await axios.get(`${API}/product/${id}`, { headers: authHeader() });
  return res.data.result;
};

export const createProduct = async (data) => {
  const res = await axios.post(`${API}/product`, data, { headers: authHeader() });
  return res.data.result;
};

// The PATCH route validates every field, so we always send all four.
export const updateProduct = async (id, product) => {
  const res = await axios.patch(
    `${API}/product/${id}`,
    {
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: product.quantity,
    },
    { headers: authHeader() },
  );
  return res.data.result;
};

export const deleteProduct = async (id) => {
  await axios.delete(`${API}/product/${id}`, { headers: authHeader() });
};
