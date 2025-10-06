// server.js
const express = require('express');
// قراءة المتغيرات من ملف .env محلياً
require('dotenv').config(); 

// استيراد دالة معالجة الطلب (بصيغة CommonJS)
const submitOrderHandler = require('./api/submit-order'); 

const app = express();
const port = process.env.PORT || 3000; 

// Middleware لتمكين قراءة JSON من الطلبات
app.use(express.json());

// 1. تقديم الملفات الثابتة (الواجهة الأمامية)
// يخدم الملفات مثل index.html و app.js و styles.css من جذر المشروع
app.use(express.static(__dirname)); 

// 2. تعريف مسار API
// عند استقبال طلب POST إلى /api/submit-order، يتم تمريره إلى دالة submitOrderHandler
app.post('/api/submit-order', async (req, res) => {
    // يجب أن تكون الدالة قادرة على التعامل مع req, res
    await submitOrderHandler(req, res);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});