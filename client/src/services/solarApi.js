// solarApi.js
// Handles Google Solar API fetch and calculations
export async function fetchSolarAnalysis(lat, lng, viewer) {
  const apiKey = import.meta.env.VITE_GOOGLE_SOLAR_API_KEY;
  const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.solarPotential) {
      alert('No solar data found for this location.');
      return null;
    }
    // Draw building outline if available
    if (data.solarPotential?.roofSegmentStats?.[0]?.boundingPolygon) {
      drawBuildingOutline(data.solarPotential.roofSegmentStats[0].boundingPolygon, viewer);
    }
    // Financial calculations
    const maxPanels = data.solarPotential.maxArrayPanelsCount;
    const yearlyKwh = data.solarPotential.yearlyEnergyDcKwh;
    const financial = data.solarPotential.financialAnalyses?.[0];
    const installCost = maxPanels * 25000;
    const annualSavings = yearlyKwh * 8;
    const breakEven = installCost / annualSavings;
    return {
      maxPanels,
      yearlyKwh,
      installCost,
      annualSavings,
      breakEven,
      financial,
      apiRaw: data
    };
  } catch (e) {
    alert('Failed to fetch solar data.');
    return null;
  }
}

function drawBuildingOutline(polygon, viewer) {
  const Cesium = window.Cesium;
  const positions = polygon.vertices.map(v =>
    Cesium.Cartesian3.fromDegrees(v.longitude, v.latitude, v.height || 0)
  );
  viewer.entities.add({
    polyline: {
      positions: [...positions, positions[0]],
      width: 4,
      material: Cesium.Color.LIME,
      clampToGround: true
    }
  });
}
