import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo"),
    username: z
      .string()
      .min(3, "Username deve ter pelo menos 3 caracteres")
      .max(30, "Username muito longo")
      .transform((s) => s.toLowerCase())
      .refine(
        (s) => /^[a-z0-9_]+$/.test(s),
        "Username deve conter apenas letras minúsculas, números e _"
      ),
    email: z
      .string()
      .email("Email inválido")
      .transform((s) => s.toLowerCase()),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .max(100, "Senha muito longa"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
