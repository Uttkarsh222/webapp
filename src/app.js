const express = require('express');
const healthRoutes = require('./routes/healthRoutes');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Route for health checks
app.use('/healthz', healthRoutes);

// Catch-all for unsupported routes, including the root if not defined elsewhere
app.use('*', (req, res) => {
    res.status(404).send();  // Respond with 404 Not Found for undefined routes
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
