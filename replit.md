# Lead Qualifier AI Agent

## Overview

The Lead Qualifier AI Agent is a web application that helps businesses automatically qualify their leads using AI analysis. The system analyzes business descriptions and campaign goals to intelligently score and categorize leads uploaded via CSV files. Built with a modern full-stack architecture, it provides a professional, trust-centered interface for businesses to streamline their lead qualification process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **UI Library**: Radix UI primitives with shadcn/ui components for accessibility and consistency
- **Styling**: Tailwind CSS with a professional navy-blue color palette designed for business trust
- **State Management**: React hooks and TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Build System**: Vite for development and ESBuild for production bundling
- **Language**: TypeScript throughout for consistent typing across the stack
- **Development**: Hot Module Replacement (HMR) with Vite integration for rapid development

### Data Storage Solutions
- **Database**: PostgreSQL configured with Drizzle ORM for type-safe database operations
- **Connection**: Neon Database serverless PostgreSQL for cloud-native scalability
- **Migrations**: Drizzle Kit for database schema management and migrations
- **Session Storage**: In-memory storage with connect-pg-simple for PostgreSQL session store
- **Client-side Processing**: No persistent data storage - leads are processed client-side only

### Authentication and Authorization
- **Architecture**: No authentication system implemented - designed for simple, direct access
- **Session Management**: Basic session handling infrastructure in place for future expansion
- **Security**: CORS and standard Express security middleware configured

### External Dependencies

#### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

#### UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives (accordion, dialog, select, etc.)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **clsx**: Conditional className utility

#### Database and ORM
- **drizzle-orm**: TypeScript ORM for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-zod**: Zod integration for Drizzle schemas

#### Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **esbuild**: Fast JavaScript bundler for production
- **@replit/vite-plugin-***: Replit-specific development plugins

#### Data Processing
- **papaparse**: CSV file parsing and processing
- **date-fns**: Date manipulation utilities

The architecture prioritizes client-side processing to avoid data persistence concerns while providing a professional, scalable foundation for AI-powered lead qualification workflows.