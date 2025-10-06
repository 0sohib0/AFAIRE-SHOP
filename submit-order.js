// /api/submit-order.js

// 💡 تم التحويل إلى صيغة CommonJS (require)
const { createClient } = require('@supabase/supabase-js'); 

// قراءة المتغيرات من البيئة (Render سيقوم بحقنها، و dotenv سيقوم بحقنها محلياً)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

// الدالة الرئيسية التي تستقبل طلبات HTTP
module.exports = async function handler(req, res) {
    
    // التأكد من وجود مفاتيح البيئة قبل المتابعة (ضروري للتشخيص)
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are missing.");
        return res.status(500).json({ message: 'خطأ في إعدادات الخادم. يرجى مراجعة مفاتيح Supabase.' });
    }

    if (req.method !== 'POST') {
        // Render يتوقع منك تعيين رمز الحالة والرد
        res.status(405).json({ message: 'الرجاء إرسال طلب POST.' });
        return;
    }

    try {
        // استخراج البيانات من الطلب (هذه هي أسماء الحقول في النموذج)
        const { 
            product, 
            client_name, 
            phone_number, 
            wilaya, 
            address, 
            quantity 
        } = req.body;

        // تحقق بسيط من البيانات الأساسية
        if (!client_name || !phone_number || !wilaya || !product) {
            res.status(400).json({ message: 'الاسم، الهاتف، الولاية، واسم المنتج حقول مطلوبة.' });
            return;
        }
        
        // الإدراج باستخدام أسماء الأعمدة الصحيحة في Supabase
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
            .select('*'); 

        if (error) {
            console.error('Supabase Insertion Error:', error);
            res.status(500).json({ 
                message: 'فشل في إدخال الطلب. تأكد من تطابق أسماء الأعمدة في Supabase.', 
                details: error.message 
            });
            return;
        }

        // إرسال رد النجاح
        res.status(200).json({ 
            message: 'تم استلام الطلب بنجاح.', 
            orderId: data[0].id 
        });

    } catch (error) {
        console.error('General Server Error:', error);
        res.status(500).json({ message: 'خطأ داخلي في الخادم.' });
    }
}
