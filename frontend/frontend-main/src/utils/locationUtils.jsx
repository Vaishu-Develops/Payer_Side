// Location scoring algorithm
export const calculateLocationScore = (hospital) => {
  if (!hospital) return { overallScore: 0, factors: {} };

  const factors = {
    publicTransport: scorePublicTransport(hospital),
    roadConnectivity: scoreRoadConnectivity(hospital),
    populationDensity: scorePopulationDensity(hospital),
    competition: scoreCompetition(hospital),
    infrastructure: scoreInfrastructure(hospital)
  };

  const weights = {
    publicTransport: 0.25,
    roadConnectivity: 0.20,
    populationDensity: 0.25,
    competition: 0.15,
    infrastructure: 0.15
  };

  const overallScore = Math.round(
    factors.publicTransport * weights.publicTransport +
    factors.roadConnectivity * weights.roadConnectivity +
    factors.populationDensity * weights.populationDensity +
    factors.competition * weights.competition +
    factors.infrastructure * weights.infrastructure
  ) * 10;

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    factors
  };
};

// Public transport scoring
const scorePublicTransport = (hospital) => {
  const { city_town, nearest_landmark } = hospital;
  
  let score = 5; // Base score
  
  // Metro cities have better public transport
  const metroCityScores = {
    'Mumbai': 9,
    'Chennai': 8,
    'New Delhi': 9,
    'Kolkata': 8,
    'Bangalore': 7,
    'Hyderabad': 6,
    'Pune': 6,
    'Ahmedabad': 5,
    'Gurugram': 5
  };
  
  score = metroCityScores[city_town] || 4;
  
  // Junction proximity adds score
  if (nearest_landmark.includes('Junction')) score += 1;
  if (nearest_landmark.includes('Circle')) score += 0.5;
  
  return Math.min(10, Math.max(1, score));
};

// Road connectivity scoring
const scoreRoadConnectivity = (hospital) => {
  const { street, nearest_landmark, area_locality } = hospital;
  
  let score = 6;
  
  // Street type analysis
  if (street.includes('Marg')) score += 1.5;
  if (street.includes('Road')) score += 1;
  if (street.includes('Path')) score += 1;
  
  // Landmark connectivity
  if (nearest_landmark.includes('Junction')) score += 1.5;
  if (nearest_landmark.includes('Circle')) score += 1;
  
  // Area type
  if (area_locality.includes('Area')) score += 0.5;
  
  return Math.min(10, Math.max(1, score));
};

// Population density scoring
const scorePopulationDensity = (hospital) => {
  const { city_town, pin_code } = hospital;
  
  const cityScores = {
    'Mumbai': 9,
    'Chennai': 8,
    'New Delhi': 8.5,
    'Kolkata': 8,
    'Bangalore': 7,
    'Hyderabad': 6.5,
    'Pune': 6,
    'Ahmedabad': 6,
    'Gurugram': 5.5
  };
  
  let score = cityScores[city_town] || 4;
  
  // Central pin codes typically have higher density
  const pinNumber = parseInt(pin_code);
  if (city_town === 'Mumbai' && pinNumber <= 400050) score += 0.5;
  if (city_town === 'Chennai' && pinNumber <= 600050) score += 0.5;
  
  return Math.min(10, Math.max(1, score));
};

// Competition scoring
const scoreCompetition = (hospital) => {
  const { city_town, area_locality } = hospital;
  
  let score = 6; // Higher score = less competition
  
  // Metro cities have more competition
  const highCompetitionCities = ['Mumbai', 'Chennai', 'Bangalore'];
  if (highCompetitionCities.includes(city_town)) score -= 1.5;
  
  // Commercial zones have more competition
  if (area_locality.includes('Zone')) score -= 0.5;
  
  return Math.min(10, Math.max(1, score));
};

// Infrastructure scoring
const scoreInfrastructure = (hospital) => {
  const { city_town, area_locality, street } = hospital;
  
  let score = 6;
  
  // Better infrastructure in major cities
  const infraScores = {
    'Mumbai': 8,
    'Chennai': 7,
    'New Delhi': 8,
    'Bangalore': 7.5,
    'Hyderabad': 6.5,
    'Pune': 6.5,
    'Ahmedabad': 6,
    'Kolkata': 6,
    'Gurugram': 7
  };
  
  score = infraScores[city_town] || 5;
  
  // Main roads have better infrastructure
  if (street.includes('Marg') || street.includes('Road')) score += 0.5;
  
  return Math.min(10, Math.max(1, score));
};

// Get coordinates from address (mock implementation)
export const getCoordinatesFromAddress = async (hospital) => {
  // This would typically use a geocoding service like Google Maps API
  // For demo purposes, using approximate coordinates for major cities
  
  const cityCoordinates = {
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'New Delhi': { lat: 28.6139, lng: 77.2090 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Gurugram': { lat: 28.4595, lng: 77.0266 }
  };
  
  const baseCoords = cityCoordinates[hospital.city_town] || { lat: 20.5937, lng: 78.9629 }; // Default to India center
  
  // Add slight random offset based on hospital ID for variety
  const offset = 0.01;
  const hospitalOffset = (hospital.hospital_id % 10) * offset * 0.1;
  
  return {
    lat: baseCoords.lat + (hospitalOffset - offset/2),
    lng: baseCoords.lng + (hospitalOffset - offset/2)
  };
};

export default {
  calculateLocationScore,
  getCoordinatesFromAddress
};
