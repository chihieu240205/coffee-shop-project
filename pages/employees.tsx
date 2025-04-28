// pages/employees.tsx
import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import withAuth from "../utils/withAuth";

interface Employee {
  ssn: string;
  name: string;
  email: string;
  salary: number;
}

function EmployeesPage() {
  const { logout } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Employee[]>('/employees');
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = async () => {
    const ssn = prompt('SSN:');
    if (!ssn) return;
    const name = prompt('Name:');
    if (!name) return;
    const email = prompt('Email:');
    if (!email) return;
    const salaryStr = prompt('Salary:');
    if (!salaryStr) return;
    const salary = parseFloat(salaryStr);
    const password = prompt('Password:');
    if (password === null) return;
    try {
      await api.post('/employees', { ssn, name, email, salary, password });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Create failed');
    }
  };

  const handleEdit = async (emp: Employee) => {
    const name = prompt('Name:', emp.name);
    if (name === null) return;
    const email = prompt('Email:', emp.email);
    if (email === null) return;
    const salaryStr = prompt('Salary:', String(emp.salary));
    if (salaryStr === null) return;
    const salary = parseFloat(salaryStr);
    const password = prompt('New password (leave blank to keep):', '');
    const payload: any = { name, email, salary };
    if (password) payload.password = password;
    try {
      await api.patch(`/employees/${emp.ssn}`, payload);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Update failed');
    }
  };

  const handleDelete = async (ssn: string) => {
    if (!confirm('Delete this employee?')) return;
    try {
      await api.delete(`/employees/${ssn}`);
      setEmployees(employees.filter(e => e.ssn !== ssn));
    } catch {
      alert('Delete failed');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button onClick={handleAdd} className="btn bg-blue-600 text-white">+ Add</button>
      </div>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">SSN</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Salary</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.ssn} className="border-t">
              <td className="px-4 py-2">{emp.ssn}</td>
              <td className="px-4 py-2">{emp.name}</td>
              <td className="px-4 py-2">{emp.email}</td>
              <td className="px-4 py-2">{emp.salary}</td>
              <td className="px-4 py-2 space-x-2">
                <button onClick={() => handleEdit(emp)} className="text-blue-600">Edit</button>
                <button onClick={() => handleDelete(emp.ssn)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withAuth(EmployeesPage);
