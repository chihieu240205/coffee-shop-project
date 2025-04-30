"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { Coffee, ArrowLeft, Plus, Edit3, Trash2 } from "lucide-react";
import withAuth from "../utils/withAuth";
import api from "../services/api";

interface Employee {
  ssn: string;
  name: string;
  email: string;
  salary: number;
}

export default withAuth(function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Employee[]>("/employees");
      setEmployees(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Could not load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAdd = async () => {
    const ssn = prompt("SSN:");
    const name = prompt("Name:");
    const email = prompt("Email:");
    const salaryS = prompt("Salary:");
    const password = prompt("Password:");
    if (!ssn || !name || !email || !salaryS || !password) return;
    try {
      await api.post("/employees", { ssn, name, email, salary: parseFloat(salaryS), password });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Add failed");
    }
  };

  const handleEdit = async (emp: Employee) => {
    const name = prompt("Name:", emp.name);
    const email = prompt("Email:", emp.email);
    const salaryS = prompt("Salary:", String(emp.salary));
    const password = prompt("New password (leave blank to keep):", "");
    if (name == null || email == null || salaryS == null) return;
    const payload: any = { name, email, salary: parseFloat(salaryS) };
    if (password) payload.password = password;
    try {
      await api.patch(`/employees/${emp.ssn}`, payload);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async (ssn: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await api.delete(`/employees/${ssn}`);
      setEmployees(es => es.filter(e => e.ssn !== ssn));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><p>Loading…</p></div>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard')} className="flex items-center text-gray-700">
        <ArrowLeft size={18} className="mr-2" /> Back to Dashboard
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Coffee size={32} className="text-amber-700" />
          <div>
            <h1 className="text-4xl font-extrabold">Employees</h1>
            <p className="text-gray-500">Total: {employees.length} employees</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="flex items-center bg-amber-700 hover:bg-amber-600 text-white" variant="solid">
          <Plus size={16} className="mr-2" /> Add Employee
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-amber-100">
          <h2 className="text-2xl font-semibold">Employee List</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead className="bg-amber-50">
                <Tr>
                  {['SSN', 'Name', 'Email', 'Salary', 'Actions'].map(h => (
                    <Th key={h}>{h}</Th>
                  ))}
                </Tr>
              </THead>
              <TBody>
                {employees.map(emp => (
                  <Tr key={emp.ssn} className="hover:bg-amber-50 transition-all">
                    <Td>{emp.ssn}</Td>
                    <Td>{emp.name}</Td>
                    <Td>{emp.email}</Td>
                    <Td>${emp.salary.toFixed(2)}</Td>
                    <Td className="space-x-2">
                      <Button size="sm" variant="outline" className="border-amber-700 text-amber-700 hover:bg-amber-50" onClick={() => handleEdit(emp)}>
                        <Edit3 size={14} className="mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="destructive" className="hover:bg-red-700" onClick={() => handleDelete(emp.ssn)}>
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
