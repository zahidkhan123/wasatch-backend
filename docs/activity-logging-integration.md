# Activity Logging Integration for Task Events

## Overview

The activity logging system has been integrated to automatically track and log various task-related events in the Wasatch Backend system. This provides comprehensive audit trails and activity monitoring for task management.

## Activity Types

The system now tracks the following task-related activity types:

- **TASK_STARTED**: When a task is initiated by an employee
- **TASK_COMPLETED**: When a task is successfully finished
- **TASK_MISSED**: When a task is not completed within the scheduled time
- **ISSUE_REPORTED**: When an employee reports an issue related to a task

## Database Schema Updates

### ActivityLog Model Changes

The `ActivityLog` model has been enhanced with new fields:

```typescript
export interface IActivityLog extends Document {
  employeeId?: string;
  employeeName?: string;
  unitNumber: string;
  type: ActivityType;
  requestType?: string;
  taskId?: string; // NEW: Reference to the task
  issueId?: string; // NEW: Reference to the issue report
  timestamp: Date;
}
```

### New Activity Types

```typescript
export type ActivityType =
  | "PICKUP_COMPLETED"
  | "MISSED_PICKUP"
  | "NEW_REQUEST"
  | "TASK_STARTED" // NEW
  | "TASK_COMPLETED" // NEW
  | "TASK_MISSED" // NEW
  | "ISSUE_REPORTED"; // NEW
```

## Integration Points

### 1. Task Start Events

**Location**: `src/services/app/employeeService.ts` - `startTask` function

**Trigger**: When an employee starts a task

**Log Created**: `TASK_STARTED`

```typescript
// Create activity log for task started
await createTaskStartedLog({
  taskId: task._id.toString(),
  employeeId: employeeId,
  unitNumber: task.unitNumber,
  requestType: task.requestId?.type || "routine",
});
```

### 2. Task Completion Events

**Location**: `src/services/app/employeeService.ts` - `endTask` function

**Trigger**: When an employee completes a task

**Log Created**: `TASK_COMPLETED`

```typescript
// Create activity log for task completed
await createTaskCompletedLog({
  taskId: task._id.toString(),
  employeeId: employeeId,
  unitNumber: task.unitNumber,
  requestType: task.requestId?.type || "routine",
});
```

### 3. Task Missed Events

**Location**: `src/jobs/generateRoutinePickups.ts` - `markMissedPickupsAndTasks` function

**Trigger**: When a task is automatically marked as missed by the cron job

**Log Created**: `TASK_MISSED`

```typescript
// Create activity log for task missed
await createTaskMissedLog({
  taskId: task._id.toString(),
  employeeId: task.employeeId?.toString(),
  unitNumber: task.unitNumber,
  requestType: pickup.type,
});
```

### 4. Issue Report Events

**Location**: `src/services/app/employeeService.ts` - `reportIssueTask` function

**Trigger**: When an employee reports an issue related to a task

**Log Created**: `ISSUE_REPORTED`

```typescript
// Create activity log for issue reported
await createIssueReportedLog({
  issueId: issueReport._id.toString(),
  taskId: taskId,
  employeeId: employeeId,
  unitNumber: task.unitNumber,
  requestType: task.requestId?.type || "routine",
});
```

### 5. Manual Task Assignment Events

**Location**: `src/services/admin/taskService.ts` - `createAndAssignTaskManually` function

**Trigger**: When an admin manually creates and assigns a task

**Log Created**: `TASK_STARTED`

```typescript
// Create activity log for task started (manual assignment)
await createTaskStartedLog({
  taskId: task._id.toString(),
  employeeId: employee._id.toString(),
  unitNumber: unitNumber,
  requestType: "on_demand",
});
```

### 6. On-Demand Pickup Creation Events

**Location**: `src/services/app/pickupService.ts` - `createOnDemandPickup` function

**Trigger**: When a user creates an on-demand pickup request

**Log Created**: `TASK_STARTED`

```typescript
// Create activity log for task started (on-demand pickup)
await createTaskStartedLog({
  taskId: task._id.toString(),
  unitNumber: pickup.unitNumber,
  requestType: "on_demand",
});
```

## Helper Functions

The activity service provides convenient helper functions for creating specific types of logs:

### `createTaskStartedLog(taskData)`

Creates a log entry when a task is started.

**Parameters**:

- `taskId`: The ID of the task
- `employeeId`: The ID of the employee (optional)
- `employeeName`: The name of the employee (optional)
- `unitNumber`: The unit number for the task
- `requestType`: The type of request (e.g., "on_demand", "routine")

### `createTaskCompletedLog(taskData)`

Creates a log entry when a task is completed.

**Parameters**: Same as `createTaskStartedLog`

### `createTaskMissedLog(taskData)`

Creates a log entry when a task is missed.

**Parameters**: Same as `createTaskStartedLog` (taskId is optional)

### `createIssueReportedLog(issueData)`

Creates a log entry when an issue is reported.

**Parameters**:

- `issueId`: The ID of the issue report
- `taskId`: The ID of the related task (optional)
- `employeeId`: The ID of the employee (optional)
- `employeeName`: The name of the employee (optional)
- `unitNumber`: The unit number (optional)
- `requestType`: The type of request (optional)

## Usage Examples

### Basic Task Start Logging

```typescript
import { createTaskStartedLog } from "../services/admin/activityService.js";

// When a task is started
await createTaskStartedLog({
  taskId: "507f1f77bcf86cd799439011",
  employeeId: "507f1f77bcf86cd799439012",
  employeeName: "John Doe",
  unitNumber: "A101",
  requestType: "on_demand",
});
```

### Issue Reporting with Logging

```typescript
import { createIssueReportedLog } from "../services/admin/activityService.js";

// When an issue is reported
await createIssueReportedLog({
  issueId: "507f1f77bcf86cd799439013",
  taskId: "507f1f77bcf86cd799439011",
  employeeId: "507f1f77bcf86cd799439012",
  unitNumber: "A101",
  requestType: "routine",
});
```

## Benefits

1. **Complete Audit Trail**: Every task event is now logged with timestamps and relevant details
2. **Employee Accountability**: Track which employees started, completed, or missed tasks
3. **Issue Tracking**: Monitor when and where issues are reported
4. **Performance Analytics**: Analyze task completion rates and employee performance
5. **Compliance**: Maintain records for regulatory or audit purposes
6. **Debugging**: Easily trace task-related problems through the activity logs

## Monitoring and Analytics

The activity logs can be used to generate various reports:

- Task completion rates by employee
- Missed task frequency by time period
- Issue reporting patterns
- Task duration analysis
- Employee performance metrics

## Database Queries

### Get all task-related activities

```javascript
const taskActivities = await ActivityLog.find({
  type: {
    $in: ["TASK_STARTED", "TASK_COMPLETED", "TASK_MISSED", "ISSUE_REPORTED"],
  },
}).sort({ timestamp: -1 });
```

### Get activities for a specific task

```javascript
const taskActivities = await ActivityLog.find({
  taskId: "507f1f77bcf86cd799439011",
}).sort({ timestamp: -1 });
```

### Get activities for a specific employee

```javascript
const employeeActivities = await ActivityLog.find({
  employeeId: "507f1f77bcf86cd799439012",
}).sort({ timestamp: -1 });
```

## Error Handling

The activity logging functions include proper error handling:

- If logging fails, it won't affect the main task operations
- Errors are logged but don't break the application flow
- Failed log attempts return error responses but don't throw exceptions

## Future Enhancements

Potential improvements for the activity logging system:

1. **Real-time Notifications**: Send notifications when specific activity types occur
2. **Dashboard Integration**: Display activity logs in admin dashboards
3. **Export Functionality**: Export activity logs for external analysis
4. **Advanced Filtering**: Add more sophisticated query options
5. **Performance Metrics**: Calculate and store derived metrics from activity data
