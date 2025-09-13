import { Student, RiskPrediction, AttendanceRecord, GradeRecord, BehaviorRecord } from '../types';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class PredictionService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async predictRiskLevel(
    student: Student,
    attendanceRecords: AttendanceRecord[],
    gradeRecords: GradeRecord[],
    behaviorRecords: BehaviorRecord[]
  ): Promise<RiskPrediction> {
    try {
      // Prepare data for ML analysis
      const studentData = this.prepareStudentData(student, attendanceRecords, gradeRecords, behaviorRecords);
      
      // Create prompt for Gemini API
      const prompt = this.createAnalysisPrompt(studentData);
      
      // Call Gemini API
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      const analysisResult = data.candidates[0]?.content?.parts[0]?.text;

      if (!analysisResult) {
        throw new Error('No analysis result received from API');
      }

      // Parse the AI response
      return this.parseAnalysisResult(student.id, analysisResult);
    } catch (error) {
      console.error('Error in risk prediction:', error);
      // Fallback to rule-based prediction
      return this.fallbackPrediction(student, attendanceRecords, gradeRecords, behaviorRecords);
    }
  }

  private prepareStudentData(
    student: Student,
    attendanceRecords: AttendanceRecord[],
    gradeRecords: GradeRecord[],
    behaviorRecords: BehaviorRecord[]
  ) {
    // Calculate recent attendance rate (last 30 days)
    const recentAttendance = attendanceRecords
      .filter(record => {
        const recordDate = new Date(record.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return recordDate >= thirtyDaysAgo;
      });

    const presentDays = recentAttendance.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const recentAttendanceRate = recentAttendance.length > 0 ? (presentDays / recentAttendance.length) * 100 : 0;

    // Calculate recent grade average
    const recentGrades = gradeRecords
      .filter(record => {
        const recordDate = new Date(record.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return recordDate >= thirtyDaysAgo;
      });

    const recentGradeAverage = recentGrades.length > 0 
      ? recentGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) / recentGrades.length
      : 0;

    // Analyze behavior trends
    const recentBehavior = behaviorRecords
      .filter(record => {
        const recordDate = new Date(record.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return recordDate >= thirtyDaysAgo;
      });

    const negativeIncidents = recentBehavior.filter(b => b.type === 'Negative').length;
    const positiveIncidents = recentBehavior.filter(b => b.type === 'Positive').length;

    return {
      student,
      recentAttendanceRate,
      overallAttendanceRate: student.attendanceRate,
      recentGradeAverage,
      overallGPA: student.currentGPA,
      negativeIncidents,
      positiveIncidents,
      totalBehaviorIncidents: recentBehavior.length,
      grade: student.grade,
      enrollmentDuration: Math.floor((new Date().getTime() - new Date(student.enrollmentDate).getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  private createAnalysisPrompt(data: any): string {
    return `
You are an AI model specialized in predicting student academic risk levels. Analyze the following student data and provide a risk assessment.

Student Information:
- Name: ${data.student.name}
- Grade: ${data.grade}
- Enrollment Duration: ${data.enrollmentDuration} days
- Overall GPA: ${data.overallGPA}
- Overall Attendance Rate: ${data.overallAttendanceRate}%

Recent Performance (Last 30 Days):
- Recent Attendance Rate: ${data.recentAttendanceRate}%
- Recent Grade Average: ${data.recentGradeAverage}%
- Negative Behavior Incidents: ${data.negativeIncidents}
- Positive Behavior Incidents: ${data.positiveIncidents}
- Total Behavior Records: ${data.totalBehaviorIncidents}

Please provide your analysis in the following JSON format:
{
  "riskScore": [number between 0 and 1],
  "riskLevel": ["Low" | "Medium" | "High"],
  "confidence": [number between 0 and 1],
  "factors": [
    {
      "feature": "feature name",
      "impact": [number between -1 and 1, where positive means increases risk],
      "description": "explanation of this factor's impact"
    }
  ],
  "reasoning": "Brief explanation of the risk assessment"
}

Risk Level Guidelines:
- Low (0.0-0.3): Student is performing well with minimal risk indicators
- Medium (0.3-0.6): Student shows some concerning patterns that need monitoring
- High (0.6-1.0): Student requires immediate intervention and support

Consider factors like:
- Attendance trends (recent vs overall)
- Academic performance trends
- Behavioral patterns
- Grade level expectations
- Duration of enrollment (adjustment period for new students)
`;
  }

  private parseAnalysisResult(studentId: string, analysisResult: string): RiskPrediction {
    try {
      // Extract JSON from the response
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis result');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        studentId,
        riskScore: Math.max(0, Math.min(1, parsed.riskScore)),
        riskLevel: this.mapScoreToLevel(parsed.riskScore),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.8)),
        factors: parsed.factors || [],
        modelVersion: '1.0.0-gemini',
        predictedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error parsing analysis result:', error);
      throw error;
    }
  }

  private mapScoreToLevel(score: number): 'Low' | 'Medium' | 'High' {
    if (score < 0.3) return 'Low';
    if (score < 0.6) return 'Medium';
    return 'High';
  }

  private fallbackPrediction(
    student: Student,
    attendanceRecords: AttendanceRecord[],
    gradeRecords: GradeRecord[],
    behaviorRecords: BehaviorRecord[]
  ): RiskPrediction {
    // Simple rule-based fallback
    const attendanceWeight = 0.4;
    const gradeWeight = 0.4;
    const behaviorWeight = 0.2;

    const attendanceScore = student.attendanceRate / 100;
    const gradeScore = student.currentGPA / 4.0;
    const behaviorScore = Math.max(0, (5 - student.behaviorScore) / 5);

    const riskScore = 1 - (attendanceScore * attendanceWeight + gradeScore * gradeWeight + behaviorScore * behaviorWeight);

    return {
      studentId: student.id,
      riskScore: Math.round(riskScore * 100) / 100,
      riskLevel: this.mapScoreToLevel(riskScore),
      confidence: 0.75,
      factors: [
        {
          feature: 'Attendance Rate',
          impact: attendanceScore < 0.8 ? 0.3 : -0.1,
          description: `Current attendance: ${student.attendanceRate}%`,
        },
        {
          feature: 'Academic Performance',
          impact: gradeScore < 0.6 ? 0.4 : -0.2,
          description: `Current GPA: ${student.currentGPA}`,
        },
        {
          feature: 'Behavioral Indicators',
          impact: behaviorScore > 0.6 ? 0.2 : -0.1,
          description: `Behavior score: ${student.behaviorScore}/5`,
        },
      ],
      modelVersion: '1.0.0-fallback',
      predictedAt: new Date().toISOString(),
    };
  }

  async batchPredict(
    students: Student[],
    allAttendanceRecords: AttendanceRecord[],
    allGradeRecords: GradeRecord[],
    allBehaviorRecords: BehaviorRecord[]
  ): Promise<RiskPrediction[]> {
    const predictions: RiskPrediction[] = [];
    
    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize);
      
      const batchPromises = batch.map(student => {
        const studentAttendance = allAttendanceRecords.filter(r => r.studentId === student.id);
        const studentGrades = allGradeRecords.filter(r => r.studentId === student.id);
        const studentBehavior = allBehaviorRecords.filter(r => r.studentId === student.id);
        
        return this.predictRiskLevel(student, studentAttendance, studentGrades, studentBehavior);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          predictions.push(result.value);
        } else {
          console.error(`Failed to predict for student ${batch[index].id}:`, result.reason);
          // Add fallback prediction
          const student = batch[index];
          const studentAttendance = allAttendanceRecords.filter(r => r.studentId === student.id);
          const studentGrades = allGradeRecords.filter(r => r.studentId === student.id);
          const studentBehavior = allBehaviorRecords.filter(r => r.studentId === student.id);
          predictions.push(this.fallbackPrediction(student, studentAttendance, studentGrades, studentBehavior));
        }
      });
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < students.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return predictions;
  }
}
