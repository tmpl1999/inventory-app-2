# Stock Inventory App

A comprehensive stock inventory management system built with React, TypeScript, and Supabase, featuring real-time updates, low-stock alerts, and batch tracking.

## Features

- **Product Management**: Create, edit, and delete products with detailed information
- **Location Management**: Manage multiple storage locations for inventory items
- **Batch Tracking**: Track batches with expiry dates using FIFO logic
- **Stock Movements**: Record incoming, outgoing, and transfer movements
- **Real-time Updates**: See inventory changes immediately using Supabase Realtime
- **Low-stock Alerts**: Get notified when inventory falls below reorder points
- **Role-Based Access Control**: Different permissions for staff and admin users

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/stock-inventory-app.git
cd stock-inventory-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
pnpm dev
```

## 1-Click Deployment to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fstock-inventory-app&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&demo-title=Stock%20Inventory%20App&demo-description=A%20comprehensive%20stock%20inventory%20management%20system&demo-url=https%3A%2F%2Fstock-inventory-app-demo.vercel.app)

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Enter your Supabase URL and Anon Key in the environment variables section
4. Click Deploy
5. Your app will be deployed and accessible via a Vercel URL

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Build Tools**: Vite
- **Testing**: Jest, Playwright
- **CI/CD**: GitHub Actions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.