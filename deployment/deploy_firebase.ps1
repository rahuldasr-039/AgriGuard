Write-Host "Deploying Full Stack to Firebase (App Hosting)..."
Write-Host "Make sure you have Firebase CLI installed: npm i -g firebase-tools"
Write-Host ""
Set-Location "../"
firebase login
firebase init apphosting
firebase apphosting:backends:create
Write-Host "Firebase deployment triggered."
