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
  BellOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons'
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

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [hotProducts, setHotProducts] = useState([])
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
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentOrders(5),
        dashboardApi.getHotProducts(5),
      ])
      setStats(statsRes.data)
      setRecentOrders(ordersRes.data || [])
      setHotProducts(productsRes.data || [])
    } catch (error) {
      // ignore
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
