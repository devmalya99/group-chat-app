"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { TextField } from "@/shared/components/TextField";
import { loginRequest } from "../api/client";
import { AUTH_ROUTES } from "../constants/auth.constants";
import {
  getFirstZodError,
  loginSchema,
} from "../utils/validation";
import { saveAuthSession } from "../utils/session";
import { AuthShell } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ identifier, password });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setFormError(getFirstZodError(parsed.error));
      return;
    }

    setLoading(true);

    try {
      const result = await loginRequest(parsed.data);
      saveAuthSession(result);
      router.push(AUTH_ROUTES.chats);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not log in",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in with your email or phone number to continue chatting."
      footer={
        <>
          New here?{" "}
          <Link
            href={AUTH_ROUTES.signup}
            className="font-semibold text-[#6D5BFF] hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email or phone"
          name="identifier"
          autoComplete="username"
          placeholder="alex@email.com or +1 555 010 2030"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          error={fieldErrors.identifier}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />

        {formError ? (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {formError}
          </p>
        ) : null}

        <PrimaryButton type="submit" loading={loading}>
          Log in
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
