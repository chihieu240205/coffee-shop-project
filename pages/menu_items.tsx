"use client";

import React, { useState, useEffect } from "react";
import { Coffee, ArrowLeft, Plus, Edit3, Trash2 } from "lucide-react";
import withAuth from "../utils/withAuth";
import api from "../services/api";

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

  const fetchItems = async () => {
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

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    const name = prompt("Drink name:")!;
    const size = parseInt(prompt("Size (oz):")!, 10);
    const type = prompt("Type (coffee/tea/softdrink):")!;
    const price = parseFloat(prompt("Price:")!);
    const is_hot = confirm("Is it hot? OK for Yes, Cancel for No.");
    try {
      await api.post("/menu_items", { name, size_ounces: size, type, price, is_hot });
      fetchItems();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Create failed");
    }
  };

  const handleEdit = async (item: MenuItem) => {
    const price = parseFloat(prompt("New price:", item.price.toString())!);
    try {
      await api.patch(`/menu_items/${item.name}`, { ...item, price });
      fetchItems();
    } catch {
      alert("Update failed");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Delete this drink?")) return;
    await api.delete(`/menu_items/${name}`);
    setItems((prev) => prev.filter((i) => i.name !== name));
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-white text-xl">Loading…</p>
      </div>
    );

  if (error)
    return <p className="text-red-500 text-center text-lg">{error}</p>;

  return (
    <div className="min-h-screen flex justify-center items-center p-8">
      <div className="w-full max-w-5xl p-8 bg-[#3e272380] backdrop-blur-md border-4 border-[#6d4c41] rounded-lg text-white shadow-lg">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          <button
            className="flex items-center text-white hover:text-gray-300"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center bg-[#6d4c41] hover:bg-[#5d4037] text-white px-4 py-2 rounded"
          >
            <Plus size={16} className="mr-2" />
            Add Drink
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center mb-6">
          <Coffee size={32} className="text-amber-500 mr-3" />
          <div>
            <h1 className="text-3xl font-bold">Menu</h1>
            <p className="text-gray-300">Total drinks: {items.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#4e342e] text-white">
                {["Name", "Size", "Type", "Price", "Hot?", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 border-b border-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.name}
                  className="hover:bg-[#5d403740] border-b border-gray-600 transition-all"
                >
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.size_ounces} oz</td>
                  <td className="px-4 py-2">{item.type}</td>
                  <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{item.is_hot ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-amber-400 hover:underline flex items-center"
                    >
                      <Edit3 size={14} className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.name)}
                      className="text-red-400 hover:underline flex items-center"
                    >
                      <Trash2 size={14} className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAuth(MenuItemsPage);
