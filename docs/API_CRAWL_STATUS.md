# Crawl Status API Documentation

## Overview

The `/api/crawl` endpoint provides comprehensive status reporting for crawl jobs, allowing cron jobs and UI consumers to track job progress without requiring direct database access.

## Endpoints

### GET /api/crawl

Get crawl job status information.

#### Query Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `jobId` | string (UUID) | Get specific job by ID | No |
| `current` | boolean | Get currently active job (`current=true`) | No |
| `limit` | number | Number of recent jobs to return (default: 10) | No |

#### Response Format

All responses follow this structure:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}
```

## Usage Examples

### 1. Get Specific Job by ID

**Request:**
```bash
GET /api/crawl?jobId=123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "type": "full",
    "status": "running",
    "startedAt": "2025-01-15T10:30:00Z",
    "completedAt": null,
    "targetUrl": null,
    "productsProcessed": 150,
    "productsUpdated": 145,
    "errorMessage": null,
    "metadata": {
      "categories": ["https://signaturesolar.com/all-products/solar-panels/"],
      "expectedTotal": 500
    },
    "progressPercentage": 30,
    "estimatedCompletion": "2025-01-15T11:15:00Z",
    "duration": 1800,
    "avgProductsPerMinute": 5
  }
}
```

### 2. Get Current Active Job

**Request:**
```bash
GET /api/crawl?current=true
```

**Response (when job is running):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "type": "full",
    "status": "running",
    "startedAt": "2025-01-15T10:30:00Z",
    "productsProcessed": 150,
    "productsUpdated": 145,
    "progressPercentage": -1,
    "duration": 1800,
    "avgProductsPerMinute": 5,
    "estimatedCompletion": null
  }
}
```

**Response (when no job is running):**
```json
{
  "success": true,
  "data": null,
  "message": "No active crawl job"
}
```

### 3. Get Recent Jobs

**Request:**
```bash
GET /api/crawl?limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "full",
        "status": "completed",
        "startedAt": "2025-01-15T10:30:00Z",
        "completedAt": "2025-01-15T11:45:00Z",
        "productsProcessed": 500,
        "productsUpdated": 485,
        "progressPercentage": 100,
        "duration": 4500,
        "avgProductsPerMinute": 7
      },
      {
        "id": "234e5678-e89b-12d3-a456-426614174001",
        "type": "category",
        "status": "failed",
        "startedAt": "2025-01-15T09:00:00Z",
        "completedAt": "2025-01-15T09:15:00Z",
        "productsProcessed": 50,
        "productsUpdated": 45,
        "errorMessage": "Network timeout",
        "progressPercentage": 0,
        "duration": 900,
        "avgProductsPerMinute": 3
      }
    ],
    "total": 2
  }
}
```

## Response Fields

### Job Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique job identifier (UUID) |
| `type` | string | Job type: `full`, `category`, or `product` |
| `status` | string | Job status: `pending`, `running`, `completed`, or `failed` |
| `startedAt` | string (ISO) | When the job started |
| `completedAt` | string (ISO) | When the job completed (null if still running) |
| `targetUrl` | string | URL being crawled (for category/product jobs) |
| `productsProcessed` | number | Total products processed |
| `productsUpdated` | number | Products successfully updated in database |
| `errorMessage` | string | Error message (if status is `failed`) |
| `metadata` | object | Additional job metadata |

### Progress Fields (calculated)

| Field | Type | Description |
|-------|------|-------------|
| `progressPercentage` | number | Progress percentage (0-100, or -1 for indeterminate) |
| `estimatedCompletion` | string (ISO) | Estimated completion time (null if unknown) |
| `duration` | number | Job duration in seconds |
| `avgProductsPerMinute` | number | Average processing rate |

## Progress Calculation

### Determinate Progress (with expectedTotal in metadata)

When a job has `metadata.expectedTotal` set, the API calculates:

- **Progress Percentage:** `(productsProcessed / expectedTotal) * 100`
- **Estimated Completion:** Based on average products per minute and remaining products

### Indeterminate Progress (no expectedTotal)

When `expectedTotal` is not available:

- **Progress Percentage:** `-1` (indicates indeterminate)
- **Estimated Completion:** `null`

The UI can show an indeterminate spinner or progress bar in this case.

## Integration Examples

### Cron Job Monitoring

```javascript
// Check if crawl is complete before starting new one
async function checkCrawlStatus() {
  const response = await fetch('/api/crawl?current=true');
  const { data } = await response.json();

  if (!data) {
    // No active job, safe to start new crawl
    await fetch('/api/crawl', { method: 'POST' });
  } else if (data.status === 'running') {
    console.log(`Crawl in progress: ${data.progressPercentage}%`);
    console.log(`${data.productsProcessed} products processed`);
  }
}
```

### UI Polling

```javascript
// Poll for job status every 5 seconds
async function pollJobStatus(jobId) {
  const response = await fetch(`/api/crawl?jobId=${jobId}`);
  const { data } = await response.json();

  if (data.status === 'running') {
    updateProgressBar(data.progressPercentage);
    updateStats({
      processed: data.productsProcessed,
      updated: data.productsUpdated,
      rate: data.avgProductsPerMinute,
      eta: data.estimatedCompletion
    });

    // Continue polling
    setTimeout(() => pollJobStatus(jobId), 5000);
  } else if (data.status === 'completed') {
    showSuccess(`Completed: ${data.productsUpdated} products updated`);
  } else if (data.status === 'failed') {
    showError(data.errorMessage);
  }
}
```

### Dashboard Display

```javascript
// Get recent crawl history for dashboard
async function loadCrawlHistory() {
  const response = await fetch('/api/crawl?limit=10');
  const { data } = await response.json();

  data.jobs.forEach(job => {
    displayJob({
      id: job.id,
      type: job.type,
      status: job.status,
      duration: formatDuration(job.duration),
      processed: job.productsProcessed,
      rate: `${job.avgProductsPerMinute}/min`,
      completedAt: job.completedAt
    });
  });
}
```

## Error Responses

### Job Not Found (404)

```json
{
  "success": false,
  "error": "Job not found"
}
```

### Server Error (500)

```json
{
  "success": false,
  "error": "Failed to get crawl status",
  "message": "Database connection error"
}
```

## POST /api/crawl

Start a new crawl job.

### Authentication

- **Development:** No authentication required
- **Production:** Requires Vercel Cron secret in Authorization header

**Request:**
```bash
POST /api/crawl
Authorization: Bearer <VERCEL_CRON_SECRET>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "pending",
    "productsProcessed": 0,
    "productsUpdated": 0
  },
  "message": "Crawl job started successfully"
}
```

## Best Practices

1. **Polling Interval:** Use 5-10 second intervals for active job polling
2. **Timeout Handling:** Implement exponential backoff if requests fail
3. **Progress Display:** Use indeterminate UI when `progressPercentage === -1`
4. **Error Recovery:** Check error messages and implement retry logic
5. **Rate Limiting:** Don't poll faster than every 2 seconds

## Vercel Cron Integration

### vercel.json Configuration

```json
{
  "crons": [
    {
      "path": "/api/crawl",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Monitoring Cron Jobs

```bash
# Check if cron job completed successfully
curl "https://yourapp.vercel.app/api/crawl?limit=1"
```

The most recent job will show if the cron ran successfully.
