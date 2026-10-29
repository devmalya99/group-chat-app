"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { TextField } from "@/shared/components/TextField";
import { signUpRequest } from "../api/client";
import { AUTH_ROUTES } from "../constants/auth.constants";
import {
  getFirstZodError,
  signUpSchema,
} from "../utils/validation";
import { saveAuthSession } from "../utils/session";
import { AuthShell } from "./AuthShell";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});

    const parsed = signUpSchema.safeParse({ name, email, phone, password });

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
      const result = await signUpRequest(parsed.data);
      saveAuthSession(result);
      router.push(AUTH_ROUTES.chats);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not create account",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Join conversations with a clean, modern chat experience."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={AUTH_ROUTES.login}
            className="font-semibold text-[#6D5BFF] hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Alex Rivera"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="alex@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <TextField
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 555 010 2030"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={fieldErrors.phone}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
          Create Account
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
