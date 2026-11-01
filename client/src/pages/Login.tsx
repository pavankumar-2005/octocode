import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button, Input, Tab, Tabs } from "@heroui/react";
import Backdrop from "../components/Backdrop";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { CheckIcon } from "../components/Icons";
import { useAuth } from "../lib/auth";

type Mode = "signin" | "signup";

// Only follow ?next= to pages on this site (never "//evil.com"), otherwise go to the dashboard.
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/projects";
}

export default function Login() {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { account, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in (or just finished signing in): go where the user was heading.
  if (account) return <Navigate to={next} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(name, email, password);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <div className="relative isolate flex flex-col px-4 py-6 sm:px-10">
        <div className="lg:hidden">
          <Backdrop />
        </div>
        <div className="flex items-center justify-between">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="m-auto flex w-full max-w-sm flex-col gap-4 py-10"
        >
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-default-500">
              {mode === "signin" ? "Sign in to open your long-term projects." : "Free, and it takes ten seconds."}
            </p>
          </div>

          <Tabs
            fullWidth
            aria-label="Sign in or sign up"
            selectedKey={mode}
            onSelectionChange={(key) => {
              setMode(key as Mode);
              setError("");
            }}
          >
            <Tab key="signin" title="Sign in" />
            <Tab key="signup" title="Create account" />
          </Tabs>

          {mode === "signup" && (
            <Input label="Your name" value={name} onValueChange={setName} isRequired autoComplete="name" />
          )}
          <Input label="Email" type="email" value={email} onValueChange={setEmail} isRequired autoComplete="email" />
          <Input
            label="Password"
            type="password"
            value={password}
            onValueChange={setPassword}
            isRequired
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            description={mode === "signup" ? "At least 8 characters" : undefined}
          />

          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

          <Button type="submit" color="primary" size="lg" isLoading={busy} className="bg-brand font-medium shadow-lg shadow-violet-500/25">
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <p className="text-center text-sm text-default-500">
            Just want to try it?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Start a quick session
            </Link>{" "}
            with no account.
          </p>
        </motion.form>
      </div>
    </div>
  );
}

// Left half on big screens: brand message and a tiny "live editor" with two teammates' cursors.
function BrandPanel() {
  return (
    <aside className="relative isolate hidden flex-col overflow-hidden bg-[#0b0b16] p-10 text-white lg:flex">
      <div className="dark contents">
        <Backdrop />
      </div>
      <Logo />
      <div className="my-auto flex flex-col gap-8">
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Your code,
            <br />
            <span className="text-brand">saved for the long run.</span>
          </h2>
          <ul className="mt-6 flex flex-col gap-2 text-white/70">
            {["Projects stay until you delete them", "Teammates join with a link after signing in", "Every keystroke synced live, even offline"].map(
              (f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckIcon size={16} className="text-cyan-400" />
                  {f}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="max-w-md overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] font-mono text-sm shadow-2xl backdrop-blur">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-red-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-green-400/80" />
            <span className="ml-3 text-xs text-white/50">main.py</span>
          </div>
          <pre className="px-4 py-4 leading-7">
            <span className="text-violet-300">def</span> <span className="text-cyan-300">merge</span>(a, b):
            {"\n"}    result = []
            <Caret name="Ana" color="#ec4899" />
            {"\n"}    <span className="text-violet-300">while</span> a <span className="text-violet-300">and</span> b:
            {"\n"}        result.append(<span className="text-amber-300">min</span>(a, b).pop(<span className="text-emerald-300">0</span>))
            <Caret name="Ravi" color="#22c55e" />
            {"\n"}    <span className="text-violet-300">return</span> result + a + b
          </pre>
        </div>
      </div>
      <p className="text-xs text-white/40">Built with Yjs CRDTs · MongoDB · Monaco</p>
    </aside>
  );
}

function Caret({ name, color }: { name: string; color: string }) {
  return (
    <span className="relative inline-block h-5 align-middle">
      <span className="octo-caret absolute -top-0.5 left-0 h-6 w-0.5" style={{ backgroundColor: color }} />
      <span
        className="absolute -top-5 left-0 whitespace-nowrap rounded rounded-bl-none px-1 font-sans text-[10px] font-medium leading-4 text-black"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </span>
  );
}
