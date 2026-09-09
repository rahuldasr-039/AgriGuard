require("dotenv").config();
const express = require("express");
const cors = require("cors");
const aiRoutes = require("./routes/ai-predictions");
const dashboardRoutes = require("./routes/dashboard");
const drugRoutes = require("./routes/drugs");
const authRoutes = require("./routes/auth");
const farmerRoutes = require("./routes/farmers");
const vetRoutes = require("./routes/veterinarians");
const testerRoutes = require("./routes/farm-testers");
const treatmentRoutes = require("./routes/treatments");
const productTestRoutes = require("./routes/product-tests");
const certificateRoutes = require("./routes/certificates");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/drugs", drugRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/farmers", farmerRoutes);
app.use("/api/v1/veterinarians", vetRoutes);
app.use("/api/v1/testers", testerRoutes);
app.use("/api/v1/treatments", treatmentRoutes);
app.use("/api/v1/product-tests", productTestRoutes);
app.use("/api/v1/certificates", certificateRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
