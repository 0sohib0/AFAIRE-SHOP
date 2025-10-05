// api/submit-order.js

import { createClient } from '@supabase/supabase-js';
// لا نحتاج لـ 'node-fetch' بشكل صريح في Vercel الحديثة
// قم بإزالة الـ import الخاص بها إذا كان موجوداً

// 🔴 التعديل هنا: استخدام المفتاح السري لخدمة الكتابة الآمنة 🔴
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';

// المفتاح السري (Service Key) يتم قراءته من متغيرات البيئة في Vercel
// تأكد أن Key في Vercel هو 'SUPABASE_SERVICE_KEY'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; 

// إذا كان المفتاح السري موجوداً، نستخدمه لإنشاء العميل
if (!SUPABASE_SERVICE_KEY) {
    console.error("SUPABASE_SERVICE_KEY environment variable not set.");
    // يمكنك إضافة معالجة خطأ هنا إذا لم يتم العثور على المفتاح
}

// إنشاء العميل باستخدام مفتاح الخدمة الذي لديه صلاحيات الكتابة
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }, 
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { product, client_name, phone_number, wilaya, address, quantity } = req.body;

        if (!SUPABASE_SERVICE_KEY) {
             return res.status(500).json({ message: 'خطأ في إعدادات الخادم: المفتاح السري غير موجود.' });
        }
        
        // ... (بقية التحققات)

        const { data, error } = await supabase
            .from('orders')
            .insert([
                { 
                   // ... بيانات الطلب ...
                }
            ])
            .select('id'); 

        if (error) {
            console.error('Supabase Insertion Error:', error);
            // قد يكون هذا الخطأ بسبب RLS إذا كان مفعلاً
            return res.status(500).json({ message: 'فشل في إدخال الطلب: فشل في قاعدة البيانات.' });
        }
        
        return res.status(200).json({ 
            message: 'تم استلام الطلب بنجاح.', 
            orderId: data[0].id 
        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error.' });
    }
}
