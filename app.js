// app.js

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('order-modal');
    const openBtns = document.querySelectorAll('.modal-open-btn');
    const closeBtn = document.querySelector('.modal-close-btn');
    const form = document.getElementById('orderForm');
    const statusMessage = document.getElementById('submissionStatus');
    const hiddenProductName = document.getElementById('hidden-product-name');
    const modalTitle = document.getElementById('modal-product-title');

    // ... (كود فتح وإغلاق النافذة المنبثقة) ...

    // معالجة إرسال النموذج (API Call)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        statusMessage.textContent = 'جاري إرسال الطلب...';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'yellow';

        try {
            // 🔴 التأكيد النهائي للمسار والهيدرز 🔴
            const response = await fetch('/api/submit-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(data) // إرسال البيانات كـ JSON
            });

            // Vercel/Node.js قد يعطي استجابة ناجحة (200) حتى لو فشل الـ Supabase
            // لذا، يجب التأكد من قراءة الرد بشكل صحيح.
            const result = await response.json(); 

            if (response.ok && !result.details) { // إذا كانت الاستجابة 200 ولم تحمل تفاصيل خطأ
                
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
                // الإغلاق التلقائي بعد 3 ثوانٍ
                setTimeout(() => {
                    modal.style.display = 'none'; 
                }, 3000); 

            } else {
                 // إذا كانت الاستجابة غير 200 أو احتوت على تفاصيل خطأ من الخادم
                statusMessage.textContent = `❌ فشل: ${result.message || 'خطأ في الاتصال بالسيرفر.'}`;
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            statusMessage.textContent = '❌ خطأ في الشبكة. يرجى المحاولة لاحقاً.';
            statusMessage.style.color = 'red';
        }
    });
});
