# Email Notification Setup Script
# Run this script to set up email notifications

Write-Host "📧 Email Notification Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if functions folder exists
if (-not (Test-Path "functions")) {
    Write-Host "❌ Functions folder not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Step 1: Install dependencies
Write-Host "Step 1: Installing functions dependencies..." -ForegroundColor Yellow
Set-Location functions
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}
Set-Location ..

Write-Host ""
Write-Host "✅ Step 1 Complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Instructions
Write-Host "Step 2: Manual Steps Required" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create SendGrid account: https://sendgrid.com/" -ForegroundColor White
Write-Host "2. Get API key from SendGrid Dashboard → Settings → API Keys" -ForegroundColor White
Write-Host "3. Upgrade Firebase to Blaze plan (free tier available)" -ForegroundColor White
Write-Host ""
Write-Host "Then run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Set SendGrid API key" -ForegroundColor Gray
Write-Host "  npx firebase functions:config:set sendgrid.key=`"YOUR_API_KEY`"" -ForegroundColor White
Write-Host ""
Write-Host "  # Deploy functions" -ForegroundColor Gray
Write-Host "  npx firebase deploy --only functions" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full guide: See SENDGRID_SETUP.md" -ForegroundColor Cyan
Write-Host ""
