import axios from 'axios';
import { getToken, setToken } from './token';
import { adminService } from '~/services/admin.service';
import { API_ROOT } from '~/utils/constants';

const api = axios.create({
    baseURL: API_ROOT,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token.access_token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => {
        return res.data;
    },
    async (err) => {
        // Kiểm tra lỗi do token hết hạn
        if (!import.meta.env.VITE_COOKIE_MODE) {
            if (err?.response?.data?.message === 'Token is not valid') {
                try {
                    // Gọi API refresh token
                    const token = getToken();
                    const newAccessToken = await adminService.refreshToken(token.refresh_token);

                    // Lưu token mới vào localStorage hoặc cookie
                    setToken(newAccessToken.access_token);

                    // Cập nhật token mới vào headers của axios
                    api.defaults.headers.Authorization = `Bearer ${newAccessToken.access_token}`;

                    // Gửi lại request ban đầu với token mới
                    err.config.headers.Authorization = `Bearer ${newAccessToken.access_token}`;
                    return api.request(err.config);
                } catch (refreshError) {
                    throw new Error(refreshError?.response?.data);
                }
            }
            return Promise.reject(err);
        }

        return Promise.reject(err);
    },
);

export default api;
