"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      console.error("Admin login error:", loginError);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#071a3d]">
      <div className="flex min-h-screen">

        {/* ================================
            LEFT BRANDING PANEL
        ================================= */}
        <section className="relative hidden overflow-hidden bg-[#071a3d] lg:flex lg:w-1/2">
          {/* Decorative circles */}
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ff7800]/10" />

          <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#ff7800]/10" />

          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <a
              href="/"
              className="flex w-fit items-center gap-3 transition hover:opacity-80"
            >
              <img
                src="/rplogo.png"
                alt="Random Picks NG"
                className="h-12 w-12 rounded-full object-cover"
              />

              <span className="text-xl font-bold text-white">
                Random Picks NG
              </span>
            </a>

            {/* Main message */}
            <div className="max-w-lg">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#ff7800]" />
                Secure Administration
              </div>

              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white xl:text-6xl">
                Manage your store
                <span className="text-[#ff7800]"> with confidence.</span>
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-white/60">
                Access your Random Picks NG administration panel
                to manage products, orders, customers and other
                store operations.
              </p>

              {/* Feature cards */}
              <div className="mt-10 grid gap-3 sm:grid-cols-2">

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7800]/10 text-[#ff7800]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z"
                      />
                    </svg>
                  </div>

                  <p className="font-semibold text-white">
                    Secure Access
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Protected administrator authentication.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7800]/10 text-[#ff7800]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3v18h18"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m7 16 4-5 3 3 5-7"
                      />
                    </svg>
                  </div>

                  <p className="font-semibold text-white">
                    Store Management
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/50">
                    Manage products and customer orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>
                © {new Date().getFullYear()} Random Picks NG
              </span>

              <span>
                Admin Portal
              </span>
            </div>
          </div>
        </section>

        {/* ================================
            RIGHT LOGIN PANEL
        ================================= */}
        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-1/2 lg:px-12 xl:px-20">

          <div className="w-full max-w-md animate-[fadeUp_0.6s_ease-out]">

            {/* Mobile logo */}
            <div className="mb-8 flex flex-col items-center text-center lg:hidden">
              <a
                href="/"
                className="flex items-center gap-3"
              >
                <img
                  src="/rplogo.png"
                  alt="Random Picks NG"
                  className="h-12 w-12 rounded-full object-cover"
                />

                <span className="text-xl font-bold text-[#071a3d]">
                  Random Picks NG
                </span>
              </a>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#ff7800]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                  />
                </svg>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7800]">
                Administration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#071a3d] sm:text-4xl">
                Welcome back
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Sign in to access your Random Picks NG
                administration dashboard.
              </p>
            </div>

            {/* Login card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                {/* Email */}
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-semibold text-[#071a3d]"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.8"
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.92l-7.5 4.615a2.25 2.25 0 0 1-2.36 0l-7.5-4.615a2.25 2.25 0 0 1-1.07-1.92V6.75"
                        />
                      </svg>
                    </div>

                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      placeholder="admin@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-sm text-[#071a3d] outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-[#ff7800]/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-sm font-semibold text-[#071a3d]"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.8"
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 10.5V7.875a4.875 4.875 0 0 0-9.75 0V10.5m-1.5 0h12.75A1.5 1.5 0 0 1 19.5 12v7.125a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19.125V12A1.5 1.5 0 0 1 6 10.5Z"
                        />
                      </svg>
                    </div>

                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-12 text-sm text-[#071a3d] outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-[#ff7800]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition hover:text-[#ff7800]"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.98A10.45 10.45 0 0 0 2.25 12s3.75 6.75 9.75 6.75c1.36 0 2.59-.27 3.68-.72M6.23 6.23C7.78 5.28 9.7 4.75 12 4.75c6 0 9.75 7.25 9.75 7.25a13.4 13.4 0 0 1-3.08 3.9M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 accent-[#ff7800]"
                    />

                    <span className="text-sm text-gray-600">
                      Remember me
                    </span>
                  </label>

                  <span className="text-xs text-gray-400">
                    Secure login
                  </span>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      stroke="currentColor"
                      className="mt-0.5 h-5 w-5 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m0 3h.008v.008H12V15.75ZM10.34 3.94 2.91 17.25A1.5 1.5 0 0 0 4.21 19.5h15.58a1.5 1.5 0 0 0 1.3-2.25L13.66 3.94a1.9 1.9 0 0 0-3.32 0Z"
                      />
                    </svg>

                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#071a3d] px-6 py-3.5 font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7800] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#071a3d] shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3 5.25 6v5.25c0 4.08 2.87 7.86 6.75 9 3.88-1.14 6.75-4.92 6.75-9V6L12 3Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m9.5 12 1.75 1.75L14.75 10"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#071a3d]">
                    Protected administrator area
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-gray-500">
                    Only authorized administrators should sign in
                    to this section.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to store */}
            <div className="mt-6 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#ff7800]"
              >
                <span>←</span>
                Back to Store
              </a>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
              Random Picks NG · Administration Portal
            </p>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}