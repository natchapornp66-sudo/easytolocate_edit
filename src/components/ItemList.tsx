import React, { useEffect, useState } from 'react';
import { Item } from '../types'; // หรือ '../types/index'
import { fetchItems } from '../services/api';

export const ItemList: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchItems()
            .then((data) => {
                setItems(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load items:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>กำลังโหลดข้อมูลสินค้า...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {items.map((item) => (
                <div key={item.item_id} className="border p-4 rounded-lg shadow">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                    <p className="text-blue-600 font-semibold mt-2">
                        ราคา: {item.daily_price} บาท/วัน
                    </p>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
                        {item.category_name || 'ทั่วไป'}
                    </span>
                </div>
            ))}
        </div>
    );
};