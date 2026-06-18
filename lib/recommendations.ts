export function getRecommendations(
  userInterests: string[],
  userGoals: string[],
  userGrade: number,
  allOpportunities: any[]
) {
  return allOpportunities
    .filter((opp) => opp.min_grade <= userGrade && opp.max_grade >= userGrade && opp.is_active)
    .map((opp) => {
      let score = 0;
      
      userInterests.forEach((interest) => {
        if (opp.tags?.includes(interest)) score += 3;
        if (opp.direction?.toLowerCase() === interest.toLowerCase()) score += 5;
      });

      userGoals.forEach((goal) => {
        if (opp.tags?.includes(goal)) score += 4;
      });

      const daysLeft = Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000);
      if (daysLeft < 30 && daysLeft > 0) score += 2;

      return { ...opp, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
