import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, message, Table, Divider, Upload, Modal } from 'antd';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ModalForm } from './component/ModalForm';
import { formatNumber } from '~/utils/formatNumber';
import { adminService } from '~/services/admin.service';
import { formattedDate } from '~/utils/formatDate';
import { toInputDate } from '~/utils/toInputDate';
import { resetDataDiscount} from '~/constants/dummyData';

const AdminDiscount = () => {
    const [state, setState] = useState({
        type: 'discount',
        modalConfig: { open: false, type: '', action: '' },
        idCheckbox: [],
        currentPage: 1,
    });

    const [isLoading, setIsLoading] = useState(false);
    const discountForm = useForm({ mode: 'onChange' });

    const { data: dataDiscount, refetch: refetchDiscount } = useQuery({
        queryKey: ['discount'],
        queryFn: async () => await adminService.getAllDiscount(),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const showDeleteConfirm = (onOk) => {
        Modal.confirm({
            title: 'Xác nhận xóa sản phẩm',
            content: 'Bạn có chắc chắn muốn xóa sản phẩm này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk() {
                onOk(); // hàm xử lý khi đồng ý
            },
            onCancel() {
                console.log('Hủy xóa');
            },
        });
    };

    const handleSubmitDiscount = async (form) => {
        setIsLoading(true);
        const { action, type } = state.modalConfig;

        const defaultValues = discountForm?.formState.defaultValues; 
        const currentValues = discountForm?.getValues();
        const result = JSON.stringify(defaultValues) === JSON.stringify(currentValues);

        if (type === 'discount' && action === 'update' && result) {
            setIsLoading(false);
            return message.error('Không có gì thay đổi');
        }
        try {
            const service =
                type === 'discount' && action === 'update' ? adminService.updateDiscount : adminService.createDiscount;
            const result = await service(form);

            if (result.success) {
                message.success(result.message);
                refetchDiscount();
                discountForm?.reset(resetDataDiscount);
                setState({
                    ...state,
                    modalConfig: { open: false, type: '', action: '' },
                });
            }
        } catch (error) {
            console.error(error);
            message.error(error.response?.data?.message || 'Mã giảm giá: Lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = useCallback(() => {
        discountForm.reset(resetDataDiscount);
        setState((prevState) => ({
            ...prevState,
            modalConfig: { open: false, type: '', action: '' },
        }));
    }, []);

    useEffect(() => {
        const { action, open } = state.modalConfig;
        if (action !== 'update' && open) {
            const methods = renderTypeModal.methods;
            const resetData = renderTypeModal.reset;
            methods.reset(resetData);
        }
    }, [state.modalConfig]);

    const handleClickUpdateDiscount = useCallback(
        (id) => {
            const item = dataDiscount?.data?.find((item) => item._id === id);

            setState((prevState) => ({
                ...prevState,
                idCheckbox: [item?._id],
                modalConfig: { open: true, type: 'discount', action: 'update' },
            }));
        },
        [dataDiscount],
    );

    useEffect(() => {
        if (!state.modalConfig.open) return;

        const { type, action } = state.modalConfig;
        const id = state.idCheckbox[0];

        const dataMap = {
            discount: dataDiscount?.data,
        };

        const formMap = {
            discount: discountForm,
        };

        let formData = dataMap[type]?.find((item) => item._id === id);

        if (type === 'discount') {
            const formatted = {
                ...formData,
                startDate: toInputDate(formData?.startDate),
                endDate: toInputDate(formData?.endDate),
            };
            formMap[type]?.reset(formatted);
        } else {
            formMap[type]?.reset(formData);
        }
    }, [state.modalConfig, dataDiscount, discountForm]);

   
    const renderActionDiscount = (id) => <Button onClick={() => handleClickUpdateDiscount(id)}>Cập nhật</Button>;

    const renderColumns = {
        discount: [
            { title: 'Mã khuyến mãi', dataIndex: 'code', width: 150 },
            { title: 'Mô tả', dataIndex: 'description', width: 150 },
            {
                title: 'Loại',
                dataIndex: 'type',
                width: 100,
                render: (type) => (type === 'percent' ? 'Phần trăm' : 'Cố định'),
            },
            {
                title: 'Giá trị giảm',
                dataIndex: 'value',
                width: 120,
                render: (val, record) => (record.type === 'percent' ? `${val}%` : `${formatNumber(val)}₫`),
            },
            {
                title: 'Tối thiểu đơn',
                dataIndex: 'minOrderValue',
                width: 150,
                render: (val) => `${formatNumber(val)}₫`,
            },
            { title: 'Giới hạn sử dụng', dataIndex: 'usageLimit', width: 120 },
            { title: 'Đã sử dụng', dataIndex: 'usedCount', width: 120 },
            {
                title: 'Bắt đầu',
                dataIndex: 'startDate',
                width: 130,
                render: (date) => formattedDate(date),
            },
            {
                title: 'Kết thúc',
                dataIndex: 'endDate',
                width: 130,
                render: (date) => formattedDate(date),
            },
            {
                title: 'Kích hoạt',
                dataIndex: 'isActive',
                width: 100,
                render: (val) => (
                    <span
                        style={{
                            color: val ? 'green' : 'red',
                            fontWeight: 600,
                        }}
                    >
                        {val ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                ),
            },
            {
                title: 'Action',
                dataIndex: '_id',
                width: 200,
                render: renderActionDiscount,
            },
        ],
    };

    const renderModalForm = useMemo(
        () => [
            {
                type: 'discount',
                modal: [
                    { name: 'code', label: 'Mã khuyến mãi', type: 'text', required: true },
                    { name: 'description', label: 'Mô tả', type: 'textarea', required: true },
                    {
                        name: 'type',
                        label: 'Loại giảm giá',
                        type: 'select',
                        options: [
                            { label: 'Phần trăm (%)', value: 'percent' },
                            { label: 'Cố định (VND)', value: 'fixed' },
                        ],
                        required: true,
                    },
                    {
                        name: 'value',
                        label: 'Giá trị giảm',
                        type: 'number',
                        required: true,
                    },
                    { name: 'minOrderValue', label: 'Giá trị đơn hàng tối thiểu', type: 'number' },
                    { name: 'usageLimit', label: 'Giới hạn sử dụng', type: 'number' },
                    { name: 'startDate', label: 'Ngày bắt đầu', type: 'date', required: true },
                    { name: 'endDate', label: 'Ngày kết thúc', type: 'date', required: true },
                    { name: 'isActive', label: 'Trạng thái', type: 'switch' },
                ],
            },
        ],
        [dataDiscount],
    );

    const [modalArray, setModalArray] = useState([]);
    const [titleModal, setTitleModal] = useState('');

    useEffect(() => {
        const { type, action } = state.modalConfig;

        const found = renderModalForm.find((item) => item.type === type);
        if (!found) return;

        const updatedModal = found.modal.map((field) =>
            field.name === 'image' ? { ...field, render: renderUpload() } : field,
        );

        setModalArray(updatedModal);

        const titleMap = {
            discount: type === 'discount' && action === 'update' ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá',
        };
        setTitleModal(titleMap[type] || '');
    }, [state.modalConfig.type, state.modalConfig.action, state.listImage]);

    const renderHandle = {
        discount: {
            submit: handleSubmitDiscount,
            methods: discountForm,
            dataSource: dataDiscount?.data,
            totalPaginate: dataDiscount?.data?.length,
            service: adminService?.deleteDiscount,
            reset: resetDataDiscount,
            modal: modalArray,
        },
    };

    const renderTypeModal = renderHandle[state.modalConfig.type] || {};

    const renderType = renderHandle[state.type];
    // set id sản phẩm dưới dạng query id=1&id=2
    const query = useMemo(() => state.idCheckbox.map((id) => `id=${id}`).join('&'), [state.idCheckbox]);
    const handleDelete = useCallback(async () => {
        try {
            const service = renderType.service;
            const result = await service(query);
            if (result.success) {
                message.success(result.message);
                setState((prevState) => ({ ...prevState, idCheckbox: [] }));
                refetchDiscount();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi');
        }
    }, [query, renderType]);

    return (
        <div className="wrap ml-10 mt-10 mx-10">
            <div className="flex justify-between flex-col md:flex-row">
                <h1 className="font-bold text-[30px]">Quản lí mã giảm giá</h1>
                <Button
                
                    onClick={() => {
                        discountForm.reset(resetDataDiscount);
                        setState({ ...state, modalConfig: { open: true, type: 'discount', action: 'create' } });
                    }}
                >
                    <PlusOutlined /> Thêm mã
                </Button>
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
                columns={renderColumns?.[state.type]}
                dataSource={renderType?.dataSource || []}
                scroll={{ x: 800 }}
                pagination={{
                    current: state.currentPage,
                    pageSize: 5,
                    total: renderType?.totalPaginate,
                    onChange: (page) => {
                        setState((prevState) => ({ ...prevState, currentPage: page }));
                    },
                }}
            />
            <ModalForm
                title={titleModal || ''}
                isOpen={state.modalConfig.open}
                onCancel={handleCancel}
                methods={renderTypeModal?.methods}
                onSubmit={renderTypeModal?.submit}
                isLoading={isLoading}
                fields={modalArray}
            />
        </div>
    );
};
export default AdminDiscount;
