"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("邮箱或密码错误");
      return;
    }

    const rawCallback = new URLSearchParams(window.location.search).get(
      "callbackUrl",
    );
    const callbackUrl =
      rawCallback && rawCallback.startsWith("/")
        ? rawCallback
        : "/novels";

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-bold">登录</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="flex flex-col gap-1 text-sm">
        邮箱
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        密码
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
          placeholder="••••••••"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {loading ? "登录中…" : "登录"}
      </button>

      <p className="text-sm text-gray-600">
        还没有账号？{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
    </form>
  );
}
