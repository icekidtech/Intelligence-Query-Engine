# API Test Suite - Intelligence Query Engine

This test suite comprehensively validates all functional requirements for the Intelligence Query Engine (Stage 2).

## 📋 Test Coverage

The test suite includes **8 major test sections** with **60+ individual test cases**:

1. **Health Check** — Verifies server is running
2. **Advanced Filtering** — All 7+ filter combinations
3. **Sorting** — age, created_at, gender_probability (asc/desc)
4. **Pagination** — page, limit, total, response structure
5. **Natural Language Queries** — NLP parsing rules (10+ patterns)
6. **Query Validation** — Error cases (400, 422, 404, 500)
7. **Backward Compatibility** — Stage-one endpoints
8. **Response Structure** — ISO 8601, UUIDs, CORS headers

## 🚀 Quick Start

### Prerequisites

- Backend server running on `http://localhost:5000`
- Dependencies installed: `pnpm install`
- (Optional) Database seeded: `pnpm seed`

### Run Tests

```bash
# Run comprehensive API tests only
pnpm test:api

# Run original profile tests
pnpm test

# Run all tests
pnpm test:all
```

### Expected Output

```
========================================================================
📋 HEALTH CHECK
========================================================================
✅ Health check returns 200
✅ Health check response is { status: "ok" }

========================================================================
📋 TEST 1: ADVANCED FILTERING
========================================================================
📌 1.1 Single Filter: Gender
--------
✅ Single gender filter returns 200
✅ All results have gender=male
...
```

## 📊 Test Structure

### Test Sections

Each test section follows this pattern:

```
📋 TEST NAME
────────────────────────────────────────────
  📌 Subsection 1
  ────────────────────────────────────────────
  ✅ Test passes here
  ✅ Another test passes
  
  📌 Subsection 2
  ────────────────────────────────────────────
  ✅ More tests here
```

### Test Results

At the end, you'll see a summary:

```
========================================================================
📊 TEST SUMMARY
========================================================================

✅ Passed: 58/60
❌ Failed: 2/60
📈 Success Rate: 96%

Failed Tests:
   1. Test that failed
   2. Another test that failed

========================================================================

🎉 ALL TESTS PASSED! 🎉
```

## 🔍 What Gets Tested

### 1. Advanced Filtering (10 tests)

- [x] Single filters (gender, country, age_group, age range, probabilities)
- [x] Combined filters with AND logic (gender + country)
- [x] Complex combinations (gender + age range + country + probabilities)
- [x] All 7 filter types together

**Example:**
```bash
# Filters AND together
GET /api/profiles?gender=male&country_id=NG&min_age=25&max_age=45
# Returns: ALL profiles that match gender=male AND country=NG AND age 25-45
```

### 2. Sorting (6 tests)

- [x] Sort by age (ascending/descending)
- [x] Sort by created_at (ascending/descending)
- [x] Sort by gender_probability (ascending)
- [x] Sorting with filters and pagination

**Example:**
```bash
GET /api/profiles?gender=male&sort_by=age&order=desc&page=1&limit=20
# Returns: Males sorted by age descending, page 1, 20 per page
```

### 3. Pagination (6 tests)

- [x] Default pagination (page=1, limit=10)
- [x] Custom page sizes
- [x] Max limit enforcement (limit capped at 50)
- [x] Page navigation consistency
- [x] Response structure (page, limit, total, data)
- [x] Offset calculation accuracy

**Example:**
```bash
GET /api/profiles?page=2&limit=25
# Returns: Profiles 26-50 in consistent sort order
```

### 4. Natural Language Queries (10 tests)

- [x] "young males" → gender=male, age 16-24
- [x] "females above 30" → gender=female, min_age=30
- [x] "people from angola" → country_id=AO
- [x] "adult males from kenya" → gender=male + age_group=adult + country_id=KE
- [x] "teenagers above 17" → age_group=teenager + min_age=17
- [x] Age ranges: "25-35 years old"
- [x] All gender keywords: males, men, boys, females, women, girls
- [x] NLP with pagination
- [x] Country name resolution (Nigeria→NG)
- [x] Multiple countries tested

**Example:**
```bash
GET /api/profiles/search?q=young+males+from+nigeria&page=1&limit=20
# Parsed as: gender=male, age 16-24, country=NG
# Returns: Paginated results matching all criteria
```

### 5. Query Validation (9 tests)

- [x] Missing query parameter (400)
- [x] Invalid gender value (422)
- [x] Invalid age_group value (422)
- [x] Non-numeric age (422)
- [x] Out-of-range age (422)
- [x] Invalid probability > 1 (422)
- [x] Invalid page < 1 (422)
- [x] Invalid limit < 1 (422)
- [x] Unparseable NLP query (200 with error message)

### 6. Error Handling (4 tests)

- [x] 404 Not Found (invalid profile ID)
- [x] 400 Bad Request (missing parameter)
- [x] 422 Unprocessable Entity (invalid type)
- [x] Error response structure

### 7. Backward Compatibility (6 tests)

- [x] Create profile (POST)
- [x] Get profile by ID (GET /:id)
- [x] Delete profile (DELETE /:id)
- [x] Basic filtering (backward compatible)
- [x] ISO 8601 UTC timestamps
- [x] UUID v7 IDs

### 8. Response Structure (5 tests)

- [x] Advanced filter response structure
- [x] NLP search response structure
- [x] Profile object fields
- [x] CORS headers
- [x] Content-Type headers

## 🔧 Running Individual Test Groups

The tests are organized in sections. You can modify the test file to run specific sections:

```typescript
// In api.test.ts, comment out test groups you don't want to run
await testAdvancedFiltering();  // Keep this
await testSorting();            // Comment to skip
// await testPagination();       // Skipped
```

## 🚨 Troubleshooting

### "Server not running"

```bash
# In one terminal, start the server:
pnpm dev

# In another terminal, run tests:
pnpm test:api
```

### "Connection refused"

- Check server is running on port 5000
- Verify `http://localhost:5000/health` returns `{ "status": "ok" }`
- Check `.env` file has correct database configuration

### "Database empty"

Tests work with empty database, but for better validation, seed first:

```bash
pnpm seed
pnpm test:api
```

### "Tests timeout"

If tests timeout:
1. Check server is responding: `curl http://localhost:5000/health`
2. Increase timeout in API client
3. Check database performance: `npm start` vs `npm dev`

## 📈 Interpreting Results

### All Tests Passed (✅ 60/60)

```
🎉 ALL TESTS PASSED! 🎉
```

Your implementation meets all requirements!

### Some Tests Failed (⚠️ 55/60)

Review the failed test names and check:

1. **Filter tests failing?** → Check repository filter logic
2. **Sorting tests failing?** → Check sort field names and order
3. **NLP tests failing?** → Check query parser keywords and rules
4. **Pagination tests failing?** → Check offset calculation: `(page-1) * limit`
5. **Validation tests failing?** → Check HTTP status codes in routes

## 🎯 Coverage Matrix

| Feature | Tests | Status |
|---------|-------|--------|
| Filtering | 10 | ✅ Comprehensive |
| Sorting | 6 | ✅ All fields + directions |
| Pagination | 6 | ✅ Structure + math |
| NLP | 10 | ✅ All patterns |
| Validation | 9 | ✅ All error codes |
| Errors | 4 | ✅ HTTP status codes |
| Backward Compat | 6 | ✅ Stage-one endpoints |
| Response | 5 | ✅ Structure + headers |
| **TOTAL** | **60+** | **✅ Complete** |

## 📝 Adding Custom Tests

To add tests:

```typescript
async function testMyFeature() {
  printSection('TEST 9: MY NEW FEATURE');

  try {
    printSubsection('9.1 My Subsection');
    
    const res = await axios.get(`${API_BASE}/profiles?my_param=value`);
    assert(res.status === 200, 'My test description');
    assert(res.data.status === 'success', 'Another check');
    
  } catch (error) {
    console.error('My Feature Error:', error instanceof Error ? error.message : error);
  }
}

// Then call it in runAllTests()
await testMyFeature();
```

## 🔗 Related Files

- [README.md](../README.md) — Main documentation
- [CHANGELOG.md](../CHANGELOG.md) — Version history
- [src/routes/profiles.routes.ts](../src/routes/profiles.routes.ts) — Route handlers
- [src/services/profiles.services.ts](../src/services/profiles.services.ts) — Business logic

---

**Test Suite Version:** 2.0.0  
**Last Updated:** April 23, 2026  
**Total Test Cases:** 60+  
**Expected Runtime:** 10-30 seconds
