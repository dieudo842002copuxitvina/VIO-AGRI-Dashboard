'use client'

import React, { useState, useMemo } from 'react'
import { adminListings, ListingRecord, ListingStatus } from './types'

export function ListingsTable() {
  const [listings, setListings] = useState<ListingRecord[]>(adminListings)
  const [filter, setFilter] = useState<string>('')

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === id ? { ...listing, status: newStatus } : listing
      )
    )
  }

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) =>
        listing.commodity.toLowerCase().includes(filter.toLowerCase())
      ),
    [listings, filter]
  )

  const statusColor = (status: ListingStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by commodity..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded w-full md:w-1/3"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commodity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price vs Market
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Anomaly Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredListings.map((listing) => (
              <tr
                key={listing.id}
                className={listing.suspicious ? 'bg-red-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">{listing.commodity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${listing.price} / ${listing.marketPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(
                      listing.status
                    )}`}
                  >
                    {listing.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={listing.anomalyScore > 70 ? 'text-red-600 font-bold' : ''}>
                    {listing.anomalyScore}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleStatusChange(listing.id, 'approved')}
                    className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:text-gray-300"
                    disabled={listing.status === 'approved'}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(listing.id, 'rejected')}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-300"
                    disabled={listing.status === 'rejected'}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}