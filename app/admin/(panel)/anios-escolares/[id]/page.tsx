import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { obtenerDatosPeriodo, type FilaEstudiantePeriodo } from "@/lib/periodos";
import { cerrarPeriodo, reabrirPeriodo, crearAjusteCargo } from "@/lib/actions-periodos";
import { BotonGuardar } from "@/components/BotonGuardar";
import type { CierrePeriodo } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = { vista?: string; q?: string };

const TABS = [
  { value: "resumen", label: "Resumen" },
  { value: "estudiantes", label: "Estudiantes" },
  { value: "ajustes", label: "Ajustes" },
  { value: "historial", label: "Historial" },
];

export default async function PeriodoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const vista = TABS.some((t) => t.value === sp.vista) ? sp.vista! : "resumen";

  const session = await auth();
  const usuario = session?.user as { permisos?: string[] } | undefined;
  const permisos = usuario?.permisos ?? [];
  const puedeCerrar = permisos.includes("cierres_periodo:crear");
  const puedeReabrir = permisos.includes("cierres_periodo:eliminar");
  const puedeAjustar = permisos.includes("cierres_periodo:editar");
  const puedeVerContabilidad = permisos.includes("cierres_periodo:ver");

  const anioEscolar = await prisma.anioEscolar.findUnique({ where: { id } });
  if (!anioEscolar) notFound();

  const { resumen, filas } = await obtenerDatosPeriodo(id);
  const cerrado = anioEscolar.estadoCierre === "CERRADO";
  const porcentajeCobrado = resumen.totalCargos > 0 ? (resumen.totalPagado / resumen.totalCargos) * 100 : 0;

  // Un período cerrado sigue cobrando cuentas por cobrar históricas — el
  // resumen de arriba siempre es el saldo ACTUAL (en vivo). Para no perder de
  // vista qué tan pendiente estaba el período al momento exacto del cierre,
  // se muestra también la fotografía congelada de ese cierre más reciente.
  const ultimoCierre = cerrado
    ? await prisma.cierrePeriodo.findFirst({
        where: { anioEscolarId: id, tipo: "CIERRE" },
        orderBy: { fecha: "desc" },
      })
    : null;

  return (
    <div>
      <Link href="/admin/anios-escolares" className="text-sm font-bold text-[var(--color-green)]">
        ← Períodos académicos
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
              {anioEscolar.nombre}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                cerrado ? "bg-gray-100 text-gray-600" : "bg-[var(--color-paper-dark)] text-[var(--color-green)]"
              }`}
            >
              {cerrado ? "CERRADO" : "ABIERTO"}
            </span>
          </div>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            {anioEscolar.fechaInicio.toLocaleDateString("es-DO")} → {anioEscolar.fechaFin.toLocaleDateString("es-DO")}
          </p>
        </div>
        {puedeVerContabilidad && (
          <a
            href={`/api/periodos/${id}/exportar`}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2.5 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]"
          >
            Exportar Excel
          </a>
        )}
      </div>

      <div className="mt-6 flex gap-2 border-b border-[var(--color-line)]">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/anios-escolares/${id}?vista=${t.value}`}
            className={`rounded-t-lg px-4 py-2 text-sm font-bold ${
              vista === t.value
                ? "border-b-2 border-[var(--color-green)] text-[var(--color-green)]"
                : "text-[var(--color-ink-soft)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {vista === "resumen" && (
        <VistaResumen
          anioEscolarId={id}
          resumen={resumen}
          porcentajeCobrado={porcentajeCobrado}
          cerrado={cerrado}
          puedeCerrar={puedeCerrar}
          puedeReabrir={puedeReabrir}
          ultimoCierre={ultimoCierre}
        />
      )}
      {vista === "estudiantes" && <VistaEstudiantes filas={filas} q={sp.q ?? ""} />}
      {vista === "ajustes" && (
        <VistaAjustes anioEscolarId={id} puedeAjustar={puedeAjustar} />
      )}
      {vista === "historial" && <VistaHistorial anioEscolarId={id} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESUMEN — tarjetas financieras + cierre/reapertura
// ---------------------------------------------------------------------------

function VistaResumen({
  anioEscolarId,
  resumen,
  porcentajeCobrado,
  cerrado,
  puedeCerrar,
  puedeReabrir,
  ultimoCierre,
}: {
  anioEscolarId: string;
  resumen: Awaited<ReturnType<typeof obtenerDatosPeriodo>>["resumen"];
  porcentajeCobrado: number;
  cerrado: boolean;
  puedeCerrar: boolean;
  puedeReabrir: boolean;
  ultimoCierre: CierrePeriodo | null;
}) {
  const cobradoDespuesDelCierre = ultimoCierre
    ? Math.round((resumen.totalPagado - Number(ultimoCierre.totalPagado)) * 100) / 100
    : 0;

  return (
    <div className="mt-6">
      <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        Resumen financiero {cerrado && <span className="normal-case text-[var(--color-ink-soft)]">(saldo actual, en vivo)</span>}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tarjeta etiqueta="Facturado" valor={resumen.totalCargos} />
        <Tarjeta etiqueta="Cobrado" valor={resumen.totalPagado} color="text-[var(--color-green)]" />
        <Tarjeta
          etiqueta="Por cobrar"
          valor={resumen.totalPendiente}
          color={resumen.totalPendiente > 0 ? "text-red-600" : "text-[var(--color-green)]"}
        />
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">% cobrado</p>
          <p className="mt-2 font-mono text-xl font-bold text-[var(--color-ink)]">
            {porcentajeCobrado.toFixed(1)}%
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-paper-dark)]">
            <div
              className="h-full bg-[var(--color-green)]"
              style={{ width: `${Math.min(porcentajeCobrado, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {cerrado && ultimoCierre && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Cuentas por cobrar históricas — al momento del cierre ({ultimoCierre.fecha.toLocaleDateString("es-DO")})
          </p>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            El período está cerrado, pero las cuentas por cobrar que quedaron pendientes se siguen pudiendo
            cobrar sin reabrirlo. Esto compara lo congelado en el cierre contra el saldo actual.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MiniDato etiqueta="Pendiente al cierre" valor={Number(ultimoCierre.totalPendiente)} />
            <MiniDato etiqueta="Cobrado después del cierre" valor={cobradoDespuesDelCierre} destacar />
            <MiniDato
              etiqueta="Pendiente actual"
              valor={resumen.totalPendiente}
              destacar={resumen.totalPendiente > 0}
            />
            <MiniDato etiqueta="Estudiantes con deuda (al cierre)" valor={ultimoCierre.estudiantesConDeuda} moneda={false} />
          </div>
        </div>
      )}

      <h2 className="mt-8 text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        Estudiantes
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Tarjeta etiqueta="Total" valor={resumen.totalEstudiantes} moneda={false} />
        <Tarjeta etiqueta="Pagados" valor={resumen.estudiantesPagados} moneda={false} color="text-[var(--color-green)]" />
        <Tarjeta etiqueta="Pago parcial" valor={resumen.estudiantesParcial} moneda={false} color="text-amber-600" />
        <Tarjeta etiqueta="Con deuda" valor={resumen.estudiantesConDeuda} moneda={false} color="text-red-600" />
      </div>

      <h2 className="mt-8 text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
        Cierre contable
      </h2>
      <div className="mt-3 rounded-2xl border border-[var(--color-line)] bg-white p-5">
        {cerrado ? (
          <>
            <p className="text-sm text-[var(--color-ink)]">
              Este período está <strong>cerrado</strong>. Los cargos y pagos históricos quedan protegidos —
              cualquier corrección debe hacerse mediante un ajuste contable en la pestaña{" "}
              <strong>Ajustes</strong>.
            </p>
            {puedeReabrir && (
              <details className="mt-4 group">
                <summary className="w-fit cursor-pointer list-none rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[var(--color-paper-dark)]">
                  Reabrir período
                </summary>
                <form action={reabrirPeriodo} className="mt-3 max-w-lg space-y-3">
                  <input type="hidden" name="anioEscolarId" value={anioEscolarId} />
                  <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    Reabrir permitirá volver a crear cargos y registrar pagos normalmente en este período.
                    Queda registrado quién reabrió, cuándo y por qué — el cierre anterior no se borra.
                  </p>
                  <label className="block text-xs text-[var(--color-ink-soft)]">
                    Motivo de la reapertura (obligatorio)
                    <textarea name="motivo" required rows={2} className={inputClass} />
                  </label>
                  <BotonGuardar
                    textoGuardado="✓ Reabierto"
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Confirmar reapertura
                  </BotonGuardar>
                </form>
              </details>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--color-ink-soft)]">
              Al cerrar este período, las operaciones financieras quedarán protegidas contra modificaciones
              normales. Las correcciones posteriores deberán realizarse mediante ajustes registrados.
            </p>
            {puedeCerrar && (
              <details className="mt-4 group">
                <summary className="w-fit cursor-pointer list-none rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white">
                  Cerrar período
                </summary>
                <form action={cerrarPeriodo} className="mt-3 max-w-lg space-y-3 rounded-lg bg-[var(--color-paper-dark)] p-4">
                  <input type="hidden" name="anioEscolarId" value={anioEscolarId} />
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Confirmar cierre — resumen al día de hoy
                  </p>
                  <ul className="space-y-1 text-sm text-[var(--color-ink)]">
                    <li>Estudiantes: <strong>{resumen.totalEstudiantes}</strong></li>
                    <li>Total facturado: <strong>RD$ {resumen.totalCargos.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong></li>
                    <li>Total cobrado: <strong>RD$ {resumen.totalPagado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong></li>
                    <li>Total pendiente: <strong className={resumen.totalPendiente > 0 ? "text-red-600" : ""}>RD$ {resumen.totalPendiente.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong></li>
                    <li>Estudiantes con deuda: <strong>{resumen.estudiantesConDeuda}</strong></li>
                  </ul>
                  <label className="block text-xs text-[var(--color-ink-soft)]">
                    Observaciones (opcional)
                    <textarea name="observaciones" rows={2} className={inputClass} />
                  </label>
                  <BotonGuardar
                    textoGuardado="✓ Cerrado"
                    className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Confirmar cierre del período
                  </BotonGuardar>
                </form>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MiniDato({
  etiqueta,
  valor,
  moneda = true,
  destacar = false,
}: {
  etiqueta: string;
  valor: number;
  moneda?: boolean;
  destacar?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{etiqueta}</p>
      <p className={`mt-1 font-mono text-sm font-bold ${destacar ? "text-[var(--color-ink)]" : "text-gray-500"}`}>
        {moneda ? `RD$ ${valor.toLocaleString("es-DO", { minimumFractionDigits: 2 })}` : valor}
      </p>
    </div>
  );
}

function Tarjeta({
  etiqueta,
  valor,
  color = "text-[var(--color-ink)]",
  moneda = true,
}: {
  etiqueta: string;
  valor: number;
  color?: string;
  moneda?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{etiqueta}</p>
      <p className={`mt-2 font-mono text-xl font-bold ${color}`}>
        {moneda ? `RD$ ${valor.toLocaleString("es-DO", { minimumFractionDigits: 2 })}` : valor}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ESTUDIANTES — tabla con búsqueda
// ---------------------------------------------------------------------------

const ESTADO_COLOR: Record<string, string> = {
  PAGADO: "bg-green-100 text-green-800",
  PARCIAL: "bg-amber-100 text-amber-800",
  PENDIENTE: "bg-red-100 text-red-800",
};

function VistaEstudiantes({ filas, q }: { filas: FilaEstudiantePeriodo[]; q: string }) {
  const filtro = q.trim().toLowerCase();
  const filasFiltradas = filtro
    ? filas.filter(
        (f) =>
          `${f.nombre} ${f.apellido}`.toLowerCase().includes(filtro) ||
          f.numeroExpediente.toLowerCase().includes(filtro)
      )
    : filas;

  return (
    <div className="mt-6">
      <form method="get" className="flex gap-2">
        <input type="hidden" name="vista" value="estudiantes" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar estudiante o expediente…"
          className="w-full max-w-sm rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)] md:w-72"
        />
        <button className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-dark)] px-4 py-2 text-sm font-bold text-[var(--color-ink)]">
          Buscar
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[var(--color-paper-dark)] text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            <tr>
              <th className="px-4 py-3">Estudiante</th>
              <th className="px-4 py-3">Identificación</th>
              <th className="px-4 py-3 text-right">Total cargado</th>
              <th className="px-4 py-3 text-right">Total pagado</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((f) => (
              <tr key={f.estudianteId} className="border-t border-[var(--color-line)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/estudiantes/${f.estudianteId}/estado-cuenta`}
                    className="font-semibold text-[var(--color-green)] hover:underline"
                  >
                    {f.nombre} {f.apellido}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-ink-soft)]">{f.numeroExpediente}</td>
                <td className="px-4 py-3 text-right font-mono">
                  RD$ {f.totalCargado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  RD$ {f.totalPagado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${
                    f.saldo > 0 ? "text-red-600" : "text-[var(--color-green)]"
                  }`}
                >
                  RD$ {f.saldo.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_COLOR[f.estado]}`}>
                    {f.estado}
                  </span>
                </td>
              </tr>
            ))}
            {filasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-ink-soft)]">
                  {filas.length === 0
                    ? "Este período todavía no tiene cargos generados."
                    : "Ningún estudiante coincide con la búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AJUSTES — crear ajuste + historial de ajustes de este período
// ---------------------------------------------------------------------------

async function VistaAjustes({ anioEscolarId, puedeAjustar }: { anioEscolarId: string; puedeAjustar: boolean }) {
  const [cargos, ajustes] = await Promise.all([
    prisma.cargo.findMany({
      where: { anioEscolarId, estado: { not: "ANULADO" } },
      include: { estudiante: true },
      orderBy: [{ estudiante: { apellido: "asc" } }, { fechaEmision: "asc" }],
    }),
    prisma.ajusteCargo.findMany({
      where: { cargo: { anioEscolarId } },
      include: { cargo: { include: { estudiante: true } }, usuario: true },
      orderBy: { creadoEn: "desc" },
    }),
  ]);

  return (
    <div className="mt-6 space-y-8">
      {puedeAjustar && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
            Nuevo ajuste contable
          </h2>
          <form
            action={crearAjusteCargo}
            className="mt-3 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-5 md:grid-cols-2"
          >
            <select name="cargoId" required className={`md:col-span-2 ${inputClass}`}>
              <option value="">Seleccionar cargo…</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.estudiante.nombre} {c.estudiante.apellido} — {c.descripcion} (RD${" "}
                  {Number(c.monto).toLocaleString("es-DO", { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
            <select name="tipo" required className={inputClass} defaultValue="DESCUENTO">
              <option value="DESCUENTO">Descuento (reduce el saldo)</option>
              <option value="RECARGO">Recargo (aumenta el saldo)</option>
              <option value="CORRECCION">Corrección de captura</option>
            </select>
            <select name="signo" className={inputClass} defaultValue="REDUCE">
              <option value="REDUCE">Corrección: reduce el saldo</option>
              <option value="AUMENTA">Corrección: aumenta el saldo</option>
            </select>
            <input name="monto" type="number" step="0.01" min="0.01" required placeholder="Monto (RD$)" className={inputClass} />
            <input name="referencia" placeholder="Referencia (opcional)" className={inputClass} />
            <textarea
              name="motivo"
              required
              rows={2}
              placeholder="Motivo del ajuste (obligatorio)"
              className={`md:col-span-2 ${inputClass}`}
            />
            <BotonGuardar
              textoGuardado="✓ Ajuste registrado"
              className="rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-60 md:col-span-2"
            >
              Registrar ajuste
            </BotonGuardar>
          </form>
          <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
            El campo &quot;signo&quot; solo aplica cuando el tipo es Corrección.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">
          Ajustes registrados en este período
        </h2>
        <div className="mt-3 space-y-2">
          {ajustes.map((a) => (
            <div key={a.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[var(--color-ink)]">
                  {a.cargo.estudiante.nombre} {a.cargo.estudiante.apellido} — {a.cargo.descripcion}
                </p>
                <p className={`font-mono font-bold ${Number(a.monto) < 0 ? "text-red-600" : "text-[var(--color-green)]"}`}>
                  {Number(a.monto) < 0 ? "-" : "+"}RD$ {Math.abs(Number(a.monto)).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                {a.tipo} · {a.motivo} · {a.usuario.nombre} · {a.creadoEn.toLocaleDateString("es-DO")}
                {a.referencia && ` · Ref: ${a.referencia}`}
              </p>
            </div>
          ))}
          {ajustes.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
              Este período no tiene ajustes contables registrados.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HISTORIAL — bitácora de cierres y reaperturas
// ---------------------------------------------------------------------------

async function VistaHistorial({ anioEscolarId }: { anioEscolarId: string }) {
  const eventos = await prisma.cierrePeriodo.findMany({
    where: { anioEscolarId },
    include: { usuario: true },
    orderBy: { fecha: "desc" },
  });

  return (
    <div className="mt-6 space-y-2">
      {eventos.map((e) => (
        <div key={e.id} className="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                e.tipo === "CIERRE" ? "bg-gray-100 text-gray-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {e.tipo === "CIERRE" ? "CIERRE" : "REAPERTURA"}
            </span>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {e.usuario.nombre} · {e.fecha.toLocaleString("es-DO")}
            </p>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--color-ink)] md:grid-cols-4">
            <p>Facturado: <strong>RD$ {Number(e.totalCargos).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong></p>
            <p>Cobrado: <strong>RD$ {Number(e.totalPagado).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong></p>
            <p>Pendiente: <strong>RD$ {Number(e.totalPendiente).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</strong></p>
            <p>Estudiantes con deuda: <strong>{e.estudiantesConDeuda}</strong></p>
          </div>
          {e.motivo && <p className="mt-2 text-sm text-[var(--color-ink-soft)]">&quot;{e.motivo}&quot;</p>}
        </div>
      ))}
      {eventos.length === 0 && (
        <p className="rounded-2xl border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-ink-soft)]">
          Este período nunca se ha cerrado.
        </p>
      )}
    </div>
  );
}

const inputClass =
  "mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
