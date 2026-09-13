import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { obtenerDatosPeriodo } from "@/lib/periodos";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const usuario = session?.user as { permisos?: string[] } | undefined;
  if (!usuario?.permisos?.includes("cierres_periodo:ver")) {
    return NextResponse.json({ error: "No tienes permiso para exportar este reporte." }, { status: 403 });
  }

  const { id } = await params;
  const anioEscolar = await prisma.anioEscolar.findUnique({ where: { id } });
  if (!anioEscolar) {
    return NextResponse.json({ error: "Período no encontrado." }, { status: 404 });
  }

  const [{ resumen, filas }, cargos, ajustes, cierres] = await Promise.all([
    obtenerDatosPeriodo(id),
    prisma.cargo.findMany({
      where: { anioEscolarId: id },
      include: { estudiante: true, pagos: true, ajustes: true },
      orderBy: [{ estudiante: { apellido: "asc" } }, { fechaEmision: "asc" }],
    }),
    prisma.ajusteCargo.findMany({
      where: { cargo: { anioEscolarId: id } },
      include: { cargo: { include: { estudiante: true } }, usuario: true },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.cierrePeriodo.findMany({
      where: { anioEscolarId: id },
      include: { usuario: true },
      orderBy: { fecha: "desc" },
    }),
  ]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Período: anioEscolar.nombre, Estado: anioEscolar.estadoCierre },
      { "Fecha inicio": anioEscolar.fechaInicio.toLocaleDateString("es-DO") },
      { "Fecha fin": anioEscolar.fechaFin.toLocaleDateString("es-DO") },
      {},
      { "Total facturado (RD$)": resumen.totalCargos },
      { "Total cobrado (RD$)": resumen.totalPagado },
      { "Total pendiente (RD$)": resumen.totalPendiente },
      { "Total estudiantes": resumen.totalEstudiantes },
      { "Estudiantes pagados": resumen.estudiantesPagados },
      { "Estudiantes con pago parcial": resumen.estudiantesParcial },
      { "Estudiantes con deuda": resumen.estudiantesConDeuda },
    ]),
    "Resumen"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      filas.map((f) => ({
        Estudiante: `${f.nombre} ${f.apellido}`,
        Expediente: f.numeroExpediente,
        "Total cargado": f.totalCargado,
        "Total pagado": f.totalPagado,
        Saldo: f.saldo,
        Estado: f.estado,
      }))
    ),
    "Estudiantes"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      cargos.map((c) => ({
        Estudiante: `${c.estudiante.nombre} ${c.estudiante.apellido}`,
        Concepto: c.concepto,
        Descripción: c.descripcion,
        Monto: Number(c.monto),
        "Fecha emisión": c.fechaEmision.toLocaleDateString("es-DO"),
        Estado: c.estado,
        "Total pagado": c.pagos.reduce((s, p) => s + Number(p.monto), 0),
      }))
    ),
    "Cargos"
  );

  const pagos = cargos.flatMap((c) =>
    c.pagos.map((p) => ({
      Estudiante: `${c.estudiante.nombre} ${c.estudiante.apellido}`,
      Concepto: c.descripcion,
      Monto: Number(p.monto),
      Método: p.metodo,
      Referencia: p.referencia ?? "",
      Fecha: p.fechaPago.toLocaleDateString("es-DO"),
    }))
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pagos), "Pagos");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      ajustes.map((a) => ({
        Estudiante: `${a.cargo.estudiante.nombre} ${a.cargo.estudiante.apellido}`,
        Concepto: a.cargo.descripcion,
        Tipo: a.tipo,
        Monto: Number(a.monto),
        Motivo: a.motivo,
        Usuario: a.usuario.nombre,
        Fecha: a.creadoEn.toLocaleDateString("es-DO"),
      }))
    ),
    "Ajustes"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      cierres.map((c) => ({
        Tipo: c.tipo,
        Fecha: c.fecha.toLocaleString("es-DO"),
        Usuario: c.usuario.nombre,
        "Total facturado": Number(c.totalCargos),
        "Total cobrado": Number(c.totalPagado),
        "Total pendiente": Number(c.totalPendiente),
        "Estudiantes con deuda": c.estudiantesConDeuda,
        Motivo: c.motivo ?? "",
      }))
    ),
    "Historial de cierres"
  );

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="periodo-${anioEscolar.nombre}-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
