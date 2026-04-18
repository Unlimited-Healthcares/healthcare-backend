# 🏥 Healthcare API Backend

A robust, scalable NestJS-based healthcare management API with comprehensive testing, security, and deployment pipelines.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- PostgreSQL 15.x
- Redis 7.x
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/healthcare-backend.git
cd healthcare-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables
# Edit .env file with your database and API keys

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 🏗️ Architecture

### Tech Stack
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Authentication**: JWT with Passport
- **File Storage**: Supabase
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **CI/CD**: GitHub Actions

### Project Structure
```
src/
├── auth/           # Authentication & Authorization
├── users/          # User management
├── patients/       # Patient records
├── centers/        # Healthcare centers
├── appointments/   # Appointment scheduling
├── medical-records/ # Medical records management
├── notifications/  # Notification system
├── audit/          # Audit logging
├── chat/           # Real-time chat system
└── health/         # Health checks
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# All tests with coverage
npm run test:cov
```

### Test Structure
- **Unit Tests**: Individual service/controller tests
- **Integration Tests**: API endpoint testing with database
- **E2E Tests**: Full application flow testing
- **Performance Tests**: Load and stress testing

## 🔧 Development

### Available Scripts
```bash
npm run start:dev      # Development server
npm run start:prod     # Production server
npm run build          # Build application
npm run lint           # Lint code
npm run format         # Format code
npm run migration:run  # Run database migrations
npm run migration:generate  # Generate new migration
npm run seed:run       # Run database seeds
```

### Environment Variables
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=healthcare

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Encryption
ENCRYPTION_KEY=your-encryption-key
ENCRYPTION_SALT=your-encryption-salt
```

## 🔒 Security

### Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- Audit logging
- Data encryption

### Security Testing
```bash
# Run security audit
npm audit

# Run security tests
npm run test:security
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build Docker image
docker build -t healthcare-api .

# Run with Docker Compose
docker-compose up -d
```

### Environment Deployment
- **Staging**: Automatic deployment on `develop` branch
- **Production**: Automatic deployment on `main` branch
- **Health Checks**: Automated monitoring and alerts

## 📊 API Documentation

### Swagger UI
Once the application is running, visit:
- **Development**: http://localhost:3000/api
- **Production**: https://api.healthcare.com/api

### API Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - User logout

#### Users
- `GET /users` - Get all users (Admin)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (Admin)

#### Patients
- `GET /patients` - Get all patients
- `POST /patients` - Create patient
- `GET /patients/:id` - Get patient by ID
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

#### Appointments
- `GET /appointments` - Get all appointments
- `POST /appointments` - Create appointment
- `GET /appointments/:id` - Get appointment by ID
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

## 🔍 Monitoring

### Health Checks
- `GET /health` - Application health
- `GET /health/database` - Database connectivity
- `GET /health/redis` - Redis connectivity

### Metrics
- Request/response times
- Error rates
- Database performance
- Memory usage

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows
- **API Testing**: Comprehensive test suite
- **Security Scanning**: OWASP ZAP security tests
- **Deployment**: Automated staging and production deployment
- **Monitoring**: Post-deployment health checks

### Pipeline Stages
1. **Code Quality**: Linting, formatting, security audit
2. **Unit Tests**: Fast feedback on code changes
3. **Integration Tests**: Database and API testing
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Vulnerability scanning
6. **Deployment**: Automated deployment to environments

---

**Built with ❤️ by the Healthcare Development Team**
