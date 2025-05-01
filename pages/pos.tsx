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
  const { logout } = useAuth(); // unused
  const router = useRouter();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("cash");

  useEffect(() => {
    api.get<MenuItem[]>("/menu_items").then((r) => setMenu(r.data));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const exists = prev.find((ci) => ci.menu_item_name === item.name);
      if (exists) {
        return prev.map((ci) =>
          ci.menu_item_name === item.name
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        );
      }
      return [...prev, { menu_item_name: item.name, quantity: 1 }];
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    try {
      await api.post("/orders", { items: cart, payment_method: payment });
      alert("Order placed!");
      setCart([]);
      router.push("/");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to place order");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-5xl p-8 bg-[#3e272380] backdrop-blur-md border-4 border-[#6d4c41] rounded-lg text-white shadow-lg">
        <button
          onClick={() => router.push("/")}
          className="mb-6 px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

        {/* MENU SECTION */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Menu</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {menu.map((item) => (
              <div
                key={item.name}
                className="p-4 rounded border border-[#6d4c41] bg-[#5d403730] shadow hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-gray-200">${item.price.toFixed(2)}</p>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 w-full rounded-full border border-white text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 transition-all duration-200"
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* CART SECTION */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cart</h2>
          {cart.length === 0 ? (
            <p className="text-gray-300 mb-6">No items yet</p>
          ) : (
            <ul className="mb-6 space-y-1">
              {cart.map((ci) => (
                <li key={ci.menu_item_name} className="text-white">
                  {ci.menu_item_name} × {ci.quantity}
                </li>
              ))}
            </ul>
          )}

          {/* PAYMENT SELECT */}
          <label className="block mb-6">
            <span className="mr-2">Payment:</span>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="border border-[#6d4c41] bg-transparent text-white rounded px-3 py-1"
            >
              <option value="cash">Cash</option>
              <option value="credit card">Credit Card</option>
              <option value="app">App</option>
            </select>
          </label>

          {/* PLACE ORDER BUTTON */}
          <div className="flex">
            <button
              onClick={placeOrder}
              className="btn bg-green-600 hover:bg-green-700"
            >
              Place Order
            </button>
          </div>
        </section>
      </div>
    </div>
  );
});
