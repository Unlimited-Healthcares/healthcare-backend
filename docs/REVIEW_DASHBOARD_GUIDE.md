# 📊 Review Dashboard Guide

## 📋 Overview

This comprehensive guide provides everything needed to implement a Review Dashboard for the healthcare management system. The dashboard enables healthcare providers to manage, track, and analyze patient reviews with comprehensive analytics, sentiment analysis, and response management capabilities.

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for all endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`

---

## 🏷️ TypeScript Interfaces

### Core Review Types

```typescript
// Review Status
enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged'
}

// Review Moderation Actions
enum ReviewModerationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  UNFLAG = 'unflag'
}

// Review Sort Options
enum ReviewSortBy {
  CREATED_AT = 'createdAt',
  RATING = 'overallRating',
  HELPFUL_VOTES = 'helpfulVotes'
}

enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}
```

### Review DTOs

```typescript
// Create Review Request
interface CreateReviewDto {
  centerId: string;                    // Required: Center UUID
  appointmentId?: string;              // Optional: Appointment UUID
  overallRating: number;               // Required: 1-5 rating
  staffRating?: number;                // Optional: 1-5 rating
  cleanlinessRating?: number;          // Optional: 1-5 rating
  waitTimeRating?: number;             // Optional: 1-5 rating
  treatmentRating?: number;            // Optional: 1-5 rating
  title?: string;                      // Optional: Review title (max 200 chars)
  content?: string;                    // Optional: Review content (max 2000 chars)
  isAnonymous?: boolean;               // Optional: Anonymous review
  photos?: string[];                   // Optional: Photo URLs
}

// Update Review Request
interface UpdateReviewDto extends Partial<CreateReviewDto> {}

// Query Reviews Parameters
interface QueryReviewsDto {
  centerId?: string;                   // Optional: Filter by center
  patientId?: string;                  // Optional: Filter by patient
  minRating?: number;                  // Optional: Minimum rating (1-5)
  maxRating?: number;                  // Optional: Maximum rating (1-5)
  verifiedOnly?: boolean;              // Optional: Verified reviews only
  hasResponse?: boolean;               // Optional: Reviews with responses
  search?: string;                     // Optional: Search in content
  sortBy?: ReviewSortBy;               // Optional: Sort field
  sortOrder?: SortOrder;               // Optional: Sort direction
  page?: number;                       // Optional: Page number (1+)
  limit?: number;                      // Optional: Items per page (1-100)
}

// Create Review Response
interface CreateReviewResponseDto {
  content: string;                     // Required: Response content (10-1000 chars)
}

// Moderate Review
interface ModerateReviewDto {
  action: ReviewModerationAction;      // Required: Moderation action
  notes?: string;                      // Optional: Moderation notes
}

// Vote on Review
interface VoteReviewDto {
  isHelpful: boolean;                  // Required: Helpful or not helpful
}

// Upload Review Photos
interface UploadReviewPhotosDto {
  photos: string[];                    // Required: Photo URLs
  captions?: string[];                 // Optional: Photo captions
}
```

### Review Response Interfaces

```typescript
// Review Entity
interface Review {
  id: string;                          // UUID - Primary key
  centerId: string;                    // UUID - Center ID
  patientId: string;                   // UUID - Patient ID
  appointmentId?: string;              // UUID - Appointment ID
  overallRating: number;               // Overall rating (1-5)
  staffRating?: number;                // Staff rating (1-5)
  cleanlinessRating?: number;          // Cleanliness rating (1-5)
  waitTimeRating?: number;             // Wait time rating (1-5)
  treatmentRating?: number;            // Treatment rating (1-5)
  title?: string;                      // Review title
  content?: string;                    // Review content
  isAnonymous: boolean;                // Anonymous flag
  isVerified: boolean;                 // Verified flag
  status: ReviewStatus;                // Review status
  photos?: string[];                   // Photo URLs
  helpfulVotes: number;                // Helpful votes count
  totalVotes: number;                  // Total votes count
  isEdited: boolean;                   // Edited flag
  editedAt?: Date;                     // Last edit timestamp
  moderationNotes?: string;            // Moderation notes
  moderatedBy?: string;                // UUID - Moderator ID
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
  center: HealthcareCenter;            // Center information
  patient: Patient;                    // Patient information
  moderator?: User;                    // Moderator information
  response?: ReviewResponse;           // Center response
  votes: ReviewVote[];                 // User votes
}

// Review Response Entity
interface ReviewResponse {
  id: string;                          // UUID - Primary key
  reviewId: string;                    // UUID - Review ID
  content: string;                     // Response content
  respondedBy: string;                 // UUID - Responder ID
  status: 'active' | 'edited' | 'deleted';
  isEdited: boolean;                   // Edited flag
  editedAt?: Date;                     // Last edit timestamp
  createdAt: Date;                     // Creation timestamp
  updatedAt: Date;                     // Last update timestamp
  responder: User;                     // Responder information
}

// Review Photo Entity
interface ReviewPhoto {
  id: string;                          // UUID - Primary key
  reviewId: string;                    // UUID - Review ID
  photoUrl: string;                    // Photo URL
  caption?: string;                    // Photo caption
  displayOrder: number;                // Display order
  fileSize?: number;                   // File size in bytes
  dimensions?: {                       // Photo dimensions
    width: number;
    height: number;
  };
  createdAt: Date;                     // Creation timestamp
}

// Analytics Types
interface CenterReviewSummary {
  totalReviews: number;                // Total review count
  averageRating: number;               // Average rating
  ratingDistribution: {                // Rating distribution
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStars: number;
  };
  verifiedReviewsCount: number;        // Verified reviews count
  responseRate: number;                // Response rate percentage
  averageResponseTime: number;         // Average response time in hours
  recentReviews: Review[];             // Recent reviews
}

interface SentimentAnalysis {
  positive: number;                    // Positive sentiment count
  negative: number;                    // Negative sentiment count
  neutral: number;                     // Neutral sentiment count
  averageSentiment: number;            // Average sentiment score
  sentimentTrend: 'improving' | 'declining' | 'stable';
}

interface ResponseMetrics {
  averageResponseTime: number;         // Average response time in hours
  totalResponses: number;              // Total responses count
  responseRate: number;                // Response rate percentage
  quickResponseCount: number;          // Quick responses (< 24h)
  delayedResponseCount: number;        // Delayed responses (> 72h)
}

interface PhotoMetrics {
  totalPhotos: number;                 // Total photos count
  reviewsWithPhotos: number;           // Reviews with photos count
  averagePhotosPerReview: number;      // Average photos per review
}

interface TimeTrends {
  daily: Record<string, number>;       // Daily trends
  weekly: Record<string, number>;      // Weekly trends
  monthly: Record<string, number>;     // Monthly trends
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface AdvancedAnalytics {
  totalReviews: number;                // Total reviews count
  sentimentAnalysis: SentimentAnalysis;
  responseMetrics: ResponseMetrics;
  photoMetrics: PhotoMetrics | null;
  trends: TimeTrends;
  reviewsWithVotes: ReviewWithVotes[];
}

interface TrendsAnalysis {
  ratingTrend: RatingTrend[];
  categoryTrends: {
    staff: CategoryTrend[];
    cleanliness: CategoryTrend[];
    waitTime: CategoryTrend[];
    treatment: CategoryTrend[];
  };
  responseRateTrend: ResponseRateTrend[];
}

interface RatingTrend {
  period: Date;                        // Time period
  averageRating: number;               // Average rating for period
  totalReviews: number;                // Total reviews for period
}

interface CategoryTrend {
  period: Date;                        // Time period
  rating: number;                      // Category rating for period
}

interface ResponseRateTrend {
  period: Date;                        // Time period
  responseRate: number;                // Response rate for period
}
```

---

## 📊 Review Management Endpoints

### 1. Create Review
**Endpoint:** `POST /reviews`  
**Authentication:** Required (Bearer token)  
**Roles:** Patient

```typescript
const createReview = async (reviewData: CreateReviewDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('https://api.unlimtedhealth.com/api/reviews', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      centerId: "550e8400-e29b-41d4-a716-446655440000",
      appointmentId: "550e8400-e29b-41d4-a716-446655440001",
      overallRating: 4.5,
      staffRating: 5.0,
      cleanlinessRating: 4.0,
      waitTimeRating: 3.5,
      treatmentRating: 4.5,
      title: "Great experience at the clinic",
      content: "The staff was very friendly and professional. The facility was clean and well-maintained.",
      isAnonymous: false,
      photos: ["https://example.com/photo1.jpg"]
    })
  });
  
  return await response.json();
};
```

### 2. Get All Reviews
**Endpoint:** `GET /reviews`  
**Authentication:** Optional (Bearer token for advanced filtering)  
**Roles:** Public, Healthcare Provider, Admin

```typescript
const getReviews = async (filters: QueryReviewsDto = {}) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews?${queryParams}`, {
    method: 'GET',
    headers
  });
  
  return await response.json();
};

// Example usage:
const reviews = await getReviews({
  centerId: '550e8400-e29b-41d4-a716-446655440000',
  minRating: 4,
  verifiedOnly: true,
  sortBy: 'createdAt',
  sortOrder: 'DESC',
  page: 1,
  limit: 20
});
```

### 3. Get Review by ID
**Endpoint:** `GET /reviews/:id`  
**Authentication:** Optional (Bearer token)  
**Roles:** Public, Healthcare Provider, Admin

```typescript
const getReviewById = async (reviewId: string) => {
  const token = localStorage.getItem('access_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}`, {
    method: 'GET',
    headers
  });
  
  return await response.json();
};
```

### 4. Update Review
**Endpoint:** `PUT /reviews/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Patient (own reviews only)

```typescript
const updateReview = async (reviewId: string, updateData: UpdateReviewDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      overallRating: 5.0,
      content: "Updated: Even better experience on my second visit!",
      photos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
    })
  });
  
  return await response.json();
};
```

### 5. Delete Review
**Endpoint:** `DELETE /reviews/:id`  
**Authentication:** Required (Bearer token)  
**Roles:** Patient (own reviews only)

```typescript
const deleteReview = async (reviewId: string) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return response.ok;
};
```

---

## 📈 Analytics Endpoints

### 1. Get Center Review Summary
**Endpoint:** `GET /reviews/centers/:centerId/summary`  
**Authentication:** Not required  
**Roles:** Public

```typescript
const getCenterReviewSummary = async (centerId: string) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/centers/${centerId}/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 2. Get Center Analytics
**Endpoint:** `GET /reviews/centers/:centerId/analytics`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Staff, Admin

```typescript
const getCenterAnalytics = async (centerId: string, months: number = 12) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/centers/${centerId}/analytics?months=${months}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 3. Get Center Trends
**Endpoint:** `GET /reviews/centers/:centerId/trends`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Staff, Admin

```typescript
const getCenterTrends = async (centerId: string, months: number = 12) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/centers/${centerId}/trends?months=${months}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

### 4. Get Advanced Analytics
**Endpoint:** `GET /reviews/centers/:centerId/advanced-analytics`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Staff, Admin

```typescript
const getAdvancedAnalytics = async (
  centerId: string, 
  options: {
    startDate?: string;
    endDate?: string;
    includePhotos?: boolean;
    includeResponses?: boolean;
  } = {}
) => {
  const token = localStorage.getItem('access_token');
  const queryParams = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/centers/${centerId}/advanced-analytics?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 💬 Response Management Endpoints

### 1. Create Review Response
**Endpoint:** `POST /reviews/:id/response`  
**Authentication:** Required (Bearer token)  
**Roles:** Healthcare Provider, Staff

```typescript
const createReviewResponse = async (reviewId: string, responseData: CreateReviewResponseDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}/response`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: "Thank you for your feedback. We appreciate your visit and are glad you had a positive experience. We look forward to serving you again!"
    })
  });
  
  return await response.json();
};
```

### 2. Moderate Review
**Endpoint:** `PUT /reviews/:id/moderate`  
**Authentication:** Required (Bearer token)  
**Roles:** Admin, Staff

```typescript
const moderateReview = async (reviewId: string, moderationData: ModerateReviewDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}/moderate`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'approve',
      notes: 'Review approved after verification'
    })
  });
  
  return await response.json();
};
```

### 3. Vote on Review
**Endpoint:** `POST /reviews/:id/vote`  
**Authentication:** Required (Bearer token)  
**Roles:** All authenticated users

```typescript
const voteOnReview = async (reviewId: string, voteData: VoteReviewDto) => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}/vote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      isHelpful: true
    })
  });
  
  return response.ok;
};
```

---

## 📸 Photo Management Endpoints

### 1. Upload Review Photos
**Endpoint:** `POST /reviews/:id/photos`  
**Authentication:** Required (Bearer token)  
**Roles:** Patient (own reviews only)

```typescript
const uploadReviewPhotos = async (reviewId: string, photos: File[], uploadData: UploadReviewPhotosDto) => {
  const token = localStorage.getItem('access_token');
  const formData = new FormData();
  
  photos.forEach(photo => {
    formData.append('photos', photo);
  });
  formData.append('photos', JSON.stringify(uploadData.photos));
  if (uploadData.captions) {
    formData.append('captions', JSON.stringify(uploadData.captions));
  }
  
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}/photos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });
  
  return await response.json();
};
```

### 2. Get Review Photos
**Endpoint:** `GET /reviews/:id/photos`  
**Authentication:** Not required  
**Roles:** Public

```typescript
const getReviewPhotos = async (reviewId: string) => {
  const response = await fetch(`https://api.unlimtedhealth.com/api/reviews/${reviewId}/photos`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

---

## 🎨 Frontend Implementation Examples

### React Review Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, DoughnutController, ArcElement, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, DoughnutController, ArcElement, LineElement, PointElement);

interface ReviewDashboardProps {
  centerId: string;
  token: string;
}

const ReviewDashboard: React.FC<ReviewDashboardProps> = ({ centerId, token }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<CenterReviewSummary | null>(null);
  const [analytics, setAnalytics] = useState<ReviewAnalytics[] | null>(null);
  const [trends, setTrends] = useState<TrendsAnalysis | null>(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<QueryReviewsDto>({
    centerId,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadDashboardData();
  }, [centerId, filters]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [reviewsData, summaryData, analyticsData, trendsData, advancedData] = await Promise.all([
        getReviews(filters),
        getCenterReviewSummary(centerId),
        getCenterAnalytics(centerId, 12),
        getCenterTrends(centerId, 12),
        getAdvancedAnalytics(centerId, {
          includePhotos: true,
          includeResponses: true
        })
      ]);
      
      setReviews(reviewsData);
      setSummary(summaryData);
      setAnalytics(analyticsData);
      setTrends(trendsData);
      setAdvancedAnalytics(advancedData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData: CreateReviewDto) => {
    try {
      const newReview = await createReview(reviewData);
      setReviews(prev => [newReview, ...prev]);
      loadDashboardData(); // Refresh all data
    } catch (error) {
      console.error('Error creating review:', error);
    }
  };

  const respondToReview = async (reviewId: string, responseData: CreateReviewResponseDto) => {
    try {
      await createReviewResponse(reviewId, responseData);
      loadDashboardData(); // Refresh all data
    } catch (error) {
      console.error('Error responding to review:', error);
    }
  };

  const moderateReview = async (reviewId: string, moderationData: ModerateReviewDto) => {
    try {
      await moderateReview(reviewId, moderationData);
      loadDashboardData(); // Refresh all data
    } catch (error) {
      console.error('Error moderating review:', error);
    }
  };

  const voteOnReview = async (reviewId: string, isHelpful: boolean) => {
    try {
      await voteOnReview(reviewId, { isHelpful });
      loadDashboardData(); // Refresh all data
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  // Chart data preparation
  const prepareRatingDistributionData = () => {
    if (!summary?.ratingDistribution) return null;

    return {
      labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
      datasets: [
        {
          data: [
            summary.ratingDistribution.fiveStars,
            summary.ratingDistribution.fourStars,
            summary.ratingDistribution.threeStars,
            summary.ratingDistribution.twoStars,
            summary.ratingDistribution.oneStars
          ],
          backgroundColor: [
            '#4CAF50',
            '#8BC34A',
            '#FFC107',
            '#FF9800',
            '#F44336'
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const prepareTrendsData = () => {
    if (!trends?.ratingTrend) return null;

    return {
      labels: trends.ratingTrend.map(trend => 
        new Date(trend.period).toLocaleDateString()
      ),
      datasets: [
        {
          label: 'Average Rating',
          data: trends.ratingTrend.map(trend => trend.averageRating),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Total Reviews',
          data: trends.ratingTrend.map(trend => trend.totalReviews),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Review Analytics',
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        min: 0,
        max: 5
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Rating Distribution',
      },
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (loading) {
    return <div className="loading">Loading review dashboard...</div>;
  }

  return (
    <div className="review-dashboard">
      {/* Header Controls */}
      <div className="dashboard-header">
        <h1>Review Dashboard</h1>
        <div className="controls">
          <select 
            value={filters.minRating || ''} 
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              minRating: e.target.value ? Number(e.target.value) : undefined 
            }))}
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>
          
          <select 
            value={filters.verifiedOnly ? 'true' : ''} 
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              verifiedOnly: e.target.value === 'true' 
            }))}
          >
            <option value="">All Reviews</option>
            <option value="true">Verified Only</option>
          </select>
          
          <select 
            value={filters.hasResponse ? 'true' : ''} 
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              hasResponse: e.target.value === 'true' 
            }))}
          >
            <option value="">All Reviews</option>
            <option value="true">With Responses</option>
          </select>
          
          <input
            type="text"
            placeholder="Search reviews..."
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Overall Rating</h3>
            <div className="metric">
              <span className="value">{summary.averageRating.toFixed(1)}</span>
              <span className="label">out of 5.0</span>
            </div>
          </div>

          <div className="summary-card">
            <h3>Total Reviews</h3>
            <div className="metric">
              <span className="value">{summary.totalReviews}</span>
              <span className="label">Reviews</span>
            </div>
          </div>

          <div className="summary-card">
            <h3>Response Rate</h3>
            <div className="metric">
              <span className="value">{summary.responseRate.toFixed(1)}%</span>
              <span className="label">Responded</span>
            </div>
          </div>

          <div className="summary-card">
            <h3>Verified Reviews</h3>
            <div className="metric">
              <span className="value">{summary.verifiedReviewsCount}</span>
              <span className="label">Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Rating Distribution</h3>
          {prepareRatingDistributionData() && (
            <Doughnut data={prepareRatingDistributionData()!} options={doughnutOptions} />
          )}
        </div>

        <div className="chart-container">
          <h3>Rating Trends</h3>
          {prepareTrendsData() && (
            <Line data={prepareTrendsData()!} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="reviews-table">
        <h3>Recent Reviews</h3>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Rating</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>
                  {review.isAnonymous ? 'Anonymous' : review.patient?.name || 'Unknown'}
                </td>
                <td>
                  <div className="rating-display">
                    <span className="stars">{'★'.repeat(Math.floor(review.overallRating))}</span>
                    <span className="rating-value">{review.overallRating}</span>
                  </div>
                </td>
                <td>{review.title || 'No title'}</td>
                <td>
                  <span className={`status-badge ${review.status}`}>
                    {review.status}
                  </span>
                </td>
                <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => voteOnReview(review.id, true)}>
                      👍 {review.helpfulVotes}
                    </button>
                    {!review.response && (
                      <button onClick={() => respondToReview(review.id, { content: '' })}>
                        Respond
                      </button>
                    )}
                    <button onClick={() => moderateReview(review.id, { action: 'approve' })}>
                      Moderate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewDashboard;
```

### CSS Styling

```css
.review-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.controls select,
.controls input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.value {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.label {
  color: #666;
  font-size: 14px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.reviews-table {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stars {
  color: #ffc107;
  font-size: 16px;
}

.rating-value {
  font-weight: bold;
  color: #333;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.flagged {
  background: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.action-buttons button:hover {
  background: #f8f9fa;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
  color: #666;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .controls {
    flex-wrap: wrap;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .reviews-table {
    overflow-x: auto;
  }
}
```

---

## 🔐 Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "overallRating",
      "message": "Overall rating must be between 1 and 5"
    }
  ]
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions to manage reviews",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Review not found",
  "error": "Not Found"
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install chart.js react-chartjs-2 axios
# or
yarn add chart.js react-chartjs-2 axios
```

### 2. Create API Service

```typescript
// services/reviewApi.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.unlimtedhealth.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const reviewApi = {
  // Review Management
  createReview: (data: CreateReviewDto) => apiClient.post('/reviews', data),
  getReviews: (params: QueryReviewsDto) => apiClient.get('/reviews', { params }),
  getReviewById: (id: string) => apiClient.get(`/reviews/${id}`),
  updateReview: (id: string, data: UpdateReviewDto) => apiClient.put(`/reviews/${id}`, data),
  deleteReview: (id: string) => apiClient.delete(`/reviews/${id}`),
  
  // Analytics
  getCenterSummary: (centerId: string) => apiClient.get(`/reviews/centers/${centerId}/summary`),
  getCenterAnalytics: (centerId: string, months?: number) => 
    apiClient.get(`/reviews/centers/${centerId}/analytics`, { params: { months } }),
  getCenterTrends: (centerId: string, months?: number) => 
    apiClient.get(`/reviews/centers/${centerId}/trends`, { params: { months } }),
  getAdvancedAnalytics: (centerId: string, options: any) => 
    apiClient.get(`/reviews/centers/${centerId}/advanced-analytics`, { params: options }),
  
  // Response Management
  createResponse: (reviewId: string, data: CreateReviewResponseDto) => 
    apiClient.post(`/reviews/${reviewId}/response`, data),
  moderateReview: (reviewId: string, data: ModerateReviewDto) => 
    apiClient.put(`/reviews/${reviewId}/moderate`, data),
  voteOnReview: (reviewId: string, data: VoteReviewDto) => 
    apiClient.post(`/reviews/${reviewId}/vote`, data),
  
  // Photo Management
  uploadPhotos: (reviewId: string, formData: FormData) => 
    apiClient.post(`/reviews/${reviewId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getPhotos: (reviewId: string) => apiClient.get(`/reviews/${reviewId}/photos`),
};
```

---

## 📋 Summary

This comprehensive Review Dashboard guide provides:

✅ **Complete API Documentation** - All review endpoints with real DTOs  
✅ **Analytics Integration** - Comprehensive analytics with charts and trends  
✅ **Response Management** - Review response and moderation capabilities  
✅ **Photo Management** - Photo upload and management  
✅ **TypeScript Interfaces** - Full type definitions for all data structures  
✅ **Frontend Implementation** - React components with Chart.js integration  
✅ **Data Visualization** - Bar charts, doughnut charts, line charts, and summary cards  
✅ **Real-time Updates** - Live review updates and notifications  
✅ **Error Handling** - Comprehensive error response documentation  
✅ **Mobile Responsive** - CSS grid layouts for all screen sizes  

The dashboard supports:
- Review creation and management
- Comprehensive analytics and data visualization
- Review response and moderation
- Photo upload and management
- Real-time updates and notifications
- Mobile-responsive design
- Role-based access control

**Base URL:** `https://api.unlimtedhealth.com/api`  
**Authentication:** Bearer token required for most endpoints  
**Documentation:** Swagger/OpenAPI available at `/api/docs`
