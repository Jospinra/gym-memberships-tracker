# Notes App - DevOps Pipeline Project

A simple CRUD notes application built with Node.js, Express, MySQL, and Bootstrap, implementing a complete DevOps pipeline for learning and demonstration purposes.

## 🚀 Features

- **CRUD Operations**: Create, Read, Update, Delete notes
- **Responsive UI**: Bootstrap-based frontend with modern design
- **REST API**: RESTful endpoints for note management
- **Database Integration**: MySQL for persistent data storage
- **Health Monitoring**: Built-in health check endpoints
- **Containerization**: Docker support with multi-stage builds
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [DevOps Implementation](#devops-implementation)
- [Database Schema](#database-schema)
- [Docker Setup](#docker-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Error Budget Policy](#error-budget-policy)
- [Contributing](#contributing)

## 🏁 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd notes
npm install
```

2. **Set up MySQL database:**
```sql
CREATE DATABASE notes_app;
```

3. **Configure environment variables:**
```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=notes_app
```

4. **Start the application:**
```bash
npm run dev  # Development mode with nodemon
npm start    # Production mode
```

5. **Access the application:**
   - Web UI: http://localhost:3000
   - Health Check: http://localhost:3000/health

### Docker Development

```bash
docker-compose up -d
```

## 📁 Project Structure

```
notes/
├── index.js                 # Main application server
├── package.json             # Node.js dependencies and scripts
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Development environment setup
├── healthcheck.js          # Docker health check script
├── README.md               # This documentation
├── public/
│   └── index.html          # Bootstrap frontend
├── .github/workflows/
│   └── ci.yml              # GitHub Actions CI/CD pipeline
├── tests/                  # Test files (to be created)
└── docs/                   # Additional documentation
```

## 🔗 API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Serve frontend application | - |
| GET | `/api/notes` | Get all notes | - |
| POST | `/api/notes` | Create new note | `{title, content}` |
| PUT | `/api/notes/:id` | Update existing note | `{title, content}` |
| DELETE | `/api/notes/:id` | Delete note | - |
| GET | `/health` | Health check endpoint | - |

### Example API Usage

**Create a note:**
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Note", "content": "This is the content"}'
```

**Get all notes:**
```bash
curl http://localhost:3000/api/notes
```

## 🛠 DevOps Implementation

### Phase 1: Plan ✅
- **Scope**: Node.js CRUD application with MySQL backend
- **DevOps Roadmap**: Code → Build → Test → Deploy → Monitor
- **Error Budget**: 99.9% uptime (8.76 hours downtime/year)

### Phase 2: Code ✅
- **Git Strategy**: GitFlow (feature → develop → main branches)
- **Code Quality**: ESLint for code standards
- **Version Control**: Semantic versioning (1.0.0)

### Phase 3: Build ✅
- **CI Pipeline**: GitHub Actions
- **Containerization**: Multi-stage Dockerfile
- **Image Optimization**: Alpine Linux base, minimal dependencies
- **Health Checks**: Built-in monitoring endpoints

## 🗄 Database Schema

**Notes Table:**
```sql
CREATE TABLE notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🐳 Docker Setup

### Multi-stage Dockerfile Benefits:
- **Security**: Non-root user execution
- **Size Optimization**: Production dependencies only
- **Health Monitoring**: Built-in health checks
- **Scalability**: Ready for container orchestration

### Commands:
```bash
# Build image
docker build -t notes-app .

# Run container
docker run -p 3000:3000 notes-app

# Development with database
docker-compose up -d
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow:

1. **Test Stage**:
   - Lint code with ESLint
   - Run unit tests with Jest
   - Test with MySQL service

2. **Build Stage**:
   - Build Docker image
   - Test container health
   - Security scanning (future)

3. **Deploy Stage**:
   - Deploy to staging (main branch)
   - Production deployment (tags)

### Pipeline Triggers:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

## 📊 Monitoring & Health Checks

### Health Check Endpoint: `/health`
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Docker Health Check:
- Interval: 30s
- Timeout: 3s
- Retries: 3
- Start period: 5s

### Monitoring Metrics (Planned):
- API response times
- Database connection status
- Memory and CPU usage
- Error rates and logging

## 📋 Error Budget Policy

### Service Level Objectives (SLOs):
- **Availability**: 99.9% uptime
- **Response Time**: < 200ms for 95% of requests
- **Error Rate**: < 0.1% of requests

### Error Budget:
- **Monthly Allowance**: 43.8 minutes downtime
- **Incident Response**: < 5 minutes detection
- **Recovery Time**: < 15 minutes for critical issues

### Alerting Thresholds:
- 50% error budget consumed: Warning
- 80% error budget consumed: Critical alert
- 100% error budget consumed: Emergency response

## 🧪 Testing Strategy

### Test Types:
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Health Checks**: Container and service monitoring
- **Load Testing**: Performance under stress (planned)

### Running Tests:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run lint          # Code quality checks
```

## 🚀 Deployment Environments

### Development:
- Local machine with Docker Compose
- Hot reloading with nodemon
- Debug logging enabled

### Staging:
- Container deployment
- Production-like environment
- Integration testing

### Production:
- High availability setup
- Monitoring and alerting
- Automated backups

## 📈 Performance Optimization

### Backend Optimizations:
- Connection pooling for MySQL
- Async/await for non-blocking operations
- Input validation and sanitization
- Prepared statements for security

### Frontend Optimizations:
- CDN for Bootstrap and Font Awesome
- Minimal JavaScript bundle
- Responsive design for mobile

### Container Optimizations:
- Multi-stage builds
- Alpine Linux base image
- Non-root user execution
- Health check integration

## 🤝 Contributing

### Git Workflow:
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and test locally
3. Commit with conventional messages: `feat: add new feature`
4. Push and create pull request
5. Code review and merge to develop
6. Deploy to staging for testing
7. Merge to main for production

### Code Standards:
- ESLint configuration enforced
- Conventional commit messages
- 100% test coverage goal
- Documentation updates required

## 📝 Next Steps

### Planned Enhancements:
- [ ] Add user authentication
- [ ] Implement note categories/tags
- [ ] Add search functionality
- [ ] Performance monitoring with Prometheus
- [ ] Log aggregation with ELK stack
- [ ] Kubernetes deployment manifests
- [ ] Infrastructure as Code with Terraform

### Security Improvements:
- [ ] HTTPS/TLS configuration
- [ ] Rate limiting
- [ ] Input validation enhancement
- [ ] Security headers implementation
- [ ] Vulnerability scanning in CI

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check existing documentation
- Review CI/CD pipeline logs

---

**Built with ❤️ for DevOps learning and demonstration**

Last updated: January 2024
