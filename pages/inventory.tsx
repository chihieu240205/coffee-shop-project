"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { Archive, ArrowLeft, Plus, Edit3, Trash2, LogOut } from "lucide-react";
import withAuth from "../utils/withAuth";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface InventoryItem {
  name: string;
  unit: string;
  price_per_unit: number;
  amount_in_stock: number;
}

export default withAuth(function InventoryItemsPage() {
  const { logout } = useAuth();
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

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    const name = prompt("Name:");
    if (!name) return;
    const unit = prompt("Unit (e.g. oz, lb):");
    if (!unit) return;
    const price = prompt("Price per unit:");
    if (!price) return;
    const amount = prompt("Initial stock amount:");
    if (!amount) return;
    try {
      await api.post("/inventory_items", {
        name,
        unit,
        price_per_unit: parseFloat(price),
        amount_in_stock: parseFloat(amount),
      });
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Add failed");
    }
  };

  const handleEdit = async (item: InventoryItem) => {
    const unit = prompt("Unit:", item.unit);
    if (unit == null) return;
    const price = prompt("Price per unit:", item.price_per_unit.toString());
    if (price == null) return;
    const amount = prompt("Stock amount:", item.amount_in_stock.toString());
    if (amount == null) return;
    try {
      await api.patch(`/inventory_items/${item.name}`, {
        name: item.name,
        unit,
        price_per_unit: parseFloat(price),
        amount_in_stock: parseFloat(amount),
      });
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/inventory_items/${name}`);
      setItems(prev => prev.filter(i => i.name !== name));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading…</p></div>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="flex items-center text-gray-700">
          <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
        </Button>
        <Button onClick={logout} variant="outline" className="flex items-center text-red-600 border-red-600 hover:bg-red-50">
          <LogOut size={16} className="mr-2" /> Log Out
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Archive size={32} className="text-amber-700" />
          <div>
            <h1 className="text-4xl font-extrabold">Inventory</h1>
            <p className="text-gray-500">Total: {items.length} items</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="flex items-center bg-amber-700 hover:bg-amber-600 text-white" variant="solid">
          <Plus size={16} className="mr-2" /> Add Item
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-amber-100">
          <h2 className="text-2xl font-semibold">Item List</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead className="bg-amber-50">
                <Tr>
                  {['Name', 'Unit', 'Price / Unit', 'In Stock', 'Actions'].map(h => (
                    <Th key={h}>{h}</Th>
                  ))}
                </Tr>
              </THead>
              <TBody>
                {items.map(item => (
                  <Tr key={item.name} className="hover:bg-amber-50 transition-all">
                    <Td>{item.name}</Td>
                    <Td>{item.unit}</Td>
                    <Td>${item.price_per_unit.toFixed(2)}</Td>
                    <Td>{item.amount_in_stock}</Td>
                    <Td className="space-x-2">
                      <Button size="sm" variant="outline" className="border-amber-700 text-amber-700 hover:bg-amber-50" onClick={() => handleEdit(item)}>
                        <Edit3 size={14} className="mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="hover:bg-red-700" onClick={() => handleDelete(item.name)}>
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
