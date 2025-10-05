// app.js

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('order-modal');
    const openBtns = document.querySelectorAll('.modal-open-btn');
    const closeBtn = document.querySelector('.modal-close-btn');
    const form = document.getElementById('orderForm');
    const statusMessage = document.getElementById('submissionStatus');
    const hiddenProductName = document.getElementById('hidden-product-name');
    const modalTitle = document.getElementById('modal-product-title');

    // 1. التحكم في النافذة المنبثقة (Modal Controls)
    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productName = btn.getAttribute('data-product-name');
            
            // تحديث اسم المنتج في عنوان النافذة
            hiddenProductName.value = productName;
            modalTitle.textContent = `أطلب ${productName} الآن (الدفع عند الاستلام)`;
            
            modal.style.display = 'flex'; // فتح النافذة
            statusMessage.style.display = 'none'; 
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 2. معالجة إرسال النموذج (المنطق الخلفي)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        statusMessage.textContent = 'جاري إرسال الطلب...';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'yellow';

        try {
            // الاتصال بدالة submit-order.js المنشورة على Vercel
            const response = await fetch('/api/submit-order', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(data)
            });

            const result = await response.json(); 

            if (response.ok) {
                // إظهار رسالة النجاح
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
                // الإغلاق التلقائي (Alert احترافي)
                setTimeout(() => {
                    modal.style.display = 'none'; 
                }, 3000); 

            } else {
                 // عرض رسالة الخطأ من الخادم (Supabase/Vercel)
                statusMessage.textContent = `❌ فشل الإرسال: ${result.message || 'خطأ في الاتصال بالشبكة.'}`;
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            // خطأ شبكة عام
            statusMessage.textContent = '❌ خطأ في الشبكة. يرجى التحقق من الاتصال وإعادة المحاولة.';
            statusMessage.style.color = 'red';
        }
    });
});
