import React, { useState, useEffect, forwardRef } from 'react';
import { Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, MenuOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { useAppStore } from '~/store/useAppStore';
import { getUser, removeUser, removeToken } from '~/config/token';
import Sidebar from './Sidebar';

const Header = forwardRef(() => {
    const user = getUser();

    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { toggleSidebar } = useAppStore();

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

                                        <Space className="text-[#fff] text-[17px] pl-5">
                                            {user ? user?.name : 'Tài khoản'}
                                        </Space>
                                        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-[2px] h-[60%] bg-gray-400"></div>
                                  
                                    </div>
                                </div>
                                  <button className=" text-[#fff] text-[17px] pl-10" onClick={handleLogout}>Đăng xuất</button>
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
