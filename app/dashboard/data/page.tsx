"use client"

import { useState, useEffect } from "react"
import QueryBuilder, { type QueryParams } from "@/components/data-explorer/query-builder"
import DataTable from "@/components/data-explorer/data-table"
import DataChart from "@/components/data-explorer/data-chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Device } from "@/lib/types"

export default function DataExplorerPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [queryData, setQueryData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState<number>()

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      if (response.ok) {
        const result = await response.json()
        setDevices(result.devices || [])
      }
    } catch (error) {
      console.error("Error fetching devices:", error)
    }
  }

  const handleQuery = async (params: QueryParams) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams({
        device_id: params.deviceId,
        limit: params.limit.toString(),
      })

      if (params.startTime) {
        searchParams.append("start_time", params.startTime)
      }

      if (params.endTime) {
        searchParams.append("end_time", params.endTime)
      }

      if (params.aggregation) {
        searchParams.append("aggregation", params.aggregation)
      }

      if (params.interval) {
        searchParams.append("interval", params.interval)
      }

      const response = await fetch(`/api/data/query?${searchParams}`)
      if (response.ok) {
        const result = await response.json()
        setQueryData(result.data || [])
        setTotalCount(result.count)
      } else {
        console.error("Query failed")
        setQueryData([])
      }
    } catch (error) {
      console.error("Error executing query:", error)
      setQueryData([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Explorer</h1>
        <p className="text-gray-600">Query and analyze your IoT data with flexible filters and visualizations</p>
      </div>

      <QueryBuilder devices={devices} onQuery={handleQuery} loading={loading} />

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <DataTable data={queryData} loading={loading} totalCount={totalCount} />
        </TabsContent>

        <TabsContent value="chart">
          <DataChart data={queryData} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
