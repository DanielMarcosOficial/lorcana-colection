"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";
import type { ActionState } from "@/app/actions/auth";

const initialState: ActionState = {};

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
};

function Field({ id, name, label, type = "text", autoComplete, error }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initialState);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {state.message}
        </p>
      )}

      <Field
        id="name"
        name="name"
        label="Nome completo"
        autoComplete="name"
        error={state.errors?.name?.[0]}
      />
      <Field
        id="username"
        name="username"
        label="Username"
        autoComplete="username"
        error={state.errors?.username?.[0]}
      />
      <Field
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={state.errors?.email?.[0]}
      />
      <Field
        id="password"
        name="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        error={state.errors?.password?.[0]}
      />
      <Field
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={state.errors?.confirmPassword?.[0]}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        aria-busy={pending}
      >
        {pending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
