'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useState } from 'react'

interface ExportarGastosPDFProps {
  gastos: any[]
  totalMonto: number
  proyecto: any
  filtrosAplicados: any
}

export default function ExportarGastosPDF({
  gastos,
  totalMonto,
  proyecto,
  filtrosAplicados
}: ExportarGastosPDFProps) {
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

      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Reporte de Gastos', marginLeft, 20)

      // Información del proyecto
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Proyecto: ${proyecto.nombre}`, marginLeft, 30)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`, marginLeft, 36)

      // Filtros aplicados
      let yPosition = 42
      const filtrosTexto: string[] = []

      if (filtrosAplicados.categoria) filtrosTexto.push('Categoría filtrada')
      if (filtrosAplicados.persona) filtrosTexto.push('Persona filtrada')
      if (filtrosAplicados.estado) filtrosTexto.push('Estado filtrado')
      if (filtrosAplicados.proveedor) filtrosTexto.push('Proveedor filtrado')
      if (filtrosAplicados.desde) filtrosTexto.push(`Desde: ${filtrosAplicados.desde}`)
      if (filtrosAplicados.hasta) filtrosTexto.push(`Hasta: ${filtrosAplicados.hasta}`)
      if (filtrosAplicados.busqueda) filtrosTexto.push(`Búsqueda: "${filtrosAplicados.busqueda}"`)
      if (filtrosAplicados.montoMin) filtrosTexto.push(`Monto min: ${formatCurrency(parseFloat(filtrosAplicados.montoMin))}`)
      if (filtrosAplicados.montoMax) filtrosTexto.push(`Monto max: ${formatCurrency(parseFloat(filtrosAplicados.montoMax))}`)

      if (filtrosTexto.length > 0) {
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text('Filtros aplicados: ' + filtrosTexto.join(', '), marginLeft, yPosition)
        yPosition += 6
      }

      // Resumen
      doc.setFontSize(11)
      doc.setTextColor(0)
      doc.text(`Total de gastos: ${gastos.length}`, marginLeft, yPosition)
      doc.setFont('helvetica', 'bold')
      doc.text(`Monto total: ${formatCurrency(totalMonto)}`, marginLeft, yPosition + 6)
      doc.setFont('helvetica', 'normal')

      yPosition += 16

      // Tabla de gastos
      const tableData = gastos.map(gasto => [
        formatDate(gasto.fecha),
        gasto.descripcion.substring(0, 40) + (gasto.descripcion.length > 40 ? '...' : ''),
        gasto.categorias_gasto.nombre,
        gasto.proveedores?.nombre || '-',
        gasto.personas?.nombre || '-',
        formatCurrency(gasto.monto),
        gasto.estados_pago.nombre
      ])

      autoTable(doc, {
        head: [['Fecha', 'Descripción', 'Categoría', 'Proveedor', 'Pagado por', 'Monto', 'Estado']],
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
          0: { cellWidth: 22 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 20 },
        },
      })

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
      const fileName = `gastos_${proyecto.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
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
      disabled={isExporting || gastos.length === 0}
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? 'Generando...' : 'Exportar PDF'}
    </Button>
  )
}
