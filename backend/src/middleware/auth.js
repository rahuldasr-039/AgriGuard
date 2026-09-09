const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key_for_sih_25007";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing or invalid token format" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token not provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Unauthorized: User not found or inactive" });
    }

    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: Token expired" });
    }
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
};

module.exports = { authenticate, authorize, JWT_SECRET };
