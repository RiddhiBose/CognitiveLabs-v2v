// Application-wide constants

export const APP_NAME = 'ElevateHer AI';
export const APP_TAGLINE =
  'One Platform. Endless Opportunities. Empowering Women Through Education, Career, Finance and Mentorship.';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  COMPLETE_PROFILE: '/complete-profile',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  COLLEGE_FINDER: '/college-finder',
  SCHOLARSHIPS: '/scholarships',
  EDUCATION_LOANS: '/education-loans',
  GOVERNMENT_SCHEMES: '/government-schemes',
  STARTUP_FUNDING: '/startup-funding',
  INTERNSHIPS: '/internships',
  FINANCIAL_LITERACY: '/financial-literacy',
  MENTORSHIP: '/mentorship',
  SAVED: '/saved',
  APPLICATIONS: '/applications',
  NOTIFICATIONS: '/notifications',
} as const;

// Role thresholds
export const MENTOR_EXPERIENCE_THRESHOLD = 5; // years

// Bio limit
export const BIO_MAX_WORDS = 300;
export const BIO_MAX_CHARS = 2000;

// Indian States and Union Territories
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

// Qualification labels
export const QUALIFICATION_LABELS: Record<string, string> = {
  class_10: 'Class 10',
  class_12: 'Class 12',
  diploma: 'Diploma',
  iti: 'ITI',
  ba: 'BA',
  bsc: 'BSc',
  bcom: 'BCom',
  bba: 'BBA',
  bca: 'BCA',
  btech: 'BTech',
  be: 'BE',
  mbbs: 'MBBS',
  bds: 'BDS',
  bpharm: 'BPharm',
  llb: 'LLB',
  mba: 'MBA',
  mca: 'MCA',
  mtech: 'MTech',
  msc: 'MSc',
  ma: 'MA',
  mcom: 'MCom',
  phd: 'PhD',
  other: 'Other',
};

// Specializations per qualification
export const SPECIALIZATIONS: Record<string, string[]> = {
  btech: [
    'Computer Science',
    'AI & ML',
    'Data Science',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology',
    'Aerospace',
    'Other',
  ],
  be: [
    'Computer Science',
    'Electronics & Communication',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology',
    'Other',
  ],
  ba: [
    'English',
    'Economics',
    'Political Science',
    'History',
    'Psychology',
    'Sociology',
    'Journalism',
    'Geography',
    'Philosophy',
    'Other',
  ],
  bsc: [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Statistics',
    'Computer Science',
    'Biotechnology',
    'Agriculture',
    'Other',
  ],
  bcom: ['Accounting', 'Finance', 'Banking', 'Taxation', 'Business Analytics', 'Other'],
  bba: ['Marketing', 'Finance', 'Human Resources', 'Operations', 'International Business', 'Other'],
  bca: ['Software Development', 'Data Science', 'Networking', 'Cybersecurity', 'Other'],
  llb: [
    'Corporate Law',
    'Criminal Law',
    'Constitutional Law',
    'Human Rights',
    'Intellectual Property',
    'Other',
  ],
  mbbs: ['General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Other'],
  bds: ['Orthodontics', 'Oral Surgery', 'Periodontics', 'Other'],
  bpharm: ['Pharmacology', 'Clinical Pharmacy', 'Drug Regulatory Affairs', 'Other'],
  mba: [
    'Marketing',
    'Finance',
    'Human Resources',
    'Operations',
    'Business Analytics',
    'Entrepreneurship',
    'Other',
  ],
  mca: ['Software Engineering', 'Data Science', 'AI & ML', 'Cybersecurity', 'Other'],
  mtech: [
    'Computer Science',
    'AI & ML',
    'Data Science',
    'VLSI',
    'Structural Engineering',
    'Other',
  ],
  msc: [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Statistics',
    'Computer Science',
    'Biotechnology',
    'Other',
  ],
  ma: [
    'English',
    'Economics',
    'Political Science',
    'History',
    'Psychology',
    'Sociology',
    'Journalism',
    'Other',
  ],
  mcom: ['Accounting', 'Finance', 'Banking', 'Taxation', 'Other'],
  phd: ['Science', 'Technology', 'Engineering', 'Mathematics', 'Humanities', 'Social Science', 'Other'],
  diploma: ['Engineering', 'Computer Applications', 'Fashion Design', 'Hotel Management', 'Other'],
  iti: ['Electrician', 'Fitter', 'Welder', 'Mechanic', 'Electronics', 'Other'],
};

// Occupation labels
export const OCCUPATION_LABELS: Record<string, string> = {
  student: 'Student',
  working_professional: 'Working Professional',
  entrepreneur: 'Entrepreneur',
  government_employee: 'Government Employee',
  private_employee: 'Private Employee',
  research_scholar: 'Research Scholar',
  freelancer: 'Freelancer',
  homemaker: 'Homemaker',
  job_seeker: 'Job Seeker',
  other: 'Other',
};

// Employment type labels
export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  government: 'Government',
  private: 'Private',
  startup: 'Startup',
  self_employed: 'Self-employed',
  ngo: 'NGO',
  freelancer: 'Freelancer',
  other: 'Other',
};

// Annual income labels
export const ANNUAL_INCOME_LABELS: Record<string, string> = {
  below_2l: 'Below ₹2 Lakh',
  '2l_5l': '₹2–5 Lakh',
  '5l_8l': '₹5–8 Lakh',
  '8l_12l': '₹8–12 Lakh',
  '12l_20l': '₹12–20 Lakh',
  above_20l: 'Above ₹20 Lakh',
};

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  obc: 'OBC',
  sc: 'SC',
  st: 'ST',
  ews: 'EWS',
  prefer_not_to_say: 'Prefer Not To Say',
};

// Gender labels
export const GENDER_LABELS: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  non_binary: 'Non-binary',
  prefer_not_to_say: 'Prefer Not To Say',
  other: 'Other',
};
