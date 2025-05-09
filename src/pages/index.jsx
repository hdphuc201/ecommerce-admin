import { Modal, Row, Col, Typography, message, Spin } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import React, { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import InputForm from '~/components/InputForm';
import { setToken, setUser } from '~/config/token';
import { useAppStore } from '~/store/useAppStore';
import { path } from '~/config/path';
import { useNavigate } from 'react-router-dom';
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from '~/utils/validator';
import { adminService } from '~/services/admin.service';
import Button from '~/components/Button';
import { background } from '~/constants/images.js';

const Home = () => {
    const { Title } = Typography;
    const { toggleModal } = useAppStore();
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const loginForm = useForm({ mode: 'onChange' });

    const handleLogin = useCallback(
        async (formData) => {
            if(formData.email !== 'admin@gmail.com' && formData.email !== 123123){
                return  message.error('Sai thông tin đăng nhập');
            } 
            setLoading(true);
            try {
                const res = await adminService?.login(formData);
                if (res.success) {
                    toggleModal();
                    const { token, ...userData } = res;
                    token && setToken(token);
                    setUser(token ? userData : res);
                    message.success(res.message);
                    navigate(path.Admin);
                }
            } catch (err) {
                message.error(err?.response?.data?.message || 'Đăng nhập thất bại');
            } finally {
                setLoading(false);
            }
        },
        [navigate, toggleModal],
    );

    return (
        <>
           <div
               className=" w-full h-full"
               style={{
                   backgroundImage: background,
                   backgroundSize: 'cover',
                   backgroundPosition: 'center',
               }}
           >
             <Modal
                open={true}
                footer={null}
                closable={false} // ẩn nút X
                maskClosable={false} // không cho bấm ra ngoài để đóng
                keyboard={false} // không cho nhấn ESC để đóng
            >
                <Row gutter={[12, 12]} justify="center" align="middle">
                    <Col xs={24} sm={24} md={14}>
                        <FormProvider {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                                <Title style={{ fontSize: '16px', marginBottom: '30px', textAlign: 'center' }}>
                                    Đăng nhập
                                </Title>
                                <InputForm
                                    error={loginForm.formState.errors['email']}
                                    placeholder="Email.. "
                                    name="email"
                                    type="text"
                                    required={true}
                                    pattern={{
                                        value: EMAIL_RULE,
                                        message: EMAIL_RULE_MESSAGE,
                                    }}
                                />
                                <div className="relative">
                                    <InputForm
                                        error={loginForm.formState.errors['password']}
                                        placeholder="Password.."
                                        name="password"
                                        type={showPass ? 'text' : 'password'}
                                        required={true}
                                        pattern={{
                                            value: PASSWORD_RULE,
                                            message: PASSWORD_RULE_MESSAGE,
                                        }}
                                    />
                                    <div
                                        className="absolute pt-8 mt-2 top-0 right-4 transform -translate-y-1/2 cursor-pointer w-[14px] h-[14px]"
                                        onClick={() => setShowPass(!showPass)}
                                    >
                                        {showPass ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                    </div>
                                </div>

                                <ul className="mt-10">
                                    <li>Tài khoản: admin@gmail.com</li>
                                    <li>Mật khẩu: 123123</li>
                                </ul>

                                <div className="mt-[30px] flex justify-between items-center gap-3">
                                    <Button className="w-full h-[40px]" disabled={loading}>
                                        {loading && <Spin />}Đăng nhập
                                    </Button>
                                </div>
                            </form>
                        </FormProvider>
                    </Col>
                </Row>
            </Modal>
           </div>
        </>
    );
};

export default Home;
