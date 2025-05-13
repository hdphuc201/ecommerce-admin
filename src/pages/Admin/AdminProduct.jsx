import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, message, Table, Divider, Upload, Modal, Input, Pagination } from 'antd';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { ModalForm } from './component/ModalForm';
import { formatNumber } from '~/utils/formatNumber';
import { validImageTypes } from '~/utils/typeFile';
import { adminService } from '~/services/admin.service';
import TextArea from 'antd/es/input/TextArea';
import { resetDataProduct } from '~/constants/dummyData';
import { ReviewCard } from '~/components/ReviewCard';

const AdminProduct = () => {
    const [state, setState] = useState({
        type: 'product',
        modalConfig: { open: false, type: '', action: '' },
        idCheckbox: [],
        currentPage: 1,
        listImage: [],
        removedImages: [],
    });

    const [searchValue, setSearchValue] = useState('');
    const [searchCate, setSearchCate] = useState('');
    const [isOpenComment, setIsOpenComment] = useState(false);
    const [idComment, setIdComment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const productForm = useForm({ mode: 'onChange' });

    const { data: dataProduct, refetch: refetchProduct } = useQuery({
        queryKey: ['products', state.currentPage],
        queryFn: async () =>
            await adminService.getAllProduct(
                `?limit=5&page=${state.currentPage}&code=${searchValue}&categories=${searchCate}`,
            ),
    });

    const { data: dataCategory, refetch: refetchCategory } = useQuery({
        queryKey: ['category'],
        queryFn: async () => await adminService.getCate(),
        staleTime: 5 * 60 * 1000, // Dữ liệu sẽ không bị stale trong 5 phút
        cacheTime: 30 * 60 * 1000,
    });

    const { data: dataReview, refetch: refetchReview } = useQuery({
        queryKey: ['reviews'],
        queryFn: async () => await adminService.getReviews(),
        staleTime: 5 * 60 * 1000, // Dữ liệu sẽ không bị stale trong 5 phút
        cacheTime: 30 * 60 * 1000,
    });

    // set lại dataSource và chỉnh lại categories từ dạng id thành title
    const dataTableProduct = useMemo(
        () =>
            dataProduct?.data?.map((item) => ({
                ...item,
                categories: dataCategory?.find((cate) => cate._id === item.categories)?.title || 'Không xác định',
            })),
        [dataProduct, dataCategory],
    );

    const handleSearch = async () => {
        refetchProduct();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

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
            removedImages: removedImages, // Lưu vào đây để khi submit thì gửi sang BE
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
                refetchCategory();
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

    useEffect(() => {
        if (!state.modalConfig.open) return;

        const { type, action } = state.modalConfig;
        const id = state.idCheckbox[0];

        const dataMap = {
            product: dataProduct?.data,
        };

        const formMap = {
            product: productForm,
        };

        let formData = dataMap[type]?.find((item) => item._id === id);
        formMap[type]?.reset(formData);
    }, [state.modalConfig, dataProduct, productForm]);

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
    const renderAction = (id) => {
        return (
            <div className="flex gap-3 flex-col">
                <Button onClick={() => handleClickUpdate(id)}>Update</Button>
                <Button onClick={() => handleClickComment(id)}>Đánh giá</Button>
            </div>
        );
    };

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

    const handleClickComment = (id) => {
        setIsOpenComment(true);
        setIdComment(id);
    };
    const hanldeCancelComment = () => {
        setIsOpenComment(false);
    };

    const renderColumns = {
        product: [
            { title: 'Tên', dataIndex: 'name', width: 150 },
            { title: 'Hình', dataIndex: 'image', ellipsis: true, width: 150, render: renderImage },
            { title: 'Mã sản phẩm', dataIndex: 'code', width: 100 },
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
                render: (value) => value || <p className="text-red-500">Hết hàng</p>,
                sorter: (a, b) => a.countInstock - b.countInstock,
            },
            {
                title: 'Đánh giá',
                dataIndex: 'rating',
                width: 100,
                sorter: (a, b) => a.rating - b.rating,
                render: (value) => (!value ? 'Chưa có' : value.toFixed(1)),
            },
            {
                title: 'Mô tả',
                dataIndex: 'description',
                width: 150,
                render: (text) => <TextArea defaultValue={text} rows={4} />,
            },
            {
                title: 'Action',
                dataIndex: '_id',
                width: 120,
                render: renderAction,
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
                    {
                        name: 'categories',
                        label: 'Danh mục',
                        type: 'select',
                        format: 'product',
                        options: dataCategory,
                        required: true,
                    },
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
        ],
        [dataProduct, dataCategory],
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
        };
        setTitleModal(titleMap[type] || '');
    }, [state.modalConfig.type, state.modalConfig.action, state.listImage]);

    const renderHandle = {
        product: {
            submit: handleSubmitProduct,
            methods: productForm,
            dataSource: dataTableProduct || [],
            totalPaginate: dataProduct?.total || 0,
            service: adminService?.deleteProduct,
            reset: resetDataProduct,
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
                refetchProduct();
                refetchCategory();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi');
        }
    }, [query, renderType]);

    return (
        <div className="wrap ml-10 mt-10 mx-10">
            <div className="flex justify-between flex-col md:flex-row">
                <h1 className="font-bold text-[30px]">Quản lí sản phẩm</h1>
                <Button
                    onClick={() =>
                        setState({ ...state, modalConfig: { open: true, type: 'product', action: 'create' } })
                    }
                >
                    <PlusOutlined /> Thêm sản phẩm
                </Button>
            </div>
            <Divider />

            <div className="search">
                <div className="flex flex-col md:flex-row justify-end gap-3 mb-10 md:mb-0">
                    <select
                        className="w-full md:w-[20%] p-2 border border-gray-300 rounded-md"
                        defaultValue=""
                        onChange={(e) => setSearchCate(e.target.value)}
                    >
                        <option value="" disabled>
                            Chọn danh mục
                        </option>
                        {dataCategory?.map((item, i) => (
                            <option key={i} value={item._id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                    <Input
                        type="text"
                        placeholder="Mã sản phẩm"
                        value={searchValue || ''}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full md:w-[20%]"
                    />
                    <Button onClick={handleSearch}>
                        <SearchOutlined /> Tìm kiếm
                    </Button>
                </div>
            </div>
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
                        // Cập nhật currentPage và refetch data nếu cần
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

            <Modal title="Đánh giá" open={isOpenComment} onCancel={hanldeCancelComment} footer={null}>
                {dataReview?.filter((review) => review.productId === idComment).length > 0 ? (
                    <div className="">
                        {dataReview
                            ?.filter((review) => review.productId === idComment)[0]
                            ?.reviews?.map((item, index) => (
                                <div key={item._id}>
                                    <ReviewCard itemReview={item} />
                                    {index <
                                        dataReview?.filter((review) => review.productId === idComment)[0]?.reviews
                                            ?.length -
                                            1 && <div className="border-solid border-b-2 border-[#f0f0f0]"></div>}
                                </div>
                            ))}
                    </div>
                ) : (
                    <p>Không có đánh giá</p>
                )}
            </Modal>
        </div>
    );
};
export default AdminProduct;
