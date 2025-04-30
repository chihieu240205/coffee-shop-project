"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { Plus, ArrowLeft, Edit3, Trash2 } from "lucide-react";
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
      const { data } = await api.get<Employee[]>('/employees');
      setEmployees(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAdd = async () => {
    const ssn = prompt('SSN:');
    const name = prompt('Name:');
    const email = prompt('Email:');
    const salaryS = prompt('Salary:');
    const password = prompt('Password:');
    if (!ssn || !name || !email || !salaryS || !password) return;
    try {
      await api.post('/employees', { ssn, name, email, salary: parseFloat(salaryS), password });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Thêm nhân viên thất bại');
    }
  };

  const handleEdit = async (emp: Employee) => {
    const name = prompt('Name:', emp.name);
    const email = prompt('Email:', emp.email);
    const salaryS = prompt('Salary:', String(emp.salary));
    const password = prompt('New password (leave blank to keep):', '');
    if (name == null || email == null || salaryS == null) return;
    const payload: any = { name, email, salary: parseFloat(salaryS) };
    if (password) payload.password = password;
    try {
      await api.patch(`/employees/${emp.ssn}`, payload);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async (ssn: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    try {
      await api.delete(`/employees/${ssn}`);
      setEmployees(es => es.filter(e => e.ssn !== ssn));
    } catch {
      alert('Xóa thất bại');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><p>Đang tải…</p></div>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-6">
        <ArrowLeft size={18} className="mr-2" /> Quay về Dashboard
      </Button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold">Quản lý Nhân viên</h1>
        <Button onClick={handleAdd} className="flex items-center" variant="solid">
          <Plus size={16} className="mr-2" /> Thêm nhân viên
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="bg-amber-100">
          <h2 className="text-xl font-semibold">Danh sách nhân viên</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <THead className="bg-amber-50">
                <Tr>
                  {['SSN', 'Tên', 'Email', 'Lương', 'Hành động'].map(h => (
                    <Th key={h}>{h}</Th>
                  ))}
                </Tr>
              </THead>
              <TBody>
                {employees.map(emp => (
                  <Tr key={emp.ssn} className="hover:bg-amber-50 transition">
                    <Td>{emp.ssn}</Td>
                    <Td>{emp.name}</Td>
                    <Td>{emp.email}</Td>
                    <Td>${emp.salary.toFixed(2)}</Td>
                    <Td className="space-x-4">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(emp)}>
                        <Edit3 size={14} className="mr-1" /> Sửa
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(emp.ssn)}>
                        <Trash2 size={14} className="mr-1" /> Xóa
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
