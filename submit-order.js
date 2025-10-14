// submit-order.js
const { createClient } = require('@supabase/supabase-js'); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
    
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are missing.");
        return res.status(500).json({ message: 'خطأ في إعدادات الخادم. يرجى مراجعة مفاتيح Supabase.' });
    }

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'الرجاء إرسال طلب POST.' });
        return;
    }

    try {
        const { 
            product, 
            client_name, 
            phone_number, 
            wilaya, 
            address, 
            quantity,
            // 🔴 جلب رقم الحذاء 🔴
            shoe_size 
        } = req.body;

        if (!client_name || !phone_number || !wilaya || !product || !shoe_size) {
            // 🔴 تحديث رسالة الخطأ لتشمل رقم الحذاء 🔴
            res.status(400).json({ message: 'الاسم، الهاتف، الولاية، اسم المنتج، ورقم الحذاء حقول مطلوبة.' });
            return;
        }
        
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
                    // 🔴 إدراج رقم الحذاء 🔴
                    shoe_size: parseInt(shoe_size),
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

        res.status(200).json({ 
            message: 'تم استلام الطلب بنجاح.', 
            orderId: data[0].id 
        });

    } catch (error) {
        console.error('General Server Error:', error);
        res.status(500).json({ message: 'خطأ داخلي في الخادم.' });
    }
}
