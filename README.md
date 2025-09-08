# 🧾 RetailEdge - AI-Powered Receipt Tracker

[![Next.js](https://img.shields.io/badge/Next.js-15.2.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-1.22.0-orange)](https://convex.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Pro-4285f4)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

RetailEdge is a cutting-edge, enterprise-grade receipt management platform that leverages advanced AI to transform how businesses handle expense tracking and receipt processing. Built with modern technologies and designed for scalability, it provides intelligent receipt scanning, automated data extraction, and comprehensive expense analytics.

## 🚀 Features

### 🤖 AI-Powered Processing
- **Advanced OCR Technology**: Powered by Google Gemini 2.5 Pro for superior text recognition
- **Intelligent Data Extraction**: Automatically extracts merchant details, transaction amounts, itemized purchases, dates, and more
- **Multi-Format Support**: Handles various receipt formats, languages, and layouts
- **Smart Categorization**: AI-driven expense categorization and tagging

### 📊 Comprehensive Data Management
- **Structured Data Storage**: Robust schema with detailed receipt information
- **Real-time Processing**: Instant receipt analysis with live status updates
- **Data Validation**: Advanced normalization and validation pipelines
- **Export Capabilities**: Multiple export formats for accounting and reporting

### 🔐 Enterprise Security & Scalability
- **Authentication**: Secure user management with Clerk
- **Role-based Access**: Multi-tier subscription model with feature gating
- **Real-time Database**: Powered by Convex for instant synchronization
- **File Storage**: Secure cloud storage with automated backup

### 💰 Flexible Pricing Tiers
- **Professional**: ₹299/month - 50 scans, advanced OCR, 30-day retention
- **Enterprise**: ₹599/month - 300 scans, AI analysis, unlimited retention
- **Custom**: Tailored solutions with unlimited processing and dedicated support

## 🏗️ Technical Architecture

### Core Technologies
- **Frontend**: Next.js 15.2.3 with React 19, TypeScript
- **Styling**: Tailwind CSS 4.0 with custom design system
- **Animation**: Framer Motion 12.23.12 + GSAP 3.13.0
- **Backend**: Convex real-time database and serverless functions
- **AI/ML**: Google Gemini 2.5 Pro API integration
- **Authentication**: Clerk for user management
- **Payment Processing**: Stripe integration with Schematic feature flagging

### Advanced Features
- **Multi-Agent AI System**: Specialized agents for scanning and database operations
- **Inngest Workflows**: Robust background job processing
- **PDF Processing**: Advanced PDF parsing with pdfjs-dist
- **Real-time Updates**: Live receipt processing status
- **Responsive Design**: Mobile-first, enterprise-grade UI/UX

## 📋 Prerequisites

- Node.js 18+ or Bun
- Convex account and project setup
- Google Gemini API key
- Clerk authentication setup
- Stripe account (for payments)

## 🛠️ Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/AmatyaJoshi/receipt-tracker.git
cd receipt-tracker
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=your-convex-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Schematic Feature Flags
NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY=your-schematic-key
SCHEMATIC_SECRET_KEY=your-schematic-secret

# Inngest
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
```

### 3. Database Setup

```bash
# Initialize Convex
npx convex dev --until-success

# Deploy schema
npx convex dashboard
```

### 4. Development Server

```bash
# Start both frontend and backend
npm run dev

# Or run separately
npm run dev:frontend  # Next.js on localhost:3000
npm run dev:backend   # Convex dashboard
```

## 📁 Project Structure

```
receipt-tracker/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page with pricing
│   ├── receipts/            # Receipt management dashboard
│   ├── receipt/[id]/        # Individual receipt details
│   ├── manage-plan/         # Subscription management
│   └── api/                 # API routes
├── components/              # Reusable React components
│   ├── ui/                  # Shadcn/ui components
│   ├── PDFDropzone.tsx      # File upload component
│   ├── ReceiptList.tsx      # Receipt listing component
│   └── schematic/           # Feature flag components
├── convex/                  # Convex backend
│   ├── schema.ts            # Database schema
│   ├── receipts.ts          # Receipt CRUD operations
│   └── auth.config.ts       # Authentication config
├── inngest/                 # Background job processing
│   ├── client.ts            # Inngest client setup
│   └── agents/              # AI processing agents
│       ├── receiptScanningAgent.ts  # OCR processing
│       └── databaseAgent.ts         # Data persistence
├── actions/                 # Server actions
├── lib/                     # Utility libraries
└── public/                  # Static assets
```

## 🤖 AI Agent System

### Receipt Scanning Agent
- **Purpose**: PDF processing and data extraction
- **Technology**: Google Gemini 2.5 Pro with vision capabilities
- **Input**: PDF receipt files
- **Output**: Structured JSON with merchant info, items, amounts

### Database Agent  
- **Purpose**: Data validation and persistence
- **Features**: Smart data normalization, validation, summary generation
- **Integration**: Seamless Convex database operations

## 📊 Database Schema

```typescript
receipts: {
  userId: string;              // Clerk user identifier
  fileName: string;            // Original file name
  fileDisplayName: string;     // Human-readable name
  fileId: Id<"_storage">;     // Convex file storage ID
  uploadedAt: number;          // Upload timestamp
  size: number;                // File size in bytes
  mimeType: string;            // File MIME type
  status: string;              // Processing status
  
  // Extracted data fields
  merchantName: string;
  merchantAddress: string;
  merchantContact: string;
  transactionDate: string;
  transactionAmount: string;
  currency: string;
  receiptSummary: string;      // AI-generated summary
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  rawExtractedData: string;    // Raw AI response
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Manual Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Lint code
npm run lint

# Test Gemini API integration
npm run test:gemini
```

## 📈 Performance Features

- **Optimized PDF Processing**: Efficient base64 encoding and streaming
- **Real-time Updates**: Convex subscriptions for instant UI updates
- **Intelligent Caching**: Smart data caching strategies
- **Progressive Enhancement**: Works without JavaScript for core features
- **Mobile Optimization**: Responsive design with touch-friendly interactions

## 🔧 API Integration

### Receipt Upload
```typescript
POST /api/receipts/upload
Content-Type: multipart/form-data

// Automatically triggers AI processing pipeline
```

### Receipt Data Extraction
```typescript
GET /api/receipts/{id}

// Returns structured receipt data with AI analysis
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: Advanced AI processing capabilities
- **Convex**: Real-time backend infrastructure
- **Clerk**: Seamless authentication solution
- **Inngest**: Reliable background job processing
- **Shadcn/ui**: Beautiful, accessible UI components

## 📞 Support & Contact

- **Documentation**: [docs.retailedge.com](https://docs.retailedge.com)
- **Support**: support@retailedge.com
- **Sales**: sales@retailedge.com
- **GitHub Issues**: [Issues Page](https://github.com/AmatyaJoshi/receipt-tracker/issues)

---

**RetailEdge** - *The smarter way to track your receipts.* 

Built with ❤️ by [AmatyaJoshi](https://github.com/AmatyaJoshi)
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
