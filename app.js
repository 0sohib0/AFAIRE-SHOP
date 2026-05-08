// app.js - نسخة محمية

document.addEventListener('DOMContentLoaded', () => {
    // المفاتيح الخاصة بمشروع الساعات في Supabase
    const SUPABASE_URL = 'https://lthjvfhaawxgvndobjhg.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0aGp2ZmhhYXd4Z3ZuZG9iamhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjY1NjIsImV4cCI6MjA5MzgwMjU2Mn0.pj3XRLAHUxspTQzyEQ0xnGTc5jtl7VbjDY-b894hCew';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); 

    async function loadProducts() {
        const grid = document.getElementById('dynamic-product-grid');
        if (!grid) return;
        
        const { data: products, error } = await supabase.from('products').select('*');
        grid.innerHTML = ''; 

        if (error) {
            grid.innerHTML = `<p style="color:red; width:100%; text-align:center;">خطأ في تحميل المنتجات.</p>`;
            return;
        }

        if (!products || products.length === 0) {
             grid.innerHTML = `<p style="color:yellow; width:100%; text-align:center;">لا توجد منتجات حاليًا.</p>`;
             return;
        }

        products.forEach((product, index) => {
            const displayPrice = product.discount_price || product.price;
            const originalPriceHtml = product.discount_price ? `<span class="original-price">${product.price} DZD</span>` : '';
            const itemClass = (index === 0 && products.length > 1) ? 'large-item' : 'small-item'; 
            
            grid.innerHTML += `
                <div class="product-item ${itemClass}">
                    <img src="${product.img_path}" alt="${product.name}">
                    <div class="product-info">
                        <span>${product.name}</span>
                        <div class="price-container"> 
                            <span class="price">${displayPrice} DZD</span>
                            ${originalPriceHtml} 
                        </div>
                    </div>
                    <button class="modal-open-btn" data-product-name="${product.name}">أطلب الآن</button>
                </div>
            `;
        });

        initializeModalButtons(); 
    }

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

        let currentProductInventory = {}; 
        
        async function checkInventory(productName, quantity) {
            if (!productName || quantity < 1) {
                submitBtn.disabled = true; return;
            }

            const { data, error } = await supabase.from('products').select('inventory_json').eq('name', productName).single();

            if (error || !data || !data.inventory_json) {
                submitBtn.disabled = false; submitBtn.textContent = 'تأكيد الطلب'; statusMessage.style.display = 'none'; return;
            }

            currentProductInventory = data.inventory_json;
            const availableStock = currentProductInventory["total"] || 0; 

            if (availableStock < parseInt(quantity)) {
                statusMessage.textContent = `❌ نفد المخزون. المتاح: ${availableStock}`;
                statusMessage.style.display = 'block'; statusMessage.style.color = '#ef4444'; 
                submitBtn.disabled = true; submitBtn.textContent = 'نفد المخزون';
            } else {
                statusMessage.style.display = 'none'; submitBtn.disabled = false; submitBtn.textContent = 'تأكيد الطلب';
            }
        }

        openBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const productName = btn.getAttribute('data-product-name');
                hiddenProductName.value = productName;
                modalTitle.textContent = `أطلب ${productName} الآن`;
                modal.style.display = 'flex'; statusMessage.style.display = 'none'; 
                form.reset(); hiddenQuantity.value = 1; currentProductInventory = {}; 
                checkInventory(productName, 1);
            });
        });

        clientOffer.addEventListener('change', (e) => {
            hiddenQuantity.value = e.target.value === '2_discounted' ? 2 : 1;
            checkInventory(hiddenProductName.value, hiddenQuantity.value);
        });

        closeBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries()); 
            
            const requiredQuantity = parseInt(data.quantity) || 1;
            const availableStock = currentProductInventory["total"] || 0;

            if (availableStock < requiredQuantity) {
                 statusMessage.textContent = `❌ المخزون غير كافٍ.`; statusMessage.style.color = 'red'; submitBtn.disabled = true; return;
            }
            
            statusMessage.textContent = 'جاري إرسال الطلب...'; statusMessage.style.display = 'block'; statusMessage.style.color = 'yellow';

            const { error: insertError } = await supabase.from('orders').insert([{ 
                product_name: data.product, client_name: data.client_name, phone_number: data.phone_number,
                wilaya: data.wilaya, detailed_address: data.address, quantity: requiredQuantity, 
                offer_type: data.offer_type, status: 'جديد' 
            }]);

            if (insertError) {
                statusMessage.textContent = `❌ فشل الإرسال`; statusMessage.style.color = 'red';
            } else {
                statusMessage.textContent = `✅ تم استلام طلبك بنجاح!`; statusMessage.style.color = 'green';
                form.reset(); checkInventory(data.product, 1); 
                setTimeout(() => modal.style.display = 'none', 3000); 
            }
        });
    }

    // تشغيل الدالة
    loadProducts();
});
