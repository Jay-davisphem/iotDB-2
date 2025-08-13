"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Database } from "lucide-react"

interface DataTableProps {
  data: any[]
  loading: boolean
  totalCount?: number
}

export default function DataTable({ data, loading, totalCount }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Query Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-gray-500">Loading data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Query Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No data found</p>
            <p>Try adjusting your query parameters or check if the device has sent data recently.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get all unique keys from the data
  const allKeys = Array.from(new Set(data.flatMap((item) => Object.keys(item))))
  const dataKeys = allKeys.filter((key) => key !== "time" && key !== "count")

  // Pagination
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—"
    if (typeof value === "number") {
      return Number.isInteger(value) ? value.toString() : value.toFixed(2)
    }
    if (typeof value === "boolean") return value ? "true" : "false"
    if (typeof value === "object") return JSON.stringify(value)
    return value.toString()
  }

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Query Results</CardTitle>
          <Badge variant="secondary">
            {data.length} {data.length === 1 ? "record" : "records"}
            {totalCount && totalCount !== data.length && ` of ${totalCount.toLocaleString()}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Timestamp</TableHead>
                {dataKeys.map((key) => (
                  <TableHead key={key} className="min-w-32">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-sm">{formatTimestamp(item.time)}</TableCell>
                  {dataKeys.map((key) => (
                    <TableCell key={key} className="font-mono text-sm">
                      {formatValue(item[key] || item.data?.[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
