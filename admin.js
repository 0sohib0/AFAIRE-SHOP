const submitOrderHandler = require('./api/submit-order.js');

Exporter vers Sheets
...

// المفاتيح الخاصة بك
const SUPABASE_URL = 'https://lpvrwuwzytuqvqlmsmpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdnJ3dXd6eXR1cXZxbG1zbXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDEzODQsImV4cCI6MjA3NTIxNzM4NH0.J_gc9Y1BwMOTZEhCzw8iyhZS7DcngYUVaHY859j5wnQ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const elements = {
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    dashboard: document.getElementById('admin-dashboard'),
    ordersTableBody: document.querySelector('#orders-table tbody'),
    loadingMessage: document.getElementById('loading-message'),
    totalOrders: document.getElementById('total-orders'),
    newOrders: document.getElementById('new-orders'),
    authError: document.getElementById('auth-error')
};

const STATUSES = ['جديد', 'قيد التأكيد', 'قيد الشحن', 'تم التوصيل', 'ملغى'];

// 1. وظيفة تسجيل الدخول
elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    elements.authError.textContent = '';

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        elements.authError.textContent = `فشل: ${error.message}`;
    } else {
        elements.loginModal.style.display = 'none';
        checkAuthStatus();
    }
});

// 2. وظيفة تسجيل الخروج
elements.logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        checkAuthStatus();
    }
});

// 3. عرض شاشة تسجيل الدخول
elements.loginBtn.addEventListener('click', () => {
    elements.loginModal.style.display = 'flex';
});

// 4. عرض/إخفاء لوحة التحكم بناءً على حالة المصادقة
async function checkAuthStatus() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        elements.loginBtn.style.display = 'none';
        elements.logoutBtn.style.display = 'block';
        elements.dashboard.style.display = 'block';
        elements.loginModal.style.display = 'none';
        loadOrders();
    } else {
        elements.loginBtn.style.display = 'block';
        elements.logoutBtn.style.display = 'none';
        elements.dashboard.style.display = 'none';
        elements.ordersTableBody.innerHTML = '';
        elements.loadingMessage.style.display = 'none';
    }
}

// 5. تحميل الطلبات من Supabase
async function loadOrders() {
    elements.loadingMessage.style.display = 'block';

    // 💡 جلب جميع الأعمدة المطلوبة
    const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, product_name, client_name, phone_number, wilaya, detailed_address, quantity, status')
        .order('created_at', { ascending: false });

    elements.loadingMessage.style.display = 'none';
    
    if (error) {
        elements.ordersTableBody.innerHTML = `<tr><td colspan="9" style="color:red;">خطأ في جلب البيانات: ${error.message}</td></tr>`;
        return;
    }

    renderOrders(data);
}

// 6. عرض الطلبات في الجدول
function renderOrders(orders) {
    elements.ordersTableBody.innerHTML = '';
    let newCount = 0;

    orders.forEach(order => {
        if (order.status === 'جديد') newCount++;

        const row = elements.ordersTableBody.insertRow();
        row.dataset.orderId = order.id;

        // الأعمدة
        row.insertCell().textContent = order.id;
        row.insertCell().textContent = order.product_name;
        row.insertCell().textContent = order.client_name;
        row.insertCell().textContent = order.phone_number;
        row.insertCell().textContent = order.wilaya;
        row.insertCell().textContent = order.detailed_address || 'N/A';
        row.insertCell().textContent = order.quantity;


        // عمود الحالة (مع قائمة منسدلة)
        const statusCell = row.insertCell();
        statusCell.innerHTML = createStatusSelect(order.status, order.id);

        // عمود الإجراءات (زر التحديث)
        const actionCell = row.insertCell();
        const updateBtn = document.createElement('button');
        updateBtn.textContent = 'تحديث الحالة';
        updateBtn.className = 'status-update-btn';
        updateBtn.addEventListener('click', () => updateOrderStatus(order.id));
        actionCell.appendChild(updateBtn);
    });

    // تحديث الإحصائيات
    elements.totalOrders.textContent = orders.length;
    elements.newOrders.textContent = newCount;
}

// 7. إنشاء القائمة المنسدلة للحالة
function createStatusSelect(currentStatus, orderId) {
    let html = `<select class="status-select" data-order-id="${orderId}">`;
    STATUSES.forEach(status => {
        const selected = status === currentStatus ? 'selected' : '';
        html += `<option value="${status}" ${selected}>${status}</option>`;
    });
    html += '</select>';
    return html;
}

// 8. وظيفة تحديث حالة الطلب
async function updateOrderStatus(orderId) {
    const selectElement = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
    const newStatus = selectElement.value;
    
    // تأكيد تحديث الحالة
    if (!confirm(`هل أنت متأكد من تغيير حالة الطلب ${orderId} إلى: ${newStatus}؟`)) {
        return;
    }

    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        alert('فشل تحديث الحالة: ' + error.message);
    } else {
        alert('تم تحديث الحالة بنجاح!');
        loadOrders(); // إعادة تحميل الطلبات
    }
}

// البدء بالتحقق من حالة المصادقة عند تحميل الصفحة
checkAuthStatus();


