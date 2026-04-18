#!/bin/bash

# Test script to verify search endpoints don't expose sensitive data
# This script tests the search endpoints to ensure no sensitive information is leaked

echo "🔍 Testing Search Endpoints Security"
echo "====================================="

BASE_URL="https://api.unlimtedhealth.com/api"

echo ""
echo "1. Testing User Search Endpoint..."
echo "GET $BASE_URL/users/search?type=doctor&specialty=cardiology&page=1&limit=5"
echo ""

# Test user search endpoint
USER_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/users/search?type=doctor&specialty=cardiology&page=1&limit=5" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$USER_SEARCH_RESPONSE" | jq '.' 2>/dev/null || echo "$USER_SEARCH_RESPONSE"

echo ""
echo "🔍 Checking for sensitive data in user search response..."
echo ""

# Check for sensitive fields that should NOT be present
SENSITIVE_FIELDS=("email" "phone" "dateOfBirth" "address" "licenseNumber" "latitude" "longitude" "locationMetadata")

for field in "${SENSITIVE_FIELDS[@]}"; do
    if echo "$USER_SEARCH_RESPONSE" | grep -q "\"$field\""; then
        echo "❌ SECURITY ISSUE: Found sensitive field '$field' in user search response!"
    else
        echo "✅ No sensitive field '$field' found in user search response"
    fi
done

echo ""
echo "2. Testing Center Search Endpoint..."
echo "GET $BASE_URL/centers/search?type=hospital&page=1&limit=5"
echo ""

# Test center search endpoint
CENTER_SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/centers/search?type=hospital&page=1&limit=5" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$CENTER_SEARCH_RESPONSE" | jq '.' 2>/dev/null || echo "$CENTER_SEARCH_RESPONSE"

echo ""
echo "🔍 Checking for sensitive data in center search response..."
echo ""

# Check for sensitive fields that should NOT be present in center search
CENTER_SENSITIVE_FIELDS=("email" "phone" "address" "latitude" "longitude" "locationMetadata")

for field in "${CENTER_SENSITIVE_FIELDS[@]}"; do
    if echo "$CENTER_SEARCH_RESPONSE" | grep -q "\"$field\""; then
        echo "❌ SECURITY ISSUE: Found sensitive field '$field' in center search response!"
    else
        echo "✅ No sensitive field '$field' found in center search response"
    fi
done

echo ""
echo "3. Testing Center Type Endpoints..."
echo "GET $BASE_URL/centers/hospital"
echo ""

# Test center type endpoint
CENTER_TYPE_RESPONSE=$(curl -s -X GET "$BASE_URL/centers/hospital" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$CENTER_TYPE_RESPONSE" | jq '.' 2>/dev/null || echo "$CENTER_TYPE_RESPONSE"

echo ""
echo "🔍 Checking for sensitive data in center type response..."
echo ""

for field in "${CENTER_SENSITIVE_FIELDS[@]}"; do
    if echo "$CENTER_TYPE_RESPONSE" | grep -q "\"$field\""; then
        echo "❌ SECURITY ISSUE: Found sensitive field '$field' in center type response!"
    else
        echo "✅ No sensitive field '$field' found in center type response"
    fi
done

echo ""
echo "4. Testing Nearby Centers Endpoint..."
echo "GET $BASE_URL/centers/nearby?lat=40.7128&lng=-74.0060&radius=25"
echo ""

# Test nearby centers endpoint
NEARBY_RESPONSE=$(curl -s -X GET "$BASE_URL/centers/nearby?lat=40.7128&lng=-74.0060&radius=25" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$NEARBY_RESPONSE" | jq '.' 2>/dev/null || echo "$NEARBY_RESPONSE"

echo ""
echo "🔍 Checking for sensitive data in nearby centers response..."
echo ""

for field in "${CENTER_SENSITIVE_FIELDS[@]}"; do
    if echo "$NEARBY_RESPONSE" | grep -q "\"$field\""; then
        echo "❌ SECURITY ISSUE: Found sensitive field '$field' in nearby centers response!"
    else
        echo "✅ No sensitive field '$field' found in nearby centers response"
    fi
done

echo ""
echo "====================================="
echo "🔒 Security Test Complete"
echo ""
echo "Expected fields in responses:"
echo "✅ Users: publicId, displayName, specialty, location (city/state/country only), avatar, qualifications, experience"
echo "✅ Centers: publicId, name, type, generalLocation (city/state/country only), imageUrl, hours"
echo ""
echo "❌ Should NOT be present:"
echo "   - email addresses"
echo "   - phone numbers" 
echo "   - full addresses"
echo "   - exact coordinates"
echo "   - date of birth"
echo "   - license numbers"
echo "   - internal IDs"
