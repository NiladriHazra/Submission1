import { 
  Student, 
  AttendanceRecord, 
  GradeRecord, 
  BehaviorRecord, 
  Alert,
  RiskPrediction,
  ModelMetadata 
} from '../types';

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Rishabh', 'Aryan', 'Kabir', 'Ansh', 'Kian', 'Rudra',
  'Prisha', 'Ananya', 'Fatima', 'Aanya', 'Diya', 'Pihu', 'Saanvi', 'Inaya', 'Riya', 'Aadhya',
  'Kiara', 'Anika', 'Kavya', 'Navya', 'Aradhya', 'Myra', 'Sara', 'Pari', 'Alisha', 'Kashvi',
  'Aryan', 'Rohan', 'Karthik', 'Nikhil', 'Rahul', 'Amit', 'Suresh', 'Vikram', 'Rajesh', 'Deepak',
  'Sneha', 'Pooja', 'Meera', 'Kavitha', 'Sunita', 'Rekha', 'Priya', 'Neha', 'Swati', 'Divya',
  'Harsh', 'Yash', 'Dev', 'Arush', 'Shivansh', 'Dhruv', 'Karan', 'Tanish', 'Veer', 'Arnav',
  'Tara', 'Ira', 'Mira', 'Zara', 'Nisha', 'Rhea', 'Sia', 'Anya', 'Ishika', 'Mahika'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Agarwal', 'Jain', 'Bansal', 'Agrawal',
  'Chopra', 'Malhotra', 'Kapoor', 'Arora', 'Mittal', 'Joshi', 'Saxena', 'Srivastava', 'Tiwari', 'Pandey',
  'Yadav', 'Mishra', 'Chandra', 'Bhatia', 'Khanna', 'Sinha', 'Mehta', 'Shah', 'Thakur', 'Nair',
  'Reddy', 'Rao', 'Krishnan', 'Iyer', 'Menon', 'Pillai', 'Das', 'Ghosh', 'Mukherjee', 'Chatterjee',
  'Dutta', 'Roy', 'Sengupta', 'Bhattacharya', 'Chakraborty', 'Banerjee', 'Bose', 'Mitra', 'Sarkar', 'Paul'
];

const subjects = ['Mathematics', 'English', 'Science', 'History', 'Art', 'Physical Education', 'Music', 'Computer Science'];
const assignmentTypes: ('Homework' | 'Quiz' | 'Test' | 'Project' | 'Participation')[] = ['Homework', 'Quiz', 'Test', 'Project', 'Participation'];
const behaviorTypes: ('Positive' | 'Negative' | 'Neutral')[] = ['Positive', 'Negative', 'Neutral'];
const grades = ['6th', '7th', '8th', '9th', '10th', '11th', '12th'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function calculateRiskLevel(attendanceRate: number, gpa: number, behaviorScore: number): { level: 'Low' | 'Medium' | 'High', score: number } {
  // Simple risk calculation based on weighted factors
  const attendanceWeight = 0.4;
  const gpaWeight = 0.4;
  const behaviorWeight = 0.2;
  
  // Normalize scores (higher is better for attendance and GPA, lower is better for behavior issues)
  const attendanceScore = attendanceRate / 100;
  const gpaScore = gpa / 4.0;
  const behaviorScoreNorm = Math.max(0, (5 - behaviorScore) / 5); // Invert behavior score
  
  const riskScore = 1 - (attendanceScore * attendanceWeight + gpaScore * gpaWeight + behaviorScoreNorm * behaviorWeight);
  
  let level: 'Low' | 'Medium' | 'High';
  if (riskScore < 0.3) level = 'Low';
  else if (riskScore < 0.6) level = 'Medium';
  else level = 'High';
  
  return { level, score: Math.round(riskScore * 100) / 100 };
}

export function generateSampleStudents(count: number = 200): Student[] {
  const students: Student[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const attendanceRate = randomFloat(65, 98);
    const gpa = randomFloat(1.5, 4.0);
    const behaviorScore = randomFloat(1, 5);
    const { level, score } = calculateRiskLevel(attendanceRate, gpa, behaviorScore);
    
    const student: Student = {
      id: generateId(),
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`,
      grade: randomChoice(grades),
      enrollmentDate: getDateDaysAgo(randomInt(30, 365)),
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      currentGPA: Math.round(gpa * 100) / 100,
      behaviorScore: Math.round(behaviorScore * 100) / 100,
      riskLevel: level,
      riskScore: score,
      lastUpdated: new Date().toISOString(),
    };
    
    students.push(student);
  }
  
  return students;
}

export function generateAttendanceRecords(students: Student[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses = ['Present', 'Absent', 'Late', 'Excused'] as const;
  
  students.forEach(student => {
    // Generate 30 days of attendance records
    for (let i = 0; i < 30; i++) {
      const date = getDateDaysAgo(i);
      let status: typeof statuses[number];
      
      // Base probability on student's attendance rate
      const rand = Math.random() * 100;
      if (rand < student.attendanceRate) {
        status = Math.random() < 0.9 ? 'Present' : 'Late';
      } else {
        status = Math.random() < 0.7 ? 'Absent' : 'Excused';
      }
      
      records.push({
        id: generateId(),
        studentId: student.id,
        date,
        status,
        notes: status === 'Absent' ? (Math.random() < 0.3 ? 'Unexcused absence' : undefined) : undefined,
      });
    }
  });
  
  return records;
}

export function generateGradeRecords(students: Student[]): GradeRecord[] {
  const records: GradeRecord[] = [];
  
  students.forEach(student => {
    // Generate 15-25 grade records per student
    const numRecords = randomInt(15, 25);
    
    for (let i = 0; i < numRecords; i++) {
      const subject = randomChoice(subjects);
      const category = randomChoice(assignmentTypes);
      const maxScore = category === 'Test' ? 100 : category === 'Quiz' ? 50 : category === 'Project' ? 100 : 20;
      
      // Base score on student's GPA with some randomness
      const basePercentage = (student.currentGPA / 4.0) * 100;
      const variance = randomFloat(-15, 15);
      const percentage = Math.max(0, Math.min(100, basePercentage + variance));
      const score = Math.round((percentage / 100) * maxScore);
      
      records.push({
        id: generateId(),
        studentId: student.id,
        subject,
        assignment: `${category} ${i + 1}`,
        score,
        maxScore,
        date: getDateDaysAgo(randomInt(1, 60)),
        category,
      });
    }
  });
  
  return records;
}

export function generateBehaviorRecords(students: Student[]): BehaviorRecord[] {
  const records: BehaviorRecord[] = [];
  
  const positiveDescriptions = [
    'Helped classmate with assignment',
    'Showed excellent leadership',
    'Demonstrated outstanding effort',
    'Participated actively in class discussion',
    'Showed kindness to new student',
  ];
  
  const negativeDescriptions = [
    'Disrupted class discussion',
    'Late to class repeatedly',
    'Did not complete homework',
    'Inappropriate behavior in hallway',
    'Disrespectful to teacher',
  ];
  
  const neutralDescriptions = [
    'Parent conference scheduled',
    'Requested extra help',
    'Participated in school event',
    'Submitted assignment late',
    'Asked to stay after class',
  ];
  
  students.forEach(student => {
    // Generate 3-8 behavior records per student
    const numRecords = randomInt(3, 8);
    
    for (let i = 0; i < numRecords; i++) {
      let type: typeof behaviorTypes[number];
      let descriptions: string[];
      
      // Base behavior type on student's behavior score
      const rand = Math.random();
      if (student.behaviorScore >= 4) {
        type = rand < 0.7 ? 'Positive' : rand < 0.9 ? 'Neutral' : 'Negative';
        descriptions = type === 'Positive' ? positiveDescriptions : type === 'Neutral' ? neutralDescriptions : negativeDescriptions;
      } else if (student.behaviorScore >= 3) {
        type = rand < 0.4 ? 'Positive' : rand < 0.7 ? 'Neutral' : 'Negative';
        descriptions = type === 'Positive' ? positiveDescriptions : type === 'Neutral' ? neutralDescriptions : negativeDescriptions;
      } else {
        type = rand < 0.2 ? 'Positive' : rand < 0.4 ? 'Neutral' : 'Negative';
        descriptions = type === 'Positive' ? positiveDescriptions : type === 'Neutral' ? neutralDescriptions : negativeDescriptions;
      }
      
      records.push({
        id: generateId(),
        studentId: student.id,
        date: getDateDaysAgo(randomInt(1, 30)),
        type,
        description: randomChoice(descriptions),
        severity: (type === 'Negative' ? randomInt(2, 5) : type === 'Positive' ? 1 : randomInt(1, 3)) as 1 | 2 | 3 | 4 | 5,
        reportedBy: randomChoice(['Ms. Johnson', 'Mr. Smith', 'Dr. Williams', 'Mrs. Brown', 'Mr. Davis']),
      });
    }
  });
  
  return records;
}

export function generateAlerts(students: Student[]): Alert[] {
  const alerts: Alert[] = [];
  
  // Generate alerts for high-risk students
  const highRiskStudents = students.filter(s => s.riskLevel === 'High');
  const mediumRiskStudents = students.filter(s => s.riskLevel === 'Medium');
  
  highRiskStudents.forEach(student => {
    if (Math.random() < 0.8) { // 80% chance of alert for high-risk students
      alerts.push({
        id: generateId(),
        studentId: student.id,
        type: 'Risk Level Change',
        message: `${student.name} has been classified as High Risk. Immediate intervention recommended.`,
        severity: 'High',
        timestamp: new Date(Date.now() - randomInt(1, 72) * 60 * 60 * 1000).toISOString(),
        acknowledged: Math.random() < 0.3,
      });
    }
  });
  
  mediumRiskStudents.forEach(student => {
    if (Math.random() < 0.4) { // 40% chance of alert for medium-risk students
      alerts.push({
        id: generateId(),
        studentId: student.id,
        type: 'Attendance Warning',
        message: `${student.name} attendance rate has dropped to ${student.attendanceRate}%.`,
        severity: 'Medium',
        timestamp: new Date(Date.now() - randomInt(1, 48) * 60 * 60 * 1000).toISOString(),
        acknowledged: Math.random() < 0.6,
      });
    }
  });
  
  return alerts;
}

export function generateRiskPredictions(students: Student[]): RiskPrediction[] {
  return students.map(student => ({
    studentId: student.id,
    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    confidence: randomFloat(0.7, 0.95),
    factors: [
      {
        feature: 'Attendance Rate',
        impact: student.attendanceRate < 80 ? randomFloat(0.3, 0.6) : randomFloat(-0.2, 0.1),
        description: `Current attendance: ${student.attendanceRate}%`,
      },
      {
        feature: 'Academic Performance',
        impact: student.currentGPA < 2.5 ? randomFloat(0.2, 0.5) : randomFloat(-0.3, 0.1),
        description: `Current GPA: ${student.currentGPA}`,
      },
      {
        feature: 'Behavioral Indicators',
        impact: student.behaviorScore > 3 ? randomFloat(-0.2, 0.1) : randomFloat(0.1, 0.4),
        description: `Behavior score: ${student.behaviorScore}/5`,
      },
    ],
    modelVersion: '1.0.0',
    predictedAt: new Date().toISOString(),
  }));
}

export function generateModelMetadata(): ModelMetadata {
  return {
    version: '1.0.0',
    trainingDate: new Date().toISOString(),
    sampleSize: 200,
    accuracy: 0.87,
    thresholds: {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
    },
  };
}
