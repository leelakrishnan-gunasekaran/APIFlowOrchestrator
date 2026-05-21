# API Flow Orchestrator - Development Prompts History

This document contains all the user prompts and queries used during the development of the API Flow Orchestrator tool, presented as a narrative journey from initial concept to final implementation.

---

## The Development Journey

The development of the API Flow Orchestrator began with the creation of a semantic schema. The first prompt was to create a JSON-LD schema file for an API testing and orchestration tool, which established the foundational data structure and relationships for API groups, nodes, execution runs, and their interconnections.

Following the schema creation, the next step involved setting up the MCP server connection for the API orchestrator. This established the communication protocols and server-client architecture necessary for the tool's operation.

With the infrastructure in place, the core development phase began with a request to create a full-stack API Flow Orchestrator application with a React frontend and Spring Boot backend. This comprehensive prompt resulted in building the entire application stack including the React frontend with Vite, Spring Boot backend with REST APIs, PostgreSQL database integration, and basic CRUD operations for API groups and nodes.

To enhance the user experience, a visual node editor was requested using React Flow for creating API workflows. This led to the integration of the React Flow library, creation of a drag-and-drop interface, and implementation of node connections with flow visualization capabilities.

The execution capabilities were then developed with a prompt to implement an API execution engine that runs APIs in sequence. This created the execution service, implemented sequential API calling, and added comprehensive error handling and response tracking.

A critical feature request came next: adding a variable chaining feature to extract values from API responses and use them in subsequent APIs. This sophisticated functionality implemented JSON path extraction, created a variable storage mechanism, added template variable replacement using the `{{VARIABLE_NAME}}` syntax, and resulted in comprehensive documentation in the Variable Chaining Guide.

A significant challenge arose when testing localhost microservices. The user reported that while Postman could successfully test different services running on different ports of localhost, the application was returning network errors. Screenshots were shared showing the discrepancy between Postman's success and the application's failure. Investigation revealed that browser CORS restrictions for localhost-to-localhost calls and invalid CORS configuration (allowCredentials=true with wildcard origins) were the root causes. The solution involved fixing the CorsConfig.java to use setAllowedOriginPatterns instead of wildcards, creating a ProxyController.java with a /api/proxy/execute endpoint, updating ApiTester.jsx to route requests through the backend proxy, and documenting the entire solution in the Localhost CORS Fix guide.

To provide better insights into API performance, a request was made to add a PDF report generation feature for API execution results. This involved installing jsPDF and jspdf-autotable libraries, creating a pdfGenerator.js utility, adding both an "Auto-generate PDF Report" checkbox and a "Generate Report Now" button, and implementing comprehensive PDF reports that included performance timeline graphs, API summary tables, detailed request/response data, and error messages. The feature was thoroughly documented in the PDF Generation Setup guide.

The performance tracking capabilities were further enhanced with a request to create a performance dashboard that opens in a new tab showing execution history and performance metrics. This resulted in the creation of the PerformanceDashboard.jsx component with a three-panel layout: the left panel showing execution history with format GroupName_Date_Time, the middle panel displaying API details with a request/response viewer, and the right panel presenting a performance bar chart with statistics. A new route was added at /groups/:id/performance, comprehensive styling was created in PerformanceDashboard.css, and the feature was documented in the Performance Dashboard Guide.

A cleanup request followed to remove Dashboard and History links from the top navigation, keeping only API Groups and API Tester. This streamlined the user interface by updating App.jsx to remove unused navigation items and cleaning up the routing configuration.

To improve workflow management, a request was made to add the ability to reorder API nodes using up/down arrows. This implementation added up/down arrow buttons to each node in VisualNodeEditor.jsx, implemented reorder logic in ApiGroupService.java, added a reorder endpoint in ApiGroupController.java, and included comprehensive logging for debugging purposes.

A sophisticated comparison feature was then requested for the performance dashboard. The user wanted to add checkboxes to each history item in the Performance Dashboard, along with a Compare button that would enable when exactly 2 histories were selected. Upon clicking the compare button, the system should display a single bar chart with 2 different colors, differentiating the 2 histories with different colors and showing the increase or decrease in performance of each API and the overall group. This comprehensive feature implementation added checkboxes to each execution history item, created a Compare button that enables when exactly 2 histories are selected, and implemented a full comparison mode. The comparison mode includes run identification badges with Run 1 in blue and Run 2 in green, an overall performance comparison showing total duration for each run, the difference in milliseconds, percentage change, and visual indicators with downward arrows for faster performance and upward arrows for slower performance. It also features an API-by-API comparison table with individual performance changes, a dual-color bar chart showing both runs side-by-side, and color-coded improvements in green and degradations in red. An "Exit Compare Mode" button was added, selected histories are highlighted with an amber/yellow color, and checkboxes are disabled when 2 are already selected. The implementation modified PerformanceDashboard.jsx to add comparison logic and UI, and updated PerformanceDashboard.css with comprehensive comparison styling.

A UI cleanup request followed to remove the 'Export API Response to report' checkbox from the Edit API Node window. This simple but important change removed the checkbox from VisualNodeEditor.jsx and cleaned up the node configuration modal.

Finally, the user requested to generate a file containing a list of all the prompts used for creating this tool, from creating the jsonld file and MCP connection through to the last query. This meta-request resulted in the creation of this comprehensive documentation file, which documents all phases of development, lists all user prompts chronologically, includes implementation details and outcomes, and serves as a complete reference for the development journey.

---

## Summary of the Development Process

Throughout this development journey, the API Flow Orchestrator evolved from a simple concept into a sophisticated tool with comprehensive features. The core functionality includes a full-stack application built with React and Spring Boot, a visual node editor powered by React Flow, an API execution engine with sequential processing capabilities, and PostgreSQL database integration for data persistence.

Advanced features were progressively added, including variable chaining with JSON path extraction for dynamic API workflows, a localhost proxy solution to bypass CORS restrictions, comprehensive PDF report generation for execution results, a performance dashboard with detailed metrics and analytics, execution history comparison capabilities for performance analysis, and node reordering functionality for workflow management.

The user experience was carefully crafted with an intuitive visual interface, real-time execution feedback, comprehensive error handling, performance analytics and comparison tools, and detailed documentation for all features. Technical solutions were implemented to address challenges such as CORS configuration fixes, the proxy pattern for localhost APIs, JSON-LD semantic schema implementation, MCP server integration, and responsive design principles.

The development process followed a logical progression starting with initial setup including schema and MCP configuration, moving through core development of the full-stack application, adding features like variable chaining and PDF reports, solving problems such as CORS and localhost issues, enhancing the system with performance dashboard and comparison capabilities, and refining the application through UI cleanup and comprehensive documentation.

Key lessons learned during this development include understanding that CORS challenges require careful configuration due to browser security, recognizing that the proxy pattern is an effective solution for localhost API testing, appreciating that variable chaining is critical for API workflow automation, understanding that performance tracking is essential for API optimization, and valuing iterative development based on user feedback.

This comprehensive development history serves as both a technical reference and a testament to the iterative, user-driven development process that created the API Flow Orchestrator tool.