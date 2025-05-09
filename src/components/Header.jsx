import React, { useState, useEffect, forwardRef } from 'react';
import { Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, MenuOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import { useAppStore } from '~/store/useAppStore';
import { getUser, removeUser, removeToken } from '~/config/token';
import Sidebar from './Sidebar';

const Header = forwardRef(() => {
    const user = getUser();

    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { toggleSidebar, toggleModal } = useAppStore();

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        removeUser();
        removeToken();
        navigate('/', { replace: true }); 
        toggleSidebar(false);
        window.location.replace('/'); 
    };

    const items = [
        {
            key: '1',
            label: 'Đăng xuất',
            onClick: handleLogout,
        },
    ].filter(Boolean);

    return (
        <>
            <div className="bg-[#15395b] h-[70px]  flex items-center z-30 w-full ">
                <Row className="w-full container justify-end" style={{ alignItems: 'center' }}>

                    <Col span={windowWidth <= 1000 ? 4 : 8} className="flex justify-end items-center">
                        {windowWidth >= 1000 ? (
                            <>
                                <div className="relative">
                                    <div className="account flex pl-[20px] items-center relative">
                                        {user?.avatar ? (
                                            <>
                                                <img
                                                    width={50}
                                                    height={50}
                                                    src={user?.avatar}
                                                    alt=""
                                                    referrerPolicy="no-referrer"
                                                    className="w-[50px] h-[50px] rounded-full object-cover"
                                                />
                                            </>
                                        ) : (
                                            <UserOutlined style={{ fontSize: '30px', color: '#fff' }} />
                                        )}

                                        <div className="account__detail pl-[10px]">
                                            <Dropdown menu={{ items }} trigger={user ? ['hover'] : []}>
                                                <button
                                                    onClick={toggleModal}
                                                    disabled={user}
                                                    className="cursor-pointer"
                                                >
                                                    <Space className="text-[#fff] text-[17px]">
                                                        {user ? user?.name : 'Tài khoản'}
                                                    </Space>
                                                </button>
                                            </Dropdown>
                                        </div>
                                        <CaretDownOutlined
                                            style={{ color: '#fff', cursor: 'pointer', padding: '2px 0 0 5px' }}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <button onClick={() => toggleSidebar(true)}>
                                <MenuOutlined style={{ fontSize: '30px', color: '#fff', cursor: 'pointer' }} />
                            </button>
                        )}
                    </Col>
                    <Sidebar />
                </Row>
            </div>
        </>
    );
});

export default Header;
