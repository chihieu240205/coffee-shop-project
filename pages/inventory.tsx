// pages/inventory_items.tsx
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
  const { logout } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  /** fetch all inventory */
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

  /** add a new inventory item */
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

  /** edit an existing item */
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

  /** delete an item */
  const handleDelete = async (name: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await api.delete(`/inventory_items/${name}`);
      setItems((prev) => prev.filter((i) => i.name !== name));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-8">
      {/* ← BACK BUTTON */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back to Dashboard
      </button>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div>
          <button onClick={handleAdd} className="btn bg-blue-600 text-white mr-2">
            + Add Item
          </button>
          <button onClick={logout} className="btn bg-red-500 text-white">
            Log Out
          </button>
        </div>
      </div>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Price / Unit</th>
            <th className="px-4 py-2">In Stock</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.name} className="border-t">
              <td className="px-4 py-2">{i.name}</td>
              <td className="px-4 py-2">{i.unit}</td>
              <td className="px-4 py-2">${i.price_per_unit.toFixed(2)}</td>
              <td className="px-4 py-2">{i.amount_in_stock}</td>
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => handleEdit(i)} className="text-blue-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(i.name)} className="text-red-600">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withAuth(InventoryItemsPage);
