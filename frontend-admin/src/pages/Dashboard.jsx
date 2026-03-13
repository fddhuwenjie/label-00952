/**
 * 仪表盘页面
 */
import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Spin, Tag } from 'antd'
import {
  UserOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  TagsOutlined,
  MessageOutlined,
  DollarOutlined,
  RiseOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
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
const PIE_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#ff4d4f', '#722ed1']

// 柱状图颜色
const BAR_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2']

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [hotProducts, setHotProducts] = useState([])
  const [chartData, setChartData] = useState({
    orderStatus: [],
    categoryStats: [],
    accountSalesRank: [],
    hourlyOrders: [],
    monthlyTrend: [],
  })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [
        statsRes,
        ordersRes,
        productsRes,
        orderStatusRes,
        categoryStatsRes,
        accountSalesRankRes,
        hourlyOrdersRes,
        monthlyTrendRes,
      ] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentOrders(5),
        dashboardApi.getHotProducts(5),
        dashboardApi.getOrderStatusDistribution(),
        dashboardApi.getCategoryStats(),
        dashboardApi.getAccountSalesRank(10),
        dashboardApi.getHourlyOrders(),
        dashboardApi.getMonthlyTrend(6),
      ])

      setStats(statsRes.data)
      setRecentOrders(ordersRes.data || [])
      setHotProducts(productsRes.data || [])

      // 处理订单状态分布数据 - 后端返回的是数组格式
      const orderStatusData = (orderStatusRes.data || []).map((item) => ({
        name: item.name || orderStatusMap[item.status]?.text || item.status,
        value: item.value || 0,
      }))

      // 处理分类统计数据
      const categoryData = (categoryStatsRes.data || []).map((item) => ({
        name: item.name || item.category_name,
        商品数量: item.product_count || 0,
        销量: item.sold_count || 0,
      }))

      // 处理账号销售排行
      const accountRankData = (accountSalesRankRes.data || []).map((item, index) => ({
        name: item.name || `账号${index + 1}`,
        销售额: item.total_amount || 0,
        订单数: item.order_count || 0,
      }))

      // 处理24小时订单数据
      const hourlyData = (hourlyOrdersRes.data || []).map((item) => ({
        hour: `${item.hour}时`,
        订单数: item.order_count || 0,
        销售额: item.total_amount || 0,
      }))

      // 处理月度趋势数据
      const monthlyData = (monthlyTrendRes.data || []).map((item) => ({
        month: item.month,
        销售额: item.total_amount || 0,
        订单数: item.order_count || 0,
      }))

      setChartData({
        orderStatus: orderStatusData,
        categoryStats: categoryData,
        accountSalesRank: accountRankData,
        hourlyOrders: hourlyData,
        monthlyTrend: monthlyData,
      })
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 订单表格列
  const orderColumns = isMobile
    ? [
        {
          title: '订单信息',
          render: (_, record) => (
            <div style={{ padding: '4px 0' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    maxWidth: '60%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {record.product_title}
                </span>
                <Tag color={orderStatusMap[record.status]?.color}>
                  {orderStatusMap[record.status]?.text}
                </Tag>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#999',
                  fontSize: 12,
                }}
              >
                <span>¥{record.total_amount}</span>
                <span>{dayjs(record.created_at).format('MM-DD HH:mm')}</span>
              </div>
            </div>
          ),
        },
      ]
    : [
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
  const productColumns = isMobile
    ? [
        {
          title: '商品信息',
          render: (_, record) => (
            <div style={{ padding: '4px 0' }}>
              <div
                style={{
                  fontSize: 13,
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {record.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#999',
                  fontSize: 12,
                }}
              >
                <span>¥{record.price}</span>
                <span>销量: {record.sold_count} | 库存: {record.stock}</span>
              </div>
            </div>
          ),
        },
      ]
    : [
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
            <Statistic
              title="待支付"
              value={stats?.orders?.pending || 0}
              valueStyle={{ fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="已支付"
              value={stats?.orders?.paid || 0}
              valueStyle={{ color: '#1677ff', fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="已发货"
              value={stats?.orders?.shipped || 0}
              valueStyle={{ color: '#fa8c16', fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="已完成"
              value={stats?.orders?.completed || 0}
              valueStyle={{ color: '#52c41a', fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="已退款"
              value={stats?.orders?.refunded || 0}
              valueStyle={{ color: '#ff4d4f', fontSize: isMobile ? 18 : 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic
              title="未读消息"
              value={stats?.unread_messages || 0}
              prefix={<MessageOutlined />}
              valueStyle={{
                color: stats?.unread_messages > 0 ? '#ff4d4f' : 'inherit',
                fontSize: isMobile ? 18 : 24,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 第一行图表：月度趋势和订单状态 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <span>
                <LineChartOutlined style={{ marginRight: 8 }} />
                月度销售趋势
              </span>
            }
            size="small"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) =>
                    name === '销售额' ? [`¥${value}`, name] : [value, name]
                  }
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="销售额"
                  stroke="#1677ff"
                  strokeWidth={2}
                  dot={{ fill: '#1677ff' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="订单数"
                  stroke="#52c41a"
                  strokeWidth={2}
                  dot={{ fill: '#52c41a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <PieChartOutlined style={{ marginRight: 8 }} />
                订单状态分布
              </span>
            }
            size="small"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.orderStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.orderStatus.map((_, index) => (
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

      {/* 第二行图表：24小时订单和分类统计 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <BarChartOutlined style={{ marginRight: 8 }} />
                24小时订单趋势
              </span>
            }
            size="small"
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData.hourlyOrders}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="订单数"
                  stroke="#1677ff"
                  fill="#1677ff"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <BarChartOutlined style={{ marginRight: 8 }} />
                商品分类统计
              </span>
            }
            size="small"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.categoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="商品数量" fill="#1677ff" name="商品数量" />
                <Bar yAxisId="right" dataKey="销量" fill="#52c41a" name="销量" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 第三行图表：账号销售排行 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <RiseOutlined style={{ marginRight: 8 }} />
                账号销售排行 TOP 10
              </span>
            }
            size="small"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.accountSalesRank} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === '销售额' ? [`¥${value}`, name] : [value, name]
                  }
                />
                <Legend />
                <Bar dataKey="销售额" fill="#1677ff" />
                <Bar dataKey="订单数" fill="#52c41a" />
              </BarChart>
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
