// api/submit-order.js
// ... (بقية الـ Imports والمفاتيح)

// 🔴 التعديل هنا لإجبار تجاوز RLS عند استخدام مفتاح الخدمة 🔴
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }, 
    global: { fetch: fetch } 
    // لا نحتاج لخيارات إضافية هنا، بل في الكود الذي ينفذ الـ INSERT
});


export default async function handler(req, res) {
    // ... (بقية التحققات)

    try {
        // ... (استخراج البيانات)
        
        // 🔴 التعديل الجذري: إضافة .rpc() أو استخدام 'public' schema بشكل صريح 🔴
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
            ], 
            // 💡 هذه الإضافة هي التي تجعل الطلب يتجاوز RLS في بعض الحالات:
            { returning: 'minimal' }) 
            .select('id'); 
            
            // ... (بقية معالجة الخطأ والرد)
            
    } catch (error) {
        // ... (معالجة الخطأ)
    }
}
