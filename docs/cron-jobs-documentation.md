# Cron Jobs Documentation

## Overview

The Wasatch Backend application now uses proper cron jobs instead of running tasks every time the server starts. The cron jobs are scheduled to run at specific intervals and use the application's configured timezone.

## Cron Jobs

### 1. Routine Pickup Generation Job

**Function**: `generateRoutinePickupsJob()`

**Schedule**: Daily at 6:00 PM in the application timezone

**Purpose**: Creates pickup requests for users who have routine pickups enabled for the next day

**Cron Expression**: `0 18 * * *` (6 PM daily)

**Features**:

- Runs in the application timezone (configurable via `APP_TZ` environment variable)
- Creates pickup requests for tomorrow based on user preferences
- Sends notifications to users about scheduled pickups
- Prevents duplicate pickup requests
- Logs detailed information about the process

**Implementation**:

```typescript
export const generateRoutinePickupsJob = () => {
  cron.schedule(
    "0 18 * * *",
    () => {
      console.log("Starting routine pickup generation cron job");
      generateRoutinePickups();
    },
    {
      timezone: APPLICATION_TIMEZONE,
    }
  );
};
```

### 2. Missed Tasks Check Job

**Function**: `markMissedTasksJob()`

**Schedule**: Every 30 minutes

**Purpose**: Marks tasks as missed if their scheduled end time has passed

**Cron Expression**: `*/30 * * * *` (every 30 minutes)

**Features**:

- Checks for tasks that are still pending or in_progress but past their scheduled end time
- Marks overdue tasks as "missed"
- Updates associated pickup requests
- Creates activity logs for missed tasks
- Sends notifications to users about missed pickups
- Uses application timezone for accurate time comparisons

**Implementation**:

```typescript
export const markMissedTasksJob = () => {
  cron.schedule(
    "*/30 * * * *",
    () => {
      console.log("Starting missed tasks check cron job");
      markMissedTasks();
    },
    {
      timezone: APPLICATION_TIMEZONE,
    }
  );
};
```

## Key Improvements

### 1. Proper Scheduling

- **Before**: Tasks ran every time the server started using `setTimeout`
- **After**: Tasks run on proper schedules using `node-cron`

### 2. Timezone Awareness

- All cron jobs now use the application's configured timezone
- Consistent time handling across the application
- Configurable via `APP_TZ` environment variable

### 3. Better Logic

- **Missed Tasks**: Now checks if `scheduledEnd` time has passed
- **More Accurate**: Uses actual task scheduling times instead of attendance records
- **Real-time**: Runs every 30 minutes for timely missed task detection

### 4. Enhanced Logging

- Detailed console logs for monitoring
- Activity logs for missed tasks
- Better error handling and reporting

## Configuration

### Environment Variables

The cron jobs use the application timezone configuration:

```bash
# Application Timezone (e.g., America/Denver, America/New_York)
APP_TZ=America/Denver
```

### Cron Schedule Customization

You can modify the cron schedules by changing the expressions in the job functions:

```typescript
// Run every 15 minutes instead of 30
cron.schedule("*/15 * * * *", () => { ... });

// Run at 8 PM instead of 6 PM
cron.schedule("0 20 * * *", () => { ... });

// Run every hour
cron.schedule("0 * * * *", () => { ... });
```

## Monitoring

### Console Logs

The cron jobs provide detailed logging:

```
Routine pickup generation cron job scheduled for 6 PM America/Denver
Missed tasks check cron job scheduled every 30 minutes in America/Denver
Starting routine pickup generation cron job
Found 5 users with routine pickups enabled
Scheduled routine pickup for user John Doe on 2024-01-15T10:00:00.000Z
Starting missed tasks check cron job
Found 2 overdue tasks
Marked task 507f1f77bcf86cd799439011 as missed for unit A101
```

### Activity Logs

Missed tasks are automatically logged in the activity system:

- Task ID
- Employee ID (if assigned)
- Unit number
- Request type
- Timestamp

## Testing

### Manual Testing

You can test the cron job functions manually:

```typescript
import {
  generateRoutinePickups,
  markMissedTasks,
} from "./jobs/generateRoutinePickups.js";

// Test routine pickup generation
await generateRoutinePickups();

// Test missed tasks check
await markMissedTasks();
```

### Cron Expression Testing

Use online cron expression validators to test your schedules:

- [Cron Expression Generator](https://crontab.guru/)
- [Cron Expression Validator](https://crontab.cronhub.io/)

## Troubleshooting

### Common Issues

1. **Jobs Not Running**:

   - Check if `node-cron` is properly installed
   - Verify cron expressions are valid
   - Check console logs for initialization messages

2. **Timezone Issues**:

   - Ensure `APP_TZ` environment variable is set correctly
   - Verify timezone is valid using `Intl.DateTimeFormat`
   - Check that dayjs timezone plugin is loaded

3. **Database Issues**:
   - Ensure database connection is stable
   - Check for proper error handling in job functions
   - Verify model relationships are correct

### Debugging

Enable detailed logging by adding console.log statements:

```typescript
export const markMissedTasks = async () => {
  console.log("Current time:", dayjs().tz(APPLICATION_TIMEZONE).format());
  console.log("Looking for tasks with scheduledEnd <", now);
  // ... rest of function
};
```

## Performance Considerations

### Database Queries

The cron jobs perform database queries that could impact performance:

1. **Routine Pickups**: Queries all users with routine pickups enabled
2. **Missed Tasks**: Queries all pending/in_progress tasks

### Optimization Tips

1. **Indexing**: Ensure proper database indexes on:

   - `Task.scheduledEnd`
   - `Task.status`
   - `PickupRequest.date`
   - `PickupRequest.status`

2. **Batch Processing**: For large datasets, consider processing in batches

3. **Error Handling**: Implement retry logic for failed operations

## Future Enhancements

Potential improvements for the cron job system:

1. **Job Status Tracking**: Track job execution status and history
2. **Configurable Schedules**: Allow runtime schedule changes
3. **Job Dependencies**: Chain jobs that depend on each other
4. **Monitoring Dashboard**: Web interface for monitoring job status
5. **Alert System**: Notifications when jobs fail or encounter errors
6. **Job Queuing**: Queue system for handling high-volume operations

## Security Considerations

1. **Access Control**: Ensure only authorized users can trigger manual job execution
2. **Rate Limiting**: Prevent abuse of manual job triggers
3. **Logging**: Maintain audit logs for job executions
4. **Error Handling**: Don't expose sensitive information in error messages
