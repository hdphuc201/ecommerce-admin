import React, { useEffect, useState } from 'react';
import { Drawer, Menu, message } from 'antd';
import { CloseOutlined, UserOutlined } from '@ant-design/icons';
import { useAppStore } from '~/store/useAppStore';
import { getUser, removeToken, removeUser } from '~/config/token';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { path } from '~/config/path';
import { adminService } from '~/services/admin.service';

const Sidebar = () => {
    const { pathname } = useLocation();
    const user = getUser();
    const { toggleSidebar, openSidebar, toggleModal } = useAppStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (!import.meta.env.VITE_COOKIE_MODE) {
            removeToken();
        } else {
            const result = await adminService.logout();
            if (result.success) {
                message.success(result.message);
            }
        }
        removeUser();
        toggleSidebar(false);
        navigate('/', { replace: true });
        window.location.replace('/');
    };

    const handleMenuClick = ({ key }) => {
        if (key === 'logout') {
            handleLogout();
        } else {
            toggleSidebar(false);
            setTimeout(() => {
                navigate(key);
            }, 200);
        }
    };
    const [openKeys, setOpenKeys] = useState(['user']); // Luôn mở "Tài khoản"

    // Chuyển đổi từ SubMenu sang items theo chuẩn mới của Ant Design
    const menuItems = [
        {
            key: 'user',
            label: user ? user.name : <span className="text-[18px]">Tài khoản</span>,
            icon: user?.avatar ? (
                <img
                    width={40}
                    height={40}
                    src={user?.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-[40px] h-[40px] rounded-full object-cover"
                />
            ) : (
                <UserOutlined style={{ fontSize: '18px' }} />
            ),
            children: user ? [{ key: 'logout', label: 'Đăng xuất' }].filter(Boolean) : [],
        },
        !user && {
            key: 'login',
            label: 'Đăng nhập',
            onClick: toggleModal,
        },
    ].filter(Boolean);

    const handleCloseSibar = () => toggleSidebar(false);
    useEffect(() => {
        toggleSidebar(false);
    }, [pathname]);

    return (
        <Drawer
            open={openSidebar}
            placement="left"
            closable={false}
            onClose={handleCloseSibar}
            styles={{
                header: { display: 'none' },
                body: { padding: 0 },
            }}
        >
            <div className="p-7 h-[70px] flex items-center justify-between bg-[#15395b]">
                <Link
                    to={path.Home}
                    style={{ color: '#fff', fontSize: '20px', fontFamily: 'sans-serif' }}
                    onClick={handleCloseSibar}
                >
                    SHOP
                </Link>
                <CloseOutlined className="text-white text-[20px] cursor-pointer" onClick={handleCloseSibar} />
            </div>

            {/* Menu mới sử dụng `items` thay vì `children` */}
            <Menu
                mode="inline"
                openKeys={openKeys}
                onOpenChange={(keys) => setOpenKeys(keys)}
                className="text-[16px] mt-10"
                onClick={handleMenuClick}
                items={menuItems}
            />
        </Drawer>
    );
};

export default Sidebar;
