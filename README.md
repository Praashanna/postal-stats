# Postal Stats

A modern web application designed to work alongside [Postal MTA](https://github.com/postalserver/postal) to provide enhanced statistics and analytics that overcome some limitations of Postal's built-in stats dashboard.

## Overview

Postal is an excellent open-source mail delivery platform, but its statistics interface can be limited for users who need more detailed analytics and better visualization of their email delivery data. Postal Stats addresses these limitations by providing:

- Enhanced data visualization
- Better filtering and search capabilities
- Improved bounce analysis
- More detailed delivery statistics
- Modern, responsive UI built with React and TypeScript

## Features

- 📊 **Advanced Analytics**: Comprehensive email delivery statistics with interactive charts
- 🔍 **Enhanced Filtering**: Filter data by date ranges, domains, and delivery status
- 📈 **Bounce Analysis**: Detailed bounce tracking with domain-specific insights
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS for a smooth user experience
- 📱 **Responsive Design**: Works seamlessly across desktop and mobile devices
- 🔒 **Secure**: Authentication-protected dashboard for your mail server data

## Prerequisites

Before running this frontend application, you'll need:

1. A running [Postal MTA](https://github.com/postalserver/postal) server
2. Access to Postal Database

## Backend Setup

**Important**: This is only the frontend application. You must also set up the backend API to connect to your Postal database.

👉 **Get the backend here**: [https://github.com/Praashanna/postal-stats-backend](https://github.com/Praashanna/postal-stats-backend)

The backend handles:
- Database connections to your Postal MTA instance
- API endpoints for retrieving email statistics
- Authentication and security
- Data processing and aggregation

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/postal-stats.git
cd postal-stats-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create your environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
# Add other necessary environment variables
```

5. Start the development server:
```bash
npm run dev
```

## Development

This project is built with:
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/UI** for accessible components
- **React Query** for data fetching and caching
- **React Hook Form** for form management

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## Links

- **Postal MTA**: [https://github.com/postalserver/postal](https://github.com/postalserver/postal) - The open-source mail delivery platform this project enhances
- **Backend Repository**: [https://github.com/Praashanna/postal-stats-backend](https://github.com/Praashanna/postal-stats-backend) - Required backend API for this frontend
- **No Stress Limited**: [https://hostmaria.com](https://hostmaria.com) - The company behind this project

## License

This project is open source and available under the [MIT License](LICENSE).

## About

This project was created at [No Stress Limited](https://hostmaria.com) to address the statistical limitations we encountered while using Postal MTA for our email delivery infrastructure. We believe in giving back to the open-source community and hope this tool helps other Postal users get better insights into their email delivery performance.
