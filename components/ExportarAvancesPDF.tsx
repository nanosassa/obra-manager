'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface ExportarAvancesPDFProps {
  avances: any[]
  proyecto: any
  filtrosAplicados: any
}

export default function ExportarAvancesPDF({
  avances,
  proyecto,
  filtrosAplicados
}: ExportarAvancesPDFProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportarPDF = async () => {
    setIsExporting(true)

    try {
      // Importación dinámica de jsPDF
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()

      // Configuración
      const pageWidth = doc.internal.pageSize.getWidth()
      const marginLeft = 14

      // Calcular totales
      const totalPresupuestado = avances.reduce((sum, a) => sum + (a.monto_presupuestado || 0), 0)
      const totalGastado = avances.reduce((sum, a) => sum + a.total_gastado, 0)
      const progresoPromedio = avances.length > 0
        ? avances.reduce((sum, a) => sum + a.porcentaje_avance, 0) / avances.length
        : 0

      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Reporte de Avances de Obra', marginLeft, 20)

      // Información del proyecto
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Proyecto: ${proyecto.nombre}`, marginLeft, 30)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`, marginLeft, 36)

      // Filtros aplicados
      let yPosition = 42
      const filtrosTexto: string[] = []

      if (filtrosAplicados.proveedor) filtrosTexto.push(`Proveedor: ${filtrosAplicados.proveedor}`)
      if (filtrosAplicados.busqueda) filtrosTexto.push(`Búsqueda: "${filtrosAplicados.busqueda}"`)
      if (filtrosAplicados.presupuestoMin) filtrosTexto.push(`Presup. min: ${formatCurrency(parseFloat(filtrosAplicados.presupuestoMin))}`)
      if (filtrosAplicados.presupuestoMax) filtrosTexto.push(`Presup. max: ${formatCurrency(parseFloat(filtrosAplicados.presupuestoMax))}`)
      if (filtrosAplicados.avanceMin) filtrosTexto.push(`Avance min: ${filtrosAplicados.avanceMin}%`)
      if (filtrosAplicados.avanceMax) filtrosTexto.push(`Avance max: ${filtrosAplicados.avanceMax}%`)

      if (filtrosTexto.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text('Filtros aplicados: ' + filtrosTexto.join(', '), marginLeft, yPosition)
        yPosition += 6
      }

      // Resumen
      doc.setFontSize(11)
      doc.setTextColor(0)
      doc.text(`Total de avances: ${avances.length}`, marginLeft, yPosition)
      doc.text(`Presupuestado total: ${formatCurrency(totalPresupuestado)}`, marginLeft, yPosition + 6)
      doc.text(`Gastado total: ${formatCurrency(totalGastado)}`, marginLeft, yPosition + 12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Progreso promedio: ${progresoPromedio.toFixed(1)}%`, marginLeft, yPosition + 18)
      doc.setFont('helvetica', 'normal')

      yPosition += 28

      // Tabla de avances
      const tableData = avances.map(avance => [
        avance.descripcion.substring(0, 50) + (avance.descripcion.length > 50 ? '...' : ''),
        avance.proveedor,
        avance.monto_presupuestado ? formatCurrency(avance.monto_presupuestado) : '-',
        formatCurrency(avance.total_gastado),
        `${avance.porcentaje_avance}%`,
        `${avance.gastos_count} gastos`
      ])

      autoTable(doc, {
        head: [['Descripción', 'Proveedor', 'Presupuesto', 'Gastado', 'Progreso', 'Gastos']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [37, 99, 235], // blue-600
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251], // gray-50
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30 },
          2: { cellWidth: 28, halign: 'right' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 24, halign: 'center' },
        },
      })

      // Agregar totales al final
      const finalY = (doc as any).lastAutoTable.finalY + 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTALES:', marginLeft, finalY)
      doc.text(`Presupuestado: ${formatCurrency(totalPresupuestado)}`, marginLeft + 60, finalY)
      doc.text(`Gastado: ${formatCurrency(totalGastado)}`, marginLeft + 120, finalY)

      // Pie de página
      const pageCount = doc.internal.pages.length - 1
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128)
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      // Guardar PDF
      const fileName = `avances_${proyecto.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al generar el PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={exportarPDF}
      disabled={isExporting || avances.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Generando...' : 'Exportar PDF'}
    </Button>
  )
}
