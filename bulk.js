const express = require('express');
const { Session } = require('snmp-native');
const path = require('path');

const app = express();
const port = 2000;
const ip_add = '192.168.1.200';
const community = 'private';

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Function to retrieve SNMP data
const getPortData = (oid, callback) => {
  const session = new Session({ host: ip_add, community });
  session.getSubtree({ oid }, (error, varbinds) => {
    const data = {};
    if (!error) {
      varbinds.forEach(vb => data[vb.oid[vb.oid.length - 1]] = vb.value);
    }
    callback(error, data);
    session.close();
  });
};

// Retrieve Interface Names
const getPortName = (callback) => getPortData([1, 3, 6, 1, 2, 1, 2, 2, 1, 2], callback);

// Retrieve Interface Status (Up/Down)
const getPortStatus = (callback) => getPortData([1, 3, 6, 1, 2, 1, 2, 2, 1, 7], (error, data) => {
  const portStatus = {};
  if (!error) {
    Object.entries(data).forEach(([port, value]) => portStatus[port] = value === 1 ? 'Up' : 'Down');
  }
  callback(error, portStatus);
});

// Retrieve System Information (Name and Description)
const getSystemInfo = (callback) => {
  const oids = [
    [1, 3, 6, 1, 2, 1, 1, 5, 0],  // System Name
    [1, 3, 6, 1, 2, 1, 1, 1, 0],  // System Description
  ];
  const session = new Session({ host: ip_add, community });
  session.getAll({ oids }, (error, varbinds) => {
    const data = {};
    if (!error) {
      varbinds.forEach(vb => {
        data[vb.oid.join('.')] = vb.value;
      });
    }
    callback(error, data);
    session.close();
  });
};

// Retrieve Interface Speed, Inbound, and Outbound Octets
const getPortTraffic = (callback) => {
  const oids = [
    [1, 3, 6, 1, 2, 1, 2, 2, 1, 5],  // Interface Speed
    [1, 3, 6, 1, 2, 1, 2, 2, 1, 10], // Inbound Octets
    [1, 3, 6, 1, 2, 1, 2, 2, 1, 16], // Outbound Octets
  ];
  const session = new Session({ host: ip_add, community });
  session.getAll({ oids }, (error, varbinds) => {
    const data = {};
    if (!error) {
      varbinds.forEach(vb => {
        data[vb.oid.join('.')] = vb.value;
      });
    }
    callback(error, data);
    session.close();
  });
};

// Route to display the port data and system info
app.get('/', (req, res) => {
  getPortStatus((error, portStatus) => {
    if (error) return res.status(500).send(`Error: ${error.message}`);
    getPortName((nameError, portName) => {
      if (nameError) return res.status(500).send(`Error: ${nameError.message}`);
      getSystemInfo((sysError, systemInfo) => {
        if (sysError) return res.status(500).send(`Error: ${sysError.message}`);
        getPortTraffic((trafficError, portTraffic) => {
          if (trafficError) return res.status(500).send(`Error: ${trafficError.message}`);
          res.render('getbulk', { portStatus, portName, systemInfo, portTraffic });
        });
      });
    });
  });
});

// Route to fetch SNMP data like system uptime
app.get('/snmp-data', (req, res) => {
  const TimeUp = '.1.3.6.1.2.1.1.3.0'; // Example OID for uptime
  const session = new Session({ host: ip_add, community });

  session.get({ oid: TimeUp }, (error, varbind) => {
    if (error) return res.status(500).send(`Error retrieving SNMP data: ${error.message}`);
    const snmpData = `${varbind.oid.join('.')} = ${varbind.value}`;
    res.send(`
      <html>
        <head><title>SNMP Data</title></head>
        <body>
          <h1>SNMP Data</h1>
          <p>${snmpData}</p>
          <form action="/" method="get"><button type="submit">Back</button></form>
        </body>
      </html>
    `);
    session.close();
  });
});

app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
