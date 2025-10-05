// api/submit-order.js

import { createClient } from '@supabase/supabase-js';

// 🔴 استخدام المفتاح العام (Anon Key) لتقليل تعقيدات الأمان 🔴
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
const SUPABASE_KEY_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ';

// إنشاء العميل باستخدام المفتاح العام (Anon Key)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY_ANON, {
    auth: { persistSession: false }, 
});


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { product, client_name, phone_number, wilaya, address, quantity } = req.body;

        if (!client_name || !phone_number || !wilaya || !product) {
            return res.status(400).json({ message: 'الاسم، الهاتف، الولاية، واسم المنتج حقول مطلوبة.' });
        }
        
        // 🔴 العملية التي يجب أن تنجح فوراً مع تعطيل RLS 🔴
        const { data, error } = await supabase
            .from('orders')
            .insert([
                { 
                    product_name: product,
                    client_name: client_name,
                    phone_number: phone_number,
                    wilaya: wilaya,
                    detailed_address: address,
                    quantity: parseInt(quantity) || 1,
                    status: 'جديد' 
                }
            ])
            .select('id');

        if (error) {
            console.error('Supabase Insertion Error:', error);
            // إذا فشل الإدراج الآن، فالمشكلة الوحيدة هي خطأ في أسماء الأعمدة في الجدول
            return res.status(500).json({ message: 'فشل في إدخال الطلب: تحقق من أسماء الأعمدة في جدول orders.', details: error.message });
        }
        
        return res.status(200).json({ 
            message: 'تم استلام الطلب بنجاح.', 
            orderId: data[0].id 
        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error.' });
    }
}
