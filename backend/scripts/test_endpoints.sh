#!/bin/bash
BASE_URL="http://localhost:8080/api"

echo "--- 1. Testing Image Upload (Admin) ---"
echo "dummy image content" > test_image.jpg
UPLOAD_RES=$(curl -s -X POST "$BASE_URL/storage/upload" \
  -H "X-Role: admin" -H "Authorization: mocked-token" \
  -F "image=@test_image.jpg")
echo "Upload Result: $UPLOAD_RES"

IMAGE_URL=$(echo $UPLOAD_RES | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$IMAGE_URL" ]; then
    echo "❌ Image upload failed. Ensure SUPABASE_URL/KEY are set and bucket exists."
    # rm test_image.jpg
    # exit 1
fi

echo "--- 2. Creating Product (Admin) ---"
PRODUCT_JSON='{
  "title": "Test Stationery Product",
  "description": "A product for testing",
  "sku": "TEST-SKU-'$(date +%s)'",
  "clave_sat": "44120000",
  "unit_sat": "H87",
  "buy_price": 10.50,
  "sale_price": 15.00,
  "stock_level": 100,
  "reorder_point": 10,
  "image_url": "'"$IMAGE_URL"'"
}'

CREATE_RES=$(curl -s -X POST "$BASE_URL/products" \
  -H "X-Role: admin" -H "Authorization: mocked-token" \
  -H "Content-Type: application/json" \
  -d "$PRODUCT_JSON")
echo "Create Result: $CREATE_RES"

PRODUCT_ID=$(echo $CREATE_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

echo "--- 3. Testing Unauthorized Access (Staff) ---"
STAFF_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/products" \
  -H "X-Role: staff" -H "Authorization: mocked-token" \
  -H "Content-Type: application/json" \
  -d "$PRODUCT_JSON")
echo "Staff Request Status (Expected 403): $STAFF_RES"

echo "--- 4. Testing Large File Upload (5MB+) ---"
dd if=/dev/zero of=large_test.jpg bs=1M count=6 2>/dev/null
LARGE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/storage/upload" \
  -H "X-Role: admin" -H "Authorization: mocked-token" \
  -F "image=@large_test.jpg")
echo "Large Upload Status (Expected 413): $LARGE_RES"

echo "--- 5. Getting All Products (Public) ---"
GET_RES=$(curl -s -X GET "$BASE_URL/products")
echo "Get All Result: $GET_RES"

echo "--- 6. Deleting Product (Admin) ---"
if [ ! -z "$PRODUCT_ID" ]; then
    DELETE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/products/$PRODUCT_ID" \
      -H "X-Role: admin" -H "Authorization: mocked-token")
    echo "Delete Status (Expected 204): $DELETE_RES"
fi

rm test_image.jpg large_test.jpg
