Write-Host "Deploying Frontend to Vercel..."
Write-Host "Make sure you have Vercel CLI installed: npm i -g vercel"
Write-Host ""
Set-Location "../web-dashboard"
vercel --prod
