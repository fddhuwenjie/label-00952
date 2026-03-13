/**
 * 指定回复页面
 */
import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form, message, Popconfirm,
  InputNumber, Switch, TimePicker, Row, Col, Tooltip, Dropdown,
} from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, FilterOutlined, MoreOutlined } from '@ant-design/icons'
import { targetedReplyApi } from '../services/api'
import dayjs from 'dayjs'

const targetTypeOptions = [
  { value: 'user', label: '用户' },
  { value: 'product', label: '商品' },
  { value: 'account', label: '账号' },
]

function TargetedReplies() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  const [filterVisible, setFilterVisible] = useState(false)
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
    if (modalVisible) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          status: editingRecord.status === 1,
          time_start: editingRecord.time_start ? dayjs(editingRecord.time_start, 'HH:mm:ss') : null,
          time_end: editingRecord.time_end ? dayjs(editingRecord.time_end, 'HH:mm:ss') : null,
        })
      } else {
        form.resetFields()
      }
    }
  }, [modalVisible, editingRecord])

  const fetchData = async (page = 1, pageSize = 20, newFilters = filters) => {
    setLoading(true)
    try {
      const res = await targetedReplyApi.getList({
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
      await targetedReplyApi.delete(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        status: values.status ? 1 : 0,
        time_start: values.time_start?.format('HH:mm:ss') || null,
        time_end: values.time_end?.format('HH:mm:ss') || null,
      }
      if (editingRecord) {
        await targetedReplyApi.update(editingRecord.id, submitData)
        message.success('更新成功')
      } else {
        await targetedReplyApi.create(submitData)
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
    {
      title: 'ID',
      dataIndex: 'id',
      width: 50,
      fixed: 'left',
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      width: 80,
      render: (val) => {
        const item = targetTypeOptions.find(o => o.value === val)
        return <Tag>{item?.label || val}</Tag>
      },
    },
    {
      title: '目标ID',
      dataIndex: 'target_id',
      width: 100,
      ellipsis: true,
    },
    {
      title: '生效时间',
      width: 120,
      render: (_, record) => {
        if (record.time_start && record.time_end) {
          return `${record.time_start.slice(0, 5)} - ${record.time_end.slice(0, 5)}`
        }
        return '全天'
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 70,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: (val) => val ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>,
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
      title: '规则信息',
      render: (_, record) => (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>{record.name}</span>
            {record.status ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <Tag>{targetTypeOptions.find(o => o.value === record.target_type)?.label || record.target_type}</Tag>
            <span style={{ color: '#666', fontSize: 12 }}>ID: {record.target_id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#999', fontSize: 12 }}>
            <span>
              {record.time_start && record.time_end 
                ? `${record.time_start.slice(0, 5)} - ${record.time_end.slice(0, 5)}` 
                : '全天'}
            </span>
            <span>优先级: {record.priority}</span>
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
      <h2 style={{ marginBottom: isMobile ? 16 : 24 }}>指定回复</h2>

      <Card bodyStyle={{ padding: isMobile ? 12 : 24 }}>
        {/* 搜索栏 */}
        {isMobile ? (
          <div style={{ marginBottom: 16 }}>
            <Space style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="搜索规则名称"
                prefix={<SearchOutlined />}
                style={{ flex: 1 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)} />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} block>
              添加规则
            </Button>
          </div>
        ) : (
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <Input
                placeholder="搜索规则名称"
                prefix={<SearchOutlined />}
                style={{ width: 180 }}
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                onPressEnter={handleSearch}
              />
              <Select
                placeholder="目标类型"
                allowClear
                style={{ width: 100 }}
                options={targetTypeOptions}
                value={filters.target_type}
                onChange={(val) => setFilters({ ...filters, target_type: val })}
              />
              <Select
                placeholder="状态"
                allowClear
                style={{ width: 100 }}
                options={[
                  { value: 1, label: '启用' },
                  { value: 0, label: '禁用' },
                ]}
                value={filters.status}
                onChange={(val) => setFilters({ ...filters, status: val })}
              />
              <Button type="primary" onClick={handleSearch}>搜索</Button>
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加规则
            </Button>
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
          scroll={isMobile ? undefined : { x: 750 }}
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
          <Form.Item label="目标类型">
            <Select
              placeholder="选择类型"
              allowClear
              options={targetTypeOptions}
              value={filters.target_type}
              onChange={(val) => setFilters({ ...filters, target_type: val })}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="选择状态"
              allowClear
              options={[
                { value: 1, label: '启用' },
                { value: 0, label: '禁用' },
              ]}
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingRecord ? '编辑规则' : '添加规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose={false}
        width={isMobile ? '95%' : 600}
        transitionName=""
        maskTransitionName=""
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          
          <Row gutter={[12, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="target_type" label="目标类型" rules={[{ required: true, message: '请选择目标类型' }]}>
                <Select options={targetTypeOptions} placeholder="选择类型" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={16}>
              <Form.Item name="target_id" label="目标ID" rules={[{ required: true, message: '请输入目标ID' }]}>
                <Input placeholder="用户ID / 商品ID / 账号ID" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="reply_content"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <Input.TextArea rows={isMobile ? 3 : 4} placeholder="请输入回复内容" />
          </Form.Item>
          
          <Row gutter={[12, 0]}>
            <Col xs={12} sm={8}>
              <Form.Item name="time_start" label="开始时间">
                <TimePicker format="HH:mm" placeholder="开始时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={8}>
              <Form.Item name="time_end" label="结束时间">
                <TimePicker format="HH:mm" placeholder="结束时间" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="priority" label="优先级" initialValue={0}>
                <InputNumber min={0} max={999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="status" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TargetedReplies
