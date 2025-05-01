"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit3, Trash2, Coffee } from "lucide-react";
import withAuth from "../utils/withAuth";
import { requireManager } from "../utils/requireManager";
import api from "../services/api";
import { useRouter } from "next/router";

interface MenuItem {
  name: string;
  size_ounces: number;
  type: string;
  price: number;
  is_hot: boolean;
}

function MenuItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all drinks
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<MenuItem[]>('/menu_items');
      setItems(data);
    } catch {
      setError('Could not load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 1) Create drink + recipe + steps + ingredients
  const handleAdd = async () => {
    const name = prompt('Drink name:')!;
    const size = parseInt(prompt('Size (oz):')!, 10);
    const type = prompt('Type (coffee / tea / softdrink):')!;
    const price = parseFloat(prompt('Price:')!);
    const is_hot = confirm('Is it hot? OK=Yes, Cancel=No');

    try {
      await api.post('/menu_items/', { name, size_ounces: size, type, price, is_hot });

      const recipeResp = await api.post<{ recipe_id: number }>('/recipes/', { menu_item_name: name });
      const recipeId = recipeResp.data.recipe_id;

      while (true) {
        const invName = prompt('Ingredient name (inventory item), or Cancel to finish:');
        if (!invName) break;

        const qtyStr = prompt(`Quantity of "${invName}" per drink (number):`);
        if (!qtyStr) continue;
        const qty = parseFloat(qtyStr);

        const unit = prompt('Unit (e.g. oz, lb):')!;

        try {
          await api.post('/recipe_ingredients/', { recipe_id: recipeId, inventory_item_name: invName, quantity: qty, unit });
        } catch (err: any) {
          alert(
            err.response?.data?.detail === 'Inventory item not found'
              ? `⚠️ No such inventory item "${invName}". Please add it first.`
              : err.response?.data?.detail || 'Could not add ingredient'
          );
          break;
        }
      }

      fetchItems();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Create failed');
    }
  };

  // 2) Edit price only
  const handleEdit = async (item: MenuItem) => {
    const price = parseFloat(prompt('New price:', item.price.toString())!);
    try {
      await api.patch(`/menu_items/${encodeURIComponent(item.name)}`, { ...item, price });
      fetchItems();
    } catch {
      alert('Update failed');
    }
  };

  // 3) Delete menu entry
  const handleDelete = async (name: string) => {
    if (!confirm('Delete this drink?')) return;

    try {
      await api.delete(`/menu_items/${encodeURIComponent(name)}`);
      setItems(prev => prev.filter(i => i.name !== name));
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.detail || 'Could not delete menu item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading…
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-[url('/coffee-bg.jpg')] bg-cover">
      <div className="max-w-5xl mx-auto bg-[#3e272380] backdrop-blur-md border-4 border-[#6d4c41] rounded-lg p-8 text-white">
        {/* Toolbar */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center hover:text-gray-300"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            <Plus size={18} className="mr-1" />
            Add Drink
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center mb-6">
          <Coffee size={32} className="text-amber-500 mr-2" />
          <div>
            <h1 className="text-3xl font-bold">Menu</h1>
            <p className="text-gray-300">Total drinks: {items.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-[#4e342e]">
              <tr>
                {['Name', 'Size', 'Type', 'Price', 'Hot?', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.name} className="border-b hover:bg-[#5d403740]">
                  <td className="px-4 py-2">{it.name}</td>
                  <td className="px-4 py-2">{it.size_ounces} oz</td>
                  <td className="px-4 py-2">{it.type}</td>
                  <td className="px-4 py-2">${it.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{it.is_hot ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 space-x-4">
                    <button onClick={() => handleEdit(it)}>
                      <Edit3 size={16} className="inline mr-1 text-amber-400" />
                      Edit
                    </button>
                    <button onClick={() => handleDelete(it.name)}>
                      <Trash2 size={16} className="inline mr-1 text-red-400" />
                      Delete
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

// Wrap with auth and manager requirement
export default withAuth(requireManager(MenuItemsPage));
