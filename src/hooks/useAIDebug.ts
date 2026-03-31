'use client'

import { useState } from 'react'

// This is a mock implementation for the AI Debug Panel.
// In a real application, you would fetch user data and make API calls.

const mockUsers = [
  { id: 'user-1', name: 'Marco' },
  { id: 'user-2', name: 'Beatrice' },
  { id: 'user-3', name: 'Catharina' },
]

const mockMarketData = {
  'user-1': { commodity: 'Soybean', price: 450, trend: 'up' },
  'user-2': { commodity: 'Corn', price: 380, trend: 'down' },
  'user-3': { commodity: 'Wheat', price: 620, trend: 'stable' },
}

const mockAIResponse = {
  decision: {
    action: 'HOLD',
    confidence: 0.85,
    insights: [
      { type: 'market_trend', text: 'Soybean prices are trending upwards.' },
      { type: 'risk_appetite', text: 'User has a low risk tolerance.' },
    ],
  },
  recommendation: {
    recommendations: [
      { id: 'rec-1', type: 'cross-sell', text: 'Consider diversifying with Corn futures.' },
      { id: 'rec-2', type: 'hedge', text: 'Hedge 20% of Soybean holdings.' },
    ],
  },
  trace: {
    request_id: 'trace-abc-123',
    stages: ['data_ingestion', 'risk_analysis', 'recommendation_generation'],
  }
}

interface AIError {
    status?: number;
    message: string;
}

export function useAIDebug() {
  const [users] = useState(mockUsers)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [marketData, setMarketData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AIError | null>(null)
  const [lastResponse, setLastResponse] = useState<any>(null)
  const [showTrace, setShowTrace] = useState(false)

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId)
    setMarketData(mockMarketData[userId as keyof typeof mockMarketData] || null)
    setLastResponse(null)
    setError(null)
  }

  const runAIAnalysis = async (userId: string) => {
    setIsLoading(true)
    setError(null)
    setLastResponse(null)

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    if (Math.random() > 0.9) { // Simulate a random API error
      setError({ status: 500, message: 'Failed to connect to the AI engine. Please try again.' });
    } else {
      setLastResponse(mockAIResponse);
    }

    setIsLoading(false)
  }

  const simulateMarketShock = () => {
    if (!selectedUserId) return
    const currentUserMarketData = mockMarketData[selectedUserId as keyof typeof mockMarketData];
    const shockedPrice = currentUserMarketData.price * (Math.random() > 0.5 ? 1.2 : 0.8); // +20% or -20%
    setMarketData({ ...currentUserMarketData, price: shockedPrice.toFixed(2), trend: 'volatile' });
    alert('Market shock simulated! New price: ' + shockedPrice.toFixed(2));
  }


  const toggleTrace = () => {
    setShowTrace(prev => !prev)
  }

  return {
    users,
    marketData,
    selectedUserId,
    isLoading,
    error,
    lastResponse,
    showTrace,
    handleUserChange,
    runAIAnalysis,
    toggleTrace,
    simulateMarketShock,
  }
}
