import axios, { AxiosError } from 'axios';

/**
 * Comprehensive Test Suite for Intelligence Query Engine - Stage 2
 * Tests all functional requirements:
 * - Advanced Filtering (6+ parameters combinable)
 * - Sorting (age, created_at, gender_probability)
 * - Pagination (page, limit, response structure)
 * - Natural Language Query parsing
 * - Query Validation
 * - Error Handling
 */

const BASE_URL = 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test Results Tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests: string[] = [];

/**
 * Test Helper: Assert condition
 */
function assert(condition: boolean, message: string) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`✅ ${message}`);
  } else {
    testsFailed++;
    failedTests.push(message);
    console.error(`❌ ${message}`);
  }
}

/**
 * Test Helper: Assert HTTP status code
 */
function assertStatus(actual: number, expected: number, message: string) {
  assert(actual === expected, `${message} (Expected: ${expected}, Got: ${actual})`);
}

/**
 * Test Helper: Assert response structure
 */
function assertResponseStructure(data: any, expectedFields: string[], message: string) {
  const hasAllFields = expectedFields.every((field) => field in data);
  assert(hasAllFields, `${message} - has all required fields: ${expectedFields.join(', ')}`);
}

/**
 * Test Helper: Print section header
 */
function printSection(title: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 ${title}`);
  console.log(`${'='.repeat(70)}`);
}

/**
 * Test Helper: Print subsection
 */
function printSubsection(title: string) {
  console.log(`\n📌 ${title}`);
  console.log(`${'-'.repeat(70)}`);
}

/**
 * Main Test Suite
 */
async function runAllTests() {
  console.log('\n🚀 Starting Intelligence Query Engine - Test Suite\n');

  try {
    // Pre-test: Check server is running
    await testHealthCheck();

    // Core Tests
    await testAdvancedFiltering();
    await testSorting();
    await testPagination();
    await testNaturalLanguageQueries();
    await testQueryValidation();
    await testErrorHandling();
    await testBackwardCompatibility();
    await testResponseStructure();

    // Print Summary
    printTestSummary();
  } catch (error) {
    console.error('\n💥 Fatal Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * TEST: Health Check
 */
async function testHealthCheck() {
  printSection('HEALTH CHECK');

  try {
    const res = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    assertStatus(res.status, 200, 'Health check returns 200');
    assert(res.data.status === 'ok', 'Health check response is { status: "ok" }');
  } catch (error) {
    console.error('❌ Server not running on http://localhost:5000');
    console.error('   Please start the server with: pnpm dev');
    process.exit(1);
  }
}

/**
 * TEST: Advanced Filtering
 * Test all filter combinations and AND logic
 */
async function testAdvancedFiltering() {
  printSection('TEST 1: ADVANCED FILTERING');

  try {
    printSubsection('1.1 Single Filter: Gender');
    let res = await axios.get(`${API_BASE}/profiles?gender=male`);
    assert(res.status === 200, 'Single gender filter returns 200');
    assert(res.data.data.every((p: any) => p.gender === 'male'), 'All results have gender=male');

    printSubsection('1.2 Single Filter: Country');
    res = await axios.get(`${API_BASE}/profiles?country_id=NG`);
    assert(res.status === 200, 'Country filter returns 200');
    assert(res.data.data.every((p: any) => p.country_id === 'NG'), 'All results have country_id=NG');

    printSubsection('1.3 Single Filter: Age Group');
    res = await axios.get(`${API_BASE}/profiles?age_group=adult`);
    assert(res.status === 200, 'Age group filter returns 200');
    assert(res.data.data.every((p: any) => p.age_group === 'adult'), 'All results have age_group=adult');

    printSubsection('1.4 Range Filter: Min Age');
    res = await axios.get(`${API_BASE}/profiles?min_age=25`);
    assert(res.status === 200, 'Min age filter returns 200');
    assert(res.data.data.every((p: any) => (p.age ?? 0) >= 25), 'All results have age >= 25');

    printSubsection('1.5 Range Filter: Max Age');
    res = await axios.get(`${API_BASE}/profiles?max_age=35`);
    assert(res.status === 200, 'Max age filter returns 200');
    assert(res.data.data.every((p: any) => (p.age ?? 0) <= 35), 'All results have age <= 35');

    printSubsection('1.6 Probability Filter: Gender Confidence');
    res = await axios.get(`${API_BASE}/profiles?min_gender_probability=0.8`);
    assert(res.status === 200, 'Min gender probability filter returns 200');
    assert(
      res.data.data.every((p: any) => (p.gender_probability ?? 0) >= 0.8),
      'All results have gender_probability >= 0.8'
    );

    printSubsection('1.7 Probability Filter: Country Confidence');
    res = await axios.get(`${API_BASE}/profiles?min_country_probability=0.75`);
    assert(res.status === 200, 'Min country probability filter returns 200');
    assert(
      res.data.data.every((p: any) => (p.country_probability ?? 0) >= 0.75),
      'All results have country_probability >= 0.75'
    );

    printSubsection('1.8 COMBINED: Gender + Country (AND logic)');
    res = await axios.get(`${API_BASE}/profiles?gender=male&country_id=NG`);
    assert(res.status === 200, 'Combined filter returns 200');
    assert(
      res.data.data.every((p: any) => p.gender === 'male' && p.country_id === 'NG'),
      'All results match BOTH gender=male AND country_id=NG (AND logic)'
    );

    printSubsection('1.9 COMBINED: Gender + Age Range + Country');
    res = await axios.get(`${API_BASE}/profiles?gender=female&min_age=25&max_age=35&country_id=KE`);
    assert(res.status === 200, 'Complex combined filter returns 200');
    assert(
      res.data.data.every(
        (p: any) =>
          p.gender === 'female' &&
          (p.age ?? 0) >= 25 &&
          (p.age ?? 0) <= 35 &&
          p.country_id === 'KE'
      ),
      'All results match all 4 conditions (AND logic)'
    );

    printSubsection('1.10 COMBINED: All Filter Types');
    res = await axios.get(
      `${API_BASE}/profiles?gender=male&age_group=adult&country_id=NG&min_age=20&max_age=50&min_gender_probability=0.7&min_country_probability=0.6`
    );
    assert(res.status === 200, 'All filter types combined returns 200');
    assert(
      res.data.data.every(
        (p: any) =>
          p.gender === 'male' &&
          p.age_group === 'adult' &&
          p.country_id === 'NG' &&
          (p.age ?? 0) >= 20 &&
          (p.age ?? 0) <= 50 &&
          (p.gender_probability ?? 0) >= 0.7 &&
          (p.country_probability ?? 0) >= 0.6
      ),
      'All results match all 7 conditions (AND logic)'
    );
  } catch (error) {
    console.error('Advanced Filtering Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Sorting
 * Test sort_by and order parameters
 */
async function testSorting() {
  printSection('TEST 2: SORTING');

  try {
    printSubsection('2.1 Sort by Age Ascending');
    let res = await axios.get(`${API_BASE}/profiles?sort_by=age&order=asc&limit=50`);
    assert(res.status === 200, 'Sort by age asc returns 200');
    if (res.data.data.length > 1) {
      let isSorted = true;
      for (let i = 1; i < res.data.data.length; i++) {
        if ((res.data.data[i].age ?? 0) < (res.data.data[i - 1].age ?? 0)) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, 'Results sorted by age in ascending order');
    }

    printSubsection('2.2 Sort by Age Descending');
    res = await axios.get(`${API_BASE}/profiles?sort_by=age&order=desc&limit=50`);
    assert(res.status === 200, 'Sort by age desc returns 200');
    if (res.data.data.length > 1) {
      let isSorted = true;
      for (let i = 1; i < res.data.data.length; i++) {
        if ((res.data.data[i].age ?? 0) > (res.data.data[i - 1].age ?? 0)) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, 'Results sorted by age in descending order');
    }

    printSubsection('2.3 Sort by Created Date Ascending');
    res = await axios.get(`${API_BASE}/profiles?sort_by=created_at&order=asc&limit=50`);
    assert(res.status === 200, 'Sort by created_at asc returns 200');
    if (res.data.data.length > 1) {
      let isSorted = true;
      for (let i = 1; i < res.data.data.length; i++) {
        const prev = new Date(res.data.data[i - 1].created_at).getTime();
        const curr = new Date(res.data.data[i].created_at).getTime();
        if (curr < prev) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, 'Results sorted by created_at in ascending order');
    }

    printSubsection('2.4 Sort by Created Date Descending');
    res = await axios.get(`${API_BASE}/profiles?sort_by=created_at&order=desc&limit=50`);
    assert(res.status === 200, 'Sort by created_at desc returns 200');
    if (res.data.data.length > 1) {
      let isSorted = true;
      for (let i = 1; i < res.data.data.length; i++) {
        const prev = new Date(res.data.data[i - 1].created_at).getTime();
        const curr = new Date(res.data.data[i].created_at).getTime();
        if (curr > prev) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, 'Results sorted by created_at in descending order');
    }

    printSubsection('2.5 Sort by Gender Probability Ascending');
    res = await axios.get(`${API_BASE}/profiles?sort_by=gender_probability&order=asc&limit=50`);
    assert(res.status === 200, 'Sort by gender_probability asc returns 200');
    if (res.data.data.length > 1) {
      let isSorted = true;
      for (let i = 1; i < res.data.data.length; i++) {
        if (
          (res.data.data[i].gender_probability ?? 0) <
          (res.data.data[i - 1].gender_probability ?? 0)
        ) {
          isSorted = false;
          break;
        }
      }
      assert(isSorted, 'Results sorted by gender_probability in ascending order');
    }

    printSubsection('2.6 Sort with Filter + Pagination');
    res = await axios.get(
      `${API_BASE}/profiles?gender=male&sort_by=age&order=desc&page=1&limit=20`
    );
    assert(res.status === 200, 'Sort with filter and pagination returns 200');
    assert(res.data.data.every((p: any) => p.gender === 'male'), 'Filter still applied with sorting');
  } catch (error) {
    console.error('Sorting Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Pagination
 * Test page, limit, total, and response structure
 */
async function testPagination() {
  printSection('TEST 3: PAGINATION');

  try {
    printSubsection('3.1 Default Pagination (page=1, limit=10)');
    let res = await axios.get(`${API_BASE}/profiles`);
    assert(res.data.page === 1, 'Default page is 1');
    assert(res.data.limit === 10, 'Default limit is 10');
    assert(res.data.total >= 0, 'Total count returned');
    assert(res.data.data.length <= 10, 'Returned data <= 10 items');

    printSubsection('3.2 Custom Page Size (limit=25)');
    res = await axios.get(`${API_BASE}/profiles?limit=25`);
    assert(res.data.limit === 25, 'Limit set to 25');
    assert(res.data.data.length <= 25, 'Returned data <= 25 items');

    printSubsection('3.3 Max Limit Enforcement (limit > 50 should cap at 50)');
    res = await axios.get(`${API_BASE}/profiles?limit=100`);
    assert(res.data.limit <= 50, 'Limit capped at 50 maximum');

    printSubsection('3.4 Page Navigation');
    res = await axios.get(`${API_BASE}/profiles?page=1&limit=10`);
    const page1Total = res.data.total;
    const page1Data = res.data.data;

    res = await axios.get(`${API_BASE}/profiles?page=2&limit=10`);
    const page2Total = res.data.total;
    const page2Data = res.data.data;

    assert(page1Total === page2Total, 'Total consistent across pages');
    if (page1Data.length > 0 && page2Data.length > 0) {
      assert(
        page1Data[0].id !== page2Data[0].id,
        'Page 2 has different data than Page 1 (pagination working)'
      );
    }

    printSubsection('3.5 Response Structure with Pagination');
    res = await axios.get(`${API_BASE}/profiles?page=1&limit=10`);
    assertResponseStructure(
      res.data,
      ['status', 'page', 'limit', 'total', 'data'],
      'Paginated response has required structure'
    );
    assert(Array.isArray(res.data.data), 'Data field is array');
    assert(typeof res.data.total === 'number', 'Total is number');

    printSubsection('3.6 Offset Calculation Accuracy');
    res = await axios.get(`${API_BASE}/profiles?gender=male&sort_by=age&order=asc&page=1&limit=5`);
    const page1FirstId = res.data.data[0]?.id;

    res = await axios.get(`${API_BASE}/profiles?gender=male&sort_by=age&order=asc&page=1&limit=5`);
    const page1FirstIdAgain = res.data.data[0]?.id;

    assert(page1FirstId === page1FirstIdAgain, 'Same filter+sort+pagination returns same data');
  } catch (error) {
    console.error('Pagination Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Natural Language Queries
 * Test all NLP parsing rules
 */
async function testNaturalLanguageQueries() {
  printSection('TEST 4: NATURAL LANGUAGE QUERY PARSING');

  try {
    printSubsection('4.1 NLP: "young males"');
    let res = await axios.get(`${API_BASE}/profiles/search?q=young+males`);
    assert(res.status === 200, 'Query returns 200');
    if (res.data.data.length > 0) {
      assert(res.data.data.every((p: any) => p.gender === 'male'), 'NLP parsed gender=male');
      assert(
        res.data.data.every((p: any) => (p.age ?? 0) >= 16 && (p.age ?? 0) <= 24),
        'NLP parsed "young"=age 16-24'
      );
    }

    printSubsection('4.2 NLP: "females above 30"');
    res = await axios.get(`${API_BASE}/profiles/search?q=females+above+30`);
    assert(res.status === 200, 'Query returns 200');
    if (res.data.data.length > 0) {
      assert(res.data.data.every((p: any) => p.gender === 'female'), 'NLP parsed gender=female');
      assert(res.data.data.every((p: any) => (p.age ?? 0) >= 30), 'NLP parsed "above 30"=min_age:30');
    }

    printSubsection('4.3 NLP: "people from angola"');
    res = await axios.get(`${API_BASE}/profiles/search?q=people+from+angola`);
    assert(res.status === 200, 'Query returns 200');
    if (res.data.data.length > 0) {
      assert(
        res.data.data.every((p: any) => p.country_id === 'AO'),
        'NLP parsed "from Angola"=country_id:AO'
      );
    }

    printSubsection('4.4 NLP: "adult males from kenya"');
    res = await axios.get(`${API_BASE}/profiles/search?q=adult+males+from+kenya`);
    assert(res.status === 200, 'Query returns 200');
    if (res.data.data.length > 0) {
      assert(res.data.data.every((p: any) => p.gender === 'male'), 'NLP parsed gender=male');
      assert(res.data.data.every((p: any) => p.age_group === 'adult'), 'NLP parsed age_group=adult');
      assert(res.data.data.every((p: any) => p.country_id === 'KE'), 'NLP parsed country=KE');
    }

    printSubsection('4.5 NLP: "teenagers above 17"');
    res = await axios.get(`${API_BASE}/profiles/search?q=teenagers+above+17`);
    assert(res.status === 200, 'Query returns 200');
    if (res.data.data.length > 0) {
      assert(
        res.data.data.every((p: any) => p.age_group === 'teenager'),
        'NLP parsed age_group=teenager'
      );
      assert(res.data.data.every((p: any) => (p.age ?? 0) >= 17), 'NLP parsed min_age=17');
    }

    printSubsection('4.6 NLP: "male and female teenagers above 17"');
    res = await axios.get(`${API_BASE}/profiles/search?q=male+and+female+teenagers+above+17`);
    assert(res.status === 200, 'Query returns 200');
    // This query should parse age_group and min_age at minimum

    printSubsection('4.7 NLP: Age range "25-35 years old"');
    res = await axios.get(`${API_BASE}/profiles/search?q=25-35+years+old`);
    assert(res.status === 200, 'Query returns 200');
    if (res.data.data.length > 0) {
      assert(
        res.data.data.every((p: any) => (p.age ?? 0) >= 25 && (p.age ?? 0) <= 35),
        'NLP parsed "25-35 years old"=age range'
      );
    }

    printSubsection('4.8 NLP: With Pagination');
    res = await axios.get(`${API_BASE}/profiles/search?q=young+males&page=1&limit=20`);
    assert(res.status === 200, 'NLP query with pagination returns 200');
    assert(res.data.page === 1, 'Page parameter applied');
    assert(res.data.limit === 20, 'Limit parameter applied');
    assert(res.data.total >= 0, 'Total count returned');

    printSubsection('4.9 NLP: Nigeria (various spellings)');
    res = await axios.get(`${API_BASE}/profiles/search?q=from+nigeria`);
    assert(res.status === 200, 'Nigeria query returns 200');
    if (res.data.data.length > 0) {
      assert(
        res.data.data.every((p: any) => p.country_id === 'NG'),
        'Country code resolved: Nigeria→NG'
      );
    }

    printSubsection('4.10 NLP: All Gender Keywords');
    const genderKeywords = ['males', 'men', 'boys', 'females', 'women', 'girls'];
    for (const keyword of genderKeywords) {
      res = await axios.get(`${API_BASE}/profiles/search?q=${keyword}`);
      assert(res.status === 200, `Gender keyword "${keyword}" accepted`);
    }
  } catch (error) {
    console.error('NLP Query Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Query Validation
 * Test error handling for invalid parameters
 */
async function testQueryValidation() {
  printSection('TEST 5: QUERY VALIDATION');

  try {
    printSubsection('5.1 Missing Query Parameter');
    try {
      await axios.get(`${API_BASE}/profiles/search`);
      assert(false, 'Missing query should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 400, 'Missing query returns 400');
    }

    printSubsection('5.2 Invalid Gender Value');
    try {
      await axios.get(`${API_BASE}/profiles?gender=invalid_gender`);
      assert(false, 'Invalid gender should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Invalid gender returns 422');
    }

    printSubsection('5.3 Invalid Age Group Value');
    try {
      await axios.get(`${API_BASE}/profiles?age_group=invalid_group`);
      assert(false, 'Invalid age_group should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Invalid age_group returns 422');
    }

    printSubsection('5.4 Invalid Min Age (non-numeric)');
    try {
      await axios.get(`${API_BASE}/profiles?min_age=abc`);
      assert(false, 'Non-numeric min_age should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Non-numeric min_age returns 422');
    }

    printSubsection('5.5 Invalid Max Age (out of range)');
    try {
      await axios.get(`${API_BASE}/profiles?max_age=200`);
      assert(false, 'max_age > 150 should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Out of range age returns 422');
    }

    printSubsection('5.6 Invalid Probability (> 1)');
    try {
      await axios.get(`${API_BASE}/profiles?min_gender_probability=1.5`);
      assert(false, 'Probability > 1 should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Invalid probability returns 422');
    }

    printSubsection('5.7 Invalid Page (< 1)');
    try {
      await axios.get(`${API_BASE}/profiles?page=0`);
      assert(false, 'page < 1 should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Invalid page returns 422');
    }

    printSubsection('5.8 Invalid Limit (< 1)');
    try {
      await axios.get(`${API_BASE}/profiles?limit=0`);
      assert(false, 'limit < 1 should fail');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Invalid limit returns 422');
    }

    printSubsection('5.9 Unparseable NLP Query');
    let res = await axios.get(`${API_BASE}/profiles/search?q=xyz+abc+def`);
    assert(res.status === 200, 'Unparseable query returns 200 (not error)');
    assert(res.data.status === 'error', 'But status field indicates error');
    assert(res.data.message.includes('Unable to interpret'), 'Error message is descriptive');
  } catch (error) {
    console.error('Validation Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Error Handling
 * Test HTTP status codes and error messages
 */
async function testErrorHandling() {
  printSection('TEST 6: ERROR HANDLING');

  try {
    printSubsection('6.1 Not Found (404)');
    try {
      await axios.get(`${API_BASE}/profiles/nonexistent-id-12345`);
      assert(false, 'Should return 404');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 404, 'Invalid profile ID returns 404');
      assert(
        err.response?.data?.message.includes('not found'),
        'Error message mentions "not found"'
      );
    }

    printSubsection('6.2 Bad Request (400) - Missing Parameter');
    try {
      await axios.post(`${API_BASE}/profiles`, {});
      assert(false, 'Should return 400');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 400, 'Missing name returns 400');
    }

    printSubsection('6.3 Unprocessable Entity (422) - Invalid Type');
    try {
      await axios.post(`${API_BASE}/profiles`, { name: 12345 });
      assert(false, 'Should return 422');
    } catch (error) {
      const err = error as AxiosError;
      assertStatus(err.response?.status || 0, 422, 'Non-string name returns 422');
    }

    printSubsection('6.4 Error Response Structure');
    try {
      await axios.get(`${API_BASE}/profiles?gender=invalid`);
    } catch (error) {
      const err = error as AxiosError;
      assert(err.response?.data?.status === 'error', 'Error response has status=error');
      assert(
        typeof err.response?.data?.message === 'string',
        'Error response has message string'
      );
    }
  } catch (error) {
    console.error('Error Handling Test Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Backward Compatibility
 * Ensure stage-one endpoints still work
 */
async function testBackwardCompatibility() {
  printSection('TEST 7: BACKWARD COMPATIBILITY');

  try {
    printSubsection('7.1 Create Profile (POST)');
    const uniqueName = `TestUser${Date.now()}`;
    let res = await axios.post(`${API_BASE}/profiles`, { name: uniqueName });
    assertStatus(res.status, 201, 'New profile creation returns 201');
    assert(res.data.status === 'success', 'Response status is success');
    assert(res.data.data?.id, 'Response includes profile ID');
    const createdId = res.data.data.id;

    printSubsection('7.2 Get Profile by ID (GET /:id)');
    res = await axios.get(`${API_BASE}/profiles/${createdId}`);
    assertStatus(res.status, 200, 'Get profile returns 200');
    assert(res.data.data?.id === createdId, 'Retrieved correct profile');

    printSubsection('7.3 Delete Profile (DELETE /:id)');
    res = await axios.delete(`${API_BASE}/profiles/${createdId}`);
    assertStatus(res.status, 204, 'Delete returns 204 No Content');

    printSubsection('7.4 Basic Filtering (backward compat)');
    res = await axios.get(`${API_BASE}/profiles?gender=male`);
    assertStatus(res.status, 200, 'Basic filter returns 200');
    assert(Array.isArray(res.data.data), 'Response includes data array');

    printSubsection('7.5 Response Timestamps in ISO 8601 UTC');
    res = await axios.get(`${API_BASE}/profiles?limit=1`);
    if (res.data.data.length > 0) {
      const timestamp = res.data.data[0].created_at;
      assert(typeof timestamp === 'string', 'Timestamp is string');
      assert(/^\d{4}-\d{2}-\d{2}T/.test(timestamp), 'Timestamp in ISO 8601 format');
      assert(timestamp.includes('Z') || timestamp.includes('+'), 'Timestamp includes timezone');
    }

    printSubsection('7.6 UUIDs in Response');
    res = await axios.get(`${API_BASE}/profiles?limit=1`);
    if (res.data.data.length > 0) {
      const id = res.data.data[0].id;
      assert(typeof id === 'string', 'ID is string');
      assert(/^[0-9a-f\-]{36}$/.test(id), 'ID is UUID format');
    }
  } catch (error) {
    console.error('Backward Compatibility Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * TEST: Response Structure
 * Validate all response formats match specification
 */
async function testResponseStructure() {
  printSection('TEST 8: RESPONSE STRUCTURE');

  try {
    printSubsection('8.1 List Response Structure (Advanced Filtering)');
    let res = await axios.get(`${API_BASE}/profiles?gender=male&page=1&limit=10`);
    assertResponseStructure(
      res.data,
      ['status', 'page', 'limit', 'total', 'data'],
      'Advanced filter response'
    );
    assert(res.data.status === 'success', 'Status is "success"');
    assert(typeof res.data.page === 'number', 'Page is number');
    assert(typeof res.data.limit === 'number', 'Limit is number');
    assert(typeof res.data.total === 'number', 'Total is number');
    assert(Array.isArray(res.data.data), 'Data is array');

    printSubsection('8.2 Search Response Structure (NLP)');
    res = await axios.get(`${API_BASE}/profiles/search?q=males&page=1&limit=10`);
    assertResponseStructure(
      res.data,
      ['status', 'page', 'limit', 'total', 'data'],
      'NLP search response'
    );

    printSubsection('8.3 Profile Object Structure');
    res = await axios.get(`${API_BASE}/profiles?limit=1`);
    if (res.data.data.length > 0) {
      const profile = res.data.data[0];
      const requiredFields = ['id', 'name', 'gender', 'age', 'country_id', 'created_at'];
      requiredFields.forEach((field) => {
        assert(field in profile, `Profile includes ${field} field`);
      });
    }

    printSubsection('8.4 CORS Header');
    res = await axios.get(`${API_BASE}/profiles?limit=1`);
    const corsHeader = res.headers['access-control-allow-origin'];
    assert(corsHeader === '*' || corsHeader === undefined, 'CORS header is set or not restrictive');

    printSubsection('8.5 Content-Type Header');
    res = await axios.get(`${API_BASE}/profiles?limit=1`);
    assert(
      res.headers['content-type'].includes('application/json'),
      'Content-Type is application/json'
    );
  } catch (error) {
    console.error('Response Structure Error:', error instanceof Error ? error.message : error);
  }
}

/**
 * Print test summary
 */
function printTestSummary() {
  const successRate = testsPassed === 0 ? '0%' : `${Math.round((testsPassed / testsRun) * 100)}%`;

  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`\n✅ Passed: ${testsPassed}/${testsRun}`);
  console.log(`❌ Failed: ${testsFailed}/${testsRun}`);
  console.log(`📈 Success Rate: ${successRate}\n`);

  if (failedTests.length > 0) {
    console.log('Failed Tests:');
    failedTests.forEach((test, idx) => {
      console.log(`   ${idx + 1}. ${test}`);
    });
  }

  console.log(`\n${'='.repeat(70)}\n`);

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! 🎉\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testsFailed} test(s) failed\n`);
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
