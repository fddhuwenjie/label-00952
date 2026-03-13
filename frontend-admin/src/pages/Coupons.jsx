/**
 * 卡券管理页面
 */
import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form, message, Popconfirm,
  Statistic, Row, Col, Tooltip, DatePicker, Dropdown,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FilterOutlined, MoreOutlined } from '@ant-design/icons'
import { couponApi, productApi } from '../services/api'
import dayjs from 'dayjs'

const statusOptions = [
  { value: 'available', label: '可用', color: 'success' },
  { value: 'used', label: '已使用', color: 'default' },
  { value: 'expired', label: '已过期', color: 'error' },
]

function Coupons() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [stats, setStats] = useState({})
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()
  const [filterVisible, setFilterVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchProducts()
    fetchStats()
    fetchData()
  }, [])

  useEffect(() => {
    if (modalVisible) {
      if (editingRecord) {
        form.setFieldsValue(editingRecord)
      } else {
        form.resetFields()
      }
    }
  }, [modalVisible, editingRecord])

  useEffect(() => {
    if (batchModalVisible) {
      batchForm.resetFields()
    }
  }, [batchModalVisible])

  const fetchCategories = async () => {
    try {
      const res = await couponApi.getCategories()
      setCategories(res.data || [])
    } catch (error) {}
  }

  const fetchProducts = async () => {
    try {
      const res = await productApi.getList({ per_page: 100 })
      setProducts(res.data || [])
    } catch (error) {}
  }

  const fetchStats = async () => {
    try {
      const res = await couponApi.getStats()
      setStats(res.data || {})
    } catch (error) {}
  }

  const fetchData = async (page = 1, pageSize = 20, newFilters = filters) => {
    setLoading(true)
    try {
      const res = await couponApi.getList({
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

  const handleAdd = () => {
    setEditingRecord(null)
    setModalVisible(true)
  }

  const handleBatchImport = () => {
    setBatchModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await couponApi.delete(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
      fetchStats()
    } catch (error) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await couponApi.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await couponApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
      fetchStats()
    } catch (error) {}
  }

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields()
      // 解析卡券数据(每行一个卡券，格式: 卡号----密码 或 卡号)
      const lines = values.coupon_data.split('\n').filter(line => line.trim())
      const coupons = lines.map(line => line.trim())
      
      await couponApi.batchImport({
        coupons,
        category_id: values.category_id,
        product_id: values.product_id,
        expire_at: values.expire_at?.format('YYYY-MM-DD HH:mm:ss'),
      })
      message.success(`成功导入 ${coupons.length} 张卡券`)
      setBatchModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
      fetchStats()
    } catch (error) {}
  }

  // 移动端操作菜单
  const getActionMenuItems = (record) => [
    { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: () => handleEdit(record) },
    { 
      key: 'delete', 
      label: '删除', 
      icon: <DeleteOutlined />, 
      danger: true,
      onClick: () => Modal.confirm({ title: '确定删除?', onOk: () => handleDelete(record.id) })
    },
  ]

  // 桌面端列配置
  const desktopColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 50,
      fixed: 'left',
    },
    {
      title: '卡券码',
      dataIndex: 'code',
      width: 180,
      ellipsis: true,
    },
    {
      title: '密码',
      dataIndex: 'password',
      width: 80,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '分类',
      dataIndex: 'category_name',
      width: 100,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '关联商品',
      dataIndex: 'product_title',
      width: 120,
      ellipsis: true,
      render: (val) => val || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (val) => {
        const item = statusOptions.find((o) => o.value === val)
        return <Tag color={item?.color}>{item?.label || val}</Tag>
      },
    },
    {
      title: '使用时间',
      dataIndex: 'used_at',
      width: 100,
      render: (val) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 100,
      render: (val) => dayjs(val).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 移动端列配置
  const mobileColumns = [
    {
      title: '卡券信息',
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.code}
            </span>
            <Tag color={statusOptions.find(o => o.value === record.status)?.color}>
              {statusOptions.find(o => o.value === record.status)?.label}
            </Tag>
          </div>
          <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
            {record.product_title || record.category_name || '未关联'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#999', fontSize: 12 }}>
              {record.password ? `密码: ${record.password}` : '无密码'}
            </span>
            <span style={{ color: '#999', fontSize: 12 }}>
              {dayjs(record.created_at).format('MM-DD HH:mm')}
            </span>
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
      <h2 style={{ marginBottom: isMobile ? 16 : 24 }}>卡券管理</h2>

      {/* 统计卡片 */}
      <Row gutter={[12, 12]} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="总数" value={stats.total || 0} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="可用" value={stats.available || 0} valueStyle={{ color: '#52c41a', fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="已使用" value={stats.used || 0} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" bodyStyle={{ padding: isMobile ? '12px 8px' : undefined }}>
            <Statistic title="已过期" value={stats.expired || 0} valueStyle={{ color: '#ff4d4f', fontSize: isMobile ? 20 : 24 }} />
          </Card>
        </Col>
      </Row>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        {/* 搜索栏 */}
        {isMobile ? (
          <div style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="搜索卡券码"
                prefix={<SearchOutlined />}
                style={{ flex: 1 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)} />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </Space>
            <Space style={{ width: '100%' }}>
              <Button icon={<UploadOutlined />} onClick={handleBatchImport} style={{ flex: 1 }}>
                批量导入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ flex: 1 }}>
                添加卡券
              </Button>
            </Space>
          </div>
        ) : (
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <Input
                placeholder="搜索卡券码"
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
              <Select
                placeholder="商品"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: 150 }}
                options={products.map((p) => ({ value: p.id, label: p.title }))}
                value={filters.product_id}
                onChange={(val) => setFilters({ ...filters, product_id: val })}
              />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </div>
            <Space>
              <Button icon={<UploadOutlined />} onClick={handleBatchImport}>
                批量导入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加卡券
              </Button>
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
          scroll={isMobile ? undefined : { x: 950 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>

      {/* 移动端筛选弹窗 */}
      <Modal
        title="筛选条件"
        open={filterVisible}
        onOk={handleSearch}
        onCancel={() => setFilterVisible(false)}
        okText="搜索"
      >
        <Form layout="vertical">
          <Form.Item label="状态">
            <Select
              placeholder="选择状态"
              allowClear
              options={statusOptions}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Form.Item>
          <Form.Item label="商品">
            <Select
              placeholder="选择商品"
              allowClear
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({ value: p.id, label: p.title }))}
              value={filters.product_id}
              onChange={(val) => setFilters({ ...filters, product_id: val })}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 单个添加/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑卡券' : '添加卡券'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 520}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="卡券码" rules={[{ required: true, message: '请输入卡券码' }]}>
            <Input placeholder="请输入卡券码" />
          </Form.Item>
          <Form.Item name="password" label="密码">
            <Input placeholder="请输入密码(可选)" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="category_id" label="分类">
                <Select
                  placeholder="选择分类"
                  allowClear
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="product_id" label="关联商品">
                <Select
                  placeholder="选择商品"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={products.map((p) => ({ value: p.id, label: p.title }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入卡券"
        open={batchModalVisible}
        onOk={handleBatchSubmit}
        onCancel={() => setBatchModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 600}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="coupon_data"
            label="卡券数据"
            rules={[{ required: true, message: '请输入卡券数据' }]}
            extra="每行一个卡券，格式: 卡号 或 卡号----密码"
          >
            <Input.TextArea
              rows={isMobile ? 6 : 10}
              placeholder={"卡号1\n卡号2----密码2\n卡号3"}
            />
          </Form.Item>
          <Row gutter={[12, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="category_id" label="分类">
                <Select
                  placeholder="选择分类"
                  allowClear
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="product_id" label="关联商品">
                <Select
                  placeholder="选择商品"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={products.map((p) => ({ value: p.id, label: p.title }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="expire_at" label="过期时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Coupons
