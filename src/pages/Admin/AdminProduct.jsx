import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Table, Divider, Upload, Modal } from 'antd';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ModalButton } from './component/ModalButton';
import { ModalForm } from './component/ModalForm';
import { formatNumber } from '~/utils/formatNumber';
import { validImageTypes } from '~/utils/typeFile';
import { adminService } from '~/services/admin.service';
import TextArea from 'antd/es/input/TextArea';
import { formattedDate } from '~/utils/formatDate';
import { toInputDate } from '~/utils/toInputDate';
import { modalButtonData, tabTableAdminProduct } from '~/constants/dummyData';

const AdminProduct = () => {
    const [state, setState] = useState({
        type: 'product',
        modalConfig: { open: false, type: '', action: '' },
        idCheckbox: [],
        currentPage: 1,
        listImage: [],
        removedImages: [],
    });

    const resetDataProduct = {
        name: '',
        image: '',
        categories: '',
        price_old: '',
        price: '',
        countInstock: '',
        description: '',
    };
    const resetDataCategory = {
        title: '',
        id: '',
    };
    const resetDataDiscount = {
        code: '',
        description: '',
        value: '',
        minOrderValue: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true,
    };

    const [isLoading, setIsLoading] = useState(false);
    const productForm = useForm({ mode: 'onChange' });
    const categoryForm = useForm({ mode: 'onChange' });
    const discountForm = useForm({ mode: 'onChange' });

    const { data: dataProduct, refetch: refetchProduct } = useQuery({
        queryKey: ['products', state.currentPage],
        queryFn: async () => await adminService.getAllProduct(`?limit=5&page=${state.currentPage}`),
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
    });

    const { data: dataCategory, refetch: refetchCategory } = useQuery({
        queryKey: ['category'],
        queryFn: async () => await adminService.getCate(),
        staleTime: 5 * 60 * 1000, // Dữ liệu sẽ không bị stale trong 5 phút
        cacheTime: 30 * 60 * 1000,
    });

    const { data: dataDiscount, refetch: refetchDiscount } = useQuery({
        queryKey: ['discount'],
        queryFn: async () => await adminService.getAllDiscount(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
    });

    // set lại dataSource và chỉnh lại categories từ dạng id thành title
    const dataTableProduct = useMemo(
        () =>
            dataProduct?.data?.map((item) => ({
                ...item,
                categories: dataCategory?.find((cate) => cate.id === item.categories)?.title || 'Không xác định',
            })),
        [dataProduct, dataCategory],
    );

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

    const handleUpload = (info) => {
        const newFiles = info?.fileList || [];

        // Kiểm tra loại ảnh hợp lệ
        const isValid = newFiles.every((file) => validImageTypes.includes(file.type));
        if (!isValid) {
            return message.error('Chỉ được upload file ảnh hợp lệ!');
        }

        // Map lại file mới
        const updatedFiles = newFiles.map((file, index) => {
            const origin = file.originFileObj || file;
            if (file.existing) {
                // Nếu là ảnh cũ, giữ nguyên
                return file;
            }
            return {
                ...file,
                originFileObj: origin,
                key: file.uid || index.toString(),
                thumbUrl: file.thumbUrl || URL?.createObjectURL(origin),
            };
        });

        // So sánh với ảnh cũ để tìm ảnh bị xoá
        const removed = state.listImage.filter((oldFile) => !newFiles.some((newFile) => newFile.uid === oldFile.uid));

        // Lưu lại ảnh bị xóa để gửi qua backend (cloudinary)
        const removedImages = removed
            .map((file) => file?.url || file?.thumbUrl) // Cloudinary URL
            .filter((url) => !!url);

        // Cập nhật state
        setState((prevState) => ({
            ...prevState,
            listImage: updatedFiles,
            removedImages: removedImages,  // Lưu vào đây để khi submit thì gửi sang BE
        }));
    };

    const handleSubmitProduct = async (form) => {
        setIsLoading(true);

        const { action, type } = state.modalConfig;

        const defaultValues = productForm?.formState.defaultValues; 
        const currentValues = productForm?.getValues();

        // Kiểm tra sự thay đổi trong form
        const result = JSON.stringify(defaultValues) === JSON.stringify(currentValues);

        // Kiểm tra sự thay đổi trong ảnh
        let isImageChanged = false;

        // Kiểm tra nếu có ảnh mới hoặc ảnh bị xóa
        if (
            state.listImage.some((file) => file.originFileObj) || // Có ảnh mới
            state.removedImages?.length > 0 // Có ảnh bị xóa
        ) {
            isImageChanged = true;
        }

        // Nếu không có thay đổi gì thì không gửi form
        if (type === 'product' && action === 'update' && result && !isImageChanged) {
            setIsLoading(false);
            return message.error('Không có gì thay đổi');
        }

        try {
            let formData = new FormData();

            // Append các field không phải image
            for (const key in form) {
                if (key !== 'image') {
                    formData.append(key, form[key]);
                }
            }

            // Xử lý ảnh bị xoá
            if (state.removedImages?.length > 0) formData.append('removedImages', JSON.stringify(state.removedImages));

            // Ảnh mới
            state.listImage.forEach((file) => {
                if (file.originFileObj) {
                    formData.append('image', file.originFileObj);
                }
            });

            // Ảnh giữ nguyên (không thay đổi)
            const unchangedImages = state.listImage
                .filter((file) => !file.originFileObj && file.url)
                .map((file) => file.url);

            formData.append('unchangedImages', JSON.stringify(unchangedImages));

            const service =
                state.modalConfig.action === 'update' ? adminService.updateProduct : adminService.createProduct;

            const result = await service(formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (result.success) {
                message.success(result.message);
                refetchProduct();
                productForm?.reset(resetDataProduct);
                setState({
                    ...state,
                    modalConfig: { open: false, type: '', action: '' },
                    listImage: [],
                });
            } else {
                // Nếu backend return success: false (như "trùng tên", sai định dạng v.v.)
                message.error(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Sản phẩm: lỗi không xác định');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitCategory = async (form) => {
        setIsLoading(true);
        try {
            const result = await adminService.createCate(form);

            if (result.success) {
                message.success(result.message);
                refetchCategory();
                categoryForm?.reset(resetDataCategory);
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

    const handleSubmitDiscount = async (form) => {
        setIsLoading(true);
        const { action, type } = state.modalConfig;

        const defaultValues = discountForm?.formState.defaultValues; // Lấy giá trị ban đầu
        const currentValues = discountForm?.getValues(); // Lấy giá trị hiện tại
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

    const handleShowTable = useCallback((type) => {
        setState((prevState) => ({
            ...prevState,
            type: type,
            idCheckbox: [],
        }));
    }, []);

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
            const methods = renderTypeModal.methods;
            const resetData = renderTypeModal.reset;
            methods.reset(resetData);
        }
    }, [state.modalConfig]);

    const handleClickUpdate = (id) => {
        const item = dataProduct?.data?.find((item) => item._id === id);
        // Chuyển mảng URL thành định dạng fileList như của Upload
        const imageList =
            item?.image?.map((url, index) => {
                return {
                    uid: `existing-${index}`,
                    name: `${url?.split('/').pop().split('-').slice(-1).join('-')}`, // hoặc parse từ url
                    status: 'done',
                    url: url,
                    thumbUrl: url,
                    originFileObj: null, // không có File object
                    type: 'image/jpeg', // hoặc bạn lấy từ phần mở rộng
                    existing: true, // Đánh dấu là ảnh cũ đã tồn tại
                };
            }) || [];

        setState({
            ...state,
            idCheckbox: [item?._id],
            modalConfig: { open: true, type: 'product', action: 'update' },
            listImage: imageList || [], // dùng để truyền vào Upload
        });
    };

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
            product: dataProduct?.data,
            discount: dataDiscount?.data,
        };

        const formMap = {
            product: productForm,
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
    }, [state.modalConfig, dataProduct, productForm, dataDiscount, discountForm]);

    const renderUpload = () => {
        return (
            <>
                <div className="mr-5 inline-block">
                    <Upload
                        listType="picture-product"
                        showUploadList={true}
                        beforeUpload={() => false}
                        multiple={true}
                        onChange={handleUpload}
                        fileList={state?.listImage.map((file, index) => ({
                            ...file,
                            uid: file.uid || file._id || `generated-${index}`,
                            thumbUrl: file.thumbUrl || URL.createObjectURL(file.originFileObj),
                        }))}
                    >
                        <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                    </Upload>
                </div>
            </>
        );
    };
    const renderAction = (id) => <Button onClick={() => handleClickUpdate(id)}>Update</Button>;
    const renderActionDiscount = (id) => <Button onClick={() => handleClickUpdateDiscount(id)}>Update</Button>;

    const renderImage = (images) => {
        return (
            <>
                <div className="flex item-center gap-2">
                    {images?.slice(0, 2).map((imgUrl, index) => (
                        <img
                            width={50}
                            height={50}
                            key={index}
                            src={imgUrl}
                            alt="Product"
                            style={{ width: '50px', height: '50px' }}
                        />
                    ))}
                    {images?.length > 2 && <span className="pl-2">+{images?.length - 2}</span>}
                </div>
            </>
        );
    };

    const renderColumns = {
        product: [
            { title: 'Tên', dataIndex: 'name', width: 150 },
            { title: 'Hình', dataIndex: 'image', ellipsis: true, width: 200, render: renderImage },
            { title: 'Danh mục', dataIndex: 'categories', width: 100 },
            {
                title: 'Giá',
                dataIndex: 'price',
                width: 100,
                sorter: (a, b) => a.price - b.price,
                render: (price) => formatNumber(Number(price || 0)),
            },
            {
                title: 'Tồn kho',
                dataIndex: 'countInstock',
                width: 100,
                sorter: (a, b) => a.countInstock - b.countInstock,
            },
            {
                title: 'Đánh giá',
                dataIndex: 'rating',
                width: 100,
                sorter: (a, b) => a.rating - b.rating,
                render: (value) => value.toFixed(1),
            },
            {
                title: 'Mô tả',
                dataIndex: 'description',
                width: 200,
                render: (text) => <TextArea defaultValue={text} rows={4} />,
            },
            {
                title: 'Action',
                dataIndex: '_id',
                width: 200,
                render: renderAction,
            },
        ],
        category: [
            { title: 'Tên danh mục', dataIndex: 'title' },
            { title: 'ID', dataIndex: 'id' },
        ],
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
                        {val ? 'Đang dùng' : 'Vô hiệu'}
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
                type: 'product',
                modal: [
                    { name: 'name', label: 'Tên sản phẩm', type: 'text', required: true },
                    { name: 'image', label: 'Hình', render: renderUpload(), type: 'photo', required: true },
                    { name: 'categories', label: 'Danh mục', type: 'select', options: dataCategory, required: true },
                    { name: 'price_old', label: 'Giá cũ', placeholder: 'Vd: 30000', type: 'number', required: true },
                    { name: 'price', label: 'Giá mới', placeholder: 'Vd: 20000', type: 'number', required: true },
                    {
                        name: 'countInstock',
                        label: 'Tồn kho',
                        type: 'number',
                        required: true,
                        pattern: { message: 'Nhập số' },
                    },
                    { name: 'description', label: 'Mô tả', type: 'textarea', required: true },
                ],
            },
            {
                type: 'category',
                modal: [
                    { name: 'title', label: 'Tên danh mục', required: true },
                    {
                        name: 'id',
                        label: 'ID',
                        placeholder: 'Random ID danh mục...',
                        required: true,
                        button: (
                            <Button onClick={() => categoryForm.setValue('id', Math.floor(Math.random() * 1000))}>
                                Random
                            </Button>
                        ),
                    },
                ],
            },
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
        [dataCategory],
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
            product: type === 'product' && action === 'update' ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm',
            category: 'Tạo danh mục',
            discount: type === 'discount' && action === 'update' ? 'Cập nhật mã giảm giá' : 'Tạo mã giảm giá',
        };
        setTitleModal(titleMap[type] || '');
    }, [state.modalConfig.type, state.modalConfig.action, state.listImage]);

    const renderHandle = {
        product: {
            submit: handleSubmitProduct,
            methods: productForm,
            dataSource: dataTableProduct,
            totalPaginate: dataProduct?.total,
            service: adminService?.deleteProduct,
            reset: resetDataProduct,
            modal: modalArray,
        },
        category: {
            submit: handleSubmitCategory,
            methods: categoryForm,
            dataSource: dataCategory,
            totalPaginate: dataCategory?.length || 0,
            service: adminService?.deleteCate,
            reset: resetDataCategory,
            modal: modalArray,
        },
        discount: {
            submit: handleSubmitDiscount,
            methods: discountForm,
            dataSource: dataDiscount?.data,
            totalPaginate: dataCategory?.data?.length,
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
                state.type === 'product' && refetchProduct();
                state.type === 'category' && refetchCategory();
                state.type === 'discount' && refetchDiscount();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi');
        }
    }, [query, renderType]);

    return (
        <div className="wrap ml-10 mt-10 w-[90%]">
            <div className="flex gap-10">
                {modalButtonData.map((item, i) => (
                    <ModalButton
                        key={i}
                        title={item.title}
                        onClick={() =>
                            setState({ ...state, modalConfig: { open: true, type: item.type, action: item.action } })
                        }
                    />
                ))}
            </div>
            <Divider />
            <Button
                disabled={!state.idCheckbox?.length}
                onClick={() => showDeleteConfirm(() => handleDelete())}
                style={{ marginBottom: '10px' }}
            >
                Xóa
            </Button>

            <div className="  mb-5 md:flex md:flex-row sm:flex-col gap-5 ">
                {tabTableAdminProduct?.map((item, i) => (
                    <div className="mt-3" key={i}>
                        <Button onClick={() => handleShowTable(item.value)}>{item.title || ''}</Button>
                    </div>
                ))}
            </div>
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
                        // Cập nhật currentPage và refetch data nếu cần
                        setState((prevState) => ({ ...prevState, currentPage: page }));
                    },
                }}
            />
            <ModalForm
                // key={state.modalConfig.open ? 'open' : 'closed'} // này fix khi bấm vào click update product sẽ reset item => nhưng nó không mượt nếu sử dụng nó
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
export default AdminProduct;
