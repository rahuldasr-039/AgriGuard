const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let lookupEmail = email.trim().toLowerCase();
    if (lookupEmail === "farmer1@example.com") {
      lookupEmail = "farmer1@gmail.com";
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lookupEmail },
          { email: email.trim().toLowerCase() }
        ]
      },
      include: {
        farmerProfile: true,
        veterinarianProfile: true,
        farmTesterProfile: true,
        regulatorProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is suspended or inactive" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        farmerProfile: user.farmerProfile,
        veterinarianProfile: user.veterinarianProfile,
        farmTesterProfile: user.farmTesterProfile,
        regulatorProfile: user.regulatorProfile
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const generateCustomId = (role) => `ID${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

// POST /api/v1/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, notificationEmail, address, role, specificId } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const generatedId = specificId || generateCustomId(role);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        isActive: true
      }
    });

    // Create specific role profile
    if (role === "FARMER") {
      const regMobile = phone || "";
      await prisma.farmer.create({
        data: {
          farmerId: generatedId,
          userId: user.id,
          fullName: name || "Unknown",
          mobileNumber: regMobile,
          notificationEmail: notificationEmail || null,
          emailNotificationsEnabled: true,
          fullAddress: address || "",
          farmLocation: address || "",
          animalCategories: "Unspecified",
          approvalStatus: "PENDING"
        }
      });
    } else if (role === "VETERINARIAN") {
      await prisma.veterinarian.create({
        data: {
          vetId: generatedId,
          userId: user.id,
          fullName: name || "Unknown",
          governmentId: `GV${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          mobileNumber: phone || "",
          address: address || "",
          qualification: "Pending",
          licenseInfo: "Pending",
          approvalStatus: "PENDING"
        }
      });
    }

    res.status(201).json({ message: "Registration successful. Pending verification." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
