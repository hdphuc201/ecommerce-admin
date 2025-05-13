import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Table, Divider, Modal, Tag } from 'antd';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ModalForm } from './component/ModalForm';
import { adminService } from '~/services/admin.service';
import { resetDataCategory } from '~/constants/dummyData';

const AdminCate = () => {
    const [state, setState] = useState({
        type: 'category',
        modalConfig: { open: false, type: '', action: '' },
        idCheckbox: [],
        currentPage: 1,
        listImage: [],
        removedImages: [],
    });

    const [isLoading, setIsLoading] = useState(false);
    const categoryForm = useForm({ mode: 'onChange' });

    const { data: dataCategory, refetch: refetchCategory } = useQuery({
        queryKey: ['category'],
        queryFn: async () => await adminService.getCate(),
        staleTime: 5 * 60 * 1000, // Dữ liệu sẽ không bị stale trong 5 phút
        cacheTime: 30 * 60 * 1000,
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
                state.modalConfig.action === 'parent'
                    ? adminService.createParentCategory
                    : adminService.createChildCategory;
            const result = await service(form);

            if (result.success) {
                message.success(result.message);
                refetchCategory();
                categoryForm?.reset(state.modalConfig.action === 'parent' ? resetDataCategory : resetDataCategoryChildrent);
                setState({
                    ...state,
                    modalConfig: { open: false, type: '', action: '' },
                });
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Danh mục: Lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = useCallback(() => {
        setState((prevState) => ({
            ...prevState,
            modalConfig: { open: false, type: '', action: '' },
            listImage: [],
            idCheckbox: [],
        }));
    }, []);

    useEffect(() => {
        const { action, open } = state.modalConfig;
        if (action !== 'update' && open) {
            categoryForm.reset(resetDataCategory);
        }
    }, [state.modalConfig]);
    
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
            title: 'Sản phẩm',
            dataIndex: 'productCount',
            key: 'productCount',
            render: (count) => count || 0,
        },
    ];

    const renderModalForm = [{ name: 'title', label: 'Tên danh mục', required: true }];

    const renderModalFormChildrent = [
        {
            name: 'parentId',
            required: true,
            label: 'Danh mục cha', 
            type: 'select',
            format: 'category',
            options: dataCategory?.map((item) => ({ label: item.title, value: item._id })),
        },
        { name: 'title', label: 'Tên danh mục', required: true },
    ];

    // set id sản phẩm dưới dạng query id=1&id=2
    const query = useMemo(() => state.idCheckbox.map((id) => `id=${id}`).join('&'), [state.idCheckbox]);
    const handleDelete = useCallback(async () => {
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
    }, [query]);

    return (
        <div className="wrap ml-10 mt-10 w-[90%]">
            <div className="flex justify-between">
                <h1 className="font-bold text-[30px]">Quản lí danh mục</h1>
                <div className="flex gap-3">
                    <Button
                        onClick={() =>
                            setState({ ...state, modalConfig: { open: true, type: 'category', action: 'parent' } })
                        }
                    >
                        <PlusOutlined /> Thêm danh mục cha
                    </Button>
                    <Button
                        onClick={() =>
                            setState({ ...state, modalConfig: { open: true, type: 'category', action: 'childrent' } })
                        }
                    >
                        <PlusOutlined /> Thêm danh mục con
                    </Button>
                </div>
            </div>
            <Divider />
            <Button
                disabled={!state.idCheckbox?.length}
                onClick={() => showDeleteConfirm(() => handleDelete())}
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
                    pageSize: 5,
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
                fields={state.modalConfig.action === 'parent' ? renderModalForm : renderModalFormChildrent}
            />
        </div>
    );
};
export default AdminCate;
