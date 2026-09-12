<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kAcK_4iU04xDqn7Ry4uMqkO_UDLuwHR6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Live data sources
AirQ uses Open-Meteo Air Quality API for modeled AQI/pollutants and Open-Meteo Weather API for current weather. Maps use Leaflet with OpenStreetMap tiles. Air-quality data should be presented as modeled atmospheric data, not as physical street-level sensor readings.

Open-Meteo air-quality data is based on CAMS forecasts. See https://open-meteo.com/en/docs/air-quality-api for attribution and licensing details.
