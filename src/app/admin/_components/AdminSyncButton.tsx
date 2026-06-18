"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminSyncButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleSync() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/sync/lorcast", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Erro ao iniciar sincronização");
      } else {
        setState("success");
        setMessage("Sincronização concluída com sucesso!");
        router.refresh();
      }
    } catch {
      setState("error");
      setMessage("Falha na conexão");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={state === "loading"}
        aria-busy={state === "loading"}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
      >
        {state === "loading" ? "Sincronizando…" : "Iniciar sincronização"}
      </button>
      {message && (
        <p
          role="alert"
          className={`text-sm ${state === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
