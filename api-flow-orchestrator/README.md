# API Flow & Performance Orchestrator

A comprehensive tool for building, testing, and monitoring API chains with visual orchestration, automated response hooking, and performance tracking.

## 🎯 Overview

The API Flow & Performance Orchestrator is designed to solve the challenges of testing and monitoring complex multi-API workflows. It provides:

- **Visual API Orchestration**: Drag-and-drop interface for building API chains
- **Automated Response Hooking**: Extract values from API responses and inject them into subsequent requests
- **Performance Tracking**: Historical baseline comparison and performance heatmaps
- **Batch Testing**: Data-driven testing with CSV/Excel file uploads
- **Selective Export**: Export only the API responses you need

## 🏗️ Architecture

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.0
- **Database**: H2 (in-memory, easily switchable to PostgreSQL/MySQL)
- **API**: RESTful endpoints with CORS support
- **HTTP Client**: WebClient (reactive)

### Frontend (React)
- **Framework**: React 18 with Vite
- **UI Library**: React Flow for node-based visualization
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts for performance visualization

## 📋 Prerequisites

- **Java**: JDK 17 or higher
- **Maven**: 3.6+ (or use Maven Wrapper included)
- **Node.js**: 18+ and npm/yarn
- **Git**: For version control

## 🚀 Getting Started

### Backend Setup

1. Navigate to the backend directory:
```bash
cd api-flow-orchestrator/backend
```

2. Build the project:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8085`

**H2 Console**: Access at `http://localhost:8085/h2-console`
- JDBC URL: `jdbc:h2:mem:apiflowdb`
- Username: `sa`
- Password: (leave empty)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd api-flow-orchestrator/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📚 Key Features

### 1. Smart API Grouping
Create logical groups of APIs that represent end-to-end business flows (e.g., "User Onboarding", "Order Processing").

### 2. Sequential Data Hooking
Automatically extract values from API responses using JSONPath and inject them into subsequent requests:
```json
{
  "employee_id": "response.data.id",
  "temp_token": "response.auth.token"
}
```

### 3. Performance Baselines
The system automatically tracks:
- Average response time
- Min/Max response times
- Performance trends over time
- Regression detection (e.g., "20% slower than baseline")

### 4. Batch Execution
Upload CSV/Excel files to run the same API chain multiple times with different data:
- Map CSV columns to API request fields
- Execute hundreds of test cases automatically
- Export consolidated results

### 5. Selective Response Export
Choose which API responses to include in the final report:
- **CSV/Excel**: Tabular format with one row per execution
- **JSON**: Full response dump for debugging

## 🔧 API Endpoints

### API Groups
- `GET /api/groups` - List all API groups
- `GET /api/groups/{id}` - Get specific group
- `POST /api/groups` - Create new group
- `PUT /api/groups/{id}` - Update group
- `DELETE /api/groups/{id}` - Delete group

### API Nodes
- `GET /api/groups/{id}/nodes` - List nodes in a group
- `POST /api/groups/{id}/nodes` - Add node to group
- `PUT /api/groups/nodes/{nodeId}` - Update node
- `DELETE /api/groups/nodes/{nodeId}` - Delete node
- `PUT /api/groups/{id}/nodes/reorder` - Reorder nodes

### Execution
- `POST /api/execution/run/{groupId}` - Execute API group
- `GET /api/execution/runs/{groupId}` - Get execution history
- `GET /api/execution/runs/{groupId}/recent` - Get recent runs
- `GET /api/execution/run/{runId}` - Get specific run details

## 📊 Database Schema

### Core Entities
- **ApiGroup**: Container for related APIs
- **ApiNode**: Individual API configuration (method, URL, headers, body)
- **HookVariable**: Variable extraction rules
- **AuthProfile**: Authentication configuration
- **ExecutionRun**: Execution metadata
- **ApiRunResult**: Individual API execution results
- **PerformanceBaseline**: Historical performance data

## 🎨 Frontend Structure

```
frontend/src/
├── components/       # Reusable UI components
├── pages/           # Page components
│   ├── Dashboard.jsx
│   ├── ApiGroupEditor.jsx
│   └── ExecutionHistory.jsx
├── services/        # API service layer
├── utils/           # Utility functions
├── types/           # TypeScript types (if using TS)
└── App.jsx          # Main application component
```

## 🔐 Configuration

### Backend Configuration
Edit `backend/src/main/resources/application.properties`:

```properties
# Server port
server.port=8080

# Database (switch to PostgreSQL/MySQL for production)
spring.datasource.url=jdbc:h2:mem:apiflowdb

# CORS origins
cors.allowed-origins=http://localhost:3000,http://localhost:5173

# File upload limits
spring.servlet.multipart.max-file-size=10MB
```

### Frontend Configuration
Edit `frontend/vite.config.js` for proxy settings:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

## 🧪 Example Use Case

### Employee Onboarding Flow

1. **Create API Group**: "Employee Onboarding"

2. **Add API Nodes**:
   - **Step 1**: `POST /create-auth` → Returns `temp_token`
   - **Step 2**: `POST /employee-profile` → Uses `temp_token`, returns `employee_id`
   - **Step 3**: `POST /assign-benefits` → Uses `employee_id`
   - **Step 4**: `GET /final-summary` → Fetches complete record

3. **Configure Hooking**:
   - Extract `temp_token` from Step 1 response
   - Extract `employee_id` from Step 2 response
   - Inject variables into subsequent requests

4. **Execute**: Click "Play" to run the entire chain

5. **Review Results**: View execution time, status, and responses

## 🚧 Future Enhancements

- [ ] CSV/Excel batch execution engine
- [ ] Advanced visual node editor with React Flow
- [ ] Performance heatmap visualization
- [ ] Export functionality (CSV/Excel/JSON)
- [ ] Authentication & authorization
- [ ] Webhook support for CI/CD integration
- [ ] API mocking capabilities
- [ ] Scheduled executions
- [ ] Team collaboration features

## 📝 Development Notes

### Adding New Features

1. **Backend**: Add entities → repositories → services → controllers
2. **Frontend**: Add API service → React Query hooks → UI components
3. **Test**: Use H2 console for database inspection

### Database Migration

To switch from H2 to PostgreSQL:

1. Update `pom.xml` with PostgreSQL dependency
2. Update `application.properties` with PostgreSQL connection
3. Change dialect to `org.hibernate.dialect.PostgreSQLDialect`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoint documentation

## 🎓 Learning Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [React Flow Documentation](https://reactflow.dev)
- [TanStack Query Documentation](https://tanstack.com/query)

---

Built with ❤️ for efficient API testing and monitoring