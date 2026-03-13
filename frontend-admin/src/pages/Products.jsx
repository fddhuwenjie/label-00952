/**
 * 商品管理页面
 */
import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form, message, Popconfirm,
  InputNumber, Switch, Row, Col, Tooltip, Dropdown,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, MoreOutlined, FilterOutlined } from '@ant-design/icons'
import { productApi, accountApi } from '../services/api'
import dayjs from 'dayjs'

const statusOptions = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'online', label: '上架', color: 'success' },
  { value: 'offline', label: '下架', color: 'warning' },
  { value: 'sold_out', label: '售罄', color: 'error' },
]

function Products() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filterVisible, setFilterVisible] = useState(false)
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchAccounts()
    fetchData()
  }, [])

  useEffect(() => {
    if (modalVisible) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          auto_delivery: editingRecord.auto_delivery === 1,
        })
      } else {
        form.resetFields()
      }
    }
  }, [modalVisible, editingRecord])

  const fetchCategories = async () => {
    try {
      const res = await productApi.getCategories()
      setCategories(res.data || [])
    } catch (error) {}
  }

  const fetchAccounts = async () => {
    try {
      const res = await accountApi.getList({ per_page: 100 })
      setAccounts(res.data || [])
    } catch (error) {}
  }

  const fetchData = async (page = 1, pageSize = 20, newFilters = filters) => {
    setLoading(true)
    try {
      const res = await productApi.getList({
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

  const handleEdit = (record) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await productApi.delete(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        auto_delivery: values.auto_delivery ? 1 : 0,
      }
      if (editingRecord) {
        await productApi.update(editingRecord.id, submitData)
        message.success('更新成功')
      } else {
        await productApi.create(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
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
    { title: 'ID', dataIndex: 'id', width: 50, fixed: 'left' },
    { title: '商品名称', dataIndex: 'title', width: 180, ellipsis: true },
    { title: '分类', dataIndex: 'category_name', width: 90, ellipsis: true, render: (val) => val || '-' },
    { title: '价格', dataIndex: 'price', width: 80, render: (val) => `¥${val}` },
    { title: '库存', dataIndex: 'stock', width: 60 },
    { title: '销量', dataIndex: 'sold_count', width: 60 },
    {
      title: '状态', dataIndex: 'status', width: 70,
      render: (val) => {
        const item = statusOptions.find((o) => o.value === val)
        return <Tag color={item?.color}>{item?.label || val}</Tag>
      },
    },
    { title: '发货', dataIndex: 'auto_delivery', width: 60, render: (val) => val ? <Tag color="blue">自动</Tag> : <Tag>手动</Tag> },
    { title: '时间', dataIndex: 'created_at', width: 100, render: (val) => dayjs(val).format('MM-DD HH:mm') },
    {
      title: '操作', width: 100, fixed: 'right',
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
      title: '商品信息',
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{record.title}</span>
            <Tag color={statusOptions.find(o => o.value === record.status)?.color}>
              {statusOptions.find(o => o.value === record.status)?.label}
            </Tag>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{record.price}</span>
            <Space size={12}>
              <span style={{ color: '#666', fontSize: 12 }}>库存: {record.stock}</span>
              <span style={{ color: '#666', fontSize: 12 }}>销量: {record.sold_count}</span>
            </Space>
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
      <h2 style={{ marginBottom: 16 }}>商品管理</h2>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        {/* 搜索栏 */}
        {isMobile ? (
          <div style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="搜索商品名称"
                prefix={<SearchOutlined />}
                style={{ flex: 1 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)} />
            </Space>
            <Space style={{ width: '100%' }}>
              <Button type="primary" onClick={handleSearch} style={{ flex: 1 }}>搜索</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
            </Space>
          </div>
        ) : (
          <div className="table-toolbar" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input
                placeholder="搜索商品名称"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
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
                placeholder="分类"
                allowClear
                style={{ width: 120 }}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                value={filters.category_id}
                onChange={(val) => setFilters({ ...filters, category_id: val })}
              />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加商品</Button>
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
          <Form.Item label="商品状态">
            <Select
              placeholder="选择状态"
              allowClear
              options={statusOptions}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Form.Item>
          <Form.Item label="商品分类">
            <Select
              placeholder="选择分类"
              allowClear
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={filters.category_id}
              onChange={(val) => setFilters({ ...filters, category_id: val })}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 600}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber min={0} precision={2} placeholder="价格" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="original_price" label="原价">
                <InputNumber min={0} precision={2} placeholder="原价" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="stock" label="库存" initialValue={0}>
                <InputNumber min={0} placeholder="库存" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="category_id" label="分类">
                <Select placeholder="选择分类" allowClear options={categories.map((c) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="account_id" label="关联账号">
                <Select placeholder="选择账号" allowClear options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="status" label="状态" initialValue="draft">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={3} placeholder="请输入商品描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col xs={12} sm={8}>
              <Form.Item name="auto_delivery" label="自动发货" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="delivery_type" label="发货类型" initialValue="coupon">
                <Select options={[
                  { value: 'coupon', label: '卡券' },
                  { value: 'text', label: '文本' },
                  { value: 'file', label: '文件' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Products
