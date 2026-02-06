
export interface HijriDate {
  day: number;
  month: number; // 0-indexed
  year: number;
  monthEn: string;
  monthHi: string;
}

export const hijriMonthsEn = [
  "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
  "Jumada al-ula", "Jumada al-akhira", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

export const hijriMonthsHi = [
  "मुहर्रम", "सफ़र", "रबी अल-अव्वल", "रबी अल-थानी",
  "जुमादा अल-उला", "जुमादा अल-अखिरा", "रजब", "शाबान",
  "रमजान", "शव्वाल", "धुल-क़ादा", "धुल-हिज्जा"
];

export function getHijriDate(date: Date, offset: number = 0): HijriDate {
  // Apply the user-defined day offset
  const adjustedDate = new Date(date);
  adjustedDate.setDate(adjustedDate.getDate() + offset);

  let jd = 0;
  const d = adjustedDate.getDate();
  const m = adjustedDate.getMonth() + 1;
  const y = adjustedDate.getFullYear();

  if (y > 1582 || (y === 1582 && m > 10) || (y === 1582 && m === 10 && d > 14)) {
    jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
         Math.floor((367 * (m - 2 - 12 * (Math.floor((m - 14) / 12)))) / 12) -
         Math.floor((3 * (Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100))) / 4) +
         d - 32075;
  } else {
    jd = Math.floor((1461 * (y + 4716)) / 4) +
         Math.floor((367 * m) / 12) -
         Math.floor((7 * (y + 4716 + Math.floor((m + 9) / 12))) / 4) +
         d - 1402;
  }

  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316) * Math.floor((50 * l + 24519) / 17705)) +
          (Math.floor(l / 5670) * Math.floor((43 * l + 11925) / 15301));
  l = l - Math.floor((30 * j + 28) / 49) + 6;
  
  let monthIndex = Math.floor((l - 1) / 30);
  let day = l - 30 * monthIndex;
  let year = 30 * n + j;

  const safeMonth = Math.min(Math.max(0, monthIndex), 11);

  return { 
    day: day, 
    month: safeMonth, 
    year: year,
    monthEn: hijriMonthsEn[safeMonth] || "Muharram",
    monthHi: hijriMonthsHi[safeMonth] || "मुहर्रम"
  };
}
