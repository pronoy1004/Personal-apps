import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      password: String(formData.get("password") ?? ""),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=1");
    throw error; // re-throw NEXT_REDIRECT on success
  }
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-accent text-accent-foreground shadow-glow">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.6" />
            <rect x="14" y="3" width="7" height="7" rx="1.6" />
            <rect x="3" y="14" width="7" height="7" rx="1.6" />
            <rect x="14" y="14" width="7" height="7" rx="1.6" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Personal Hub</h1>
          <p className="text-sm text-muted">Everything in one place.</p>
        </div>
      </div>
      <form action={login} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="rounded-[12px] border border-border bg-surface-2 px-4 py-3.5 text-center outline-none focus:border-accent"
        />
        {error && <p className="text-center text-sm text-danger">Incorrect password.</p>}
        <button
          type="submit"
          className="rounded-[12px] bg-accent py-3.5 font-bold text-accent-foreground shadow-glow active:bg-accent-press"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
