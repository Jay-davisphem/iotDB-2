"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Archive, Download, Trash2, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Device } from "@/lib/types"

interface ArchiveEntry {
  id: string
  device_id: string
  archive_date: string
  file_path: string
  file_size: number
  record_count: number
  compression_type: string
  created_at: string
  devices?: Device
}

interface ArchiveManagerProps {
  devices: Device[]
}

export default function ArchiveManager({ devices }: ArchiveManagerProps) {
  const [archives, setArchives] = useState<ArchiveEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [archiveDate, setArchiveDate] = useState<Date>()

  useEffect(() => {
    fetchArchives()
  }, [])

  const fetchArchives = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/archives")
      if (response.ok) {
        const result = await response.json()
        setArchives(result.archives || [])
      }
    } catch (error) {
      console.error("Error fetching archives:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!selectedDevice || !archiveDate) return

    setArchiving(true)
    try {
      const response = await fetch("/api/archives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: selectedDevice,
          archive_date: archiveDate.toISOString().split("T")[0],
        }),
      })

      if (response.ok) {
        fetchArchives()
        setSelectedDevice("")
        setArchiveDate(undefined)
      } else {
        const result = await response.json()
        alert(result.error || "Failed to create archive")
      }
    } catch (error) {
      console.error("Error creating archive:", error)
      alert("Failed to create archive")
    } finally {
      setArchiving(false)
    }
  }

  const handleDownload = async (archiveId: string) => {
    try {
      const response = await fetch(`/api/archives/${archiveId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `archive-${archiveId}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert("Failed to download archive")
      }
    } catch (error) {
      console.error("Error downloading archive:", error)
      alert("Failed to download archive")
    }
  }

  const handleDelete = async (archiveId: string) => {
    if (!confirm("Are you sure you want to delete this archive? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/archives/${archiveId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchArchives()
      } else {
        alert("Failed to delete archive")
      }
    } catch (error) {
      console.error("Error deleting archive:", error)
      alert("Failed to delete archive")
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Archive Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Create Archive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Device</label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.device_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Archive Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !archiveDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {archiveDate ? format(archiveDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={archiveDate} onSelect={setArchiveDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleArchive}
                disabled={!selectedDevice || !archiveDate || archiving}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {archiving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />}
                Create Archive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archives List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Data Archives</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchArchives} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Archive Date</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Compression</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-pulse text-gray-500">Loading archives...</div>
                    </TableCell>
                  </TableRow>
                ) : archives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No archives found
                    </TableCell>
                  </TableRow>
                ) : (
                  archives.map((archive) => (
                    <TableRow key={archive.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{archive.devices?.name || "Unknown Device"}</div>
                          <div className="text-sm text-gray-500">{archive.devices?.device_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(archive.archive_date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{archive.record_count.toLocaleString()}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{formatFileSize(archive.file_size)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{archive.compression_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(archive.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(archive.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(archive.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
