import api from '~/config/api';

export const adminService = {
    // user
    create: (form) => api.post(`/user/create`, form),
    getAllUser: (query) => api.get(`/user/getall${query ? query : ''}`),
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
    getCate: (query) => api.get(`/category/getCategory${query ? query : ''}`),
    createParentCategory: (form) => api.post(`/category/create-category-parent`, form),
    createChildCategory: (form) => api.post(`/category/create-category-childrent`, form),
    deleteCate: (ids) => api.delete(`/category/delete-cateogry?${ids}`),

    // product
    getAllProduct: (query) => api.get(`/product/getAllProduct${query ? query : ''}`),
    deleteProduct: (ids) => api.delete(`/product/delete-product?${ids}`),
    createProduct: (form, config = {}) => api.post(`/product/create-product`, form, config),
    createMultipleProduct: (products) => api.post(`/product/bulk-crawl`, products),
    createMockdata: (url, categoryId) => {
        console.log('url, categoryId', url, categoryId)
        api.post(`/product/crawl-mockdata`, url, categoryId)
    },
    updateProduct: (form, config = {}) => api.put(`/product/update-product`, form, config),

    // chart
    getRevenueStatistics: (type, year) => api.get(`/chart/stats/?type=${type}&year=${year}`),
    getProductsInPeriod: (data) => api.post(`/chart/stats/products`, data),
    // discount
    createDiscount: (data) => api.post('/discount/createDiscount', data),
    validateDiscount: (data) => api.post(`/discount/validate`, data),
    getAllDiscount: (code = '') => api.get(`/discount/getDiscount${code}`),
    deleteDiscount: (ids) => api.delete(`/discount/deleteDiscount?${ids}`),
    updateDiscount: (form) => api.put('/discount/updateDiscount', form),

    // order
    getOrderAdmin: (query) => api.get(`/order/getOrderAdmin${query ? query : ''}`),
    cancelOrder: (ids) => api.delete(`/order/cancelOrder?ids=${ids}`),

    // review 
    getReviews: () => api.get(`/reviews/get`),

};
