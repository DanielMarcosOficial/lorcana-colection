"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-red-500">!</p>
      <h1 className="mt-4 text-2xl font-bold">Algo deu errado</h1>
      <p className="mt-2 text-gray-500">Ocorreu um erro inesperado.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
