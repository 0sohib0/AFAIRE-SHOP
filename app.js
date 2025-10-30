// app.js

// 🔴 المفاتيح: يرجى التأكد من أن هذه المفاتيح كاملة ومطابقة لما في Supabase
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
// يجب استبدال القيمة التالية بالمفتاح العام (anon key) الكامل والصحيح من إعدادات API في Supabase
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ';

// إنشاء عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

// ----------------------------------------------------
// 1. وظيفة جلب وعرض المنتجات 
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
        grid.innerHTML = `<p style="color:red; width:100%; text-align:center;">
                            خطأ في تحميل المنتجات: تأكد من تفعيل سياسة SELECT لجدول products.
                          </p>`;
        return;
    }

    if (products.length === 0) {
         grid.innerHTML = `<p style="color:yellow; width:100%; text-align:center;">لا توجد منتجات متاحة حاليًا. يرجى إضافتها.</p>`;
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

    initializeModalButtons(); 
}

// ----------------------------------------------------
// 2. معالجة الـ Modal وإرسال الطلب (تمت إعادة إضافة منطق المخزون الآمن)
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
    const clientSizeInput = document.getElementById('clientSize');
    const submitBtn = form.querySelector('button[type="submit"]');

    let currentProductInventory = {}; // لتخزين المخزون الحالي للمنتج المحدد
    
    // وظيفة جلب المخزون وتحديث حالة الزر
    async function checkInventory(productName, size, quantity) {
        // السماح بالتحقق فقط إذا كان رقم الحذاء والكمية مدخلين
        if (!productName || !size || quantity < 1) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'اختر رقم الحذاء أولاً';
            return;
        }

        // 1. جلب المخزون الحالي للمنتج من Supabase
        const { data, error } = await supabase
            .from('products')
            .select('inventory_json')
            .eq('name', productName)
            .single();

        if (error || !data || !data.inventory_json) {
            console.error('Failed to fetch inventory:', error);
            // في حالة الخطأ، نعتبر المخزون متاحًا ونعتمد على الزناد لمنع تكرار الطلب على الخادم
            submitBtn.disabled = false;
            submitBtn.textContent = 'تأكيد الطلب';
            statusMessage.style.display = 'none';
            return;
        }

        currentProductInventory = data.inventory_json;
        
        // 2. التحقق من المخزون للقياس المحدد
        const requiredQuantity = parseInt(quantity);
        // قراءة المخزون من الـ JSONB، القيمة الافتراضية هي صفر
        const availableStock = currentProductInventory[String(size)] || 0; 

        if (availableStock < requiredQuantity) {
            statusMessage.textContent = `❌ نفد المخزون للقياس رقم ${size}. المخزون المتاح: ${availableStock}`;
            statusMessage.style.display = 'block';
            statusMessage.style.color = '#ef4444'; // أحمر
            submitBtn.disabled = true;
            submitBtn.textContent = 'نفد المخزون';
        } else {
            statusMessage.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.textContent = 'تأكيد الطلب';
        }
    }


    // وظيفة فتح النافذة المنبثقة
    openBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const productName = btn.getAttribute('data-product-name');
            hiddenProductName.value = productName;
            modalTitle.textContent = `أطلب ${productName} الآن (الدفع عند الاستلام)`;
            modal.style.display = 'flex'; 
            statusMessage.style.display = 'none'; 
            form.reset();
            currentProductInventory = {}; // مسح المخزون السابق
            submitBtn.disabled = true; // إغلاق الزر حتى يتم اختيار رقم الحذاء
            submitBtn.textContent = 'اختر رقم الحذاء أولاً';
        });
    });

    // مراقبة التغييرات في الحقول التي تؤثر على المخزون
    const inventoryChangeHandler = () => {
        const productName = hiddenProductName.value;
        const size = clientSizeInput.value;
        const quantity = hiddenQuantity.value;
        checkInventory(productName, size, quantity);
    };

    clientOffer.addEventListener('change', (e) => {
        // تحديث الكمية بناءً على العرض المختار
        if (e.target.value === '2_discounted') {
             hiddenQuantity.value = 2;
        } else {
             hiddenQuantity.value = 1;
        }
        inventoryChangeHandler();
    });

    clientSizeInput.addEventListener('input', inventoryChangeHandler);


    // وظيفة إغلاق النافذة المنبثقة (بدون تغيير)
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 🔴 معالجة إرسال النموذج 
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries()); 
        
        // إعادة التحقق السريع في الواجهة قبل الإرسال
        const requiredQuantity = parseInt(data.quantity) || 1;
        const selectedSize = parseInt(data.shoe_size) || null;
        const availableStock = currentProductInventory[String(selectedSize)] || 0;

        if (availableStock < requiredQuantity) {
             statusMessage.textContent = `❌ فشل الإرسال! المخزون غير كافٍ.`;
             statusMessage.style.color = 'red';
             submitBtn.disabled = true;
             return;
        }
        
        // إظهار رسالة الإرسال
        statusMessage.textContent = 'جاري إرسال الطلب...';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'yellow';

        try {
            // 🚨 الإرسال المباشر لـ Supabase (الزناد سيقوم بالخصم بعد هذا الإرسال)
            const { error: insertError } = await supabase
                .from('orders')
                .insert([
                    { 
                        product_name: data.product,
                        client_name: data.client_name,
                        phone_number: data.phone_number,
                        wilaya: data.wilaya,
                        detailed_address: data.address, 
                        quantity: requiredQuantity, 
                        shoe_size: selectedSize,
                        offer_type: data.offer_type,
                        status: 'جديد' 
                    }
                ]);

            if (insertError) {
                console.error('Supabase Insertion Error:', insertError);
                statusMessage.textContent = `❌ فشل إرسال الطلب: (${insertError.message})`;
                statusMessage.style.color = 'red';
            } else {
                // ✅ النجاح: هنا سيقوم الزناد بخصم المخزون على الخادم
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
                // تحديث المخزون في الواجهة بعد الإرسال لإغلاق الزر إذا نفد المخزون
                checkInventory(data.product, selectedSize, 1); 

                setTimeout(() => {
                    modal.style.display = 'none'; 
                }, 3000); 
            }
        } catch (error) {
            statusMessage.textContent = '❌ خطأ في الشبكة أو الإرسال. يرجى المحاولة لاحقاً.';
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
