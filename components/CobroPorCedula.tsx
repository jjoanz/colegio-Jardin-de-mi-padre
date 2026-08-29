"use client";

import { useActionState, useMemo, useState } from "react";
import { buscarParaCobro, registrarPagosMultiples, type ResultadoBusquedaCobro } from "@/lib/actions";
import { BotonGuardar } from "@/components/BotonGuardar";

const estadoInicial: ResultadoBusquedaCobro = { encontrado: false };

type CuentaOpcion = { id: string; nombre: string; banco: string };

export function CobroPorCedula({ cuentas }: { cuentas: CuentaOpcion[] }) {
  const [resultado, buscarAction, buscando] = useActionState(buscarParaCobro, estadoInicial);
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});
  const [montos, setMontos] = useState<Record<string, string>>({});

  function toggle(cargoId: string, pendiente: number) {
    setSeleccionados((s) => {
      const nuevo = !s[cargoId];
      if (nuevo && !montos[cargoId]) {
        setMontos((m) => ({ ...m, [cargoId]: pendiente.toFixed(2) }));
      }
      return { ...s, [cargoId]: nuevo };
    });
  }

  const totalSeleccionado = useMemo(() => {
    if (!resultado.grupos) return 0;
    return resultado.grupos
      .flatMap((g) => g.hijos)
      .flatMap((h) => h.cargosPendientes)
      .filter((c) => seleccionados[c.id])
      .reduce((sum, c) => sum + (Number(montos[c.id]) || 0), 0);
  }, [resultado.grupos, seleccionados, montos]);

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-green)]">
        Cobrar por cédula, expediente, matrícula o nombre
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
        Busca por la cédula del padre/madre/tutor, el número de expediente, la matrícula MINERD,
        o el nombre del padre/madre/tutor o del estudiante — si el nombre trae varios resultados
        relacionados, se muestran todos para elegir. Cobra de una vez los cargos de uno o varios
        hijos, completo o como abono parcial.
      </p>

      <form action={buscarAction} className="mt-3 flex gap-2">
        <input
          name="busqueda"
          placeholder="Cédula, expediente, matrícula MINERD o nombre"
          required
          className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {resultado.mensaje && !resultado.encontrado && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{resultado.mensaje}</p>
      )}

      {resultado.encontrado && resultado.grupos && (
        <form action={registrarPagosMultiples} className="mt-4 space-y-5">
          {resultado.grupos.length > 1 && (
            <p className="text-xs font-semibold text-[var(--color-ink-soft)]">
              {resultado.grupos.length} resultados relacionados — marca los cargos que quieras cobrar,
              pueden ser de familias distintas.
            </p>
          )}

          {resultado.grupos.map((grupo, i) => (
            <div key={i} className="space-y-3">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {grupo.tutor ? (
                  <>
                    {grupo.tutor.nombre} {grupo.tutor.apellido}{" "}
                    <span className="font-normal text-[var(--color-ink-soft)]">
                      ({grupo.tutor.numeroExpediente})
                    </span>
                  </>
                ) : (
                  <span className="font-normal text-[var(--color-ink-soft)]">
                    Estudiante sin padre/madre/tutor vinculado
                  </span>
                )}
              </p>

              {grupo.hijos.map((hijo) => (
                <div key={hijo.id} className="rounded-lg bg-[var(--color-paper-dark)] p-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {hijo.nombre} {hijo.apellido}{" "}
                    <span className="font-normal text-[var(--color-ink-soft)]">({hijo.numeroExpediente})</span>
                  </p>
                  {hijo.cargosPendientes.length === 0 ? (
                    <p className="mt-1 text-xs text-[var(--color-ink-soft)]">Sin cargos pendientes.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {hijo.cargosPendientes.map((c) => {
                        const marcado = !!seleccionados[c.id];
                        return (
                          <div key={c.id} className="rounded-lg bg-white p-2.5">
                            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name="cargoIds"
                                  value={c.id}
                                  checked={marcado}
                                  onChange={() => toggle(c.id, c.pendiente)}
                                />
                                {c.descripcion}
                              </span>
                              <span className="font-mono text-xs text-[var(--color-ink-soft)]">
                                Saldo: RD$ {c.pendiente.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                              </span>
                            </label>

                            {marcado && (
                              <div className="mt-2 flex items-center gap-2 pl-6">
                                <label className="text-xs text-[var(--color-ink-soft)]">Monto a cobrar (RD$):</label>
                                <input
                                  type="number"
                                  name={`monto-${c.id}`}
                                  step="0.01"
                                  min="0.01"
                                  max={c.pendiente}
                                  value={montos[c.id] ?? ""}
                                  onChange={(e) => setMontos((m) => ({ ...m, [c.id]: e.target.value }))}
                                  className="w-32 rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm outline-none focus:border-[var(--color-green)]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setMontos((m) => ({ ...m, [c.id]: c.pendiente.toFixed(2) }))}
                                  className="text-xs font-semibold text-[var(--color-green)]"
                                >
                                  Pago total
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div className="space-y-3 border-t border-[var(--color-line)] pt-3">
            <p className="text-sm font-bold text-[var(--color-ink)]">
              Total a cobrar: RD${" "}
              <span className={totalSeleccionado > 0 ? "text-[var(--color-green)]" : ""}>
                {totalSeleccionado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
              </span>
            </p>
            <select name="metodo" required className={inputClass}>
              <option value="ENLACE_PAGO_AZUL">Enlace de pago Azul</option>
              <option value="TRANSFERENCIA">Transferencia bancaria</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTRO">Otro</option>
            </select>
            <select name="cuentaId" className={inputClass}>
              <option value="">Sin cuenta bancaria (no afecta balances)</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.banco}
                </option>
              ))}
            </select>
            <input name="referencia" placeholder="Referencia / # de confirmación" className={inputClass} />
            <textarea name="notas" placeholder="Notas (opcional)" rows={2} className={inputClass} />
            <BotonGuardar
              textoGuardado="✓ Cobrado"
              disabled={totalSeleccionado <= 0}
              className="w-full rounded-lg bg-[var(--color-green)] py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              Cobrar seleccionados
            </BotonGuardar>
          </div>
        </form>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm outline-none focus:border-[var(--color-green)]";
