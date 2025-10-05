// api/submit-order.js

import { createClient } from '@supabase/supabase-js';

// 🔴 المفاتيح الخاصة بك - تم دمجها هنا لضمان عدم وجود خطأ في قراءة متغيرات البيئة 🔴
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
// هذا هو المفتاح السري الذي أدخلته في Vercel كمتغير بيئة (SUPABASE_SERVICE_KEY)
// نحن نستخدمه مباشرة هنا لضمان نجاح الاتصال.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ'; 
// ملاحظة: بما أن RLS مُعطّل، يمكننا استخدام المفتاح العام هنا بنجاح

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }, 
    // إذا كنت تستخدم Node.js أقل من 18، قم بإضافة: global: { fetch: fetch } 
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
        
        // 🔴 العملية التي يجب أن تنجح الآن: إدراج البيانات 🔴
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
            // إذا فشل الإدراج الآن، فالمشكلة في الـ Table Schema (أسماء الأعمدة)
            return res.status(500).json({ message: 'فشل في إدخال الطلب: تحقق من أسماء الأعمدة في Supabase.', details: error.message });
        }
        
        return res.status(200).json({ 
            message: 'تم استلام الطلب بنجاح.', 
            orderId: data[0].id 
        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error.' });
    }
}
