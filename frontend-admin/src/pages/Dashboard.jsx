/**
 * 仪表盘页面
 */
import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Spin, Tag, Select } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  TagsOutlined,
  MessageOutlined,
  BellOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { dashboardApi } from '../services/api'
import dayjs from 'dayjs'

// 状态标签映射
const orderStatusMap = {
  pending: { text: '待支付', color: 'default' },
  paid: { text: '已支付', color: 'processing' },
  shipped: { text: '已发货', color: 'warning' },
  completed: { text: '已完成', color: 'success' },
  refunded: { text: '已退款', color: 'error' },
  cancelled: { text: '已取消', color: 'default' },
}

// 饼图颜色
const PIE_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2']

// 趋势类型
const TREND_TYPES = [
  { value: 'daily', label: '最近7天', key: 'date' },
  { value: 'weekly', label: '最近7周', key: 'day' },
  { value: 'monthly', label: '最近6个月', key: 'day' },
]

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [hotProducts, setHotProducts] = useState([])
  const [salesTrend, setSalesTrend] = useState([])
  const [orderStatusDistribution, setOrderStatusDistribution] = useState([])
  const [productSalesRank, setProductSalesRank] = useState([])
  const [hourlyTrend, setHourlyTrend] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [trendType, setTrendType] = useState('daily')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchData()
  }, [trendType])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [
        statsRes,
        ordersRes,
        productsRes,
        trendRes,
        statusRes,
        rankRes,
        hourlyRes,
        categoryRes,
      ] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentOrders(5),
        dashboardApi.getHotProducts(5),
        trendType === 'daily'
          ? dashboardApi.getSalesTrend(7)
          : trendType === 'weekly'
          ? dashboardApi.getWeeklyTrend(7)
          : dashboardApi.getMonthlyTrend(6),
        dashboardApi.getOrderStatusDistribution(),
        dashboardApi.getProductSalesRank(10),
        dashboardApi.getHourlyTrend(),
        dashboardApi.getCategoryStats(30),
      ])
      setStats(statsRes.data)
      setRecentOrders(ordersRes.data || [])
      setHotProducts(productsRes.data || [])
      setSalesTrend(trendRes.data || [])
      setOrderStatusDistribution(statusRes.data || [])
      setProductSalesRank(rankRes.data || [])
      setHourlyTrend(hourlyRes.data || [])
      setCategoryStats(categoryRes.data || [])
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 订单表格列
  const orderColumns = isMobile ? [
    {
      title: '订单信息',
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 13, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.product_title}
            </span>
            <Tag color={orderStatusMap[record.status]?.color}>{orderStatusMap[record.status]?.text}</Tag>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 12 }}>
            <span>¥{record.total_amount}</span>
            <span>{dayjs(record.created_at).format('MM-DD HH:mm')}</span>
          </div>
        </div>
      ),
    },
  ] : [
    {
      title: '订单号',
      dataIndex: 'order_no',
      ellipsis: true,
    },
    {
      title: '商品',
      dataIndex: 'product_title',
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      render: (val) => `¥${val}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (val) => {
        const item = orderStatusMap[val] || { text: val, color: 'default' }
        return <Tag color={item.color}>{item.text}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      render: (val) => dayjs(val).format('MM-DD HH:mm'),
    },
  ]

  // 商品表格列
  const productColumns = isMobile ? [
    {
      title: '商品信息',
      render: (_, record) => (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: 13, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {record.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 12 }}>
            <span>¥{record.price}</span>
            <span>销量: {record.sold_count} | 库存: {record.stock}</span>
          </div>
        </div>
      ),
    },
  ] : [
    {
      title: '商品名称',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'price',
      render: (val) => `¥${val}`,
    },
    {
      title: '销量',
      dataIndex: 'sold_count',
    },
    {
      title: '库存',
      dataIndex: 'stock',
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: isMobile ? 16 : 24 }}>仪表盘</h2>

      {/* 统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="账号总数"
              value={stats?.accounts?.total || 0}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="在线账号"
              value={stats?.accounts?.online || 0}
              valueStyle={{ color: '#52c41a', fontSize: isMobile ? 20 : 24 }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="商品数量"
              value={stats?.products?.total || 0}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="今日订单"
              value={stats?.today_orders?.order_count || 0}
              prefix={<OrderedListOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="今日销售额"
              value={stats?.today_orders?.total_amount || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6} lg={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="可用卡券"
              value={stats?.coupons?.available || 0}
              prefix={<TagsOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ fontSize: isMobile ? 20 : 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 订单状态统计 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="待支付" value={stats?.orders?.pending || 0} valueStyle={{ fontSize: isMobile ? 18 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="已支付" value={stats?.orders?.paid || 0} valueStyle={{ color: '#1677ff', fontSize: isMobile ? 18 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="已发货" value={stats?.orders?.shipped || 0} valueStyle={{ color: '#fa8c16', fontSize: isMobile ? 18 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="已完成" value={stats?.orders?.completed || 0} valueStyle={{ color: '#52c41a', fontSize: isMobile ? 18 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="已退款" value={stats?.orders?.refunded || 0} valueStyle={{ color: '#ff4d4f', fontSize: isMobile ? 18 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="未读消息"
              value={stats?.unread_messages || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: stats?.unread_messages > 0 ? '#ff4d4f' : 'inherit', fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {/* 销售趋势图 */}
        <Col xs={24} lg={16}>
          <Card
            size="small"
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>销售趋势</span>
                <Select
                  size="small"
                  value={trendType}
                  onChange={setTrendType}
                  options={TREND_TYPES}
                  style={{ width: 120 }}
                />
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={TREND_TYPES.find(t => t.value === trendType)?.key || 'date'} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_amount"
                  name="销售额"
                  stroke="#1677ff"
                  fill="url(#colorAmount)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="order_count"
                  name="订单数"
                  stroke="#52c41a"
                  fill="url(#colorOrders)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 订单状态分布饼图 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="订单状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {orderStatusDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 第二行图表 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {/* 商品销售排行柱状图 */}
        <Col xs={24} lg={12}>
          <Card size="small" title="商品销售排行">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={productSalesRank}
                layout="vertical"
                margin={{ left: isMobile ? 20 : 80, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={isMobile ? 60 : 100}
                  tickFormatter={(value) =>
                    value.length > (isMobile ? 4 : 8) ? `${value.slice(0, isMobile ? 4 : 8)}...` : value
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'sales' ? `${value}件` : `¥${value}`,
                    name === 'sales' ? '销量' : '销售额',
                  ]}
                />
                <Legend />
                <Bar dataKey="sales" name="销量" fill="#1677ff" radius={[0, 4, 4, 0]} />
                <Bar dataKey="amount" name="销售额" fill="#52c41a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 24小时订单趋势 */}
        <Col xs={24} lg={12}>
          <Card size="small" title="今日24小时订单趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="order_count"
                  name="订单数"
                  stroke="#fa8c16"
                  strokeWidth={2}
                  dot={{ fill: '#fa8c16', strokeWidth: 2, r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="total_amount"
                  name="销售额"
                  stroke="#eb2f96"
                  strokeWidth={2}
                  dot={{ fill: '#eb2f96', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 第三行图表 - 商品类别统计 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {/* 商品类别销售占比饼图 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="商品类别销售占比">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats.filter(cat => cat.amount > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isMobile ? 60 : 80}
                  dataKey="amount"
                  nameKey="name"
                >
                  {categoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `¥${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 商品类别订单数柱状图 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="各类别订单数量">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryStats}
                margin={{ left: isMobile ? 10 : 30, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    value.length > (isMobile ? 2 : 4) ? `${value.slice(0, isMobile ? 2 : 4)}...` : value
                  }
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="order_count" name="订单数" fill="#722ed1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="product_count" name="商品数" fill="#13c2c2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 商品类别雷达图 */}
        <Col xs={24} lg={8}>
          <Card size="small" title="类别销售分析">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={categoryStats} cx="50%" cy="50%" outerRadius={isMobile ? 50 : 70}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar
                  name="销售额"
                  dataKey="amount"
                  stroke="#1677ff"
                  fill="#1677ff"
                  fillOpacity={0.3}
                />
                <Radar
                  name="订单数"
                  dataKey="order_count"
                  stroke="#52c41a"
                  fill="#52c41a"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 数据表格 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card title="最近订单" size="small" bodyStyle={{ padding: isMobile ? 8 : undefined }}>
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="热销商品" size="small" bodyStyle={{ padding: isMobile ? 8 : undefined }}>
            <Table
              columns={productColumns}
              dataSource={hotProducts}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard