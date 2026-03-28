'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Mail, Lock, Leaf, AlertCircle, Loader } from 'lucide-react'

type AuthMode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      setEmail('')
      setPassword('')
      setErrorMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.')
      setMode('login')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi đăng ký')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      setEmail('')
      setPassword('')
      router.push('/')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Email hoặc mật khẩu không chính xác')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = mode === 'login' ? handleLogin : handleSignUp

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-green-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
              <Leaf className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">VIO AGRI</h1>
            <p className="text-gray-500 text-sm mt-1">Nền tảng quản lý nông sản</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMessage('')
              }}
              className={`flex-1 py-2 rounded font-medium transition-all ${
                mode === 'login'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setErrorMessage('')
              }}
              className={`flex-1 py-2 rounded font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className={`mb-6 flex items-start gap-3 p-4 rounded-lg border ${
                errorMessage.includes('thành công')
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  errorMessage.includes('thành công')
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              />
              <p
                className={`text-sm ${
                  errorMessage.includes('thành công')
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}
              >
                {errorMessage}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader className="w-5 h-5 animate-spin" />}
              {isLoading
                ? 'Đang xử lý...'
                : mode === 'login'
                  ? 'Đăng nhập'
                  : 'Đăng ký'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6">
            {mode === 'login'
              ? 'Chưa có tài khoản? '
              : 'Đã có tài khoản? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setErrorMessage('')
              }}
              className="text-green-600 font-semibold hover:text-green-700 transition-colors"
            >
              {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
