"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import withAuth from "../../utils/withAuth";
import api from "../../services/api";

export default withAuth(function DrinkPage() {
  const router = useRouter();
  const { name } = router.query as { name?: string };
  const [desc, setDesc] = useState<string>("Loading…");

  useEffect(() => {
    if (!name) return;
    api
      .get<{ description: string }>(`/llm/description/${encodeURIComponent(name)}`)
      .then((r) => setDesc(r.data.description))
      .catch(() => setDesc("Could not load description"));
  }, [name]);

  return (
    <div className="p-8">
      <button
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-4">{name}</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p>{desc}</p>
      </div>
    </div>
  );
});
