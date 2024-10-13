const express = require('express');
const path = require('path');

const app = express();
const port = 8080;

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route for the home page
app.get('/', (req, res) => {
    res.render('index'); // Render the index.ejs page
});

// Other routes
app.get('/', (req, res) => {
    res.send('This is page 1');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
