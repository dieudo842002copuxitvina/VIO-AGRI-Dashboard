'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  CloudSun,
  Cpu,
  Leaf,
  Package,
  Radar,
  ShieldCheck,
  Sprout,
  Waves,
  type LucideIcon,
} from 'lucide-react'

type ProductCategory = 'supplies' | 'iot' | 'solution'
type CategoryFilter = 'all' | ProductCategory

type Product = {
  id: string
  name: string
  category: ProductCategory
  supplier: string
  price: string
  isIoT: boolean
  icon: LucideIcon
  summary: string
}

const categoryTabs: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'supplies', label: 'Vật tư nông nghiệp' },
  { id: 'iot', label: 'Thiết bị IoT & Drone' },
  { id: 'solution', label: 'Gói giải pháp' },
]

const categoryMeta: Record<
  ProductCategory,
  {
    label: string
    badgeClassName: string
    iconClassName: string
  }
> = {
  supplies: {
    label: 'Vật tư',
    badgeClassName: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    iconClassName: 'bg-emerald-100 text-emerald-700',
  },
  iot: {
    label: 'IoT & Drone',
    badgeClassName: 'bg-blue-100 text-blue-800 border border-blue-200',
    iconClassName: 'bg-blue-100 text-blue-700',
  },
  solution: {
    label: 'Giải pháp',
    badgeClassName: 'bg-amber-100 text-amber-800 border border-amber-200',
    iconClassName: 'bg-amber-100 text-amber-700',
  },
}

const products: Product[] = [
  {
    id: 'organic-fertilizer-pro',
    name: 'Phân bón hữu cơ sinh học BioGrow Pro',
    category: 'supplies',
    supplier: 'VIO Inputs',
    price: 'Từ 2.500.000 đ',
    isIoT: false,
    icon: Sprout,
    summary: 'Cải tạo đất, tăng sức đề kháng cây trồng và tối ưu năng suất ở quy mô trang trại.',
  },
  {
    id: 'eco-pesticide-max',
    name: 'Thuốc bảo vệ thực vật sinh học EcoShield',
    category: 'supplies',
    supplier: 'GreenCrop Supply',
    price: 'Liên hệ báo giá',
    isIoT: false,
    icon: Leaf,
    summary: 'Giải pháp kiểm soát sâu bệnh thân thiện môi trường cho vùng nguyên liệu xuất khẩu.',
  },
  {
    id: 'irrigation-nutrient-kit',
    name: 'Bộ châm phân và tưới tự động SmartMix',
    category: 'solution',
    supplier: 'VIO Tech',
    price: 'Từ 18.900.000 đ',
    isIoT: true,
    icon: Waves,
    summary: 'Kết hợp tưới nhỏ giọt và kiểm soát dinh dưỡng theo chu kỳ vận hành tự động.',
  },
  {
    id: 'weather-station-mini',
    name: 'Trạm quan trắc thời tiết mini',
    category: 'iot',
    supplier: 'VIO Tech',
    price: 'Từ 9.800.000 đ',
    isIoT: true,
    icon: CloudSun,
    summary: 'Theo dõi nhiệt độ, độ ẩm, lượng mưa và dữ liệu vi khí hậu theo thời gian thực.',
  },
  {
    id: 'soil-sensor-lora',
    name: 'Cảm biến độ ẩm đất LoRa FieldSense',
    category: 'iot',
    supplier: 'Agri Sensor Lab',
    price: 'Từ 3.200.000 đ',
    isIoT: true,
    icon: Radar,
    summary: 'Giúp quản lý tưới chính xác, giảm thất thoát nước và đưa ra cảnh báo sớm trên dashboard.',
  },
  {
    id: 'drone-dji-agras',
    name: 'Drone phun thuốc DJI Agras',
    category: 'iot',
    supplier: 'DroneHub Vietnam',
    price: 'Liên hệ báo giá',
    isIoT: true,
    icon: Cpu,
    summary: 'Giải pháp phun chính xác cho vùng trồng quy mô lớn, rút ngắn thời gian vận hành đáng kể.',
  },
  {
    id: 'smart-farm-package-5ha',
    name: 'Gói giám sát nông trại thông minh 5ha',
    category: 'solution',
    supplier: 'VIO Smart Farm',
    price: 'Từ 65.000.000 đ',
    isIoT: true,
    icon: ShieldCheck,
    summary: 'Triển khai trọn gói cảm biến, trạm gateway và báo cáo vận hành cho nông trại tiêu chuẩn cao.',
  },
  {
    id: 'export-rice-input-pack',
    name: 'Combo vật tư chuẩn xuất khẩu cho lúa gạo',
    category: 'solution',
    supplier: 'VIO Inputs',
    price: 'Liên hệ báo giá',
    isIoT: false,
    icon: Package,
    summary: 'Đóng gói đồng bộ dinh dưỡng, bảo vệ cây trồng và checklist kiểm soát chất lượng vùng nguyên liệu.',
  },
]

export default function IoTPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((product) => product.category === activeCategory)

  return (
    <div className="space-y-8 text-stone-950 lg:space-y-10">
      <section className="overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.24),_transparent_36%),linear-gradient(135deg,_#064e3b,_#022c22_55%,_#0f172a)] p-6 text-white shadow-[0_28px_90px_-44px_rgba(6,78,59,0.75)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-end">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Agri High-Tech Solutions
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.85rem] lg:leading-tight">
                Giải pháp Nông nghiệp Công nghệ cao
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                Nâng tầm năng suất với vật tư chuẩn quốc tế và hệ thống quản lý IoT tự động từ VIO AGRI.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
                Danh mục nổi bật
              </p>
              <p className="mt-3 text-2xl font-semibold">{products.length}+ giải pháp</p>
              <p className="mt-2 text-sm leading-7 text-emerald-50/80">
                Từ vật tư đầu vào đến drone và hệ thống quan trắc chuyên dụng.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100/80">
                Mô hình mua sắm B2B
              </p>
              <p className="mt-3 text-2xl font-semibold">Báo giá theo yêu cầu</p>
              <p className="mt-2 text-sm leading-7 text-emerald-50/80">
                Phù hợp cho hợp tác xã, doanh nghiệp nông nghiệp và đối tác xuất khẩu quy mô lớn.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-20 rounded-[28px] border border-stone-200 bg-white/92 p-2 shadow-[0_18px_55px_-44px_rgba(15,23,42,0.45)] backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map((tab) => {
            const active = tab.id === activeCategory

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span className="relative inline-flex items-center">
                  {tab.label}
                  {active ? (
                    <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-emerald-600" />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Smart Farming Catalog</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Danh mục Vật tư & Thiết bị Công nghệ
            </h2>
          </div>
          <p className="text-sm text-stone-500">
            {filteredProducts.length} sản phẩm phù hợp với bộ lọc hiện tại.
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const Icon = product.icon
              const category = categoryMeta[product.category]

              return (
                <article
                  key={product.id}
                  className="group rounded-[28px] border border-stone-200 bg-white p-4 shadow-[0_18px_60px_-46px_rgba(15,23,42,0.38)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_-42px_rgba(15,23,42,0.42)] sm:p-5"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-[24px] border border-stone-200 bg-gradient-to-br from-stone-100 via-stone-100 to-stone-200/80 p-4">
                    <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-white/70 bg-white/60">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${category.iconClassName}`}>
                        <Icon className="h-8 w-8" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${category.badgeClassName}`}>
                        {category.label}
                      </span>
                      {product.isIoT ? (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Smart Farming
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-stone-950">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        {product.summary}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200 bg-stone-50/90 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Cung cấp bởi
                          </p>
                          <p className="mt-2 text-sm font-semibold text-stone-900">{product.supplier}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Mức giá
                        </p>
                        <p className="mt-2 text-xl font-semibold tracking-tight text-stone-950">
                          {product.price}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      Nhận báo giá
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-stone-300 bg-white p-10 text-center shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-100 text-stone-500">
              <Package className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-stone-950">Chưa có sản phẩm trong danh mục này</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-stone-600">
              Chúng tôi đang tiếp tục mở rộng catalog thiết bị và vật tư cho các mô hình nông nghiệp công nghệ cao.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
