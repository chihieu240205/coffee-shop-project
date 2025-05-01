"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withAuth from "../utils/withAuth";
import { requireManager } from "../utils/requireManager";
import api from "../services/api";

interface RevenueResp {
  start: string;
  end: string;
  revenue: number;
}

interface PopularItem {
  name: string;
  sold: number;
}

interface RevItem {
  name: string;
  revenue: number;
}

export default withAuth(
  requireManager(function AnalyticsPage() {
    const router = useRouter();

    // Revenue report
    const [start, setStart] = useState<string>(new Date().toISOString().slice(0, 10));
    const [end, setEnd] = useState<string>(new Date().toISOString().slice(0, 10));
    const [revenue, setRevenue] = useState<number | null>(null);

    // Popular items report
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [kPopular, setKPopular] = useState<number>(3);
    const [popularItems, setPopularItems] = useState<PopularItem[]>([]);

    // Top revenue report
    const [start2, setStart2] = useState<string>(new Date().toISOString().slice(0, 10));
    const [end2, setEnd2] = useState<string>(new Date().toISOString().slice(0, 10));
    const [kRevenue, setKRevenue] = useState<number>(3);
    const [topRevenueItems, setTopRevenueItems] = useState<RevItem[]>([]);

    // Fetch functions
    const fetchRevenue = async () => {
      try {
        const { data } = await api.get<RevenueResp>("/analytics/revenue/", {
          params: { start, end },
        });
        setRevenue(data.revenue);
      } catch (err) {
        console.error("Failed to fetch revenue:", err);
        setRevenue(null);
      }
    };

    const fetchPopular = async () => {
      try {
        const { data } = await api.get<PopularItem[]>("/analytics/popular/", {
          params: { month, year, k: kPopular },
        });
        setPopularItems(data);
      } catch (err) {
        console.error("Failed to fetch popular items:", err);
        setPopularItems([]);
      }
    };

    const fetchTopRevenue = async () => {
      try {
        const { data } = await api.get<RevItem[]>("/analytics/top-revenue/", {
          params: { start: start2, end: end2, k: kRevenue },
        });
        setTopRevenueItems(data);
      } catch (err) {
        console.error("Failed to fetch top revenue items:", err);
        setTopRevenueItems([]);
      }
    };

    // Initial fetch on load
    useEffect(() => {
      fetchRevenue();
      fetchPopular();
      fetchTopRevenue();
    }, []);

    return (
      <div className="p-8">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-4 px-4 py-2 bg-gray-200 rounded"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

        {/* Revenue Report */}
        <section className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Revenue Report</h2>
          <label className="mr-4">
            From: <input type="date" value={start} onChange={e => setStart(e.target.value)} className="ml-2 border rounded" />
          </label>
          <label className="mr-4">
            To: <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="ml-2 border rounded" />
          </label>
          <button onClick={fetchRevenue} className="px-3 py-1 bg-blue-600 text-white rounded">
            Run
          </button>
          {revenue !== null && (
            <p className="mt-4">Revenue from {start} to {end}: <strong>${revenue.toFixed(2)}</strong></p>
          )}
        </section>

        {/* Popular Items */}
        <section className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Most Popular Items</h2>
          <label className="mr-4">
            Month: <input type="number" min={1} max={12} value={month} onChange={e => setMonth(Number(e.target.value))} className="ml-2 w-16 border rounded" />
          </label>
          <label className="mr-4">
            Year: <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="ml-2 w-20 border rounded" />
          </label>
          <label className="mr-4">
            Top k: <input type="number" min={1} value={kPopular} onChange={e => setKPopular(Number(e.target.value))} className="ml-2 w-16 border rounded" />
          </label>
          <button onClick={fetchPopular} className="px-3 py-1 bg-blue-600 text-white rounded">
            Run
          </button>
          {popularItems.length > 0 && (
            <table className="mt-4 w-full table-auto">
              <thead className="bg-gray-200">
                <tr><th className="px-4 py-2 text-left">Item</th><th className="px-4 py-2 text-left">Sold</th></tr>
              </thead>
              <tbody>
                {popularItems.map(pi => (
                  <tr key={pi.name} className="border-b">
                    <td className="px-4 py-2">{pi.name}</td>
                    <td className="px-4 py-2">{pi.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Top Revenue Items */}
        <section className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Top Revenue Items</h2>
          <label className="mr-4">
            From: <input type="date" value={start2} onChange={e => setStart2(e.target.value)} className="ml-2 border rounded" />
          </label>
          <label className="mr-4">
            To: <input type="date" value={end2} onChange={e => setEnd2(e.target.value)} className="ml-2 border rounded" />
          </label>
          <label className="mr-4">
            Top k: <input type="number" min={1} value={kRevenue} onChange={e => setKRevenue(Number(e.target.value))} className="ml-2 w-16 border rounded" />
          </label>
          <button onClick={fetchTopRevenue} className="px-3 py-1 bg-blue-600 text-white rounded">
            Run
          </button>
          {topRevenueItems.length > 0 && (
            <table className="mt-4 w-full table-auto">
              <thead className="bg-gray-200">
                <tr><th className="px-4 py-2 text-left">Item</th><th className="px-4 py-2 text-left">Revenue</th></tr>
              </thead>
              <tbody>
                {topRevenueItems.map(tr => (
                  <tr key={tr.name} className="border-b">
                    <td className="px-4 py-2">{tr.name}</td>
                    <td className="px-4 py-2">${tr.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    );
  })
);
