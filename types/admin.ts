export interface AdminStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalSubscribers: number
  revenueByDay: { date: string; revenue: number }[]
  topProducts: { title: string; total: number }[]
  recentOrders: {
    id: string
    customer_email: string
    total: number
    status: string
    created_at: string
  }[]
}
