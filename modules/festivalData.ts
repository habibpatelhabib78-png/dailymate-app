
export interface Festival {
  date: string; // MM-DD format
  nameEn: string;
  nameHi: string;
  type: 'national' | 'religious' | 'jayanti' | 'international' | 'lunar';
  description?: string;
}

export const FESTIVAL_DATA: Festival[] = [
  // National Holidays
  { date: '01-26', nameEn: 'Republic Day', nameHi: 'गणतंत्र दिवस', type: 'national' },
  { date: '08-15', nameEn: 'Independence Day', nameHi: 'स्वतंत्रता दिवस', type: 'national' },
  { date: '10-02', nameEn: 'Gandhi Jayanti', nameHi: 'गांधी जयंती', type: 'national' },
  
  // Jayantis
  { date: '01-12', nameEn: 'National Youth Day', nameHi: 'राष्ट्रीय युवा दिवस', type: 'jayanti' },
  { date: '01-23', nameEn: 'Netaji Bose Jayanti', nameHi: 'नेताजी जयंती', type: 'jayanti' },
  { date: '04-14', nameEn: 'Ambedkar Jayanti', nameHi: 'अम्बेडकर जयंती', type: 'jayanti' },
  { date: '09-05', nameEn: 'Teachers\' Day', nameHi: 'शिक्षक दिवस', type: 'jayanti' },
  { date: '11-14', nameEn: 'Children\'s Day', nameHi: 'बाल दिवस', type: 'jayanti' },

  // Religious / Cultural
  { date: '01-14', nameEn: 'Makar Sankranti', nameHi: 'मकर संक्रांति', type: 'religious' },
  { date: '12-25', nameEn: 'Christmas', nameHi: 'क्रिसमस', type: 'religious' },
  { date: '04-13', nameEn: 'Baisakhi', nameHi: 'बैसाखी', type: 'religious' },
  
  // Lunar Events (Placeholders for major occurrences)
  { date: '01-25', nameEn: 'Paush Purnima', nameHi: 'पौष पूर्णिमा', type: 'lunar' },
  { date: '02-09', nameEn: 'Mauni Amavasya', nameHi: 'मौनी अमावस्या', type: 'lunar' },
  { date: '02-24', nameEn: 'Magha Purnima', nameHi: 'माघ पूर्णिमा', type: 'lunar' },
  { date: '03-10', nameEn: 'Phalguna Amavasya', nameHi: 'फाल्गुन अमावस्या', type: 'lunar' },
  { date: '03-25', nameEn: 'Holi Purnima', nameHi: 'होली पूर्णिमा', type: 'lunar' },
  { date: '04-08', nameEn: 'Chaitra Amavasya', nameHi: 'चैत्र अमावस्या', type: 'lunar' },
  { date: '04-23', nameEn: 'Hanuman Jayanti Purnima', nameHi: 'हनुमान जयंती पूर्णिमा', type: 'lunar' },

  // International
  { date: '03-08', nameEn: 'International Women\'s Day', nameHi: 'महिला दिवस', type: 'international' },
  { date: '06-21', nameEn: 'International Yoga Day', nameHi: 'योग दिवस', type: 'international' },
  { date: '12-01', nameEn: 'World AIDS Day', nameHi: 'विश्व एड्स दिवस', type: 'international' }
];
