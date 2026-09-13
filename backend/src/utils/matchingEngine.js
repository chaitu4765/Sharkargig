import { query } from '../db/index.js';

// Calculate Haversine distance between two sets of (lat, lng) in kilometers
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5.0; // Fallback default distance
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Calculate smart match score for a candidate worker
export const findSuitableWorkers = async ({ serviceId, customerLat, customerLng, isEmergency = false }) => {
  // Fetch service details
  const service = await query(`SELECT * FROM services WHERE id = ?`, [serviceId]);
  if (!service.length) return [];

  // Get all VERIFIED and AVAILABLE workers
  const candidateWorkers = await query(`
    SELECT w.*, u.full_name, u.email, u.phone, cs.name as society_name, cs.city as society_city
    FROM workers w
    JOIN users u ON w.user_id = u.id
    JOIN cooperative_societies cs ON w.society_id = cs.id
    WHERE w.verification_status = 'VERIFIED' AND w.is_available = 1
  `);

  const results = [];

  for (const worker of candidateWorkers) {
    // 1. Skill Compatibility Check (0.35 weight)
    const workerSkills = await query(
      `SELECT ws.*, s.service_id 
       FROM worker_skills ws 
       JOIN skills s ON ws.skill_id = s.id 
       WHERE ws.worker_id = ? AND s.service_id = ?`,
      [worker.id, serviceId]
    );
    const skillMatchScore = workerSkills.length > 0 ? 1.0 : 0.4; // 1.0 if explicit skill match, 0.4 if generic category worker

    // 2. Active Job Workload Check (Availability weight)
    const activeJobs = await query(
      `SELECT COUNT(*) as count FROM bookings WHERE worker_id = ? AND status IN ('CONFIRMED', 'WORKER_ON_THE_WAY', 'IN_PROGRESS')`,
      [worker.id]
    );
    const hasConflict = activeJobs[0].count > 0;
    const availabilityScore = hasConflict ? 0.0 : 1.0;

    if (hasConflict && !isEmergency) {
      // Exclude busy workers for non-emergency bookings
      continue;
    }

    // 3. Distance Score (0.20 weight)
    const distanceKm = calculateDistanceKm(customerLat, customerLng, worker.latitude, worker.longitude);
    const distanceScore = Math.max(0, 1.0 - distanceKm / 25.0);

    // 4. Rating Score (0.10 weight)
    const ratingScore = (worker.average_rating || 5.0) / 5.0;

    // 5. Fair Work Allocation Score (0.15 weight)
    // Workers with fewer recent jobs get a higher fairness boost
    const recentJobs = await query(
      `SELECT COUNT(*) as count FROM bookings WHERE worker_id = ? AND created_at >= datetime('now', '-30 days')`,
      [worker.id]
    );
    const recentJobsCount = recentJobs[0].count;
    const fairnessScore = Math.max(0.1, 1.0 - Math.min(1.0, recentJobsCount / 15.0));

    // Dynamic Weights
    let wSkill = 0.35;
    let wAvail = 0.20;
    let wDist = 0.20;
    let wRating = 0.10;
    let wFairness = 0.15;

    // Emergency Boost: Prioritize proximity & immediate availability
    if (isEmergency) {
      wDist = 0.35;
      wAvail = 0.30;
      wSkill = 0.20;
      wFairness = 0.05;
      wRating = 0.10;
    }

    const totalMatchScore =
      skillMatchScore * wSkill +
      availabilityScore * wAvail +
      distanceScore * wDist +
      ratingScore * wRating +
      fairnessScore * wFairness;

    // Fetch skills list text for UI presentation
    const skillsList = await query(
      `SELECT name FROM skills s JOIN worker_skills ws ON s.id = ws.skill_id WHERE ws.worker_id = ?`,
      [worker.id]
    );

    const certificationsList = await query(
      `SELECT c.name, wc.certificate_no 
       FROM worker_certifications wc 
       JOIN certifications c ON wc.certification_id = c.id 
       WHERE wc.worker_id = ?`,
      [worker.id]
    );

    results.push({
      worker_id: worker.id,
      user_id: worker.user_id,
      full_name: worker.full_name,
      phone: worker.phone,
      profile_photo_url: worker.profile_photo_url,
      years_of_experience: worker.years_of_experience,
      society_name: worker.society_name,
      society_city: worker.society_city,
      average_rating: worker.average_rating,
      total_completed_jobs: worker.total_completed_jobs,
      distance_km: distanceKm,
      match_score: Math.round(totalMatchScore * 100),
      fairness_score: Math.round(fairnessScore * 100),
      breakdown: {
        skill_score: Math.round(skillMatchScore * 100),
        distance_score: Math.round(distanceScore * 100),
        rating_score: Math.round(ratingScore * 100),
        fairness_score: Math.round(fairnessScore * 100)
      },
      skills: skillsList.map((s) => s.name),
      certifications: certificationsList
    });
  }

  // Sort candidate workers by highest match score
  results.sort((a, b) => b.match_score - a.match_score);

  return results;
};
