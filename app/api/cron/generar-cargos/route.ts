import { NextRequest, NextResponse } from "next/server";
import { generarCargosPendientes } from "@/lib/generacion-cargos";

// El panel ya dispara la generación de cuotas automáticamente en cada carga
// (ver app/admin/(panel)/layout.tsx), así que este endpoint es opcional: solo
// hace falta si más adelante se despliega en un host con cron real (Vercel
// Cron, tarea programada de Windows) y se quiere garantizar que las cuotas se
// generen aunque nadie entre al panel ese día. Protegido con un secreto para
// que no cualquiera pueda invocarlo.
export async function GET(req: NextRequest) {
  const secreto = req.nextUrl.searchParams.get("secreto");
  if (!process.env.CRON_SECRET || secreto !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await generarCargosPendientes();
  return NextResponse.json({ ok: true });
}
