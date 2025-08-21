import { adminService } from '~/services/admin.service';
import React, { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Button, message, Table, Divider, Modal, Input } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { formatNumber } from '~/utils/formatNumber';

const AdminOrder = () => {
    const [visible, setVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [status, setStatus] = useState('');
    const [code, setCode] = useState('');

    const [state, setState] = useState({
        type: 'product',
        modalConfig: { open: false, type: '', action: '' },
        idCheckbox: [],
        currentPage: 1,
        listImage: [],
        removedImages: [],
    });

    const { data: dataOrder, refetch: refetchOrder } = useQuery({
        queryKey: ['order'],
        queryFn: async () => await adminService.getOrderAdmin(`?status=${status || ''}&code=${code || ''}`),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
    const { data: dataUser, refetch: refetchUser } = useQuery({
        queryKey: ['user'],
        queryFn: async () => await adminService.getAllUser(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const handleSearch = () => {
        refetchOrder();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClickViewProduct = (order) => {
        setSelectedOrder(order);
        setVisible(true);
    };

    const renderColumns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'code',
            key: 'code',
            width: 120,
        },
        {
            title: 'Tên',
            dataIndex: 'userId',
            key: 'userId',
            render: (value) => {
                const user = dataUser?.find((user) => user._id === value);
                return user?.name;
            },
            width: 150,
        },
        {
            title: 'Thanh toán',
            dataIndex: 'isPaid',
            key: 'isPaid',
            render: (value) => (value ? '✅' : '❌'),
            width: 100,
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 180,
        },
        {
            title: 'Hình thức giao hàng',
            dataIndex: 'deliveryMethod',
            key: 'deliveryMethod',
            width: 150,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => {
                const statusOrder = {
                    fullfilled: 2,
                    pending: 1,
                    cancelled: 0,
                };
                return statusOrder[a.status] - statusOrder[b.status];
            },
            render: (value) => {
                if (value === 'fullfilled')
                    return <span className="  fontWeight: 600, text-green-500">Đã giao hàng</span>;
                if (value === 'cancelled') return <span className="  fontWeight: 600, text-red-500">Đã hủy</span>;
                return 'Đang chờ';
            },
            width: 100,
        },
        {
            title: 'Địa chỉ giao hàng',
            dataIndex: 'shippingAddress',
            key: 'shippingAddress',
            render: (addr) => `${addr.houseNumber}, ${addr.district}, ${addr.city}`,
            width: 250,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => new Date(date).toLocaleString('vi-VN'),
            width: 180,
        },
        {
            title: 'Chi tiết',
            key: 'action',
            render: (_, record) => <Button onClick={() => handleClickViewProduct(record)}>Xem</Button>,
            width: 120,
        },
    ];
    const renderColumnsModal = [
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: 'Hình',
            dataIndex: 'image',
            key: 'image',
            render: (image) => <img src={image} alt="product" style={{ width: 50, height: 50 }} />,
        },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => formatNumber(price),
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Tổng tiền',
            key: 'total',
            render: (_, record) => formatNumber(record.price * record.quantity),
        },
    ];

    const idCancel = dataOrder?.data.filter((item) => item.status === 'cancelled').map((item) => item._id);

    const showDeleteConfirm = (onOk, ids) => {
        Modal.confirm({
            title: 'Xác nhận hủy đơn hàng',
            content: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
            okText: 'Có',
            okType: 'danger',
            cancelText: 'Không',
            onOk() {
                if (ids.some((id) => idCancel.includes(id))) {
                    message.warning('Đơn hàng này đã được hủy');
                    return;
                }
                onOk(); // hàm xử lý khi đồng ý
            },
            onCancel() {
                console.log('Hủy xóa');
            },
        });
    };

    const handleDelete = async () => {
        await adminService.cancelOrder(state.idCheckbox);
        refetchOrder();
    };
    const dataStatus = [
        {
            value: 'fullfilled',
            label: 'Đã giao hàng',
        },
        {
            value: 'cancelled',
            label: 'Đã hủy',
        },
        {
            value: 'pending',
            label: 'Đang chờ',
        },
    ];

    return (
        <div className="wrap ml-10 mt-10 mx-10">
            <div className="flex justify-between flex-col md:flex-row">
                <h1 className="font-bold text-[30px]">Quản lí đơn hàng</h1>
            </div>
            <Divider />

            <div className="search">
                <div className="flex flex-col md:flex-row justify-end gap-3 mb-10 md:mb-0">
                    <select
                        className="w-full md:w-[20%] p-2 border border-gray-300 rounded-md"
                        defaultValue=""
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="" disabled>
                            Trạng thái
                        </option>
                        {dataStatus?.map((item, i) => (
                            <option key={i} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <Input
                        type="text"
                        placeholder="Mã đơn hàng"
                        value={code || ''}
                        onChange={(e) => setCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full md:w-[15%]"
                    />
                    <Button onClick={handleSearch}>
                        <SearchOutlined /> Tìm kiếm
                    </Button>
                </div>
            </div>
            <Button
                disabled={!state.idCheckbox?.length}
                onClick={() => showDeleteConfirm(() => handleDelete(), state.idCheckbox)}
                style={{ marginBottom: '10px' }}
            >
                Hủy đơn hàng
            </Button>

            <Table
                rowKey="_id"
                rowClassName={() => 'align-top'}
                rowSelection={{
                    selectedRowKeys: state.idCheckbox,
                    onChange: (keys) => setState({ ...state, idCheckbox: keys }),
                }}
                columns={renderColumns}
                dataSource={dataOrder?.data || []}
                scroll={{ x: 800 }}
                pagination={{
                    current: state.currentPage,
                    pageSize: 5,
                    total: dataOrder?.data?.totalPage,
                    onChange: (page) => {
                        setState((prevState) => ({ ...prevState, currentPage: page }));
                    },
                }}
            />
            <Modal
                title={`Chi tiết đơn hàng #${selectedOrder?.code}`}
                open={visible}
                onCancel={() => setVisible(false)}
                footer={null}
                width={800}
            >
                <Table
                    rowClassName={() => 'align-top'}
                    rowKey="_id"
                    dataSource={selectedOrder?.orderItems}
                    columns={renderColumnsModal}
                    pagination={false}
                />
                <div className="mt-4 font-semibold text-right">
                    <p>Tổng số sản phẩm: {selectedOrder?.orderItems?.reduce((sum, item) => sum + item.quantity, 0)}</p>
                    <p>Tổng tiền: {formatNumber(selectedOrder?.totalPrice)} VND</p>
                </div>
            </Modal>
        </div>
    );
};

export default AdminOrder;
