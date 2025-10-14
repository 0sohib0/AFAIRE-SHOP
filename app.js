// app.js

// 🔴 مفاتيح Supabase (تم الحصول عليها من ملف .env الخاص بك)
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ';

// إنشاء عميل Supabase (يستخدم مفتاح الـ anon)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

// ----------------------------------------------------
// 1. وظيفة جلب وعرض المنتجات (مُحدَّث لعرض سعر التخفيض)
// ----------------------------------------------------
async function loadProducts() {
    const grid = document.getElementById('dynamic-product-grid');
    
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    grid.innerHTML = ''; 

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
        const itemClass = (index === 0 && products.length > 1) ? 'large-item' : 'small-item'; 
        
        let priceDisplay = '';
        if (product.discount_price && product.discount_price < product.price) {
            // سعر التخفيض موجود: اعرض المخفض بخط كبير والأصلي مشطوب
            priceDisplay = `
                <span style="color: #ccc; text-decoration: line-through; font-size: 0.8em; margin-left: 10px;">${product.price} DZD</span>
                <span class="price" style="font-size: 1.2em;">${product.discount_price} DZD</span>
            `;
        } else {
            // لا يوجد تخفيض: اعرض السعر الأصلي فقط
            priceDisplay = `<span class="price">${product.price} DZD</span>`;
        }
        
        const productHtml = `
            <div class="product-item ${itemClass}">
                <img src="${product.img_path}" alt="${product.name}">
                <div class="product-info">
                    <span>${product.name}</span>
                    <div style="display: flex; align-items: center; justify-content: flex-end;">
                        ${priceDisplay}
                    </div>
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

    initializeModalButtons(); 
}

// ----------------------------------------------------
// 2. معالجة الـ Modal وإرسال الطلب (لم تتغير)
// ----------------------------------------------------
function initializeModalButtons() {
    const modal = document.getElementById('order-modal');
    const openBtns = document.querySelectorAll('.modal-open-btn'); 
    const closeBtn = document.querySelector('.modal-close-btn');
    const form = document.getElementById('orderForm');
    const statusMessage = document.getElementById('submissionStatus');
    const hiddenProductName = document.getElementById('hidden-product-name');
    const modalTitle = document.getElementById('modal-product-title');

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

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

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
    loadProducts();
});
