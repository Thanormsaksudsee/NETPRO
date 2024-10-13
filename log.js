const express = require('express');
const { Session } = require('snmp-native');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;
const ip_add = '192.168.1.200'; // IP ของอุปกรณ์ Router/Switch
const community = 'private'; // SNMP community string

// ใช้เก็บข้อมูล traffic
let trafficData = {
    inbound: [],
    outbound: [],
    timestamps: []
};

// Function เพื่อดึงข้อมูล SNMP สำหรับ inbound และ outbound traffic
const getTrafficData = (callback) => {
    const session = new Session({ host: ip_add, community });
    const oids = [
        [1,3,6,1,2,1,2,2,1,10,1], // Inbound Octets
        [1, 3, 6, 1, 2, 1, 2, 2, 1, 16,1]  // Outbound Octets
    ];
    
    session.getAll({ oids }, (error, varbinds) => {
        if (error) {
            console.error('Failed to get traffic data', error);
            callback(error);
        } else {
            const inbound = varbinds[0].value; // Inbound traffic
            const outbound = varbinds[1].value; // Outbound traffic
            const timestamp = new Date(); // Current time

            // เก็บข้อมูลที่ได้ลงใน trafficData
            trafficData.inbound.push(inbound);
            trafficData.outbound.push(outbound);
            trafficData.timestamps.push(timestamp);

            // เก็บแค่ 24 ชั่วโมง
            if (trafficData.timestamps.length > 1440) { // 1440 นาที = 1 วัน
                trafficData.inbound.shift();
                trafficData.outbound.shift();
                trafficData.timestamps.shift();
            }

            callback(null, { inbound, outbound, timestamp });
        }
        session.close();
    });
};

// ตั้งให้ดึงข้อมูลทุก 1 นาที
setInterval(() => {
    getTrafficData((err, data) => {
        if (!err) {
            console.log(`Inbound: ${data.inbound}, Outbound: ${data.outbound}, Time: ${data.timestamp}`);
        }
    });
}, 60000); // 1 นาที = 60000 ms

// Route เพื่อแสดงหน้าตา log แบบกราฟ
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('logindex', { trafficData });
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));

