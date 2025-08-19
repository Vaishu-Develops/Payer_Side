# Frontend Files Explained - Quick Overview

## Root Level Files

- **package.json** - Lists all dependencies (like antd, axios, react-router-dom)
- **public/index.html** - The main HTML page that loads your React app

## src/ (Main Source Code)

### Core App Files

- **App.js** - Main component with login logic, routing, and layout (header + sidebar)
- **App.css** - All styling (Bootstrap imports + custom styles)
- **index.js** - Entry point that renders App.js to the webpage

### Pages (Your Views)

- **pages/LandingPage.js** - Dashboard home with KPI cards and navigation tiles
- **pages/intern1/file1/Q01_HospitalList.js** - Sample question page (template for others)

### Services (API Calls)

- **services/api.js** - Base API setup (connects to localhost:8000)
- **services/hospitalService.js** - Hospital-related API calls (getHospitals, getHospitalDetails, etc.)
- **services/analyticsService.js** - Analytics API calls (rankings, benchmarks, etc.)

### Utils (Helper Functions)

- **utils/healthcare-constants.js** - Industry benchmarks, risk calculations, quality scoring

### Empty Folders (For Future)

- **components/** - Reusable UI pieces (cards, charts, tables)
- **hooks/** - Custom React hooks for data management
- **styles/** - Additional CSS files

## How It All Connects

1. **index.js** loads **App.js**
2. **App.js** shows login then routing between pages
3. **LandingPage.js** uses **services/** to fetch data
4. **Q01_HospitalList.js** shows the pattern for all other questions
5. **healthcare-constants.js** provides calculations for complex questions

## What Interns Do

- **Copy Q01_HospitalList.js** then rename and modify for their questions
- **Add new routes** to App.js menu
- **Use same styling patterns** from existing files
- **Import API calls** from services/ folder

## Important Notes

React is just HTML + JavaScript organized into reusable components. Each .js file in the pages/ folder represents a different screen/page in your application.

The pattern is simple:
1. Copy the existing Q01_HospitalList.js file
2. Rename it for your question (e.g., Q02_NABHCertified.js)
3. Change the API calls to get the data you need
4. Modify the table/chart to display your specific data
5. Add the new page to the menu in App.js

## File Organization

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/        (empty - for reusable components)
│   ├── hooks/            (empty - for custom hooks)
│   ├── pages/
│   │   ├── LandingPage.js
│   │   ├── intern1/
│   │   │   ├── file1/
│   │   │   │   └── Q01_HospitalList.js
│   │   │   └── file2/
│   │   └── intern2/
│   │       ├── file1/
│   │       └── file2/
│   ├── services/
│   │   ├── api.js
│   │   ├── hospitalService.js
│   │   └── analyticsService.js
│   ├── styles/           (empty - for additional CSS)
│   ├── utils/
│   │   └── healthcare-constants.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── node_modules/         (created after npm install)
```

This structure keeps everything organized and makes it easy to find what you need when building your question pages.