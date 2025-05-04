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

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = async () => {
    const ssn = prompt("SSN:");
    const name = prompt("Name:");
    const email = prompt("Email:");
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

  const handleEdit = async (emp: Employee) => {
    const newSsn = prompt("SSN:", emp.ssn);
    if (newSsn == null) return;
    const name    = prompt("Name:", emp.name);
    const email   = prompt("Email:", emp.email);
    const salaryS = prompt("Salary:", String(emp.salary));
    const password = prompt("New password (leave blank to keep):", "");
    if (name == null || email == null || salaryS == null) return;
    const salary = parseFloat(salaryS);
  
    const payload: any = { ssn: newSsn, name, email, salary };
    if (password) payload.password = password;
  
    try {
      await api.patch(`/employees/${emp.ssn}`, payload);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  const handleDelete = async (ssn: string) => {
    if (!confirm("Really delete this employee?")) return;
    try {
      await api.delete(`/employees/${ssn}`);
      setEmployees((es) => es.filter((e) => e.ssn !== ssn));
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) return <p className="text-white text-center">Loading…</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

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
          <h1 className="text-3xl font-bold">Employees</h1>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded"
          >
            + Add Employee
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-[#4e342e] text-white">
                {["SSN", "Name", "Email", "Salary", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold border-b border-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr
                  key={emp.ssn}
                  className="border-b border-gray-500 hover:bg-[#5d403780] transition-all"
                >
                  <td className="px-4 py-2">{emp.ssn}</td>
                  <td className="px-4 py-2">{emp.name}</td>
                  <td className="px-4 py-2">{emp.email}</td>
                  <td className="px-4 py-2">${emp.salary.toFixed(2)}</td>
                  <td className="px-4 py-2 space-x-4">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-blue-400 hover:underline"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp.ssn)}
                      className="text-red-400 hover:underline"
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

export default withAuth(EmployeesPage);
