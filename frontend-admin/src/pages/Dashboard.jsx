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
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
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
  const [salesTrend, setSalesTrend] = useState([])
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
      const [statsRes, ordersRes, productsRes, salesTrendRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentOrders(5),
        dashboardApi.getHotProducts(5),
        dashboardApi.getSalesTrend(7),
      ])
      setStats(statsRes.data)
      setRecentOrders(ordersRes.data || [])
      setHotProducts(productsRes.data || [])
      setSalesTrend(salesTrendRes.data || [])
    } catch (error) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // 销售趋势折线图配置
  const getSalesTrendOption = () => {
    const dates = salesTrend.map(item => item.date)
    const amounts = salesTrend.map(item => item.total_amount)
    const counts = salesTrend.map(item => item.order_count)

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          let result = `<div style="font-weight: bold;margin-bottom: 8px;">${params[0].axisValue}</div>`
          params.forEach(item => {
            const marker = `<span style="display:inline-block;margin-right:8px;border-radius:50%;width:10px;height:10px;background-color:${item.color};"></span>`
            const value = item.seriesName === '销售额' ? `¥${item.value}` : `${item.value}单`
            result += `<div style="margin: 4px 0;">${marker}${item.seriesName}: ${value}</div>`
          })
          return result
        }
      },
      legend: {
        data: ['销售额', '订单数'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          rotate: isMobile ? 30 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '销售额(元)',
          position: 'left',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        {
          type: 'value',
          name: '订单数(单)',
          position: 'right'
        }
      ],
      dataZoom: isMobile ? [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ] : [],
      series: [
        {
          name: '销售额',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3
          },
          areaStyle: {
            opacity: 0.3
          },
          yAxisIndex: 0,
          data: amounts,
          itemStyle: {
            color: '#1677ff'
          }
        },
        {
          name: '订单数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3
          },
          areaStyle: {
            opacity: 0.3
          },
          yAxisIndex: 1,
          data: counts,
          itemStyle: {
            color: '#52c41a'
          }
        }
      ]
    }
  }

  // 订单状态分布饼图配置
  const getOrderStatusOption = () => {
    const statusData = [
      { name: '待支付', value: stats?.orders?.pending || 0, itemStyle: { color: '#d9d9d9' } },
      { name: '已支付', value: stats?.orders?.paid || 0, itemStyle: { color: '#1677ff' } },
      { name: '已发货', value: stats?.orders?.shipped || 0, itemStyle: { color: '#fa8c16' } },
      { name: '已完成', value: stats?.orders?.completed || 0, itemStyle: { color: '#52c41a' } },
      { name: '已退款', value: stats?.orders?.refunded || 0, itemStyle: { color: '#ff4d4f' } },
    ].filter(item => item.value > 0)

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: isMobile ? 'horizontal' : 'vertical',
        bottom: isMobile ? 10 : 'center',
        right: isMobile ? 'center' : 10
      },
      series: [
        {
          name: '订单状态',
          type: 'pie',
          radius: ['40%', '70%'],
          center: isMobile ? ['50%', '40%'] : ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: !isMobile,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: !isMobile
          },
          data: statusData
        }
      ]
    }
  }

  // 热销商品柱状图配置
  const getHotProductsOption = () => {
    const productNames = hotProducts.map(item => item.title)
    const soldCounts = hotProducts.map(item => item.sold_count)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c}件'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: productNames,
        axisLabel: {
          interval: 0,
          rotate: isMobile ? 45 : 30,
          fontSize: isMobile ? 10 : 12
        }
      },
      yAxis: {
        type: 'value',
        name: '销量(件)'
      },
      dataZoom: isMobile ? [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ] : [],
      series: [
        {
          name: '销量',
          type: 'bar',
          barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#1677ff' },
              { offset: 1, color: '#69b1ff' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}件'
          },
          data: soldCounts
        }
      ]
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

      {/* 数据图表 - 销售趋势 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24}>
          <Card title="销售趋势" size="small">
            <ReactECharts
              option={getSalesTrendOption()}
              style={{ height: isMobile ? 300 : 350 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据图表 - 订单状态分布和热销商品 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={24} lg={12}>
          <Card title="订单状态分布" size="small">
            <ReactECharts
              option={getOrderStatusOption()}
              style={{ height: isMobile ? 280 : 320 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="热销商品销量" size="small">
            <ReactECharts
              option={getHotProductsOption()}
              style={{ height: isMobile ? 280 : 320 }}
              opts={{ renderer: 'svg' }}
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
