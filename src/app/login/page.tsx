'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const valueProps = [
  'Kết nối trực tiếp vựa và nhà xuất khẩu',
  'Thương lượng giá theo thời gian thực',
  'Bảo mật và minh bạch 100%',
]

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const buttonLabel = useMemo(
    () => (isLogin ? 'Đăng nhập hệ thống' : 'Tạo tài khoản miễn phí'),
    [isLogin]
  )

  const heading = isLogin ? 'Chào mừng quay lại' : 'Tạo tài khoản mới'
  const subheading = isLogin
    ? 'Đăng nhập để truy cập sàn giao thương, dashboard đối tác và phòng thương lượng.'
    : 'Khởi tạo tài khoản để kết nối đối tác, đăng tin mua bán và chốt deal nhanh hơn.'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isLoading) {
      return
    }

    setError('')
    setNotice('')
    setIsLoading(true)

    try {
      const normalizedEmail = email.trim()
      const normalizedPassword = password.trim()

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: normalizedPassword,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: normalizedPassword,
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }
      }

      router.push('/profile')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Đã xảy ra lỗi không mong muốn.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-stone-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <section className="relative hidden overflow-hidden bg-emerald-900 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(167,243,208,0.16),_transparent_30%)]" />
          <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
          <div className="relative flex w-full flex-col justify-between px-10 py-12 xl:px-14 xl:py-14">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-50 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                VIO AGRI Trusted Network
              </div>

              <div className="max-w-xl space-y-5">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                  Agricultural Trade Intelligence
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-white xl:text-5xl xl:leading-tight">
                  VIO AGRI - Nền tảng Giao thương Nông sản B2B
                </h1>
                <p className="max-w-lg text-base leading-8 text-emerald-50/78">
                  Một không gian giao thương hiện đại cho nông sản Việt Nam, nơi dữ liệu thị trường,
                  niềm tin đối tác và tốc độ chốt deal cùng hội tụ trong một trải nghiệm gọn gàng.
                </p>
              </div>

              <div className="space-y-4">
                {valueProps.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                    <p className="text-sm leading-7 text-emerald-50/90">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
                Deal Room Ready
              </p>
              <p className="mt-3 text-lg font-medium leading-8 text-white">
                Đăng nhập một lần để theo dõi niêm yết, nhận cảnh báo AI và thương lượng với đối tác
                trong cùng một hành trình liền mạch.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-xl">
            <div className="rounded-[32px] border border-stone-200 bg-white shadow-[0_26px_80px_-46px_rgba(15,23,42,0.42)]">
              <div className="border-b border-stone-200 px-6 pt-6 sm:px-8 sm:pt-8">
                <div className="inline-flex rounded-2xl border border-stone-200 bg-stone-100 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true)
                      setNotice('')
                      setError('')
                    }}
                    className={`rounded-[14px] px-5 py-2.5 text-sm font-semibold transition ${
                      isLogin
                        ? 'bg-white text-stone-950 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false)
                      setNotice('')
                      setError('')
                    }}
                    className={`rounded-[14px] px-5 py-2.5 text-sm font-semibold transition ${
                      !isLogin
                        ? 'bg-white text-stone-950 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>

                <div className="pb-6 pt-6 sm:pb-8">
                  <h2 className="text-3xl font-semibold tracking-tight text-stone-950">{heading}</h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-stone-600 sm:text-base">
                    {subheading}
                  </p>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-stone-700">
                      Email công việc
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tencongty@vioagri.vn"
                      disabled={isLoading}
                      required
                      className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/12 disabled:cursor-not-allowed disabled:bg-stone-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold text-stone-700">
                      Mật khẩu
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Nhập mật khẩu của bạn"
                      disabled={isLoading}
                      required
                      className="h-14 w-full rounded-2xl border border-stone-200 bg-white px-4 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/12 disabled:cursor-not-allowed disabled:bg-stone-50"
                    />
                  </div>

                  <div className="flex min-h-6 items-center justify-between gap-3 text-sm">
                    <span className="text-stone-500">
                      {isLogin
                        ? 'Đăng nhập nhanh để tiếp tục giao thương.'
                        : 'Miễn phí tạo tài khoản, sẵn sàng kết nối đối tác.'}
                    </span>
                    {isLogin ? (
                      <Link href="#" className="font-semibold text-emerald-700 transition hover:text-emerald-600">
                        Quên mật khẩu?
                      </Link>
                    ) : null}
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(5,150,105,0.88)] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowRight className="h-5 w-5" />
                    )}
                    {isLoading ? 'Đang xử lý...' : buttonLabel}
                  </button>
                </form>

                <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <p className="text-sm leading-7 text-stone-600">
                    {notice || 'Đăng nhập hoặc tạo tài khoản để truy cập không gian giao thương riêng của VIO AGRI.'}
                  </p>
                </div>

                <p className="mt-5 text-sm leading-7 text-stone-500">
                  Bằng việc tiếp tục, bạn đồng ý vận hành giao dịch trên một môi trường minh bạch,
                  có đối soát và tối ưu cho thương mại nông sản B2B.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
