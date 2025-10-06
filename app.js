// app.js
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('order-modal');
    const openBtns = document.querySelectorAll('.modal-open-btn');
    const closeBtn = document.querySelector('.modal-close-btn');
    const form = document.getElementById('orderForm');
    const statusMessage = document.getElementById('submissionStatus');
    const hiddenProductName = document.getElementById('hidden-product-name');
    const modalTitle = document.getElementById('modal-product-title');

    // وظيفة فتح النافذة المنبثقة
    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productName = btn.getAttribute('data-product-name');
            hiddenProductName.value = productName;
            modalTitle.textContent = `أطلب ${productName} الآن (الدفع عند الاستلام)`;
            modal.style.display = 'flex'; 
            statusMessage.style.display = 'none'; 
        });
    });

    // وظيفة إغلاق النافذة المنبثقة
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // معالجة إرسال النموذج (API Call)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        statusMessage.textContent = 'جاري إرسال الطلب...';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'yellow';

        try {
            const response = await fetch('/api/submit-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json(); 

            if (response.ok) {
                // 🔴 إظهار رسالة التأكيد وإغلاق النافذة تلقائياً 🔴
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
                // الإغلاق التلقائي بعد 3 ثوانٍ (Alert احترافي)
                setTimeout(() => {
                    modal.style.display = 'none'; 
                }, 3000); 

            } else {
                statusMessage.textContent = `❌ فشل إرسال الطلب: ${result.message || 'خطأ غير معروف.'}`;
                statusMessage.style.color = 'red';
            }
        } catch (error) {
            statusMessage.textContent = '❌ خطأ في الشبكة. يرجى المحاولة لاحقاً.';
            statusMessage.style.color = 'red';
        }
    });
});
