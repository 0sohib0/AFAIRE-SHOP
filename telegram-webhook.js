// api/telegram-webhook.js
// يجب أن يكون لديك ملف package.json يحتوي على 'node-fetch' إذا كنت تستخدم Node.js أقل من v18
import fetch from 'node-fetch'; 

// 🔴 تنبيه أمني: يفضل استخدام متغيرات البيئة في الخادم
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8296247378:AAEs8ZGTrN38EMIRA3OvGIJgmWUX6ehe7jc'; 
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '2093416949'; 

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// الدالة الرئيسية التي تستقبل طلب الـ Webhook من Supabase
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        // الـ Webhooks تعمل فقط بطلبات POST
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const payload = req.body;
        // Supabase ترسل البيانات في حقل 'record'
        const newRecord = payload.record; 
        
        // التحقق من وجود سجل جديد
        if (!newRecord) {
             return res.status(200).json({ message: 'No record found, likely a test payload.' });
        }

        // 1. استخراج البيانات من الطلب
        const { product_name, client_name, phone_number, wilaya, quantity, status, detailed_address } = newRecord;

        // 2. تنسيق رسالة الإشعار باستخدام Markdown للتحسين
        const messageText = `
        ✨ *طلب جديد في متجر SOHIB&HAMZA DZ!* ✨
        ----------------------------------
        
        *المنتج:* ${product_name}
        *الكمية:* ${quantity}
        
        *اسم العميل:* ${client_name}
        *الهاتف:* ${phone_number}
        *الولاية:* ${wilaya}
        *العنوان:* ${detailed_address}
        *الحالة:* ${status}
        ----------------------------------
        _الرجاء التأكيد فوراً عبر الاتصال بالعميل._
        `;
        
        // 3. إرسال الرسالة إلى API تيليجرام
        const telegramResponse = await fetch(TELEGRAM_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'Markdown' // لتمكين *النص الغامق* و _المائل_
            })
        });

        if (telegramResponse.ok) {
            return res.status(200).json({ message: 'Telegram alert sent successfully.' });
        } else {
            const errorData = await telegramResponse.json();
            console.error('Telegram API Error:', errorData);
            return res.status(500).json({ message: 'Failed to send Telegram alert.', details: errorData });
        }

    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ message: 'Internal Server Error.' });
    }
}
