const express = require('express');
const path = require('path');
const dgram = require('dgram'); // UDP module for creating SNMP trap listener

const app = express();
const port = 4000;
const ip_add = '192.168.1.109'; // IP Address for listening to traps

// Store the received traps
let traps = [];

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to attempt decoding SNMP trap message
function decodeTrapMessage(msg) {
    try {
        const pdu = snmp.PDU.fromBuffer(msg); // Trying to decode the trap
        const decodedTrap = {
            version: pdu.version,
            community: pdu.community,
            oid: pdu.enterprise.toString(),
            varbinds: pdu.varbinds.map(vb => ({
                oid: vb.oid.toString(),
                value: vb.value.toString()
            }))
        };
        return decodedTrap;
    } catch (error) {
        // If decoding fails, return both hex and ASCII message for further analysis
        return { 
            error: 'Failed to decode trap', 
            messageHex: msg.toString('hex'), // Hexadecimal format
            messageAscii: msg.toString('ascii') // ASCII format for better understanding
        };
    }
}

// Create a UDP server to listen for SNMP traps
const trapServer = dgram.createSocket('udp4');

trapServer.on('message', (msg, rinfo) => {
    const decodedTrap = decodeTrapMessage(msg); // Decode the trap or get the hexadecimal string
    const trapData = {
        source: rinfo.address,
        decodedMessage: decodedTrap // Store decoded message or hex message
    };
    traps.push(trapData);
    console.log(`Trap received from ${rinfo.address}:`, decodedTrap);
});

// Bind the trap listener to port 162 on the specific IP
trapServer.bind(162, ip_add, () => {
    console.log(`SNMP Trap listener started on IP ${ip_add} and port 162`);
});

// Serve the traps on the web interface
app.get('/', (req, res) => {
    res.render('trapindex', { traps });
});

app.listen(port, () => console.log(`Trap server is running on http://localhost:${port}`));
