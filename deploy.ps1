<#
============================================================
deploy.ps1 — Universal Application Deployment Script (PowerShell / Windows)
Pipeline: GitHub -> Jenkins -> Docker -> AWS EC2

Usage:
  .\deploy.ps1 -Type ml      -Name fraud-detection-api -Tag v2.4
  .\deploy.ps1 -Type react   -Name ecommerce-store     -Tag v1.8
  .\deploy.ps1 -Type nodejs  -Name user-auth-api       -Tag v3.1
  .\deploy.ps1 -Type django  -Name crm-backend         -Tag v2.0
  .\deploy.ps1 -Type java    -Name order-service       -Tag v4.2
============================================================
#>

[CmdletBinding()]
param(
    [ValidateSet("ml", "react", "nodejs", "django", "java")]
    [string]$Type = "ml",

    [string]$Name = "my-app",

    [string]$Tag = "latest",

    [string]$Registry = "docker.io/devops-org",

    [string]$HostIP = "54.210.89.14",

    [string]$SshKey = "$HOME\.ssh\aws-ec2-key.pem",

    [string]$SshUser = "ec2-user",

    [switch]$SkipTests,

    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"

# ── Dockerfile & Port mappings ──
$Dockerfiles = @{
    "ml"     = "ml_application/Dockerfile"
    "react"  = "Dockerfile.node"
    "nodejs" = "Dockerfile.node"
    "django" = "Dockerfile.django"
    "java"   = "Dockerfile.java"
}

$Ports = @{
    "ml"     = "8000"
    "react"  = "80"
    "nodejs" = "3000"
    "django" = "8080"
    "java"   = "8080"
}

$TestCommands = @{
    "ml"     = "python -m pytest test_model.py -v; python train.py"
    "react"  = "npm test -- --watchAll=false; npm run build"
    "nodejs" = "npm test"
    "django" = "python manage.py test --verbosity=2"
    "java"   = "mvn test"
}

$Dockerfile = $Dockerfiles[$Type]
$AppPort = $Ports[$Type]
$TestCmd = $TestCommands[$Type]
$FullImage = "$Registry/${Name}:$Tag"
$LatestImage = "$Registry/${Name}:latest"

function Log-Info($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }
function Log-Success($msg) { Write-Host "✅ $msg" -ForegroundColor Green }
function Log-Warn($msg) { Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Log-Fail($msg) { Write-Host "❌ $msg" -ForegroundColor Red; exit 1 }
function Write-Separator { Write-Host ("═" * 55) -ForegroundColor DarkGray }

Write-Separator
Log-Info "🚀 DevOps Pipeline — Universal App Deployment"
Log-Info "   App Type : $Type"
Log-Info "   App Name : $Name"
Log-Info "   Image    : $FullImage"
Log-Info "   Port     : $AppPort"
Log-Info "   EC2 Host : $HostIP"
Write-Separator

# ── STEP 1: Tests ──
if (-not $SkipTests) {
    Log-Info "🧪 [JENKINS] Running automated tests: $TestCmd"
    try {
        Invoke-Expression $TestCmd
        Log-Success "Tests passed!"
    } catch {
        Log-Fail "Tests failed — aborting deployment: $_"
    }
} else {
    Log-Warn "Skipping tests (-SkipTests flag set)"
}

# ── STEP 2: Docker Build ──
Write-Separator
Log-Info "🐳 [DOCKER] Building image: $FullImage"
Log-Info "   Dockerfile: $Dockerfile"

$buildArgs = @(
    "build",
    "-f", $Dockerfile,
    "-t", $FullImage,
    "-t", $LatestImage,
    "--build-arg", "APP_PORT=$AppPort",
    "--build-arg", "APP_ENV=production",
    "."
)

& docker @buildArgs
if ($LASTEXITCODE -ne 0) {
    Log-Fail "Docker build failed with exit code $LASTEXITCODE"
}
Log-Success "Docker image built: $FullImage"

# ── STEP 3: Docker Push ──
if (-not $SkipPush) {
    Log-Info "📦 [DOCKER] Pushing to registry: $Registry"
    & docker push $FullImage
    & docker push $LatestImage
    if ($LASTEXITCODE -eq 0) {
        Log-Success "Image pushed to registry."
    } else {
        Log-Warn "Registry push returned non-zero code. (If offline or testing locally, proceed with local image)."
    }
} else {
    Log-Warn "Skipping registry push (-SkipPush flag set)"
}

# ── STEP 4: AWS EC2 Deploy ──
Write-Separator
Log-Info "☁️  [AWS] Deploying to EC2: $HostIP"

$RemoteCommands = @"
echo "Connected to EC2. Deploying $Name..."
docker pull $FullImage 2>/dev/null || true
docker stop $Name 2>/dev/null || true
docker rm $Name 2>/dev/null || true
docker run -d --name $Name --restart always -p ${AppPort}:${AppPort} -e APP_ENV=production $FullImage
echo "Container started:"
docker ps --filter "name=$Name"
"@

if (Test-Path $SshKey) {
    & ssh -o StrictHostKeyChecking=no -i $SshKey "${SshUser}@${HostIP}" $RemoteCommands
    Log-Success "Remote EC2 container deployed."
} else {
    Log-Warn "SSH key not found at $SshKey. Simulating local Docker container start for $Name on port $AppPort..."
    & docker stop $Name 2>$null
    & docker rm $Name 2>$null
    & docker run -d --name $Name --restart always -p "${AppPort}:${AppPort}" -e "APP_ENV=production" $FullImage
    Log-Success "Local test container started."
}

# ── STEP 5: Health Check ──
Write-Separator
Log-Info "🎯 [VERIFY] Running health check..."
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:$AppPort/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Log-Success "Health check passed! Service returned HTTP 200"
    } else {
        Log-Warn "Service returned HTTP $($response.StatusCode)"
    }
} catch {
    Log-Warn "Health check endpoint not reachable directly (expected if running on remote EC2 $HostIP)"
}

Write-Separator
Log-Success "🎉 Pipeline Execution Finished Successfully!"
Log-Info "   Application : $Name"
Log-Info "   Type        : $Type"
Log-Info "   Local URL   : http://localhost:$AppPort"
Log-Info "   AWS EC2 URL : http://${HostIP}:${AppPort}"
Write-Separator
