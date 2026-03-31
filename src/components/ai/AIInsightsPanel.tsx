'use client'

import { useState } from 'react'
import { PanelLeft, Maximize2, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import InsightFeed from '@/components/InsightFeed'
import { useDecision } from '@/hooks/useDecision'

export default function AIInsightsPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const { insights, loading } = useDecision()

  return (
    <div className="flex flex-col h-full bg-slate-950/50 backdrop-blur-md border-l border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
          <div>
            <h3 className="font-bold text-slate-200 text-lg">AI Intelligence</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Live Signals</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-0" 
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeft className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-hidden transition-all ${collapsed ? 'hidden' : 'block'}`}>
        <Card className="border-0 bg-transparent h-full">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-4 pb-0">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Priority</div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className="w-12 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto mb-1"></div>
                  <div className="text-xs font-mono text-slate-400">High</div>
                </div>
                <div className="text-center">
                  <div className="w-8 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mx-auto mb-1"></div>
                  <div className="text-xs font-mono text-slate-400">Medium</div>
                </div>
                <div className="text-center">
                  <div className="w-4 h-3 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full mx-auto mb-1"></div>
                  <div className="text-xs font-mono text-slate-400">Low</div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <InsightFeed insights={insights} loading={loading} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
