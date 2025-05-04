"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import withAuth from "../utils/withAuth";
import { requireManager } from "../utils/requireManager";
import api from "../services/api";

export interface WorkSchedule {
  ssn: string;
  day_of_week: string;
  start_time: string; // "HH:MM:SS"
  end_time: string;   // "HH:MM:SS"
}

function WorkSchedulesPage({ userRole }: { userRole: "manager" | "barista" }) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<Partial<WorkSchedule>>({});
  const router = useRouter();

  useEffect(() => {
    api
      .get<WorkSchedule[]>("/work_schedules/")
      .then(res => setSchedules(res.data))
      .catch(err => console.error(err));
  }, []);

  const createSchedule = async () => {
    await api.post("/work_schedules/", newSchedule);
    router.reload();
  };

  const updateSchedule = async (ws: WorkSchedule) => {
    await api.patch(
      `/work_schedules/${ws.ssn}/${ws.day_of_week}/${ws.start_time}`,
      { end_time: ws.end_time }
    );
    router.reload();
  };

  const deleteSchedule = async (ws: WorkSchedule) => {
    await api.delete(
      `/work_schedules/${ws.ssn}/${ws.day_of_week}/${ws.start_time}`
    );
    setSchedules(s =>
      s.filter(
        x =>
          !(
            x.ssn === ws.ssn &&
            x.day_of_week === ws.day_of_week &&
            x.start_time === ws.start_time
          )
      )
    );
  };

  return (
    <div className="min-h-screen p-8 bg-[url('/coffee-bg.jpg')] bg-cover">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 px-4 py-2 bg-gray-100/80 hover:bg-gray-200/90 text-gray-800 rounded shadow"
      >
        ← Back
      </button>

      {/* Panel */}
      <div className="max-w-4xl mx-auto bg-brown-900/70 backdrop-blur-lg border border-gray-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-6">Work Schedules</h1>

        {/* Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-4 py-2 text-left">SSN</th>
                <th className="px-4 py-2 text-left">Day</th>
                <th className="px-4 py-2 text-left">Start</th>
                <th className="px-4 py-2 text-left">End</th>
                {userRole === "manager" && (
                  <th className="px-4 py-2 text-left">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {schedules.map(ws => (
                <tr
                  key={`${ws.ssn}-${ws.day_of_week}-${ws.start_time}`}
                  className="border-b border-gray-700 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-2">{ws.ssn}</td>
                  <td className="px-4 py-2">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][parseInt(ws.day_of_week) - 1]}
                  </td>
                  <td className="px-4 py-2">{ws.start_time.slice(0,5)}</td>
                  <td className="px-4 py-2">
                    {userRole === "manager" ? (
                      <input
                        type="time"
                        value={ws.end_time.slice(0,5)}
                        onChange={e =>
                          updateSchedule({
                            ...ws,
                            end_time: e.target.value + ":00",
                          })
                        }
                        className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1"
                      />
                    ) : (
                      ws.end_time.slice(0,5)
                    )}
                  </td>
                  {userRole === "manager" && (
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteSchedule(ws)}
                        className="text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create form */}
        {userRole === "manager" && (
          <div className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Add New Schedule</h2>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { key: "ssn", type: "text", placeholder: "SSN" },
                { key: "day_of_week", type: "number", placeholder: "Day (1–7)" },
                { key: "start_time", type: "time", placeholder: "Start" },
                { key: "end_time", type: "time", placeholder: "End" },
              ].map(({ key, type, placeholder }) => (
                <input
                  key={key}
                  type={type}
                  placeholder={placeholder}
                  value={
                    key.includes("time")
                      ? (newSchedule as any)[key]?.slice(0,5) || ""
                      : (newSchedule as any)[key] || ""
                  }
                  onChange={e =>
                    setNewSchedule({
                      ...newSchedule,
                      [key]: key.includes("time")
                        ? e.target.value + ":00"
                        : e.target.value,
                    })
                  }
                  className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                />
              ))}
            </div>
            <button
              onClick={createSchedule}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded shadow"
            >
              Create Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(requireManager(WorkSchedulesPage));
