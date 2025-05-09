import api from '~/config/api';

export const adminService = {
    // user
    create: (form) => api.post(`/user/create`, form),
    getAllUser: () => api.get(`/user/getall`),
    update: (form) => api.put(`/user/update-user`, form),
    delete: (queryId) => api.delete(`/user/delete-user?${queryId}`),

    // auth
    login: (form) => api.post('/user/sign-in', form),
    loginGoogle: (token) => api.post('/user/sign-in-google', token),
    logout: () => api.post('/user/sign-out'),
    register: (form) => api.post('/user/sign-up', form),
    verifyEmail: (form) => api.post('/user/verify-email', form),
    refreshToken: (token) => api.post('/user/refresh-token', { token }, { withCredentials: true }),

    // category
    getCate: () => api.get(`/product/getCategory`),
    createCate: (form, config = {}) => api.post(`/product/create-category`, form, config),
    deleteCate: (ids) => api.delete(`/product/delete-cateogry?${ids}`),

    // product
    getAllProduct: (query) => api.get(`/product/getAllProduct${query ? query : ''}`),
    deleteProduct: (ids) => api.delete(`/product/delete-product?${ids}`),
    createProduct: (form, config = {}) => api.post(`/product/create-product`, form, config),
    updateProduct: (form, config = {}) => api.put(`/product/update-product`, form, config),

    // chart
    getRevenueStatistics: (type) => api.get(`/chart/stats/?type=${type}`),

    // discount
    createDiscount: (data) => api.post('/discount/createDiscount', data),
    validateDiscount: (data) => api.post(`/discount/validate`, data),
    getAllDiscount: (code = '') => api.get(`/discount/getDiscount${code}`),
    deleteDiscount: (ids) => api.delete(`/discount/deleteDiscount?${ids}`),
    updateDiscount: (form) => api.put('/discount/updateDiscount', form),

    // order
    getOrder: (query) => api.get(`/order/getOrderAdmin${query ? query : ''}`),

};
