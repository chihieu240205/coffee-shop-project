// pages/pos.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../services/api";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

interface MenuItem { name: string; price: number }
interface CartItem { menu_item_name: string; quantity: number }

export default withAuth(function PosPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    api.get<MenuItem[]>("/menu_items").then(r => setMenu(r.data));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(cs => {
      const exists = cs.find(c => c.menu_item_name === item.name);
      if (exists) {
        return cs.map(c =>
          c.menu_item_name === item.name
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...cs, { menu_item_name: item.name, quantity: 1 }];
    });
  };

  const placeOrder = async () => {
    if (!cart.length) {
      alert("Cart is empty");
      return;
    }

    const payload = { items: cart, payment_method: payment };

    // 1) Try to create the order
    try {
      await api.post("/orders", payload);
      alert("✅ Order placed!");
    } catch (err: any) {
      // if the backend returns 400 with detail="Not enough X in stock", show it
      const msg = err.response?.data?.detail ?? "Failed to place order";
      alert(`⚠️ ${msg}`);
      return; // stop here, don’t go on to suggestions
    }

    // 2) Now try to fetch LLM suggestions, but don't block if that fails
    try {
      const resp = await api.post<{ suggestions: string[] }>(
        "/llm/suggest",
        payload
      );
      setSuggestions(resp.data.suggestions);
      setShowSuggestions(true);
    } catch {
      console.warn("LLM suggestions failed, skipping them");
    }

    // 3) Clear cart
    setCart([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-5xl p-8 bg-[#3e272380] backdrop-blur-md border-4 border-[#6d4c41] rounded-lg text-white shadow-lg">
        <div className="flex justify-between mb-6">
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300">
            ← Back
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

        {/* MENU */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {menu.map((item) => (
              <div key={item.name} className="p-4 rounded border border-[#6d4c41] bg-[#5d403730]">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-gray-200">${item.price.toFixed(2)}</p>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 w-full rounded-full border border-white text-white bg-white/10 hover:bg-white/20 px-4 py-2"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CART */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-300 mb-6">No items yet</p>
          ) : (
            <ul className="mb-6 space-y-1">
              {cart.map(ci => (
                <li key={ci.menu_item_name} className="text-white">
                  {ci.menu_item_name} × {ci.quantity}
                </li>
              ))}
            </ul>
          )}

          <label className="block mb-6">
            <span className="mr-2">Payment:</span>
            <select
              value={payment}
              onChange={e => setPayment(e.target.value)}
              className="border border-[#6d4c41] bg-transparent text-white rounded px-3 py-1"
            >
              <option value="cash">Cash</option>
              <option value="credit card">Credit Card</option>
              <option value="app">App</option>
            </select>
          </label>

          <button
            onClick={placeOrder}
            className="btn bg-green-600 hover:bg-green-700"
          >
            Place Order
          </button>
        </section>

        {/* SUGGESTIONS */}
        {showSuggestions && (
          <section className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h3 className="text-xl font-semibold mb-2 text-yellow-800">
              You might also like:
            </h3>
            <ul className="list-disc list-inside mb-4 text-yellow-900">
              {suggestions.map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
            <button
              onClick={() => setShowSuggestions(false)}
              className="px-3 py-1 bg-yellow-700 text-white rounded"
            >
              Dismiss
            </button>
          </section>
        )}
      </div>
    </div>
  );
});
