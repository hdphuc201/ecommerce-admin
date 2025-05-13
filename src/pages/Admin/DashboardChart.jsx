import React, { useState } from 'react';
import { Card, Table, Select, Tabs, Modal, Button, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '~/services/admin.service';

const { Option } = Select;

const RevenueStatisticsTable = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [visible, setVisible] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [productDetails, setProductDetails] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const { data: dataMonth } = useQuery({
        queryKey: ['revenue', 'month', year],
        queryFn: () => adminService.getRevenueStatistics('month', year),
    });

    const { data: dataWeek } = useQuery({
        queryKey: ['revenue', 'week', year],
        queryFn: () => adminService.getRevenueStatistics('week', year),
    });

    const fetchProductDetails = async (period, type) => {
        const res = await adminService.getProductsInPeriod({ type, label: period.label, year });
        if (res) {
            setProductDetails(res.data);
            setVisible(true);
            setSelectedPeriod(period);
        }
    };

    const columns = (type) => [
        { title: 'Thời gian', dataIndex: 'label', width: 120 },
        {
            title: 'Tổng doanh thu',
            dataIndex: 'totalRevenue',
            width: 160,
            render: (val) => `${val.toLocaleString()} ₫`,
        },
        { title: 'Tổng đơn hàng', dataIndex: 'totalOrders', width: 140 },
        {
            title: 'Chi tiết',
            dataIndex: 'action',
            render: (_, record) => <Button onClick={() => fetchProductDetails(record, type)}>Xem sản phẩm</Button>,
        },
    ];

    const maxQuantity = Math.max(...productDetails.map((p) => p.quantity));

    const modalColumns = [
        { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
        {
            title: 'Số lượng đã bán',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity) => (
                <span className={quantity === maxQuantity ? 'text-red-500 font-semibold' : ''}>{quantity}</span>
            ),
        },
    ];

    return (
        <div className="wrap ml-10 mt-10 mb-20 mx-10">
            <div className="flex flex-col md:flex-row justify-between">
                <h1 className="font-bold text-[30px]">Thống kê doanh thu</h1>
                <Select value={year} onChange={setYear} style={{ width: 120 }}>
                    {[2023, 2024, 2025].map((y) => (
                        <Option key={y} value={y}>
                            {y}
                        </Option>
                    ))}
                </Select>
            </div>

            <Divider />

            <Tabs
                defaultActiveKey="month"
                items={[
                    {
                        label: 'Theo tháng',
                        key: 'month',
                        children: (
                            <Table
                                rowKey="label"
                                scroll={{ x: 600 }}
                                dataSource={dataMonth?.data || []}
                                columns={columns('month')}
                                pagination={false}
                            />
                        ),
                    },
                    {
                        label: 'Theo tuần',
                        key: 'week',
                        children: (
                            <Table
                                rowKey="label"
                                dataSource={dataWeek?.data || []}
                                columns={columns('week')}
                                scroll={{ x: 600 }}
                                pagination={{
                                    current: currentPage,
                                    pageSize: 12,
                                    total: dataWeek?.length,
                                    onChange: (page) => setCurrentPage(page),
                                }}
                            />
                        ),
                    },
                ]}
            />

            <Modal
                title={`Sản phẩm đã bán - ${selectedPeriod?.label}`}
                open={visible}
                onCancel={() => setVisible(false)}
                footer={null}
            >
                <Table rowKey="_id" dataSource={productDetails} columns={modalColumns} pagination={false} />
                <div className="mt-4 font-semibold text-right">
                    Tổng số sản phẩm: {productDetails.reduce((sum, p) => sum + p.quantity, 0)}
                </div>
            </Modal>
        </div>
    );
};

export default RevenueStatisticsTable;
