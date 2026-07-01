# Brand Guidelines: BackOne (PT. Data Bisnis Solusi)
- **Brand Identity**: The web dashboard is officially branded as "BackOne", a product by PT. Data Bisnis Solusi.
- **Logo**: Always use the BackOne logo (circular with a red-to-blue gradient and white curved shape). Reference it from `public/backone-logo.png`.
- **Color Palette**: Utilize the brand's core colors—vibrant Red and deep Blue (often as a gradient)—against a sleek dark or clean light theme suitable for enterprise dashboards.
- **Typography**: Use modern, clean sans-serif fonts (e.g., `Inter` or `Montserrat`) to reflect a professional tech identity.
- **Naming Conventions**: Replace generic labels (like "Netify Dashboard") with "BackOne Dashboard" or "BackOne".

# Architecture Rules: Multi-User & RBAC
- **Multi-Tenancy**: All backend queries (Flows, Threats, Devices) MUST eventually be scoped by 	enant_id or site_uuid to ensure data isolation between clients.
- **RBAC (Role-Based Access Control)**:
  - Users must have defined roles (e.g., SUPER_ADMIN, TENANT_ADMIN, SOC_ANALYST, ENGINEER).
  - Frontend components and Backend API routes must check user roles before rendering sensitive actions (e.g., hiding "Delete Agent" for Analysts).
- **Authentication**: Use a robust session management system (e.g., NextAuth.js or JWT-based auth via backend) before exposing the dashboard.
