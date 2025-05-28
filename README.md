# Sentiment Map Dashboard

This is a partial implementation of an interactive dashboard for sentiment visualisation on a world map, developed as part of a frontend technical test.

## ✨ Features Implemented

- Interactive world map using **amCharts 5**
- CSV parsing to extract sentiment data by country
- Map colouration based on country-continent mapping
- Click event handler stubbed to support future drill-down
- Hover tooltip with country name
- Responsive layout using Tailwind CSS

## ⚠️ Features Not Fully Implemented

- Drill-down into sub-regions
- Colour-coded heatmap based on sentiment values (positive/neutral/negative)
- Legend and sentiment scale toggle
- Error UI feedback
- Fully mapped ISO/country codes for all CSV rows

## 🛠️ Tech Stack

- React + Vite
- TailwindCSS
- amCharts 5
- CSV data via native `fetch`
