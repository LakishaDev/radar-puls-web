"use client";

import {FormEvent, useState} from "react";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {setAdminToken} from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (token.trim().length < 8) {
      setError(t("login.validation.tokenMin"));
      return;
    }

    setAdminToken(token);
    router.replace("/admin");
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <form onSubmit={onSubmit} className="w-full rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">Radar Puls</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-100">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("login.subtitle")}</p>

        <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400" htmlFor="token">
          {t("login.tokenLabel")}
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
            if (error) {
              setError(null);
            }
          }}
          className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-500"
          placeholder={t("login.placeholder")}
          autoComplete="off"
        />

        {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}

        <button
          type="submit"
          className="mt-5 w-full rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
        >
          {t("login.submit")}
        </button>
      </form>
    </div>
  );
}
