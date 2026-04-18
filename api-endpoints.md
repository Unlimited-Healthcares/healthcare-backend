
# API Endpoints Structure

The API will follow RESTful principles and be organized around the following resource groups:

## Authentication
- POST /auth/register
- POST /auth/login
- POST /auth/refresh-token
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/verify-email/:token

## Users & Profiles
- GET /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id
- GET /profiles/:id
- PATCH /profiles/:id
- GET /me

## Healthcare Centers
- GET /centers
- POST /centers
- GET /centers/:id
- PATCH /centers/:id
- DELETE /centers/:id
- GET /centers/:id/staff
- POST /centers/:id/staff
- GET /centers/:id/services

## Specialized Center Types
- GET /centers/types
- GET /centers/types/:type
- GET /centers/eye-clinics
- GET /centers/maternity
- GET /centers/virology
- GET /centers/psychiatric
- GET /centers/care-homes
- GET /centers/hospice
- GET /centers/funeral

## Patients
- GET /patients
- POST /patients
- GET /patients/:id
- PATCH /patients/:id
- DELETE /patients/:id
- GET /patients/:id/records
- GET /patients/:id/appointments
- GET /patients/:id/referrals

## Medical Records
- GET /records
- POST /records
- GET /records/:id
- PATCH /records/:id
- DELETE /records/:id
- POST /records/:id/share
- GET /records/shared
- GET /records/requests

## Appointments
- GET /appointments
- POST /appointments
- GET /appointments/:id
- PATCH /appointments/:id
- DELETE /appointments/:id
- GET /centers/:id/availability

## Referrals
- GET /referrals
- POST /referrals
- GET /referrals/:id
- PATCH /referrals/:id
- GET /referrals/:id/documents
- POST /referrals/:id/documents

## Files
- POST /files/upload
- GET /files/:id
- DELETE /files/:id
- GET /files/:id/download
- POST /files/convert

## Notifications
- GET /notifications
- PATCH /notifications/:id
- DELETE /notifications/:id
- GET /notifications/settings
- PATCH /notifications/settings
- GET /notifications/reminders
- POST /notifications/reminders
- PATCH /notifications/reminders/:id
- DELETE /notifications/reminders/:id

## Reports & Analytics
- GET /analytics/referrals
- GET /analytics/appointments
- GET /analytics/patients
- GET /reports/generate

## GPS & Location Services (Phase 8)
- GET /location/validate-coordinates
- POST /location/calculate-distance
- POST /location/geocode
- POST /location/reverse-geocode
- POST /location/geofences
- GET /location/geofences
- GET /location/geofences/:id
- PUT /location/geofences/:id
- DELETE /location/geofences/:id

## Ratings & Reviews (Phase 9) - COMPLETED
- GET /reviews
- POST /reviews
- GET /reviews/:id
- PATCH /reviews/:id
- DELETE /reviews/:id
- POST /reviews/:id/responses
- PUT /reviews/:id/moderate
- POST /reviews/:id/vote
- POST /reviews/:id/photos
- GET /reviews/:id/photos
- GET /reviews/appointments/:appointmentId
- GET /reviews/centers/:centerId/summary
- GET /reviews/centers/:centerId/analytics
- GET /reviews/centers/:centerId/trends
- GET /reviews/centers/:centerId/advanced-analytics

## Emergency Services (Phase 10)

### Ambulance Services
- POST /emergency/ambulance/request
- GET /emergency/ambulance/requests
- GET /emergency/ambulance/requests/:id
- PUT /emergency/ambulance/requests/:id/status
- GET /emergency/ambulance/available
- PUT /emergency/ambulance/ambulances/:id/location
- POST /emergency/ambulance/coordinate-response
- GET /emergency/ambulance/nearby-services

### SOS & Emergency Alerts
- POST /emergency/alerts/sos
- GET /emergency/alerts
- PUT /emergency/alerts/:id/acknowledge
- PUT /emergency/alerts/:id/resolve
- POST /emergency/alerts/emergency-contacts
- GET /emergency/alerts/emergency-contacts

### Viral Disease Reporting
- POST /emergency/viral-reporting/reports
- GET /emergency/viral-reporting/reports
- PUT /emergency/viral-reporting/reports/:id/status
- POST /emergency/viral-reporting/reports/:id/contact-traces
- GET /emergency/viral-reporting/reports/:id/contact-traces
- GET /emergency/viral-reporting/public-health-summary

## AI Assistant & Medical Intelligence (Phase 11) - NEW

### AI Chat System
- POST /ai/chat/sessions
- GET /ai/chat/sessions
- GET /ai/chat/sessions/:id
- PATCH /ai/chat/sessions/:id
- DELETE /ai/chat/sessions/:id
- GET /ai/chat/sessions/:id/messages
- POST /ai/chat/sessions/:id/messages
- POST /ai/chat/message
- GET /ai/chat/history

### Symptom Analysis & Medical Advice
- POST /ai/symptom-checker
- GET /ai/symptom-checker/:id
- POST /ai/symptom-analysis
- GET /ai/medical-advice/:category
- POST /ai/medical-consultation
- GET /ai/triage-assessment

### Intelligent Recommendations
- GET /ai/recommendations
- POST /ai/recommendations/generate
- GET /ai/recommendations/:id
- PATCH /ai/recommendations/:id
- DELETE /ai/recommendations/:id
- POST /ai/recommendations/:id/feedback
- GET /ai/recommendations/services/nearby
- GET /ai/recommendations/specialists
- GET /ai/recommendations/preventive-care

### Health Risk Assessments
- POST /ai/risk-assessment
- GET /ai/risk-assessments
- GET /ai/risk-assessments/:id
- PUT /ai/risk-assessments/:id
- GET /ai/risk-factors
- POST /ai/risk-factors/analyze

### Medical Analysis Tools
- POST /ai/analyze/symptoms
- POST /ai/analyze/drug-interactions
- POST /ai/analyze/medical-image
- GET /ai/analyze/:id
- GET /ai/drug-interactions/check
- POST /ai/drug-interactions/bulk-check
- GET /ai/trends/health/:userId
- POST /ai/trends/predict

### Health Profiles & Trends
- GET /ai/health-profile
- POST /ai/health-profile
- PATCH /ai/health-profile
- GET /ai/health-trends
- POST /ai/health-trends
- GET /ai/health-insights
- POST /ai/health-monitoring

### Medical Knowledge Base
- GET /ai/knowledge
- GET /ai/knowledge/search
- GET /ai/knowledge/:category
- GET /ai/conditions/:condition
- GET /ai/treatments/:treatment
- GET /ai/medications/:medication

## Blood Donation System (Future)
- GET /blood-donation/requests
- POST /blood-donation/requests
- GET /blood-donation/requests/:id
- PATCH /blood-donation/requests/:id
- GET /blood-donation/donors
- POST /blood-donation/donors
- GET /blood-donation/donors/:id
- PATCH /blood-donation/donors/:id
- POST /blood-donation/match
- GET /blood-donation/match/:id
- POST /blood-donation/verify/:id
- POST /blood-donation/payment
- GET /blood-donation/cards
- GET /blood-donation/cards/:id

## Medical Equipment Marketplace (Future)
- GET /equipment
- POST /equipment
- GET /equipment/:id
- PATCH /equipment/:id
- DELETE /equipment/:id
- GET /equipment/rentals
- POST /equipment/rentals
- GET /equipment/rentals/:id
- PATCH /equipment/rentals/:id
- GET /equipment/sales
- POST /equipment/sales
- GET /equipment/sales/:id
- PATCH /equipment/sales/:id
- GET /equipment/vendors
- POST /equipment/vendors
- GET /equipment/vendors/:id
- PATCH /equipment/vendors/:id

## Admin Management (Future)
- GET /admin/centers
- PATCH /admin/centers/:id/verify
- GET /admin/users
- PATCH /admin/users/:id/status
- GET /admin/system/config
- PATCH /admin/system/config
- GET /admin/audit-logs
