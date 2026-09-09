#!/bin/bash
# SIH25007 - Deployment Script
# This script configures environment variables for deployment to Render, Vercel, Supabase, and Sepolia.

echo "🚀 SIH25007 Full-Stack Deployment Initializer"
echo "============================================="

# 1. Database (Supabase)
echo "1. SUPABASE (PostgreSQL)"
echo "Create a Supabase project. Get your Connection String (URI)."
echo "Update backend/.env with DATABASE_URL"
echo ""

# 2. Blockchain (Sepolia)
echo "2. BLOCKCHAIN (Sepolia via Hardhat)"
echo "Ensure you have a Sepolia RPC URL (Infura/Alchemy) and a Private Key."
echo "Update backend/.env with BLOCKCHAIN_RPC_URL and PRIVATE_KEY."
echo "Run deployment:"
echo "cd smart-contracts && npx hardhat run scripts/deploy.js --network sepolia"
echo ""

# 3. Backend (Render)
echo "3. BACKEND (Render Node.js Web Service)"
echo "Push the monorepo to GitHub."
echo "In Render, create a new Web Service."
echo "Build Command: cd backend && npm install && npx prisma generate && npx prisma db push"
echo "Start Command: cd backend && npm start"
echo "Set Env Vars on Render:"
echo " - DATABASE_URL (from Supabase)"
echo " - CONTRACT_ADDRESS (from Sepolia deploy)"
echo " - BLOCKCHAIN_RPC_URL (Infura/Alchemy Sepolia URL)"
echo " - PRIVATE_KEY"
echo " - JWT_SECRET"
echo ""

# 4. Frontend (Vercel)
echo "4. FRONTEND (Vercel Next.js)"
echo "In Vercel, import the GitHub repository."
echo "Set the Root Directory to: web-dashboard"
echo "Framework Preset: Next.js"
echo "Set Env Var on Vercel:"
echo " - NEXT_PUBLIC_API_URL = https://your-render-backend-url.onrender.com/api/v1"
echo ""

# 5. Mobile App (Flutter)
echo "5. MOBILE APP (Flutter)"
echo "Open mobile-app/lib/services/api_service.dart"
echo "Change baseUrl to your Render backend URL."
echo "Build the APK:"
echo "cd mobile-app && flutter build apk --release"
echo ""

echo "✅ Deployment instructions generated successfully."
