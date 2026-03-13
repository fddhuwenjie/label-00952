/**
 * 订单管理页面
 */
import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form, message, Popconfirm,
  DatePicker, Descriptions, Tooltip, Dropdown, Row, Col,
} from 'antd'
import {
  SearchOutlined, EyeOutlined, SendOutlined, RollbackOutlined,
  MoreOutlined, FilterOutlined,
} from '@ant-design/icons'
import { orderApi } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const statusOptions = [
  { value: 'pending', label: '待支付', color: 'default' },
  { value: 'paid', label: '已支付', color: 'processing' },
  { value: 'shipped', label: '已发货', color: 'warning' },
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'refunded', label: '已退款', color: 'error' },
  { value: 'cancelled', label: '已取消', color: 'default' },
]

function Orders() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [shipModalVisible, setShipModalVisible] = useState(false)
  const [filterVisible, setFilterVisible] = useState(false)
  const [shipForm] = Form.useForm()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (shipModalVisible) {
      shipForm.resetFields()
    }
  }, [shipModalVisible])

  const fetchData = async (page = 1, pageSize = 20, newFilters = filters) => {
    setLoading(true)
    try {
      const res = await orderApi.getList({
        page,
        per_page: pageSize,
        ...newFilters,
      })
      setData(res.data || [])
      setPagination({
        current: res.pagination?.page || 1,
        pageSize: res.pagination?.per_page || 20,
        total: res.pagination?.total || 0,
      })
    } catch (error) {}
    setLoading(false)
  }

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize)
  }

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, filters)
    setFilterVisible(false)
  }

  const handleViewDetail = async (record) => {
    try {
      const res = await orderApi.getDetail(record.id)
      setCurrentOrder(res.data)
      setDetailVisible(true)
    } catch (error) {}
  }

  const handleShip = (record) => {
    setCurrentOrder(record)
    setShipModalVisible(true)
  }

  const handleShipSubmit = async () => {
    try {
      const values = await shipForm.validateFields()
      await orderApi.ship(currentOrder.id, values)
      message.success('发货成功')
      setShipModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  const handleRefund = async (id) => {
    try {
      await orderApi.refund(id)
      message.success('退款成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setFilters({
        ...filters,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      })
    } else {
      const { start_date, end_date, ...rest } = filters
      setFilters(rest)
    }
  }

  // 移动端操作菜单
  const getActionMenuItems = (record) => {
    const items = [
      { key: 'detail', label: '查看详情', icon: <EyeOutlined />, onClick: () => handleViewDetail(record) },
    ]
    if (record.status === 'paid') {
      items.push({ key: 'ship', label: '发货', icon: <SendOutlined />, onClick: () => handleShip(record) })
    }
    if (['paid', 'shipped'].includes(record.status)) {
      items.push({ 
        key: 'refund', 
        label: '退款', 
        icon: <RollbackOutlined />, 
        danger: true,
        onClick: () => Modal.confirm({ title: '确定退款?', onOk: () => handleRefund(record.id) })
      })
    }
    return items
  }

  // 桌面端列配置
  const desktopColumns = [
    { title: '订单号', dataIndex: 'order_no', width: 150, ellipsis: true, fixed: 'left' },
    { title: '商品', dataIndex: 'product_title', width: 150, ellipsis: true },
    { title: '买家', dataIndex: 'buyer_name', width: 100, ellipsis: true, render: (val) => val || '-' },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '金额', dataIndex: 'total_amount', width: 80, render: (val) => `¥${val}` },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (val) => {
        const item = statusOptions.find((o) => o.value === val)
        return <Tag color={item?.color}>{item?.label || val}</Tag>
      },
    },
    { title: '时间', dataIndex: 'created_at', width: 100, render: (val) => dayjs(val).format('MM-DD HH:mm') },
    {
      title: '操作', width: 100, fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          {record.status === 'paid' && (
            <Tooltip title="发货">
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleShip(record)} />
            </Tooltip>
          )}
          {['paid', 'shipped'].includes(record.status) && (
            <Popconfirm title="确定退款?" onConfirm={() => handleRefund(record.id)}>
              <Tooltip title="退款">
                <Button type="link" size="small" danger icon={<RollbackOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  // 移动端列配置
  const mobileColumns = [
    {
      title: '订单信息',
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{record.order_no}</span>
            <Tag color={statusOptions.find(o => o.value === record.status)?.color}>
              {statusOptions.find(o => o.value === record.status)?.label}
            </Tag>
          </div>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{record.product_title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{record.total_amount}</span>
            <span style={{ color: '#999', fontSize: 12 }}>{dayjs(record.created_at).format('MM-DD HH:mm')}</span>
          </div>
        </div>
      ),
    },
    {
      title: '操作', width: 50,
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <div className="fade-in">
      <h2 style={{ marginBottom: 16 }}>订单管理</h2>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        {/* 搜索栏 */}
        {isMobile ? (
          <div style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%' }}>
              <Input
                placeholder="搜索订单号/买家"
                prefix={<SearchOutlined />}
                style={{ flex: 1 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)} />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </Space>
          </div>
        ) : (
          <div className="table-toolbar" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input
                placeholder="搜索订单号/买家"
                prefix={<SearchOutlined />}
                style={{ width: 180 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="状态"
                allowClear
                style={{ width: 100 }}
                options={statusOptions}
                value={filters.status}
                onChange={(val) => setFilters({ ...filters, status: val })}
              />
              <RangePicker onChange={handleDateChange} style={{ width: 240 }} />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </Space>
          </div>
        )}

        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            size: isMobile ? 'small' : 'default',
            showSizeChanger: !isMobile,
            showTotal: isMobile ? undefined : (total) => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={isMobile ? undefined : { x: 920 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {/* 移动端筛选抽屉 */}
      <Modal
        title="筛选条件"
        open={filterVisible}
        onOk={handleSearch}
        onCancel={() => setFilterVisible(false)}
        okText="搜索"
      >
        <Form layout="vertical">
          <Form.Item label="订单状态">
            <Select
              placeholder="选择状态"
              allowClear
              options={statusOptions}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Form.Item>
          <Form.Item label="日期范围">
            <RangePicker onChange={handleDateChange} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={isMobile ? '95%' : 600}
        transitionName=""
        maskTransitionName=""
      >
        {currentOrder && (
          <Descriptions column={isMobile ? 1 : 2} bordered size="small">
            <Descriptions.Item label="订单号" span={2}>{currentOrder.order_no}</Descriptions.Item>
            <Descriptions.Item label="商品" span={isMobile ? 1 : undefined}>{currentOrder.product?.title || currentOrder.product_title}</Descriptions.Item>
            <Descriptions.Item label="数量">{currentOrder.quantity}</Descriptions.Item>
            <Descriptions.Item label="单价">¥{currentOrder.unit_price}</Descriptions.Item>
            <Descriptions.Item label="总金额">¥{currentOrder.total_amount}</Descriptions.Item>
            <Descriptions.Item label="买家">{currentOrder.buyer_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusOptions.find(o => o.value === currentOrder.status)?.color}>
                {statusOptions.find(o => o.value === currentOrder.status)?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            {currentOrder.shipped_content && (
              <Descriptions.Item label="发货内容" span={2}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>{currentOrder.shipped_content}</pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 发货弹窗 */}
      <Modal
        title="订单发货"
        open={shipModalVisible}
        onOk={handleShipSubmit}
        onCancel={() => setShipModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 500}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={shipForm} layout="vertical">
          <Form.Item name="content" label="发货内容" extra="留空将自动从卡券库中获取">
            <Input.TextArea rows={4} placeholder="请输入发货内容，留空将自动发货" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Orders
