'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Role } from '@/types/auth'
import { Mail, Lock, Leaf, AlertCircle, Loader, MapPin } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('farmer')
  const [region, setRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Profile row is created lazily after the user signs in.
        // Admin roles should still be assigned by an administrator.
        router.push('/login')
        setErrorMessage('ÄÄƒng kÃ½ thÃ nh cÃ´ng! Vui lÃ²ng kiá»ƒm tra email Ä‘á»ƒ xÃ¡c thá»±c.')
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lá»—i Ä‘Äƒng kÃ½')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
              <Leaf className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">VIO AGRI</h1>
            <p className="text-gray-500 text-sm mt-1">Táº¡o tÃ i khoáº£n má»›i</p>
          </div>

          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg border bg-red-50 border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Máº­t kháº©u</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vai trÃ²</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isLoading}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="farmer">NÃ´ng dÃ¢n (Farmer)</option>
                <option value="trader">ThÆ°Æ¡ng lÃ¡i (Trader)</option>
                <option value="exporter">Xuáº¥t kháº©u (Exporter)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khu vá»±c</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Tá»‰nh/ThÃ nh phá»‘"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader className="w-5 h-5 animate-spin" />}
              {isLoading ? 'Äang Ä‘Äƒng kÃ½...' : 'ÄÄƒng kÃ½ tÃ i khoáº£n'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            ÄÃ£ cÃ³ tÃ i khoáº£n?{' '}
            <a href="/login" className="text-green-600 font-semibold hover:text-green-700">ÄÄƒng nháº­p</a>
          </p>
        </div>
      </div>
    </div>
  )
}


