import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Table, Divider, Modal, Tag, Pagination, Input } from 'antd';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ModalForm } from './component/ModalForm';
import { adminService } from '~/services/admin.service';
import { resetDataCategory } from '~/constants/dummyData';
import { formatNumber } from '~/utils/formatNumber';

const AdminCate = () => {
    const [state, setState] = useState({
        modalConfig: { open: false, form: 'parent' },
        idCheckbox: [],
        currentPage: 1,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [isOpenViewProduct, setIsOpenViewProduct] = useState(false);
    const [idViewProduct, setIdViewProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const categoryForm = useForm({ mode: 'onChange' });

    const { data: dataCategory, refetch: refetchCategory } = useQuery({
        queryKey: ['category'],
        queryFn: async () => await adminService.getCate(),
        staleTime: 5 * 60 * 1000, // Dữ liệu sẽ không bị stale trong 5 phút
        gcTime: 30 * 60 * 1000,
    });

    const { data: dataProduct } = useQuery({
        queryKey: ['products', state.currentPage, idViewProduct, currentPage],
        queryFn: async () => await adminService.getAllProduct(`?limit=3&page=${currentPage}${idViewProduct ? `&categories=${idViewProduct}` : ''}`),
        staleTime: 5 * 60 * 1000, // Dữ liệu sẽ không bị stale trong 5 phút
        gcTime: 30 * 60 * 1000,
    });

    const showDeleteConfirm = (onOk) => {
        Modal.confirm({
            title: 'Xác nhận xóa danh mục',
            content: 'Bạn có chắc chắn muốn xóa danh mục này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                onOk();
            },
            onCancel() {
                console.log('Hủy xóa');
            },
        });
    };

    const handleSubmitCategory = async (form) => {
        setIsLoading(true);
        try {
            const service =
                state.modalConfig.form === 'parent'
                    ? adminService.createParentCategory
                    : adminService.createChildCategory;
            const result = await service(form);

            if (result.success) {
                message.success(result.message);
                refetchCategory();
                categoryForm?.reset(resetDataCategory);
                setState({
                    ...state,
                    modalConfig: { open: false, form: 'parent' },
                });
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Danh mục: Lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClickViewProduct = (id) => {
        setIsOpenViewProduct(true);
        setIdViewProduct(id);
    };
    const hanldeCancelViewProduct = () => {
        setIsOpenViewProduct(false);
    };

    // pagination của view product
    const onShowSizeChange = (page) => {
        setCurrentPage(page);
    };

    const handleCancel = useCallback(() => {
        setState((prevState) => ({
            ...prevState,
            modalConfig: { open: false, form: 'parent' },
            idCheckbox: [],
        }));
        categoryForm?.reset(resetDataCategory);
    }, []);

    useEffect(() => {
        const { form, open } = state.modalConfig;
        if (form !== 'update' && open) {
            categoryForm.reset(resetDataCategory);
        }
    }, [state.modalConfig]);

    const renderAction = (id) => <Button onClick={() => handleClickViewProduct(id)}>Xem</Button>;
    const renderColumns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'title',
            key: 'title',
        },

        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
        },
        {
            title: 'Loại danh mục',
            key: 'parent',
            render: (_, record) =>
                record.parent ? <Tag color="blue">Danh mục con</Tag> : <Tag color="green">Danh mục cha</Tag>,
        },
        {
            title: 'Danh mục cha',
            dataIndex: 'parent',
            key: 'parent',
            render: (parentId, record) => {
                if (!parentId) return <span className="text-gray-400 italic">—</span>;
                const parent = dataCategory?.find((c) => c._id === parentId);
                return parent?.title || 'Không tìm thấy';
            },
        },
        {
            title: 'Số sản phẩm',
            dataIndex: 'productCount',
            key: 'productCount',
            sorter: (a, b) => a.productCount - b.productCount,
            render: (count) => count || 0,
        },
        {
            title: 'Danh sách sản phẩm',
            dataIndex: '_id',
            key: '_id',
            render: renderAction,
        },
    ];
    const renderModalForm = {
        parent: {
            fields: [{ name: 'title', label: 'Tên danh mục', required: true }],
        },
        childrent: {
            fields: [
                {
                    name: 'parentId',
                    required: true,
                    label: 'Danh mục cha',
                    type: 'select',
                    format: 'category',
                    options: dataCategory?.map((item) => ({ label: item.title, value: item._id })),
                },
                { name: 'title', label: 'Tên danh mục', required: true },
            ],
        },
    };

    // set id sản phẩm dưới dạng query id=1&id=2
    const query = useMemo(() => state.idCheckbox.map((id) => `id=${id}`).join('&'), [state.idCheckbox]);
    const handleDelete = useCallback(
        async (ids) => {
            const productInCate = dataCategory.filter((item) => item.productCount > 0).map((item) => item._id);
            if (ids.some((id) => productInCate.includes(id))) {
                return message.error('Không thể xóa danh mục này vì có sản phẩm thuộc danh mục này');
            }
            try {
                const result = await adminService?.deleteCate(query);
                if (result.success) {
                    message.success(result.message);
                    setState((prevState) => ({ ...prevState, idCheckbox: [] }));
                    refetchCategory();
                }
            } catch (error) {
                message.error(error.response?.data?.message || 'Lỗi');
            }
        },
        [query],
    );
    return (
        <div className="wrap ml-10 mt-10 mx-10">
            <div className="flex justify-between flex-col md:flex-row">
                <h1 className="font-bold text-[30px]">Quản lí danh mục</h1>
                <div className="flex flex-col md:flex-row justify-end gap-3">
                    <Button onClick={() => setState({ ...state, modalConfig: { open: true, form: 'parent' } })}>
                        <PlusOutlined /> Thêm danh mục cha
                    </Button>
                    <Button onClick={() => setState({ ...state, modalConfig: { open: true, form: 'childrent' } })}>
                        <PlusOutlined /> Thêm danh mục con
                    </Button>
                </div>
            </div>
           
            <Divider />
            <Button
                disabled={!state.idCheckbox?.length}
                onClick={() => showDeleteConfirm(() => handleDelete(state.idCheckbox))}
                style={{ marginBottom: '10px' }}
            >
                Xóa
            </Button>

            <Table
                rowKey="_id"
                rowClassName={() => 'align-top'}
                rowSelection={{
                    selectedRowKeys: state.idCheckbox,
                    onChange: (keys) => setState({ ...state, idCheckbox: keys }),
                }}
                columns={renderColumns}
                dataSource={dataCategory || []}
                scroll={{ x: 800 }}
                pagination={{
                    current: state.currentPage,
                    pageSize: 10,
                    total: dataCategory?.length || 0,
                    onChange: (page) => {
                        setState((prevState) => ({ ...prevState, currentPage: page }));
                    },
                }}
            />
            <ModalForm
                title="Tạo danh mục"
                isOpen={state.modalConfig.open}
                onCancel={handleCancel}
                methods={categoryForm}
                onSubmit={handleSubmitCategory}
                isLoading={isLoading}
                fields={renderModalForm?.[state?.modalConfig?.form]?.fields}
            />
            <Modal title="Sản phẩm" open={isOpenViewProduct} onCancel={hanldeCancelViewProduct} footer={null}>
                {dataProduct?.data?.length > 0
                    ? dataProduct?.data.map((item) => (
                          <div key={item._id} className="flex items-center gap-4 mb-2 relative">
                              <img src={item.image[0]} alt={item.name} className="w-40 h-40 object-cover " />
                              <p className="text-md max-w-[50%]">{item.name}</p>
                              <p className="text-md absolute right-0">{formatNumber(item.price || 0)}</p>
                          </div>
                      ))
                    : 'Không có sản phẩm'}

                {dataProduct?.data?.length > 0 && (
                    <div className="flex justify-end">
                        <Pagination
                            style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}
                            onChange={onShowSizeChange}
                            total={dataProduct?.total}
                            pageSize={3}
                            current={currentPage}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default AdminCate;
