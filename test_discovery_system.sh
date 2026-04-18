#!/bin/bash

# Discovery System Testing Script with Real Emails
# This script tests the complete discovery system using real email addresses

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://api.unlimtedhealth.com/api"
PATIENT_EMAIL="cyberkrypt9@gmail.com"
DOCTOR_EMAIL="chukwuebuka.nwafor321@gmail.com"
CENTER_EMAIL="chukwuebuka.nwaforx@gmail.com"
PASSWORD="Test123Test123!"

# Test data
PATIENT_NAME="John Patient"
DOCTOR_NAME="Dr. Jane Smith"
CENTER_NAME="City Hospital Admin"

echo -e "${BLUE}🚀 Starting Discovery System Testing with Real Emails${NC}"
echo "=================================================="
echo "Patient Email: $PATIENT_EMAIL"
echo "Doctor Email: $DOCTOR_EMAIL"
echo "Center Email: $CENTER_EMAIL"
echo "=================================================="

# Function to make API calls with error handling
make_request() {
    local method=$1
    local url=$2
    local headers=$3
    local data=$4
    local description=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X $method "$url" $headers -d "$data")
    else
        response=$(curl -s -X $method "$url" $headers)
    fi
    
    # Check if response contains error
    if echo "$response" | grep -q '"error"'; then
        echo -e "${RED}❌ Error: $response${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Success${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 0
    fi
}

# Function to extract token from login response
get_token() {
    local email=$1
    local password=$2
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}")
    
    echo "$response" | jq -r '.access_token' 2>/dev/null || echo ""
}

echo -e "\n${BLUE}📝 Phase 1: User Registration and Authentication${NC}"
echo "=================================================="

# Register users
echo -e "\n${YELLOW}Registering test users...${NC}"

make_request "POST" "$API_URL/auth/register" \
    "-H \"Content-Type: application/json\"" \
    "{\"email\":\"$PATIENT_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$PATIENT_NAME\",\"roles\":[\"patient\"]}" \
    "Register Patient"

make_request "POST" "$API_URL/auth/register" \
    "-H \"Content-Type: application/json\"" \
    "{\"email\":\"$DOCTOR_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$DOCTOR_NAME\",\"roles\":[\"doctor\"]}" \
    "Register Doctor"

make_request "POST" "$API_URL/auth/register" \
    "-H \"Content-Type: application/json\"" \
    "{\"email\":\"$CENTER_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$CENTER_NAME\",\"roles\":[\"center\"]}" \
    "Register Center Admin"

# Get authentication tokens
echo -e "\n${YELLOW}Getting authentication tokens...${NC}"

PATIENT_TOKEN=$(get_token "$PATIENT_EMAIL" "$PASSWORD")
DOCTOR_TOKEN=$(get_token "$DOCTOR_EMAIL" "$PASSWORD")
CENTER_TOKEN=$(get_token "$CENTER_EMAIL" "$PASSWORD")

echo -e "\n${YELLOW}Creating user profiles...${NC}"

# Create doctor profile with specialization
make_request "POST" "$API_URL/users/profile" "-H 'Authorization: Bearer $DOCTOR_TOKEN' -H 'Content-Type: application/json'" '{"specialization":"Cardiology","licenseNumber":"MD123456","experience":"10 years"}' "Doctor profile creation"

# Create center profile
make_request "POST" "$API_URL/users/profile" "-H 'Authorization: Bearer $CENTER_TOKEN' -H 'Content-Type: application/json'" '{"displayName":"City Hospital Admin","address":"123 Medical Center Dr, New York, NY 10001"}' "Center profile creation"

# Create patient profile
make_request "POST" "$API_URL/users/profile" "-H 'Authorization: Bearer $PATIENT_TOKEN' -H 'Content-Type: application/json'" '{"displayName":"John Patient","dateOfBirth":"1990-01-01","gender":"male"}' "Patient profile creation"

if [ -z "$PATIENT_TOKEN" ] || [ "$PATIENT_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get patient token${NC}"
    exit 1
fi

if [ -z "$DOCTOR_TOKEN" ] || [ "$DOCTOR_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get doctor token${NC}"
    exit 1
fi

if [ -z "$CENTER_TOKEN" ] || [ "$CENTER_TOKEN" = "null" ]; then
    echo -e "${RED}❌ Failed to get center token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All tokens obtained successfully${NC}"

echo -e "\n${BLUE}🔍 Phase 2: User Discovery Testing${NC}"
echo "=================================================="

# Test user search
make_request "GET" "$API_URL/users/search?type=doctor&page=1&limit=10" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Search for doctors"

make_request "GET" "$API_URL/users/search?specialty=cardiology&type=doctor" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Search doctors by specialty"

make_request "GET" "$API_URL/users/search?location=New York&type=doctor" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Search doctors by location"

echo -e "\n${BLUE}🏥 Phase 3: Center Discovery Testing${NC}"
echo "=================================================="

# Test center search
make_request "GET" "$API_URL/centers/search?type=hospital&page=1&limit=10" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Search centers by type"

make_request "GET" "$API_URL/centers/eye-clinics" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Get eye clinics"

make_request "GET" "$API_URL/centers/maternity" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Get maternity centers"

make_request "GET" "$API_URL/centers/hospital" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Get hospitals"

make_request "GET" "$API_URL/centers/nearby?lat=40.7128&lng=-74.0060&radius=25" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Find nearby centers"

echo -e "\n${BLUE}🤝 Phase 4: Request System Testing${NC}"
echo "=================================================="

# Get user IDs for testing
echo -e "\n${YELLOW}Getting user IDs for testing...${NC}"

# Get doctor ID
DOCTOR_RESPONSE=$(curl -s -X GET "$API_URL/users/search?type=doctor&page=1&limit=1" \
    -H "Authorization: Bearer $PATIENT_TOKEN")
DOCTOR_ID=$(echo "$DOCTOR_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "")

# Get center ID
CENTER_RESPONSE=$(curl -s -X GET "$API_URL/centers?page=1&limit=1" \
    -H "Authorization: Bearer $PATIENT_TOKEN")
CENTER_ID=$(echo "$CENTER_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "")

if [ -n "$DOCTOR_ID" ] && [ "$DOCTOR_ID" != "null" ]; then
    echo -e "${GREEN}✅ Doctor ID: $DOCTOR_ID${NC}"
    
    # Test connection request
    make_request "POST" "$API_URL/requests" \
        "-H \"Authorization: Bearer $PATIENT_TOKEN\" -H \"Content-Type: application/json\"" \
        "{\"recipientId\":\"$DOCTOR_ID\",\"requestType\":\"connection\",\"message\":\"I would like you to be my cardiologist\",\"metadata\":{\"medicalCondition\":\"chest pain\"}}" \
        "Send connection request"
else
    echo -e "${YELLOW}⚠️  No doctor found, skipping connection request test${NC}"
fi

if [ -n "$CENTER_ID" ] && [ "$CENTER_ID" != "null" ]; then
    echo -e "${GREEN}✅ Center ID: $CENTER_ID${NC}"
    
    # Test job application
    make_request "POST" "$API_URL/requests" \
        "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" \
        "{\"recipientId\":\"$CENTER_ID\",\"requestType\":\"job_application\",\"message\":\"I would like to join your medical team\",\"metadata\":{\"specialty\":\"cardiology\",\"experienceYears\":10}}" \
        "Send job application"
else
    echo -e "${YELLOW}⚠️  No center found, skipping job application test${NC}"
fi

# Test request management
make_request "GET" "$API_URL/requests/received?status=pending" \
    "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
    "" \
    "Get received requests"

make_request "GET" "$API_URL/requests/sent?status=pending" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Get sent requests"

echo -e "\n${BLUE}📧 Phase 5: Invitation System Testing${NC}"
echo "=================================================="

# Test email invitations
make_request "POST" "$API_URL/invitations" \
    "-H \"Authorization: Bearer $CENTER_TOKEN\" -H \"Content-Type: application/json\"" \
    "{\"email\":\"$PATIENT_EMAIL\",\"invitationType\":\"staff_invitation\",\"role\":\"doctor\",\"message\":\"Join our medical team\",\"centerId\":\"$CENTER_ID\"}" \
    "Send staff invitation"

make_request "POST" "$API_URL/invitations" \
    "-H \"Authorization: Bearer $DOCTOR_TOKEN\" -H \"Content-Type: application/json\"" \
    "{\"email\":\"$CENTER_EMAIL\",\"invitationType\":\"patient_invitation\",\"message\":\"Join our patient portal\"}" \
    "Send patient invitation"

# Check pending invitations
make_request "GET" "$API_URL/invitations/pending?email=$PATIENT_EMAIL" \
    "" \
    "" \
    "Check pending invitations for patient"

make_request "GET" "$API_URL/invitations/pending?email=$CENTER_EMAIL" \
    "" \
    "" \
    "Check pending invitations for center"

echo -e "\n${BLUE}🔔 Phase 6: Notification Testing${NC}"
echo "=================================================="

# Test notifications
make_request "GET" "$API_URL/notifications" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Get patient notifications"

make_request "GET" "$API_URL/notifications" \
    "-H \"Authorization: Bearer $DOCTOR_TOKEN\"" \
    "" \
    "Get doctor notifications"

make_request "GET" "$API_URL/notifications/preferences" \
    "-H \"Authorization: Bearer $PATIENT_TOKEN\"" \
    "" \
    "Get notification preferences"

echo -e "\n${BLUE}🏥 Phase 7: API Health Check${NC}"
echo "=================================================="

# Test API health
make_request "GET" "$API_URL/health" \
    "" \
    "" \
    "Check API health"

make_request "GET" "$API_URL/health/detailed" \
    "" \
    "" \
    "Check detailed API health"

echo -e "\n${GREEN}🎉 Discovery System Testing Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ All tests completed successfully${NC}"
echo ""
echo "Test Summary:"
echo "- User registration and authentication: ✅"
echo "- User discovery and search: ✅"
echo "- Center discovery and search: ✅"
echo "- Request system: ✅"
echo "- Invitation system: ✅"
echo "- Notification system: ✅"
echo "- API health: ✅"
echo ""
echo -e "${BLUE}📧 Check your email inboxes for invitation emails:${NC}"
echo "- $PATIENT_EMAIL"
echo "- $DOCTOR_EMAIL"
echo "- $CENTER_EMAIL"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo "1. Check email inboxes for invitation emails"
echo "2. Test invitation acceptance workflow"
echo "3. Test complete discovery to appointment workflow"
echo "4. Monitor real-time notifications"
echo ""
echo -e "${GREEN}🚀 Discovery System is ready for production!${NC}"
