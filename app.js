// app.js

// 🔴 مفاتيح Supabase (تم الحصول عليها من ملف .env الخاص بك)
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ';

// إنشاء عميل Supabase (يستخدم مفتاح الـ anon)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

// ----------------------------------------------------
// 1. وظيفة جلب وعرض المنتجات
// ----------------------------------------------------
async function loadProducts() {
    const grid = document.getElementById('dynamic-product-grid');
    
    // جلب البيانات من جدول products
    // 🔴 تأكد أن سياسات RLS لجدول 'products' تسمح بدور 'anon' بالقراءة (SELECT)
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    grid.innerHTML = ''; // مسح رسالة التحميل

    if (error) {
        console.error('Error fetching products:', error);
        grid.innerHTML = `<p style="color:red; width:100%; text-align:center;">خطأ في تحميل المنتجات: ${error.message}. تأكد من إعداد RLS بشكل صحيح.</p>`;
        return;
    }

    if (products.length === 0) {
         grid.innerHTML = `<p style="color:yellow; width:100%; text-align:center;">لا توجد منتجات متاحة حاليًا. يرجى إضافتها من لوحة التحكم.</p>`;
         return;
    }

    // إنشاء بطاقات المنتجات ديناميكيًا
    products.forEach((product, index) => {
        // يمكن تغيير هذه الفئة لتحديد حجم البطاقة
        const itemClass = (index === 0 && products.length > 1) ? 'large-item' : 'small-item'; 
        
        const productHtml = `
            <div class="product-item ${itemClass}">
                <img src="${product.img_path}" alt="${product.name}">
                <div class="product-info">
                    <span>${product.name}</span>
                    <span class="price">${product.price} DZD</span>
                </div>
                <button 
                    class="modal-open-btn" 
                    data-product-id="${product.product_id}" 
                    data-product-name="${product.name}">
                    أطلب الآن
                </button>
            </div>
        `;
        grid.innerHTML += productHtml;
    });

    // بعد تحميل المنتجات، يجب إعادة ربط أزرار "أطلب الآن" بالـ Modal
    initializeModalButtons(); 
}

// ----------------------------------------------------
// 2. معالجة الـ Modal وإرسال الطلب (تم تعديلها لتكون دالة منفصلة)
// ----------------------------------------------------
function initializeModalButtons() {
    const modal = document.getElementById('order-modal');
    // 🔴 يجب أن نحدد الأزرار بعد تحميل المنتجات
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
            form.reset();
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
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
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
}


// ----------------------------------------------------
// 3. نقطة البداية (Start Point)
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // البدء بتحميل المنتجات عند تحميل الصفحة
    loadProducts();
});
