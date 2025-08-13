"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts"
import { useState } from "react"

interface DataChartProps {
  data: any[]
  loading: boolean
}

export default function DataChart({ data, loading }: DataChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])

  if (loading || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Data Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">{loading ? "Loading chart..." : "No data to visualize"}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get numeric fields from the data
  const numericFields = Array.from(
    new Set(
      data.flatMap((item) => {
        const dataObj = item.data || item
        return Object.keys(dataObj).filter((key) => {
          const value = dataObj[key]
          return typeof value === "number" && key !== "time"
        })
      }),
    ),
  )

  // Auto-select first few numeric fields if none selected
  if (selectedMetrics.length === 0 && numericFields.length > 0) {
    setSelectedMetrics(numericFields.slice(0, 3))
  }

  // Prepare chart data
  const chartData = data.map((item) => {
    const dataObj = item.data || item
    return {
      time: new Date(item.time).toLocaleTimeString(),
      ...dataObj,
    }
  })

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-lg font-semibold">Data Visualization</CardTitle>
          <div className="flex gap-2">
            <Select value={chartType} onValueChange={(value: "line" | "bar") => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {numericFields.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">No numeric fields found in the data</div>
        ) : (
          <>
            {/* Metric Selection */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Select metrics to display:</div>
              <div className="flex flex-wrap gap-2">
                {numericFields.map((field) => (
                  <button
                    key={field}
                    onClick={() => {
                      setSelectedMetrics((prev) =>
                        prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
                      )
                    }}
                    className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                      selectedMetrics.includes(field)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {field}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMetrics.map((metric, index) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMetrics.map((metric, index) => (
                    <Bar key={metric} dataKey={metric} fill={colors[index % colors.length]} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
