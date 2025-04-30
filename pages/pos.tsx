"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../services/api";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

interface MenuItem {
  name: string;
  price: number;
}

interface CartItem {
  menu_item_name: string;
  quantity: number;
}

export default withAuth(function PosPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");

  // 1) Fetch menu once
  useEffect(() => {
    api.get<MenuItem[]>("/menu_items").then(r => setMenu(r.data));
  }, []);

  // 2) Pure addToCart
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(ci => ci.menu_item_name === item.name);
      if (exists) {
        // return a brand-new array, bumping only that item’s quantity
        return prev.map(ci =>
          ci.menu_item_name === item.name
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      // first time: append with qty 1
      return [...prev, { menu_item_name: item.name, quantity: 1 }];
    });
  };

  // 3) Place order
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    try {
      await api.post("/orders", { items: cart, payment_method: payment });
      alert("Order placed!");
      setCart([]);             // clear cart
      router.push("/");        // back to home (or /index)
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to place order");
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={() => router.push("/")}
        className="mb-4 px-4 py-2 bg-gray-200 rounded"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Point of Sale</h1>

      <section className="mb-8">
        <h2 className="text-xl mb-2">Menu</h2>
        <div className="grid grid-cols-3 gap-4">
          {menu.map(item => (
            <div key={item.name} className="p-4 border rounded">
              <h3 className="font-semibold">{item.name}</h3>
              <p>${item.price.toFixed(2)}</p>
              <button
                onClick={() => addToCart(item)}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl mb-2">Cart</h2>
        {cart.length === 0 ? (
          <p>No items yet</p>
        ) : (
          <ul className="mb-4">
            {cart.map(ci => (
              <li key={ci.menu_item_name}>
                {ci.menu_item_name} × {ci.quantity}
              </li>
            ))}
          </ul>
        )}

        <label className="block mb-4">
          Payment:
          <select
            value={payment}
            onChange={e => setPayment(e.target.value)}
            className="ml-2 border rounded"
          >
            <option value="cash">Cash</option>
            <option value="credit card">Credit Card</option>
            <option value="app">App</option>
          </select>
        </label>

        <div className="flex gap-4">
          <button
            onClick={placeOrder}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Place Order
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Log Out
          </button>
        </div>
      </section>
    </div>
  );
});
