"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../services/api";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

interface InventoryItem {
  name: string;
  unit: string;
  price_per_unit: number;
  amount_in_stock: number;
}

function InventoryItemsPage() {
  const { logout } = useAuth(); // still imported (can be removed if not reused)
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<InventoryItem[]>("/inventory_items");
      setItems(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    const name = prompt("Name:");
    if (!name) return;
    const unit = prompt("Unit (e.g. oz, lb):");
    if (!unit) return;
    const priceStr = prompt("Price per unit:");
    if (!priceStr) return;
    const amountStr = prompt("Initial stock amount:");
    if (!amountStr) return;

    try {
      await api.post("/inventory_items", {
        name,
        unit,
        price_per_unit: parseFloat(priceStr),
        amount_in_stock: parseFloat(amountStr),
      });
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Add failed");
    }
  };

  const handleEdit = async (item: InventoryItem) => {
    const unit = prompt("Unit:", item.unit);
    if (unit === null) return;
    const price_per_unit = parseFloat(
      prompt("Price per unit:", item.price_per_unit.toString()) || ""
    );
    const amount_in_stock = parseFloat(
      prompt("Stock amount:", item.amount_in_stock.toString()) || ""
    );
    try {
      await api.patch(`/inventory_items/${item.name}`, {
        name: item.name,
        unit,
        price_per_unit,
        amount_in_stock,
      });
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/inventory_items/${name}`);
      setItems((prev) => prev.filter((i) => i.name !== name));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading)
    return (
      <p className="text-white text-center text-lg">
        Loading…
      </p>
    );

  if (error)
    return <p className="text-red-500 text-center text-lg">{error}</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl p-8 rounded-lg border-4 border-[#6d4c41] bg-[#3e272380] backdrop-blur-md text-white shadow-lg">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
        >
          ← Back
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
          >
            + Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-[#4e342e] text-white">
                <th className="px-4 py-3 border-b border-gray-500 text-left">Name</th>
                <th className="px-4 py-3 border-b border-gray-500 text-left">Unit</th>
                <th className="px-4 py-3 border-b border-gray-500 text-left">Price / Unit</th>
                <th className="px-4 py-3 border-b border-gray-500 text-left">In Stock</th>
                <th className="px-4 py-3 border-b border-gray-500 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr
                  key={i.name}
                  className="border-b border-gray-500 hover:bg-[#5d403780] transition-all"
                >
                  <td className="px-4 py-2">{i.name}</td>
                  <td className="px-4 py-2">{i.unit}</td>
                  <td className="px-4 py-2">${i.price_per_unit.toFixed(2)}</td>
                  <td className="px-4 py-2">{i.amount_in_stock}</td>
                  <td className="px-4 py-2 space-x-4">
                    <button
                      onClick={() => handleEdit(i)}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(i.name)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ❌ Delete
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

export default withAuth(InventoryItemsPage);
