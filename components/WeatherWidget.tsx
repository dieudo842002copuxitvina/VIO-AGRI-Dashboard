'use client'

import { useEffect, useState } from 'react'
import { CloudRain, Droplets, ThermometerSun, Wind } from 'lucide-react'

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWeather() {
      try {
        // Tọa độ mẫu: Khu vực Đồng Nai (Đông Nam Bộ)
        const lat = 10.9485
        const lon = 107.0329
        
        // Gọi API Open-Meteo (Miễn phí, không cần API Key)
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=Asia%2FBangkok`)
        const data = await res.json()
        
        setWeather(data.current)
      } catch (error) {
        console.error("Lỗi tải dữ liệu thời tiết:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
    // Tự động làm mới dữ liệu mỗi 15 phút
    const interval = setInterval(fetchWeather, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="bg-white p-6 rounded-2xl border shadow-sm animate-pulse h-40">Đang đồng bộ vệ tinh khí tượng...</div>
  if (!weather) return null

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Giám sát Khí hậu vùng trồng</h3>
        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Trực tiếp
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-blue-50">
          <ThermometerSun className="w-6 h-6 text-orange-500" />
          <div>
            <p className="text-xs text-gray-500">Nhiệt độ</p>
            <p className="text-lg font-bold text-gray-800">{weather.temperature_2m}°C</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-blue-50">
          <Droplets className="w-6 h-6 text-blue-500" />
          <div>
            <p className="text-xs text-gray-500">Độ ẩm đất/không khí</p>
            <p className="text-lg font-bold text-gray-800">{weather.relative_humidity_2m}%</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-blue-50">
          <CloudRain className="w-6 h-6 text-cyan-600" />
          <div>
            <p className="text-xs text-gray-500">Lượng mưa</p>
            <p className="text-lg font-bold text-gray-800">{weather.precipitation} mm</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white p-3 rounded-xl shadow-sm border border-blue-50">
          <Wind className="w-6 h-6 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Sức gió</p>
            <p className="text-lg font-bold text-gray-800">{weather.wind_speed_10m} km/h</p>
          </div>
        </div>
      </div>
    </div>
  )
}