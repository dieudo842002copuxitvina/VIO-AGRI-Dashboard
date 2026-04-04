'use client'

import Link from 'next/link'
import {
  MessageSquare,
  Lock,
  BarChart3,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="w-full bg-gradient-to-b from-white via-emerald-50/30 to-white">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Hero Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Nền tảng giao thương nông sản B2B đáng tin cậy</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-950">
              Kết Nối Giao Thương Nông Sản
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                B2B Toàn Cầu
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mx-auto max-w-2xl text-xl leading-8 text-slate-600">
              Nền tảng giao thương nông sản an toàn, minh bạch với thanh toán ký quỹ tự động, quản lý tập trung và kết nối với các đối tác đã xác minh.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                href="/b2b"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
              >
                Vào Sàn Giao Dịch
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-lg font-semibold text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 transition"
              >
                Đăng Ký Ngay
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="pt-8 flex items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span>Thanh toán an toàn</span>
              </div>
              <div className="hidden sm:flex h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-emerald-600" />
                <span>Đối tác xác minh</span>
              </div>
              <div className="hidden sm:flex h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                <span>Kết nối toàn cầu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-emerald-200 to-transparent opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-teal-200 to-transparent opacity-30 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="relative w-full px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-4">
              Tính Năng Chính
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-950">
              Mọi thứ bạn cần để giao dịch thành công
            </h2>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Real-time Chat */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-bold text-slate-950 mb-3">
                  Thương Lượng Trực Tiếp
                </h3>

                <p className="text-slate-600 leading-7 mb-6">
                  Chat, đàm phán điều khoản, và kết nối ngay lập tức với các đối tác B2B trong thời gian thực.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Tin nhắn tức thời</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Địa chỉ liên hệ xác minh</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Lịch sử giao dịch</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2: Escrow Payments */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-teal-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-100 text-teal-600 mb-6 group-hover:scale-110 transition-transform">
                  <Lock className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-bold text-slate-950 mb-3">
                  Thanh Toán Ký Quỹ
                </h3>

                <p className="text-slate-600 leading-7 mb-6">
                  Tiền được giữ an toàn cho đến khi cả hai bên xác nhận giao dịch. Không rủi ro, không gặp rắc rối.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Ký quỹ tự động</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Thanh toán an toàn</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Hỗ trợ tranh chấp</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3: Dashboard Management */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-bold text-slate-950 mb-3">
                  Quản Lý Tập Trung
                </h3>

                <p className="text-slate-600 leading-7 mb-6">
                  Dashboard thông minh giúp bạn quản lý toàn bộ giao dịch, tin đăng và phân tích thị trường từ một nơi.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Quản lý tin đăng</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Theo dõi giao dịch</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Phân tích dữ liệu</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative w-full px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 text-white text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <p className="text-emerald-100">Đối tác B2B</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">$50M+</div>
              <p className="text-emerald-100">Giao dịch được xử lý</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">15</div>
              <p className="text-emerald-100">Nước hoạt động</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <p className="text-emerald-100">Độ tin cậy hệ thống</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative w-full px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-12 text-center shadow-lg">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Tham gia hà ng ngàn doanh nghiệp nông sản đang giao dịch trên VIO AGRI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/b2b"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white hover:bg-emerald-500 transition"
              >
                Khám Phá Sàn Giao Dịch
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-8 py-4 text-lg font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Liên Hệ Hỗ Trợ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-2xl font-bold text-emerald-600 mb-4">VIO AGRI</div>
              <p className="text-slate-600 text-sm">Nền tảng giao thương nông sản B2B an toàn và minh bạch.</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-4">Sàn Giao Dịch</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="/b2b" className="hover:text-emerald-600 transition">Tin đăng bán</Link></li>
                <li><Link href="/b2b" className="hover:text-emerald-600 transition">Tin đăng mua</Link></li>
                <li><Link href="/b2b" className="hover:text-emerald-600 transition">Cơ hội giao dịch</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-4">Công Ty</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-emerald-600 transition">Về chúng tôi</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition">Điều khoản sử dụng</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-950 mb-4">Hỗ Trợ</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="#" className="hover:text-emerald-600 transition">Trung tâm trợ giúp</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition">Tài liệu API</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition">Bảo mật</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>&copy; 2026 VIO AGRI. Tất cả quyền được bảo lưu.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-emerald-600 transition">Facebook</Link>
              <Link href="#" className="hover:text-emerald-600 transition">LinkedIn</Link>
              <Link href="#" className="hover:text-emerald-600 transition">Twitter</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
