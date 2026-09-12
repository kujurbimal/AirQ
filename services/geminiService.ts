
import { GoogleGenAI, Type } from "@google/genai";
import { AirQualityData, HealthProfile, AIRecommendation, AQILevel } from "../types";

function generateFallbackRecommendation(
  airData: AirQualityData,
  profile: HealthProfile
): AIRecommendation {
  const hasRespiratory = profile.conditions.some(c =>
    ['Asthma', 'COPD', 'Allergies'].includes(c)
  );
  const hasHeartDisease = profile.conditions.includes('Heart Disease');
  const isHighActivity = profile.activityLevel === 'high';
  const isSensitive = hasRespiratory || hasHeartDisease || profile.age >= 65 || profile.age <= 12;

  let summary = '';
  let activityAdvice = '';
  let routeAdvice = '';
  let healthWarning = undefined;

  if (airData.aqi <= 50) {
    summary = `Air quality is optimal around ${airData.location.address.split(',')[0]}. Safe for all outdoor activities.`;
    activityAdvice = isHighActivity 
      ? "Great conditions for high-intensity cardio, marathon training, or cycling outdoors."
      : "Ideal conditions for walking or outdoor exercise without precautions.";
    routeAdvice = "All routes open with low particulate matter. Park trails and open corridors recommended.";
  } else if (airData.aqi <= 100) {
    if (isSensitive) {
      summary = `Moderate AQI (${airData.aqi}). Sensitive individuals with ${profile.conditions.join(', ') || 'conditions'} should limit prolonged exertion.`;
      activityAdvice = "Shift strenuous workouts indoors or exercise before 10 AM before ozone levels peak.";
      routeAdvice = "Avoid heavy transit arterials like Spring St. Prefer tree-lined residential side-streets.";
      healthWarning = "Keep rescue inhaler accessible if venturing near industrial or high-traffic zones.";
    } else {
      summary = `Air quality is acceptable (AQI ${airData.aqi}). Most individuals can maintain regular outdoor routines.`;
      activityAdvice = "Moderate outdoor workouts are safe. Stay hydrated as ozone levels rise in midday warmth.";
      routeAdvice = "Urban corridors are clear, though maintaining distance from stop-and-go intersections reduces direct PM2.5 exposure.";
    }
  } else {
    summary = `Elevated pollution alert (AQI ${airData.aqi}). Particulates (PM2.5: ${airData.pollutants.pm25} µg/m³) present respiratory risks.`;
    activityAdvice = "Avoid vigorous outdoor exercise. Opt for indoor gym workouts with filtered air ventilation.";
    routeAdvice = "Avoid major thoroughfares and construction corridors. Keep vehicle windows closed with recirculated AC.";
    healthWarning = "High risk for sensitive airways. Wear an N95 mask if outdoor transit is mandatory.";
  }

  return {
    summary,
    activityAdvice,
    routeAdvice,
    healthWarning,
  };
}

export const getAIRecommendation = async (
  airData: AirQualityData,
  profile: HealthProfile
): Promise<AIRecommendation> => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    (typeof window !== "undefined" && (window as any).__GEMINI_KEY__) ||
    "";

  if (!apiKey || apiKey.trim() === "" || apiKey === "undefined") {
    return generateFallbackRecommendation(airData, profile);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
      Generate personalized health and activity advice based on the following air quality data and user profile.
      
      Air Quality:
      - AQI: ${airData.aqi} (${airData.level})
      - PM2.5: ${airData.pollutants.pm25} µg/m³
      - PM10: ${airData.pollutants.pm10} µg/m³
      - Ozone: ${airData.pollutants.o3} ppb
      - Nitrogen Dioxide (NO2): ${airData.pollutants.no2} ppb
      - Location: ${airData.location.address}
      
      User Profile:
      - Age: ${profile.age}
      - Medical Conditions: ${profile.conditions.join(', ') || 'None'}
      - Activity Level: ${profile.activityLevel}
      
      Provide tailored, actionable guidance for exercise timing, route selection, and health precautions.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            activityAdvice: { type: Type.STRING },
            routeAdvice: { type: Type.STRING },
            healthWarning: { type: Type.STRING },
          },
          required: ["summary", "activityAdvice", "routeAdvice"],
        },
      },
    });

    const text = response.text?.trim();
    if (text) {
      return JSON.parse(text);
    }
  } catch (e) {
    console.warn("Gemini API call skipped or encountered an error, using intelligent fallback", e);
  }

  return generateFallbackRecommendation(airData, profile);
};
