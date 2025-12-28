
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os'; // Import OS module

const app = express();
app.use(cors());

// Helper to find Local IP
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (localhost) and non-IPv4
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
};

// API Endpoint to get IP
app.get('/api/ip', (req, res) => {
    res.json({ ip: getLocalIP() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*", // السماح لأي جهاز بالاتصال (مؤقتاً للتطوير)
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("جهاز جديد متصل:", socket.id);

    // 1. الكمبيوتر يطلب مسح باركود
    socket.on("REQUEST_SCAN", (data) => {
        console.log("الكمبيوتر طلب مسح باركود");
        // إرسال الأمر لجميع الهواتف المتصلة (أو يمكن تخصيصه لاحقاً)
        io.emit("OPEN_CAMERA", data);
    });

    // 2. الهاتف يرسل نتيجة المسح
    socket.on("SCAN_RESULT", (data) => {
        console.log("تم استلام باركود من الهاتف:", data);
        // إرسال النتيجة للكمبيوتر
        io.emit("RECEIVE_BARCODE", data);
    });

    socket.on("disconnect", () => {
        console.log("جهاز قطع الاتصال:", socket.id);
    });
});

const PORT = 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 خادم المزامنة يعمل الآن على: http://localhost:${PORT}`);
    console.log(`📡 جاهز لربط الهواتف والكمبيوتر...`);
});
