import React, { useState } from 'react';
import axios from 'axios';
import { Button, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '~/services/admin.service';
import api from '~/config/api';

export default function MockDataTool() {
    const [url, setUrl] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [message, setMessage] = useState('');

    const { data: dataCategory } = useQuery({
        queryKey: ['category'],
        queryFn: async () => await adminService.getCate(),
    });

    const handleRun = async () => {
        if (!url || !categoryId) {
            setMessage('❌ Vui lòng nhập đầy đủ URL và Category ID');
            return;
        }

        try {
            const res = await api.post('product/crawl-mockdata', {
                url,
                categoryId,
            });
            console.log('res', res);
            if (res.success) {
                setMessage(`✅ ${res.message}`);
            } else {
                setMessage(`❌ ${res.message}`);
            }
        } catch (err) {
            setMessage(`❌ Lỗi: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: 32, maxWidth: 500 }}>
            <h2>Tạo mockData từ URL</h2>

            <Input
                type="text"
                placeholder="https://dathangsi.vn/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full mt-10"
            />
            <select
                className="w-full mt-5 p-2 border border-gray-300 rounded-md"
                defaultValue=""
                onChange={(e) => setCategoryId(e.target.value)}
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

            <Button onClick={handleRun} className="mt-5">
                <PlusOutlined /> Tạo mockData
            </Button>
            <div style={{ marginTop: 16, color: message.startsWith('✅') ? 'green' : 'red' }}>{message}</div>
        </div>
    );
}
