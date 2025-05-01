"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
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

const MenuToolbar: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex justify-between items-center mb-6">
    <Button variant="ghost" className="flex items-center text-gray-700" onClick={() => window.history.back()}>
      <ArrowLeft size={18} className="mr-2" /> Back
    </Button>
    <Button onClick={onAdd} variant="solid" className="flex items-center bg-amber-700 hover:bg-amber-600 text-white">
      <Plus size={16} className="mr-2" /> Add Drink
    </Button>
  </div>
);

const MenuHeader: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex items-center mb-4">
    <Coffee size={32} className="text-amber-700 mr-3" />
    <div>
      <h1 className="text-3xl font-bold">Menu</h1>
      <p className="text-gray-500">Total drinks: {count}</p>
    </div>
  </div>
);

const MenuTable: React.FC<{
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (name: string) => void;
}> = ({ items, onEdit, onDelete }) => (
  <Card className="shadow-lg">
    <CardHeader className="bg-amber-100">
      <h2 className="text-xl font-semibold">Drink List</h2>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <THead className="bg-amber-50">
            <Tr>
              {['Name', 'Size', 'Type', 'Price', 'Hot?', 'Actions'].map(header => (
                <Th key={header}>{header}</Th>
              ))}
            </Tr>
          </THead>
          <TBody>
            {items.map(item => (
              <Tr key={item.name} className="hover:bg-amber-50 transition">
                <Td>{item.name}</Td>
                <Td>{item.size_ounces} oz</Td>
                <Td>{item.type}</Td>
                <Td>${item.price.toFixed(2)}</Td>
                <Td>{item.is_hot ? 'Yes' : 'No'}</Td>
                <Td className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)} className="border-amber-700 text-amber-700 hover:bg-amber-50">
                    <Edit3 size={14} className="mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(item.name)} className="hover:bg-red-700">
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
);

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
    setItems(prev => prev.filter(i => i.name !== name));
  };

  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading…</p></div>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <MenuToolbar onAdd={handleAdd} />
      <MenuHeader count={items.length} />
      <MenuTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}

export default withAuth(MenuItemsPage);
