export const getGradeFromTotal = (total) => {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  return "F";
};

export const getGradePoint = (grade) => {
  const map = {
    "A+": 10,
    A: 9,
    B: 8,
    C: 7,
    F: 0,
  };
  return map[grade] ?? 0;
};

export const calculateCgpaFromTotals = (totals = []) => {
  if (!totals.length) return 0;
  const gradePoints = totals.map((total) => getGradePoint(getGradeFromTotal(total)));
  const avg = gradePoints.reduce((sum, gp) => sum + gp, 0) / gradePoints.length;
  return Number(avg.toFixed(2));
};
