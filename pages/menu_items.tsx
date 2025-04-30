"use client";

import { useState, useEffect } from "react";
import api from "../services/api";
import withAuth from "../utils/withAuth";

interface MenuItem {
  name: string;
  size_ounces: number;
  type: string;
  price: number;
  is_hot: boolean;
}

function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<MenuItem[]>("/menu_items");
      setItems(data);
    } catch {
      setError("Could not load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(fetch, []);

  const handleAdd = async () => {
    const name = prompt("Drink name:")!;
    const size = parseInt(prompt("Size (oz):")!, 10);
    const type = prompt("Type (coffee/tea/softdrink):")!;
    const price = parseFloat(prompt("Price:")!);
    const is_hot = confirm("Is it hot? OK for Yes, Cancel for No.");

    try {
      await api.post("/menu_items", { name, size_ounces: size, type, price, is_hot });
      fetch();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Create failed");
    }
  };

  const handleEdit = async (item: MenuItem) => {
    const price = parseFloat(prompt("New price:", item.price.toString())!);
    try {
      await api.patch(`/menu_items/${item.name}`, { ...item, price });
      fetch();
    } catch {
      alert("Update failed");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Delete this drink?")) return;
    await api.delete(`/menu_items/${name}`);
    setItems(items.filter(i => i.name !== name));
  };

  if (loading) return <p>Loading…</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Menu</h1>
        <button onClick={handleAdd} className="btn bg-blue-600 text-white">+ Add Drink</button>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            {["Name","Size","Type","Price","Hot?","Actions"].map(h => (
              <th key={h} className="px-4 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.name} className="border-t">
              <td className="px-4 py-2">{item.name}</td>
              <td className="px-4 py-2">{item.size_ounces} oz</td>
              <td className="px-4 py-2">{item.type}</td>
              <td className="px-4 py-2">${item.price.toFixed(2)}</td>
              <td className="px-4 py-2">{item.is_hot ? "Yes" : "No"}</td>
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => handleEdit(item)} className="text-blue-600">Edit</button>
                <button onClick={() => handleDelete(item.name)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withAuth(MenuItemsPage);

