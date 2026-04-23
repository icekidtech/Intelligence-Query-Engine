# HNG Profile Intelligence Service - Stage 2: Query Engine

[![GitHub](https://img.shields.io/badge/GitHub-Intelligence--Query--Engine-blue?logo=github)](https://github.com/icekidtech/Intelligence-Query-Engine.git)
[![License](https://img.shields.io/badge/License-ISC-yellow)]()
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-336791)]()

A **production-grade Intelligence Query Engine** that transforms raw profile data into actionable demographic intelligence. This system combines advanced filtering, intelligent sorting, efficient pagination, and natural language query parsing to enable powerful demographic insights at scale.

**Version:** `2.0.0` (Stage 2 - Query Engine Implementation)

## 🎯 Overview

Stage 2 extends the original profile enrichment system with enterprise-grade query capabilities. The API now supports:

- **Advanced Filtering** — Combine up to 6+ parameters (gender, age ranges, probability thresholds, countries)
- **Intelligent Sorting** — By age, creation time, or probability scores
- **Efficient Pagination** — Handle 2026+ profiles with optimal performance
- **Natural Language Search** — Convert plain English queries into structured database filters
- **Bulk Seeding** — Idempotently load 2026 seed profiles without duplicates

### Real-World Examples

```bash
# Query 1: Young males from Nigeria
GET /api/profiles/search?q=young+males+from+nigeria

# Query 2: Adult females with high confidence from Kenya, sorted by age
GET /api/profiles?gender=female&age_group=adult&country_id=KE&min_gender_probability=0.75&sort_by=age&order=desc

# Query 3: Paginated results of teenagers with high nationalization confidence
GET /api/profiles?age_group=teenager&min_country_probability=0.8&page=2&limit=25
```

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites & Installation](#-prerequisites--installation)
- [Configuration](#-configuration)
- [Running the Server](#-running-the-server)
- [API Endpoints](#-api-endpoints)
- [Query Language](#-query-language)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Error Handling](#-error-handling)
- [Performance](#-performance)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

## ⭐ Features

### Core Query Capabilities

✅ **Advanced Filtering**
- Filter by gender, age_group, country_id
- Range queries: min_age, max_age
- Probability thresholds: min_gender_probability, min_country_probability
- Combine all filters simultaneously

✅ **Intelligent Sorting**
- Sort by age (ascending/descending)
- Sort by creation date (newest/oldest)
- Sort by prediction confidence scores
- Maintains data integrity in all sort orders

✅ **Efficient Pagination**
- Default: 10 profiles per page
- Max: 50 profiles per page (configurable)
- Returns total count for UI integration
- Accurate offset calculation

✅ **Natural Language Queries**
- Parse plain English: "young males from nigeria"
- Gender keywords: male, man, men, female, woman, women, girl, girls, boy, boys
- Age keywords: young (16-24), teenager, adult, senior, child
- Age expressions: "above 30", "under 40", "16-24 years old"
- Country names: Nigeria, Kenya, Tanzania, Angola, Benin, etc. (40+ African countries)
- Returns descriptive error when query can't be parsed

✅ **Data Seeding**
- Bulk insert 2026 profiles from seed file
- Idempotent: re-runs don't create duplicates
- Tracks insertion results (inserted, skipped, errors)
- Validation of profile data integrity

### Data Management

✅ **Enhanced Data Model**
- Country IDs now 2-character ISO alpha-2 codes (NG, KE, AO, etc.)
- Added country_name field for human-readable display
- All 2026 seed profiles pre-loaded with rich metadata
- UUID v7 for all records

✅ **Backward Compatibility**
- All stage-one endpoints still functional
- POST /api/profiles, GET /api/profiles/:id, DELETE /api/profiles/:id unchanged
- Basic filtering preserved for legacy clients
- Idempotency maintained

✅ **CORS & Standards**
- CORS header: `Access-Control-Allow-Origin: *`
- ISO 8601 UTC timestamps for all dates
- HTTP status codes follow REST conventions
- Consistent JSON response structure

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────┐
│         REST API Layer                       │
│  (Express 5.1.0 with TypeScript)            │
└──────────────┬──────────────────────────────┘
               │
        ┌──────┴──────┬──────────────┐
        │             │              │
    ┌───▼───┐   ┌────▼────┐   ┌────▼────┐
    │Routes │   │Services  │   │Filters  │
    └───────┘   │- Profiles│   │& Parser │
                │- Filter  │   └────┬────┘
                │- Parser  │        │
                └────┬─────┘        │
                     │              │
               ┌─────▼──────────────┘
               │
        ┌──────▼───────────────┐
        │ Repository Layer     │
        │ (TypeORM QueryBuilder)
        └──────┬───────────────┘
               │
        ┌──────▼──────────────────┐
        │  PostgreSQL Database    │
        │  (profiles table)        │
        └─────────────────────────┘
```

### Key Components

| Component | Purpose | Key Methods |
|-----------|---------|-------------|
| **FilterService** | Validate & normalize query parameters | `validateFilters()`, `normalizeFilters()` |
| **QueryParser** | Parse natural language to structured filters | `parseQuery()`, `countryNameToCode()` |
| **ProfilesService** | Business logic for query execution | `queryProfiles()`, `searchWithNaturalLanguage()` |
| **ProfileRepository** | Database access with advanced queries | `findAllAdvanced()`, `seedProfiles()` |

## 📦 Prerequisites & Installation

### Requirements

- **Node.js** v16 or higher
- **pnpm** v8+ (or npm/yarn)
- **PostgreSQL** 12 or higher
- **Git**
- **2GB+ RAM** (for development)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/icekidtech/Intelligence-Query-Engine.git
   cd stage-two
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials.

4. **Build project:**
   ```bash
   pnpm build
   ```

5. **Run migrations:**
   ```bash
   npm run dev
   ```
   The app will auto-run pending migrations on startup.

6. **Seed database:**
   ```bash
   pnpm seed
   ```
   Loads 2026 profiles from `stage-two/seed_profiles.json`. Safe to re-run—duplicates are skipped.

7. **Start development server:**
   ```bash
   pnpm dev
   ```
   Server runs on `http://localhost:5000`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=development
PORT=5000

# PostgreSQL (Recommended: Connection String)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intelligence_query_engine

# PostgreSQL (Alternative: Individual Parameters)
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_USER=postgres
# DATABASE_PASSWORD=postgres
# DATABASE_NAME=intelligence_query_engine

# External APIs (optional - defaults provided)
GENDERIZE_API_URL=https://api.genderize.io
AGIFY_API_URL=https://api.agify.io
NATIONALIZE_API_URL=https://api.nationalize.io
API_TIMEOUT=5000

# Pagination Limits
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=50
```

## 🚀 Running the Server

### Development

```bash
# Start with auto-reload
pnpm dev

# Logs show:
# ✅ Database connected
# ✅ Migrations applied
# ✅ Server running on port 5000
```

### Production

```bash
# Build
pnpm build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 logs
pm2 monit
```

## 📡 API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{ "status": "ok" }
```

### Advanced Profile Search

```
GET /api/profiles/search?q=<NATURAL_LANGUAGE_QUERY>[&page=1&limit=10]
```

**Query Parameters:**
- `q` (required, string) — Natural language query (e.g., "young males from nigeria")
- `page` (optional, int) — Page number (default: 1)
- `limit` (optional, int) — Results per page, max 50 (default: 10)

**Example Request:**
```bash
curl "http://localhost:5000/api/profiles/search?q=young+males+from+nigeria&page=1&limit=20"
```

**Example Response:**
```json
{
  "status": "success",
  "page": 1,
  "limit": 20,
  "total": 156,
  "data": [
    {
      "id": "018f76a3-0b2d-7000-8000-000000000001",
      "name": "Chisom Okafor",
      "gender": "male",
      "gender_probability": 0.98,
      "age": 22,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.92,
      "created_at": "2026-04-20T16:45:23.456Z"
    }
    // ... more profiles
  ]
}
```

### Advanced Filtering

```
GET /api/profiles?[gender=GENDER&][age_group=AGE_GROUP&][country_id=CODE&][min_age=NUM&][max_age=NUM&][min_gender_probability=FLOAT&][min_country_probability=FLOAT&][sort_by=FIELD&][order=ORDER&][page=NUM&][limit=NUM]
```

**Query Parameters:**

| Parameter | Type | Options | Example |
|-----------|------|---------|---------|
| `gender` | string | male, female | gender=male |
| `age_group` | string | child, teenager, adult, senior | age_group=adult |
| `country_id` | string | 2-char ISO code | country_id=NG |
| `min_age` | integer | 0-150 | min_age=25 |
| `max_age` | integer | 0-150 | max_age=35 |
| `min_gender_probability` | float | 0-1 | min_gender_probability=0.75 |
| `min_country_probability` | float | 0-1 | min_country_probability=0.8 |
| `sort_by` | string | age, created_at, gender_probability | sort_by=age |
| `order` | string | asc, desc | order=desc |
| `page` | integer | ≥1 | page=2 |
| `limit` | integer | 1-50 | limit=25 |

**Example Request:**
```bash
curl "http://localhost:5000/api/profiles?gender=female&age_group=adult&country_id=KE&min_gender_probability=0.75&sort_by=age&order=desc&page=1&limit=20"
```

**Example Response:**
```json
{
  "status": "success",
  "page": 1,
  "limit": 20,
  "total": 342,
  "data": [
    {
      "id": "018f76a3-0b2d-7000-8000-000000000042",
      "name": "Amara Kipchoge",
      "gender": "female",
      "gender_probability": 0.89,
      "age": 54,
      "age_group": "adult",
      "country_id": "KE",
      "country_name": "Kenya",
      "country_probability": 0.87,
      "created_at": "2026-04-20T16:45:23.456Z"
    }
    // ... more profiles sorted by age descending
  ]
}
```

### Create Profile

```
POST /api/profiles
Content-Type: application/json

{ "name": "John Doe" }
```

**Response (201 - New):**
```json
{
  "status": "success",
  "data": {
    "id": "018f76a3-0b2d-7000-8000-000000000100",
    "name": "John Doe",
    "gender": "male",
    "gender_probability": 0.91,
    // ... enriched data
  }
}
```

**Response (200 - Already Exists):**
```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { /* existing profile */ }
}
```

### Retrieve Profile

```
GET /api/profiles/:id
```

**Response (200):**
```json
{
  "status": "success",
  "data": { /* profile details */ }
}
```

**Response (404):**
```json
{
  "status": "error",
  "message": "Profile not found"
}
```

### Delete Profile

```
DELETE /api/profiles/:id
```

**Response (204):**
```
[No Content]
```

## 🗣️ Query Language

The natural language parser converts plain English into structured database filters. Use these patterns:

### Gender Queries

```
"male" / "man" / "men" / "boy" / "boys"        → gender: male
"female" / "woman" / "women" / "girl" / "girls" → gender: female
```

### Age Queries

```
"young"              → min_age: 16, max_age: 24
"teenager" / "teens" → age_group: teenager
"adult" / "adults"   → age_group: adult
"senior" / "elderly" → age_group: senior
"child" / "children" → age_group: child

"above 30"           → min_age: 30
"below 50"           → max_age: 50
"25-35 years old"    → min_age: 25, max_age: 35
"age 28"             → min_age: 28, max_age: 28
```

### Country Queries

```
"from Nigeria"       → country_id: NG
"in Kenya"           → country_id: KE
"people from Angola" → country_id: AO
"in Benin"           → country_id: BJ
```

### Combined Queries

```
"young males from nigeria"
→ gender: male, min_age: 16, max_age: 24, country_id: NG

"female teenagers above 17 from kenya"
→ gender: female, age_group: teenager, min_age: 17, country_id: KE

"adult males from uganda"
→ gender: male, age_group: adult, country_id: UG
```

**Supported Countries:** Nigeria (NG), Kenya (KE), Tanzania (TZ), Uganda (UG), Angola (AO), Benin (BJ), Botswana (BW), Cameroon (CM), Ghana (GH), Rwanda (RW), Senegal (SN), South Africa (ZA), Zimbabwe (ZW), and 27+ more African countries.

## 🗄️ Database Schema

### profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_lower VARCHAR(255) NOT NULL UNIQUE,
  gender VARCHAR(10),
  gender_probability NUMERIC(5,4),
  sample_size INTEGER,
  age INTEGER,
  age_group VARCHAR(20),
  country_id VARCHAR(2),
  country_name VARCHAR(255),
  country_probability NUMERIC(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
CREATE INDEX idx_name_lower ON profiles(name_lower);
CREATE INDEX idx_gender ON profiles(gender);
CREATE INDEX idx_age_group ON profiles(age_group);
CREATE INDEX idx_country_id ON profiles(country_id);
CREATE INDEX idx_created_at ON profiles(created_at);
CREATE INDEX idx_gender_country_age_group ON profiles(gender, country_id, age_group);
```

## ✅ Testing

### Run Tests

```bash
pnpm test
```

Tests cover:
- Filtering combinations (gender, country, age ranges, probabilities)
- Sorting (age, created_at, gender_probability)
- Pagination (offset, limit, total count)
- Natural language parsing (all example queries)
- Error handling (400, 422, 404, 500)
- CORS headers and timestamps

### Manual Testing

**Test Natural Language Search:**
```bash
curl "http://localhost:5000/api/profiles/search?q=young+males+from+nigeria"

curl "http://localhost:5000/api/profiles/search?q=female+teenagers+from+kenya&page=1&limit=5"

curl "http://localhost:5000/api/profiles/search?q=adults+above+40&sort_by=age&order=desc"
```

**Test Advanced Filtering:**
```bash
# Gender + age range + country
curl "http://localhost:5000/api/profiles?gender=male&min_age=25&max_age=45&country_id=NG"

# Probability thresholds
curl "http://localhost:5000/api/profiles?min_gender_probability=0.8&min_country_probability=0.75"

# Sorting + pagination
curl "http://localhost:5000/api/profiles?sort_by=age&order=asc&page=2&limit=20"
```

**Test Error Cases:**
```bash
# Missing query parameter
curl "http://localhost:5000/api/profiles/search"
# Expected: 400 Bad Request

# Invalid parameter type
curl "http://localhost:5000/api/profiles?page=abc"
# Expected: 422 Unprocessable Entity

# Unparseable NLP query
curl "http://localhost:5000/api/profiles/search?q=xyz+abc+def"
# Expected: 200 OK with error message
```

## 📁 Project Structure

```
stage-two/
├── src/
│   ├── entities/
│   │   └── Profile.ts              # TypeORM entity with country_name field
│   ├── migrations/
│   │   ├── 1713369600000-CreateProfilesTable.ts
│   │   ├── 1713369600001-UpdateCountryIdFormat.ts
│   │   └── 1713369600002-AddCountryNameColumn.ts
│   ├── repositories/
│   │   └── ProfileRepository.ts     # Advanced query methods
│   ├── services/
│   │   ├── filter.services.ts       # Validation + normalization
│   │   ├── queryparser.services.ts  # NLP parsing
│   │   ├── profiles.services.ts     # Query execution + NLP
│   │   ├── genderize.services.ts    # (from stage-one)
│   │   ├── agify.services.ts        # (from stage-one)
│   │   └── nationalize.services.ts  # (from stage-one)
│   ├── routes/
│   │   ├── profiles.routes.ts       # All endpoints (enhanced)
│   │   └── health.routes.ts
│   ├── types/
│   │   └── index.types.ts           # Query types, pagination, sorting
│   ├── utils/
│   │   ├── seed.utils.ts            # Seed loading + validation
│   │   └── helpers.utils.ts         # (from stage-one)
│   ├── scripts/
│   │   └── seed-database.ts         # Bulk insert script
│   ├── middleware/
│   │   └── index.middleware.ts
│   ├── database.ts                  # Connection setup
│   └── main.ts                      # Server entry point
├── tests/
│   ├── profiles.test.ts             # Integration tests
│   └── diagnostic.test.ts
├── seed_profiles.json               # 2026 profiles for seeding
├── .env.example
├── package.json                     # Scripts including "seed"
├── tsconfig.json
├── ecosystem.config.js              # PM2 configuration
├── README.md                        # This file
├── CHANGELOG.md                     # Version history
├── CONTRIBUTION.md
└── .gitignore
```

## ❌ Error Handling

All errors follow this format:

```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

### HTTP Status Codes

| Code | Scenario | Message |
|------|----------|---------|
| 200 | Success (or unparseable NLP) | Response data included |
| 201 | Profile created | New profile returned |
| 204 | Profile deleted | No content |
| 400 | Missing/empty parameter | "Missing or empty query parameter" |
| 404 | Profile not found | "Profile not found" |
| 422 | Invalid parameter type | "Invalid query parameters" |
| 500 | Server error | "Internal server error" |
| 502 | External API failure | "Genderize/Agify/Nationalize returned an invalid response" |

### Common Errors

**Invalid Pagination:**
```json
{
  "status": "error",
  "message": "page must be a number >= 1; limit must be a number between 1 and 50"
}
```

**Unparseable NLP Query:**
```json
{
  "status": "error",
  "message": "Unable to interpret query",
  "page": 1,
  "limit": 10,
  "total": 0,
  "data": []
}
```

**Invalid Gender:**
```json
{
  "status": "error",
  "message": "Invalid query parameters"
}
```

## ⚡ Performance

### Optimization Strategies

1. **Database Indexes**: Composite index on (gender, country_id, age_group) for common filter combinations
2. **QueryBuilder Optimization**: TypeORM QueryBuilder avoids N+1 queries
3. **Pagination**: Offset-based, tested up to 2026 records
4. **Connection Pooling**: PostgreSQL maintains persistent connections
5. **Caching Ready**: Seed data static—can add Redis for repeated queries

### Benchmarks (Intel i5, 16GB RAM)

| Operation | Records | Time | Notes |
|-----------|---------|------|-------|
| Filter + sort | 2026 | <50ms | No pagination |
| Paginated query | 2026 | <30ms | With offset/limit |
| NLP parse | Various | <5ms | Regex-based, no AI |
| Seed insert | 2026 | ~2s | First run (transaction) |
| Seed re-run | 2026 | ~500ms | All duplicates skipped |

## 🌐 Deployment

### Docker (Recommended)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["node", "dist/main.js"]
```

### PM2 Production

```bash
# Install globally
npm install -g pm2

# Start with config
pm2 start ecosystem.config.js --env production

# Setup auto-restart on reboot
pm2 startup
pm2 save
```

### Environment for Production

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@production-db:5432/intelligence_query_engine
API_TIMEOUT=5000
```

## 🆘 Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Verify PostgreSQL is running: `psql -U postgres`
- Check DATABASE_URL in .env
- Ensure database exists

### Seeding Fails

```
Error: Seed file not found
```

**Solution:**
- Run from project root: `cd stage-two && pnpm seed`
- Verify `stage-two/seed_profiles.json` exists
- Check file has read permissions

### Migrations Not Applied

```
Migration pending but not applied
```

**Solution:**
- Run development server: `pnpm dev`
- Check logs for migration errors
- Ensure database user has CREATE TABLE permissions

### NLP Query Returns No Results

```
Unable to interpret query
```

**Solution:**
- Use supported keywords (see Query Language section)
- Check country spelling (case-insensitive)
- Try simpler query: "males from nigeria"

### Pagination Offset Incorrect

**Solution:**
- Verify page & limit parameters are integers
- Check total count matches expected
- Ensure new records haven't been inserted between requests

## 📚 Related Documentation

- [CHANGELOG.md](CHANGELOG.md) — Version history and updates
- [CONTRIBUTION.md](CONTRIBUTION.md) — Development guidelines
- [.env.example](.env.example) — Environment template

## 📝 License

ISC License

## 👨‍💻 Author

**Udoh, Idopise Edwin**

## 🔗 Repository

https://github.com/icekidtech/Intelligence-Query-Engine.git

---

**Last Updated:** April 20, 2026  
**Version:** 2.0.0 (Stage 2 - Complete Implementation)
