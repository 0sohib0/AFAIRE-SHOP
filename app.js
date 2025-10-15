// app.js

// 🔴 مفاتيح Supabase (لم تتغير)
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY8559j5wnQ';

// إنشاء عميل Supabase (يستخدم مفتاح الـ anon)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

// ----------------------------------------------------
// 1. وظيفة جلب وعرض المنتجات (محدثة لعرض التخفيض)
// ----------------------------------------------------
async function loadProducts() {
    const grid = document.getElementById('dynamic-product-grid');
    
    // جلب البيانات من جدول products
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
        // تحديد السعر للعرض (سعر التخفيض إذا وُجد، وإلا فالسعر العادي)
        const displayPrice = product.discount_price || product.price;
        
        // تجهيز السعر الأصلي إذا كان هناك تخفيض
        const originalPriceHtml = product.discount_price ? 
            `<span class="original-price">${product.price} DZD</span>` : '';
        
        const itemClass = (index === 0 && products.length > 1) ? 'large-item' : 'small-item'; 
        
        const productHtml = `
            <div class="product-item ${itemClass}">
                <img src="${product.img_path}" alt="${product.name}">
                <div class="product-info">
                    <span>${product.name}</span>
                    <div class="price-container"> 
                        <span class="price">${displayPrice} DZD</span>
                        ${originalPriceHtml} 
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

    // بعد تحميل المنتجات، يجب إعادة ربط أزرار "أطلب الآن" بالـ Modal
    initializeModalButtons(); 
}

// ----------------------------------------------------
// 2. معالجة الـ Modal وإرسال الطلب (محدثة لإرسال رقم الحذاء)
// ----------------------------------------------------
function initializeModalButtons() {
    const modal = document.getElementById('order-modal');
    const openBtns = document.querySelectorAll('.modal-open-btn'); 
    const closeBtn = document.querySelector('.modal-close-btn');
    const form = document.getElementById('orderForm');
    const statusMessage = document.getElementById('submissionStatus');
    const hiddenProductName = document.getElementById('hidden-product-name');
    const modalTitle = document.getElementById('modal-product-title');
    const hiddenQuantity = document.getElementById('hidden-quantity');
    const clientOffer = document.getElementById('clientOffer');


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

    // تحديث حقل الكمية المخفي بناءً على خيار العرض
    clientOffer.addEventListener('change', (e) => {
        // هنا يمكنك إضافة منطق لتحديد الكمية بناءً على قيمة العرض
        // مثلاً: إذا كان العرض هو '2_discounted' فإن الكمية = 2
        if (e.target.value === '2_discounted') {
             hiddenQuantity.value = 2;
        } else if (e.target.value === '3_regular') {
             hiddenQuantity.value = 3;
        } else {
             hiddenQuantity.value = 1;
        }
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

    // معالجة إرسال النموذج (Supabase direct call)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries()); 
        
        // إظهار رسالة الإرسال
        statusMessage.textContent = 'جاري إرسال الطلب...';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'yellow';

        try {
            // 🚨 الإرسال المباشر لـ Supabase
            const { error } = await supabase
                .from('orders')
                .insert([
                    { 
                        product_name: data.product,
                        client_name: data.client_name,
                        phone_number: data.phone_number,
                        wilaya: data.wilaya,
                        detailed_address: data.address, 
                        quantity: parseInt(data.quantity) || 1, 
                        // 💡 الإضافة الجديدة لرقم الحذاء:
                        shoe_size: parseInt(data.shoe_size) || null,
                        // 💡 إرسال نوع العرض
                        offer_type: data.offer_type,
                        // --------------------------
                        status: 'جديد' 
                    }
                ]);

            if (error) {
                console.error('Supabase Insertion Error:', error);
                statusMessage.textContent = `❌ فشل إرسال الطلب: ${error.message}. تأكد من إعداد RLS بشكل صحيح.`;
                statusMessage.style.color = 'red';
            } else {
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
                setTimeout(() => {
                    modal.style.display = 'none'; 
                }, 3000); 
            }
        } catch (error) {
            statusMessage.textContent = '❌ خطأ في الإرسال. يرجى المحاولة لاحقاً.';
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
