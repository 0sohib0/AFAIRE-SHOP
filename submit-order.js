// /api/submit-order.js

// يجب تثبيت هذه الحزمة: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

// 🔴 تنبيه أمني: يفضل استخدام مفاتيح البيئة (process.env.SUPABASE_URL و process.env.SUPABASE_KEY)
const supabaseUrl = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9YY1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ'; 

const supabase = createClient(supabaseUrl, supabaseKey);

// الدالة الرئيسية التي تستقبل طلبات HTTP
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الرجاء إرسال طلب POST.' });
    }

    try {
        // استخراج البيانات من الطلب
        const { 
            product, // من النموذج (app.js)
            client_name, 
            phone_number, 
            wilaya, 
            address, // من النموذج (app.js)
            quantity 
        } = req.body;

        // تحقق بسيط من البيانات الأساسية
        if (!client_name || !phone_number || !wilaya || !product) {
            return res.status(400).json({ message: 'الاسم، الهاتف، الولاية، واسم المنتج حقول مطلوبة.' });
        }
        
        // 💡 التصحيح: تغيير أسماء الأعمدة لتتطابق مع Supabase:
        // product_name بدلاً من product
        // detailed_address بدلاً من address
        const { data, error } = await supabase
            .from('orders')
            .insert([
                { 
                    product_name: product, // يُرسل 'product' لكن يُخزن في 'product_name'
                    client_name: client_name,
                    phone_number: phone_number,
                    wilaya: wilaya,
                    detailed_address: address, // يُرسل 'address' لكن يُخزن في 'detailed_address'
                    quantity: parseInt(quantity) || 1, 
                    status: 'جديد' 
                }
            ])
            .select('*');

        if (error) {
            console.error('Supabase Insertion Error:', error);
            return res.status(500).json({ 
                message: 'فشل في إدخال الطلب. تأكد من تطابق أسماء الأعمدة في Supabase.', 
                details: error.message 
            });
        }

        // إرسال رد النجاح
        return res.status(200).json({ 
            message: 'تم استلام الطلب بنجاح.', 
            orderId: data[0].id 
        });

    } catch (error) {
        console.error('General Server Error:', error);
        return res.status(500).json({ message: 'خطأ داخلي في الخادم.' });
    }
}
