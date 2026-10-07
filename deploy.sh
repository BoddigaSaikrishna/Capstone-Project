#!/usr/bin/env bash
# ============================================================
# deploy.sh — Universal Application Deployment Script
# Pipeline: GitHub -> Jenkins -> Docker -> AWS EC2
#
# Usage:
#   ./deploy.sh --type ml      --name fraud-detection-api --tag v2.4
#   ./deploy.sh --type react   --name ecommerce-store     --tag v1.8
#   ./deploy.sh --type nodejs  --name user-auth-api       --tag v3.1
#   ./deploy.sh --type django  --name crm-backend         --tag v2.0
#   ./deploy.sh --type java    --name order-service       --tag v4.2
# ============================================================

set -euo pipefail

# ── Defaults ─────────────────────────────────────────────────
APP_TYPE="ml"
APP_NAME="my-app"
IMAGE_TAG="latest"
DOCKER_REGISTRY="docker.io/devops-org"
AWS_EC2_HOST="54.210.89.14"
AWS_SSH_KEY="~/.ssh/aws-ec2-key.pem"
AWS_SSH_USER="ec2-user"
SKIP_TESTS=false
SKIP_PUSH=false

# ── Dockerfile map ───────────────────────────────────────────
declare -A DOCKERFILE_MAP=(
  [ml]="ml_application/Dockerfile"
  [react]="Dockerfile.node"
  [nodejs]="Dockerfile.node"
  [django]="Dockerfile.django"
  [java]="Dockerfile.java"
)

declare -A PORT_MAP=(
  [ml]="8000"
  [react]="80"
  [nodejs]="3000"
  [django]="8080"
  [java]="8080"
)

declare -A TEST_CMD_MAP=(
  [ml]="python -m pytest test_model.py -v && python train.py"
  [react]="npm run test -- --watchAll=false && npm run build"
  [nodejs]="npm test"
  [django]="python manage.py test --verbosity=2"
  [java]="mvn test"
)

# ── Argument Parser ──────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --type)     APP_TYPE="$2";         shift 2 ;;
    --name)     APP_NAME="$2";         shift 2 ;;
    --tag)      IMAGE_TAG="$2";        shift 2 ;;
    --registry) DOCKER_REGISTRY="$2"; shift 2 ;;
    --host)     AWS_EC2_HOST="$2";     shift 2 ;;
    --key)      AWS_SSH_KEY="$2";      shift 2 ;;
    --user)     AWS_SSH_USER="$2";     shift 2 ;;
    --skip-tests) SKIP_TESTS=true;     shift ;;
    --skip-push)  SKIP_PUSH=true;      shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Derived Values ───────────────────────────────────────────
DOCKERFILE="${DOCKERFILE_MAP[$APP_TYPE]:-Dockerfile}"
APP_PORT="${PORT_MAP[$APP_TYPE]:-8000}"
TEST_CMD="${TEST_CMD_MAP[$APP_TYPE]:-echo 'No test command'}"
FULL_IMAGE="${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}"

# ── Logging ──────────────────────────────────────────────────
log()  { echo -e "\033[0;36m[$(date +%T)] $*\033[0m"; }
ok()   { echo -e "\033[0;32m✅ $*\033[0m"; }
warn() { echo -e "\033[0;33m⚠️  $*\033[0m"; }
fail() { echo -e "\033[0;31m❌ $*\033[0m"; exit 1; }
sep()  { echo "═══════════════════════════════════════════════════"; }

# ═══════════════════════════════════════════════════════════════
sep
log "🚀 DevOps Pipeline — Universal App Deployment"
log "   App Type : $APP_TYPE"
log "   App Name : $APP_NAME"
log "   Image    : $FULL_IMAGE"
log "   Port     : $APP_PORT"
log "   EC2 Host : $AWS_EC2_HOST"
sep

# ── STEP 1: Tests (Jenkins-equivalent local) ─────────────────
if [ "$SKIP_TESTS" = false ]; then
  log "🧪 [JENKINS] Running tests: $TEST_CMD"
  eval "$TEST_CMD" || fail "Tests failed — aborting deployment."
  ok "Tests passed!"
else
  warn "Skipping tests (--skip-tests flag set)"
fi

# ── STEP 2: Docker Build ──────────────────────────────────────
sep
log "🐳 [DOCKER] Building image: $FULL_IMAGE"
log "   Dockerfile: $DOCKERFILE"

docker build \
  -f "$DOCKERFILE" \
  -t "$FULL_IMAGE" \
  -t "${DOCKER_REGISTRY}/${APP_NAME}:latest" \
  --build-arg APP_PORT="$APP_PORT" \
  --build-arg APP_ENV=production \
  .

ok "Docker image built: $FULL_IMAGE"

# ── STEP 3: Docker Push ───────────────────────────────────────
if [ "$SKIP_PUSH" = false ]; then
  log "📦 [DOCKER] Pushing to registry: $DOCKER_REGISTRY"
  docker push "$FULL_IMAGE"
  docker push "${DOCKER_REGISTRY}/${APP_NAME}:latest"
  ok "Image pushed to registry."
else
  warn "Skipping registry push (--skip-push flag set)"
fi

# ── STEP 4: AWS EC2 Deploy ────────────────────────────────────
sep
log "☁️  [AWS] Deploying to EC2: $AWS_EC2_HOST"

ssh -o StrictHostKeyChecking=no \
    -i "$AWS_SSH_KEY" \
    "${AWS_SSH_USER}@${AWS_EC2_HOST}" << REMOTE
  echo "Connected to EC2. Deploying $APP_NAME..."
  docker pull $FULL_IMAGE
  docker stop $APP_NAME 2>/dev/null || true
  docker rm   $APP_NAME 2>/dev/null || true
  docker run -d \
    --name $APP_NAME \
    --restart always \
    -p $APP_PORT:$APP_PORT \
    -e APP_ENV=production \
    $FULL_IMAGE
  echo "Container started:"
  docker ps | grep $APP_NAME
REMOTE

# ── STEP 5: Health Check ──────────────────────────────────────
sep
log "🎯 [VERIFY] Running health check..."
sleep 5

HEALTH_URL="http://${AWS_EC2_HOST}:${APP_PORT}"
if curl -sf "${HEALTH_URL}/health" > /dev/null 2>&1 || \
   curl -sf "${HEALTH_URL}/" > /dev/null 2>&1 || \
   curl -sf "${HEALTH_URL}/actuator/health" > /dev/null 2>&1; then
  ok "Health check passed!"
else
  warn "Health endpoint not reachable — check EC2 firewall / security groups."
fi

sep
ok "🚀 Deployment complete!"
echo ""
echo "  App      : $APP_NAME ($APP_TYPE)"
echo "  Image    : $FULL_IMAGE"
echo "  Endpoint : http://${AWS_EC2_HOST}:${APP_PORT}"
echo ""
