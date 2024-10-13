const express = require('express');
const { Session } = require('snmp-native');
const path = require('path');

const app = express();
const port = 1000;
const ip_add = '192.168.1.200';
const community = 'private';

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to convert TimeTicks to hours and minutes
const formatUptime = (ticks) => {
  const seconds = ticks / 100; // 1 tick = 10 milliseconds, so 100 ticks = 1 second
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours} hours, ${minutes} minutes`;
};

// Function to get SNMP data
const getSNMPData = (oids, callback) => {
  const session = new Session({ host: ip_add, community });
  session.getAll({ oids }, (error, varbinds) => {
    const data = {};
    if (!error) {
      varbinds.forEach(vb => {
        // Check if it's System Uptime OID to convert
        if (vb.oid.join('.') === '1.3.6.1.2.1.1.3.0') {
          data[vb.oid.join('.')] = formatUptime(vb.value); // Convert to hours and minutes
        } else {
          data[vb.oid.join('.')] = vb.value; // Store OID and its value
        }
      });
    }
    callback(error, data);
    session.close();
  });
};

app.get('/', (req, res) => {
  // Define more OIDs for additional data like CPU, Memory, Errors, Discards, etc.
  const oids = [
    [1, 3, 6, 1, 2, 1, 1, 5, 0],   // Interface Name
    [1, 3, 6, 1, 2, 1, 2, 1, 0],   // Interface Status
    [1, 3, 6, 1, 2, 1, 1, 3, 0],   // System Uptime
    [1, 3, 6, 1, 4, 1, 9, 2, 1, 56, 0], // CPU Load (Cisco)
    [1, 3, 6, 1, 2, 1, 1, 1, 0],        // System Description
    [1,3,6,1,2,1,31,1,1,1,1,1],        // System Description

  ];

  getSNMPData(oids, (error, data) => {
    if (error) return res.status(500).send(`Error: ${error.message}`);
    res.render('getindex', { data });
  });
});

app.listen(port, () => console.log(`GET Server is running on http://localhost:${port}`));
