// /api/submit-order.js

// يجب تثبيت هذه الحزمة: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');


// 🔴 التصحيح: استخدام متغيرات البيئة (process.env)
// Vercel يجب أن يقوم بحقن هذه القيم من إعدادات البيئة (SUPABASE_URL و SUPABASE_KEY)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

// الدالة الرئيسية التي تستقبل طلبات HTTP
export default async function handler(req, res) {
    // التأكد من وجود مفاتيح البيئة قبل المتابعة
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are missing.");
        return res.status(500).json({ message: 'خطأ في إعدادات الخادم. يرجى مراجعة مفاتيح Supabase.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'الرجاء إرسال طلب POST.' });
    }

    try {
        // استخراج البيانات من الطلب (هذه هي أسماء الحقول في النموذج)
        const { 
            product, 
            client_name, 
            phone_number, 
            wilaya, 
            address, // العنوان التفصيلي
            quantity 
        } = req.body;

        // تحقق بسيط من البيانات الأساسية
        if (!client_name || !phone_number || !wilaya || !product) {
            return res.status(400).json({ message: 'الاسم، الهاتف، الولاية، واسم المنتج حقول مطلوبة.' });
        }
        
        // 💡 التصحيح: الإدراج باستخدام أسماء الأعمدة الصحيحة في Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert([
                { 
                    // product_name و detailed_address يتطابقان مع الجدول
                    product_name: product,
                    client_name: client_name,
                    phone_number: phone_number,
                    wilaya: wilaya,
                    detailed_address: address, 
                    quantity: parseInt(quantity) || 1, 
                    status: 'جديد' 
                }
            ])
            .select('*'); 

        if (error) {
            console.error('Supabase Insertion Error:', error);
            // إرسال رسالة خطأ واضحة للمساعدة في التشخيص
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

