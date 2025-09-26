'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PieChart as PieChartIcon } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface CategoriaData {
  nombre: string
  total: number
  count: number
  color: string
}

interface Props {
  data: CategoriaData[]
}

const COLORS = [
  '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#3B82F6',
  '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6'
]

export default function GastosPorCategoriaChart({ data }: Props) {
  const [viewType, setViewType] = useState<'pie' | 'list'>('list')

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay datos de categorías para mostrar
      </div>
    )
  }

  // Preparar datos para gráficos
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
    percentage: (item.total / data.reduce((sum, cat) => sum + cat.total, 0)) * 100
  })).sort((a, b) => b.total - a.total)

  const total = chartData.reduce((sum, item) => sum + item.total, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.nombre}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(data.total)} ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-xs text-gray-500">{data.count} gastos</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex gap-2 justify-center">
        <Button
          size="sm"
          variant={viewType === 'list' ? 'default' : 'outline'}
          onClick={() => setViewType('list')}
          className="text-xs"
        >
          Lista
        </Button>
        <Button
          size="sm"
          variant={viewType === 'pie' ? 'default' : 'outline'}
          onClick={() => setViewType('pie')}
          className="text-xs"
        >
          <PieChartIcon className="h-3 w-3 mr-1" />
          Circular
        </Button>
      </div>

      {/* Vista de Lista (Mobile-First) */}
      {viewType === 'list' && (
        <div className="space-y-3">
          {chartData.map((categoria, index) => (
            <div key={categoria.nombre} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: categoria.color }}
                  />
                  <span className="font-medium text-sm truncate">{categoria.nombre}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {categoria.count}
                  </Badge>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">{formatCurrency(categoria.total)}</p>
                  <p className="text-xs text-gray-500">{categoria.percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${categoria.percentage}%`,
                    backgroundColor: categoria.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Circular */}
      {viewType === 'pie' && (
        <div className="space-y-4">
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="total"
                  label={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Leyenda personalizada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {chartData.map((categoria) => (
              <div key={categoria.nombre} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: categoria.color }}
                />
                <span className="text-sm truncate flex-1">{categoria.nombre}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {categoria.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Resumen */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm font-medium">Total: {formatCurrency(total)}</p>
        <p className="text-xs text-gray-500">{chartData.length} categorías</p>
      </div>
    </div>
  )
}