import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const usuario = session?.user as { tipoUsuario?: string; name?: string } | undefined;
  if (!session || usuario?.tipoUsuario !== "PADRE") redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[var(--color-paper-dark)]">
      <header className="flex items-center justify-between bg-[var(--color-green-deep)] px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
          <div>
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold">Portal de padres</p>
            <p className="text-xs text-white/60">{usuario?.name}</p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button className="text-xs font-bold uppercase tracking-widest text-[var(--color-gold)]">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
