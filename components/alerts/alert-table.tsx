"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Search, Plus, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react"
import type { Alert, Device } from "@/lib/types"
import AlertModal from "./alert-modal"

interface AlertTableProps {
  alerts: (Alert & { devices?: Device })[]
  devices: Device[]
  onRefresh: () => void
}

export default function AlertTable({ alerts, devices, onRefresh }: AlertTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">("create")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.devices?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200",
    }
    return variants[severity as keyof typeof variants] || variants.low
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "bg-red-100 text-red-800 border-red-200",
      acknowledged: "bg-yellow-100 text-yellow-800 border-yellow-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
    }
    return variants[status as keyof typeof variants] || variants.open
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-3 w-3 mr-1" />
      case "acknowledged":
        return <Clock className="h-3 w-3 mr-1" />
      default:
        return <AlertTriangle className="h-3 w-3 mr-1" />
    }
  }

  const handleCreate = () => {
    setSelectedAlert(null)
    setModalMode("create")
    setIsModalOpen(true)
  }

  const handleView = (alert: Alert) => {
    setSelectedAlert(alert)
    setModalMode("view")
    setIsModalOpen(true)
  }

  const handleEdit = (alert: Alert) => {
    setSelectedAlert(alert)
    setModalMode("edit")
    setIsModalOpen(true)
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: "POST",
      })

      if (response.ok) {
        onRefresh()
      } else {
        alert("Failed to acknowledge alert")
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error)
      alert("Failed to acknowledge alert")
    }
  }

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "POST",
      })

      if (response.ok) {
        onRefresh()
      } else {
        alert("Failed to resolve alert")
      }
    } catch (error) {
      console.error("Error resolving alert:", error)
      alert("Failed to resolve alert")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedAlert(null)
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-semibold">Alert Management</CardTitle>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Alert Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alert Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{alert.title}</div>
                          {alert.description && (
                            <div className="text-sm text-gray-500 line-clamp-2">{alert.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {alert.devices?.name || "System Alert"}
                          {alert.devices?.location && (
                            <div className="text-xs text-gray-500">{alert.devices.location}</div>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityBadge(alert.severity)}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(alert.status)}>
                          {getStatusIcon(alert.status)}
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{new Date(alert.triggered_at).toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(alert)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {alert.status === "open" && (
                              <DropdownMenuItem onClick={() => handleAcknowledge(alert.id)}>
                                <Clock className="h-4 w-4 mr-2" />
                                Acknowledge
                              </DropdownMenuItem>
                            )}
                            {alert.status !== "resolved" && (
                              <DropdownMenuItem onClick={() => handleResolve(alert.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Alert Modal */}
      <AlertModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        alert={selectedAlert}
        devices={devices}
        mode={modalMode}
      />
    </div>
  )
}
