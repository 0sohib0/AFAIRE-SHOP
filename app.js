// app.js

// المفاتيح الجديدة الخاصة بمشروع الساعات في Supabase
const SUPABASE_URL = 'https://lthjvfhaawxgvndobjhg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0aGp2ZmhhYXd4Z3ZuZG9iamhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjY1NjIsImV4cCI6MjA5MzgwMjU2Mn0.pj3XRLAHUxspTQzyEQ0xnGTc5jtl7VbjDY-b894hCew';

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
                            خطأ في تحميل المنتجات: تأكد من الاتصال بقاعدة البيانات.
                          </p>`;
        return;
    }

    if (!products || products.length === 0) {
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

    initializeModalButtons(); 
}

// ----------------------------------------------------
// 2. معالجة الـ Modal وإرسال الطلب (محدثة للمخزون الإجمالي)
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
    const submitBtn = form.querySelector('button[type="submit"]');

    let currentProductInventory = {}; // لتخزين المخزون الحالي
    
    // وظيفة جلب المخزون وتحديث حالة الزر (معدلة للساعات)
    async function checkInventory(productName, quantity) {
        if (!productName || quantity < 1) {
            submitBtn.disabled = true;
            return;
        }

        // جلب المخزون الحالي للمنتج من Supabase
        const { data, error } = await supabase
            .from('products')
            .select('inventory_json')
            .eq('name', productName)
            .single();

        if (error || !data || !data.inventory_json) {
            console.error('Failed to fetch inventory:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'تأكيد الطلب';
            statusMessage.style.display = 'none';
            return;
        }

        currentProductInventory = data.inventory_json;
        
        const requiredQuantity = parseInt(quantity);
        // قراءة المخزون الإجمالي "total"
        const availableStock = currentProductInventory["total"] || 0; 

        if (availableStock < requiredQuantity) {
            statusMessage.textContent = `❌ نفد المخزون. المتاح: ${availableStock}`;
            statusMessage.style.display = 'block';
            statusMessage.style.color = '#ef4444'; 
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
            hiddenQuantity.value = 1; // إعادة تعيين الكمية للوضع الافتراضي
            currentProductInventory = {}; 
            
            // التحقق من المخزون فور فتح النافذة
            checkInventory(productName, 1);
        });
    });

    // مراقبة التغييرات في العرض (الكمية)
    clientOffer.addEventListener('change', (e) => {
        if (e.target.value === '2_discounted') {
             hiddenQuantity.value = 2;
        } else {
             hiddenQuantity.value = 1;
        }
        checkInventory(hiddenProductName.value, hiddenQuantity.value);
    });

    // إغلاق النافذة
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
        
        const requiredQuantity = parseInt(data.quantity) || 1;
        const availableStock = currentProductInventory["total"] || 0;

        if (availableStock < requiredQuantity) {
             statusMessage.textContent = `❌ فشل الإرسال! المخزون غير كافٍ.`;
             statusMessage.style.color = 'red';
             submitBtn.disabled = true;
             return;
        }
        
        statusMessage.textContent = 'جاري إرسال الطلب...';
        statusMessage.style.display = 'block';
        statusMessage.style.color = 'yellow';

        try {
            // الإرسال المباشر لـ Supabase
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
                        offer_type: data.offer_type,
                        status: 'جديد' 
                    }
                ]);

            if (insertError) {
                console.error('Supabase Insertion Error:', insertError);
                statusMessage.textContent = `❌ فشل إرسال الطلب: (${insertError.message})`;
                statusMessage.style.color = 'red';
            } else {
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح! سنتصل بك خلال دقائق.`;
                statusMessage.style.color = 'green';
                form.reset();
                
                checkInventory(data.product, 1); 

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
    loadProducts();
});
