"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withAuth from "../utils/withAuth";
import api from "../services/api";

interface Employee {
  ssn: string;
  name: string;
  email: string;
  salary: number;
}

function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]       = useState<boolean>(true);
  const [error, setError]           = useState<string>("");

  // Fetch list
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

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Add a new employee via prompt (swap for modal in real app)
  const handleAdd = async () => {
    const ssn     = prompt("SSN:");
    const name    = prompt("Name:");
    const email   = prompt("Email:");
    const salaryS = prompt("Salary:");
    const password = prompt("Password:");
    if (!ssn || !name || !email || !salaryS || !password) return;
    const salary = parseFloat(salaryS);
    try {
      await api.post("/employees", { ssn, name, email, salary, password });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Add failed");
    }
  };

  // Edit an existing employee
  const handleEdit = async (emp: Employee) => {
    const name    = prompt("Name:", emp.name);
    const email   = prompt("Email:", emp.email);
    const salaryS = prompt("Salary:", String(emp.salary));
    const password = prompt("New password (leave blank to keep):", "");
    if (name == null || email == null || salaryS == null) return;
    const salary = parseFloat(salaryS);
    const payload: any = { name, email, salary };
    if (password) payload.password = password;
    try {
      await api.patch(`/employees/${emp.ssn}`, payload);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  // Delete an employee
  const handleDelete = async (ssn: string) => {
    if (!confirm("Really delete this employee?")) return;
    try {
      await api.delete(`/employees/${ssn}`);
      setEmployees((es) => es.filter((e) => e.ssn !== ssn));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error)   return <p className="text-red-500">{error}</p>;

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
        <h1 className="text-2xl font-bold">Employees</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          + Add Employee
        </button>
      </div>

      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {["SSN","Name","Email","Salary","Actions"].map((h) => (
              <th key={h} className="border px-4 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.ssn} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{emp.ssn}</td>
              <td className="px-4 py-2">{emp.name}</td>
              <td className="px-4 py-2">{emp.email}</td>
              <td className="px-4 py-2">${emp.salary.toFixed(2)}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleEdit(emp)}
                  className="mr-2 text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(emp.ssn)}
                  className="text-red-600 hover:underline"
                >
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

export default withAuth(EmployeesPage);
