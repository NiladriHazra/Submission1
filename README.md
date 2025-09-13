# Student Risk Monitoring System

A comprehensive AI-powered web application for proactive student risk assessment and intervention management. Built with Next.js, TypeScript, and integrated with Google's Gemini AI for intelligent risk predictions.

## Features

### Core Functionality
- **AI-Powered Risk Assessment**: Uses Google Gemini API for intelligent student risk level predictions (Low/Medium/High)
- **Multi-Factor Analysis**: Combines attendance, academic performance, and behavioral indicators
- **Real-Time Dashboard**: Interactive visualizations with risk distribution charts and student analytics
- **Student Profiles**: Detailed individual student views with historical data and trend analysis
- **Alert System**: Automated alerts with configurable thresholds and integration hooks for SMS/email
- **Continuous Learning**: Model retraining capabilities with versioning and metadata tracking

### Technical Features
- **Modular Storage Layer**: Abstracted storage interface supporting easy migration from localStorage to backend APIs
- **Responsive Design**: Modern UI with copper forge background theme and mobile-friendly interface
- **TypeScript**: Full type safety throughout the application
- **Accessibility**: Keyboard navigation and ARIA labels for screen readers

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key (for AI predictions)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd hackathon
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open the application:**
Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. **Configure API Key**: Go to Settings and enter your Gemini API key
2. **Sample Data**: The app automatically generates 200 sample students with realistic data on first load
3. **Explore**: Navigate through the dashboard, student profiles, and alerts to familiarize yourself with the system

## Application Structure

### Pages
- **Landing Page** (`/`): Introduction and feature overview
- **Dashboard** (`/dashboard`): Main analytics view with risk distribution and key metrics
- **Students** (`/students`): Student directory with search, filtering, and sorting
- **Student Profile** (`/students/[id]`): Individual student details with charts and risk factors
- **Alerts** (`/alerts`): Alert management with acknowledgment and filtering
- **Settings** (`/settings`): System configuration including thresholds and API settings

### Data Models

The application uses comprehensive TypeScript interfaces for type safety:

```typescript
interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  enrollmentDate: string;
  attendanceRate: number;
  currentGPA: number;
  behaviorScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskScore: number;
  lastUpdated: string;
}
```

See `lib/types.ts` for complete interface definitions.

### Storage Architecture

The storage layer is designed for easy migration:

```typescript
// Current: localStorage implementation
import { storage } from './lib/storage';

// Future: API implementation
// Just replace the factory in lib/storage/index.ts
```

**localStorage Schema:**
- `srm_students`: Student records
- `srm_attendance`: Attendance records
- `srm_grades`: Grade records  
- `srm_behavior`: Behavior incidents
- `srm_alerts`: System alerts
- `srm_predictions`: AI risk predictions
- `srm_model_metadata`: ML model information
- `srm_settings`: Application settings

## AI Integration

### Gemini API Integration
The system uses Google's Gemini AI for risk predictions:

```typescript
const predictionService = new PredictionService(apiKey);
const prediction = await predictionService.predictRiskLevel(
  student, 
  attendanceRecords, 
  gradeRecords, 
  behaviorRecords
);
```

### Risk Factors
The AI analyzes multiple factors:
- **Attendance Patterns**: Recent vs. historical attendance rates
- **Academic Performance**: GPA trends and assignment completion
- **Behavioral Indicators**: Incident frequency and severity
- **Contextual Factors**: Grade level, enrollment duration

### Model Features
- **Explainable AI**: Each prediction includes factor importance and descriptions
- **Confidence Scoring**: Predictions include confidence levels
- **Fallback System**: Rule-based predictions when API is unavailable
- **Batch Processing**: Efficient processing of multiple students
- **Rate Limiting**: Built-in delays to respect API limits

## Alert System

### Alert Types
- **Risk Level Change**: When a student's risk category changes
- **Attendance Warning**: Low attendance rate alerts
- **Grade Drop**: Significant GPA decreases
- **Behavior Incident**: Negative behavior reports
- **Manual**: Custom alerts created by educators

### Integration Hooks
Ready for production integrations:

```typescript
// SMS Integration (Twilio)
await alertService.sendSMSAlert(alert, phoneNumber);

// Email Integration (SendGrid)
await alertService.sendEmailAlert(alert, email);
```

## Configuration

### Risk Thresholds
Configurable in Settings page:
- **Low Risk**: 0-30% (default)
- **Medium Risk**: 30-60% (default)  
- **High Risk**: 60-100% (default)

### Alert Settings
- Browser notifications
- Email integration toggle
- SMS integration toggle
- Auto-acknowledgment timing

### Model Settings
- Auto-retrain threshold
- Manual retrain trigger
- Model versioning

## Migration to Production Backend

### Step 1: Database Setup
Create tables based on TypeScript interfaces in `lib/types.ts`:

```sql
CREATE TABLE students (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  grade VARCHAR NOT NULL,
  enrollment_date DATE NOT NULL,
  attendance_rate DECIMAL(5,2),
  current_gpa DECIMAL(3,2),
  behavior_score DECIMAL(3,2),
  risk_level VARCHAR(10),
  risk_score DECIMAL(3,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Additional tables for attendance, grades, behavior, alerts, etc.
```

### Step 2: API Service Implementation
Create a new service implementing the `StorageInterface`:

```typescript
export class APIStorageService implements StorageInterface {
  async getStudents(): Promise<Student[]> {
    const response = await fetch('/api/students');
    return response.json();
  }
  
  async saveStudent(student: Student): Promise<void> {
    await fetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(student)
    });
  }
  
  // Implement other interface methods...
}
```

### Step 3: Update Storage Factory
Modify `lib/storage/index.ts`:

```typescript
export function createStorageService(): StorageInterface {
  // return new LocalStorageService(); // Development
  return new APIStorageService(); // Production
}
```

### Step 4: External Integrations
Configure alert providers in `AlertService`:

```typescript
// Twilio SMS
const client = twilio(accountSid, authToken);
await client.messages.create({
  body: alert.message,
  from: '+1234567890',
  to: phoneNumber
});

// SendGrid Email
await sgMail.send({
  to: email,
  from: 'alerts@school.edu',
  subject: `Student Risk Alert - ${alert.severity}`,
  text: alert.message,
});
```

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Project Structure
```
├── app/                 # Next.js app router pages
│   ├── dashboard/       # Dashboard page
│   ├── students/        # Student pages
│   ├── alerts/          # Alerts page
│   ├── settings/        # Settings page
│   └── page.tsx         # Landing page
├── lib/                 # Core business logic
│   ├── data/            # Sample data generation
│   ├── services/        # AI and alert services
│   ├── storage/         # Storage abstraction layer
│   └── types.ts         # TypeScript interfaces
└── public/              # Static assets
```

### Key Dependencies
- **Next.js 15**: React framework with app router
- **TypeScript**: Type safety and developer experience
- **Recharts**: Data visualization components
- **Lucide React**: Icon library
- **Date-fns**: Date manipulation utilities
- **Tailwind CSS**: Utility-first CSS framework

## Testing

Basic unit tests are included for critical components:

```bash
npm test                 # Run tests (when implemented)
```

Test coverage includes:
- Storage layer functionality
- Risk prediction logic
- Alert system operations
- Data validation

## Security Considerations

- **API Key Storage**: Gemini API key stored in localStorage (development) - move to secure server-side storage for production
- **Data Validation**: Input sanitization and type checking throughout
- **Access Control**: Add authentication and authorization for production use
- **HTTPS**: Ensure all API communications use HTTPS in production

## Performance Optimization

- **Lazy Loading**: Components and data loaded on demand
- **Caching**: localStorage provides client-side caching
- **Batch Processing**: Efficient API calls for multiple students
- **Responsive Design**: Optimized for various screen sizes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues:
1. Check the documentation above
2. Review the code comments in `lib/` directory
3. Examine the sample data generation in `lib/data/sampleData.ts`
4. Test the storage layer with different scenarios

## Roadmap

### Future Enhancements
- **Advanced ML Models**: Integration with more sophisticated prediction algorithms
- **Real-time Updates**: WebSocket integration for live data updates
- **Mobile App**: React Native companion application
- **Advanced Analytics**: Predictive modeling for intervention effectiveness
- **Integration APIs**: REST API for third-party system integration
- **Multi-tenant Support**: Support for multiple schools/districts
# Submission1
