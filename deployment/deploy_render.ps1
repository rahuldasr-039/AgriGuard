Write-Host "Deploying Backend to Render..."
Write-Host "Make sure you have connected your Render account to GitHub."
Write-Host "This script simulates pushing the code to trigger a Render deploy."
Write-Host ""
Set-Location "../"
git add .
git commit -m "Deploy to render"
git push origin main
Write-Host "Backend pushed. Render will auto-deploy."
