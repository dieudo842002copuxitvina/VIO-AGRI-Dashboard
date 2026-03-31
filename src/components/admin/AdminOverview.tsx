'use client'

import React from 'react'
import {
  revenueMetrics,
  revenueSeries,
  riskAlerts,
  RiskAlert,
  AlertSeverity,
} from './types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const severityColorMap: Record<AlertSeverity, string> = {
  critical: 'bg-red-500',
  high: 'bg-red-400',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400',
}

const RiskAlertCard = ({ alert }: { alert: RiskAlert }) => (
  <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-md text-gray-800">{alert.title}</h3>
      <span
        className={`px-2 py-1 text-xs font-bold text-white rounded-full ${
          severityColorMap[alert.severity]
        }`}
      >
        {alert.severity.toUpperCase()}
      </span>
    </div>
    <p className="text-sm text-gray-600 mt-2">{alert.description}</p>
    <div className="mt-3 text-xs text-gray-500">
      <span>
        Entity: {alert.entityLabel} ({alert.entityId})
      </span>
      <span className="mx-2">|</span>
      <span>Signal: {alert.signal}</span>
    </div>
  </div>
)

export function AdminOverview() {
  return (
    <div className="space-y-8">
      {/* Revenue Dashboard */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Revenue Dashboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {revenueMetrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-white p-6 rounded-lg shadow"
            >
              <p className="text-sm text-gray-500">{metric.label}</p>
              <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
              <p
                className={`text-sm ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {metric.helperText}
              </p>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold mb-4">Weekly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis
                tickFormatter={(value) =>
                  `$${(value / 1000).toLocaleString()}k`
                }
              />
              <Tooltip
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return [
                      value.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }),
                      'Revenue',
                    ]
                  }
                  return [value, 'Revenue']
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Risk & Fraud Panel */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Risk & Fraud Panel
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {riskAlerts.length > 0 ? (
            riskAlerts
              .sort((a, b) => {
                const severityOrder: Record<AlertSeverity, number> = {
                  critical: 0,
                  high: 1,
                  medium: 2,
                  low: 3,
                }
                return severityOrder[a.severity] - severityOrder[b.severity]
              })
              .map((alert) => <RiskAlertCard key={alert.id} alert={alert} />)
          ) : (
            <div className="col-span-full bg-white p-6 rounded-lg shadow text-center text-gray-500">
              <p>✅ No active risk alerts. System is stable.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}