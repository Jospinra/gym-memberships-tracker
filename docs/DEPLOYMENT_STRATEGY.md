# Phase 6: Deploy - Kubernetes Deployment Strategy

## Overview
This document outlines the deployment strategy for the Gym Membership Tracker application using Kubernetes, including rolling updates, blue-green deployments, and resource management.

## Deployment Strategy: Rolling Updates

The default strategy uses **RollingUpdate** to ensure zero-downtime deployments:

### Configuration in `k8s/deployment.yaml`
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

**Parameters:**
- `maxSurge: 1` — One extra pod can be created above the desired replicas during update.
- `maxUnavailable: 0` — Zero pods can be unavailable (ensures service continuity).

**How it works:**
1. Kubernetes spins up a new pod with the updated image (replicas: 3 total temporarily).
2. Traffic is gradually shifted from old to new pods.
3. Old pods are terminated once health checks pass on new pods.
4. Result: Seamless rollout with zero downtime.

## Alternative Strategy: Blue-Green Deployment

For critical updates requiring instant rollback, use blue-green deployment:

### Blue-Green Setup Example

**Blue (Current):** Running on label `version: v1`
**Green (New):** Running on label `version: v2`

Create two deployments and switch traffic via Service selector:

```yaml
# deployment-blue.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gym-membership-tracker-blue
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gym-membership-tracker
      version: v1
  # ... (rest of spec)

---
# deployment-green.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gym-membership-tracker-green
spec:
  replicas: 2
  selector:
    matchLabels:
      app: gym-membership-tracker
      version: v2
  # ... (rest of spec with new image)

---
# service.yaml - Initially routes to blue (v1)
apiVersion: v1
kind: Service
metadata:
  name: gym-membership-tracker-service
spec:
  selector:
    app: gym-membership-tracker
    version: v1  # Switch to v2 after testing green
  ports:
    - port: 80
      targetPort: 3000
```

**Deployment flow:**
1. Deploy green (new version) alongside blue (current).
2. Run smoke tests on green via a test Service selector `version: v2`.
3. If tests pass: Update the main Service selector to `version: v2`.
4. If tests fail: Delete green, keep blue running (instant rollback).
5. Once stable, delete old blue deployment.

## Resource Requirements & Calculations

### Current Resource Configuration

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Resource Breakdown

| Resource | Request | Limit | Reasoning |
|----------|---------|-------|-----------|
| CPU | 100m (0.1 core) | 500m (0.5 core) | Node.js app is I/O bound; 100m baseline, 500m burst for traffic spikes |
| Memory | 128Mi | 512Mi | Minimal app footprint (~50-100 MiB at idle), 512Mi headroom for leaks |

### Cluster Sizing Example (2 replicas, max 10 with HPA)

**Per Pod:**
- Request: 100m CPU + 128 MiB RAM
- Limit: 500m CPU + 512 MiB RAM

**Minimum (2 replicas):**
- CPU: 200m (0.2 cores)
- Memory: 256 MiB

**Maximum (10 replicas with HPA):**
- CPU: 1000m (1.0 core)
- Memory: 1.28 GiB

**For a 3-node cluster (each 2 CPU, 4 GiB RAM):**
- Total capacity: 6 CPUs, 12 GiB RAM
- After system pods (~500m CPU, 500 MiB RAM per node): ~4.5 CPUs, ~10 GiB available
- Can safely run up to 10 replicas of this app + 1 MySQL instance + monitoring

### Adjusting Resources for Your Environment

1. **For low traffic (dev/staging):**
   ```yaml
   requests:
     memory: "64Mi"
     cpu: "50m"
   limits:
     memory: "256Mi"
     cpu: "250m"
   minReplicas: 1
   maxReplicas: 3
   ```

2. **For high traffic (production):**
   ```yaml
   requests:
     memory: "256Mi"
     cpu: "200m"
   limits:
     memory: "1Gi"
     cpu: "1000m"
   minReplicas: 3
   maxReplicas: 20
   ```

## Health Checks & Probes

### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```
- Checks every 10 seconds if the app is ready to serve traffic.
- After 3 failures (30s), the pod is removed from load balancer.
- Prevents traffic routing to unhealthy pods.

### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 20
  failureThreshold: 5
```
- Checks if the pod is alive; if it fails 5 times (100s), Kubernetes restarts the pod.
- Recovers from deadlocks or resource exhaustion.

## Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gym-membership-tracker-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: gym-membership-tracker
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
```

**Behavior:**
- Scales up when avg CPU > 60% or memory > 70% across pods.
- Scales down when usage drops below thresholds.
- Ensures cost-efficient resource utilization.

## Deployment Steps

### 1. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace gym-tracker

# Create database secret (optional, if not using env vars)
kubectl create secret generic db-credentials \
  --from-literal=password=your_db_password \
  -n gym-tracker

# Apply deployment manifests
kubectl apply -f k8s/deployment.yaml -n gym-tracker
kubectl apply -f k8s/service.yaml -n gym-tracker

# Verify deployment
kubectl get deployments -n gym-tracker
kubectl get pods -n gym-tracker
kubectl get svc -n gym-tracker
```

### 2. Rolling Update (Automated via CI/CD)

The GitHub Actions workflow automatically updates the image tag on main branch pushes:

```bash
# Triggered by CI/CD:
kubectl set image deployment/gym-membership-tracker \
  app=ghcr.io/jospinra/gym-memberships-tracker:latest \
  -n gym-tracker
```

Monitor the rollout:
```bash
kubectl rollout status deployment/gym-membership-tracker -n gym-tracker
```

### 3. Blue-Green Manual Switch (if using blue-green)

```bash
# Deploy green
kubectl apply -f k8s/deployment-green.yaml -n gym-tracker

# Test green pods
kubectl port-forward svc/gym-membership-tracker-green 3000:80 -n gym-tracker
# Test at http://localhost:3000/health

# Switch traffic to green
kubectl patch service gym-membership-tracker-service \
  -p '{"spec":{"selector":{"version":"v2"}}}' \
  -n gym-tracker

# Delete blue after stable
kubectl delete deployment gym-membership-tracker-blue -n gym-tracker
```

### 4. Monitor Deployment

```bash
# Watch pods
kubectl get pods -n gym-tracker -w

# Check resource usage
kubectl top nodes
kubectl top pods -n gym-tracker

# View logs
kubectl logs -f deployment/gym-membership-tracker -n gym-tracker
```

## Rollback Strategy

### Automatic Rollback (if health checks fail)
Kubernetes automatically rollback if readiness/liveness probes fail:
```bash
kubectl rollout undo deployment/gym-membership-tracker -n gym-tracker
```

### Manual Rollback
```bash
# View rollout history
kubectl rollout history deployment/gym-membership-tracker -n gym-tracker

# Rollback to previous version
kubectl rollout undo deployment/gym-membership-tracker -n gym-tracker

# Rollback to specific revision
kubectl rollout undo deployment/gym-membership-tracker --to-revision=2 -n gym-tracker
```

## Monitoring & Alerts

Set up alerts for:
- Pod restart count > threshold (indicates issues)
- CPU utilization > 80% (approaching limits)
- Memory utilization > 85% (risk of OOM)
- Deployment rollout failures
- Pod readiness probe failures

## Next Steps

1. Integrate this deployment into GitHub Actions CD pipeline (`.github/workflows/ci.yml`).
2. Set up Prometheus/Grafana for metrics and Loki for logs.
3. Configure Alertmanager for notifications based on error budget thresholds.
4. Test rolling updates and rollback procedures in staging.
