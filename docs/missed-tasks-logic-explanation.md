# Missed Tasks Logic Explanation

## How the Cron Job Works

### 1. **When It Runs**

The missed tasks cron job runs **every 30 minutes** using this schedule:

```typescript
cron.schedule(
  "*/05 * * * *",
  () => {
    markMissedTasks();
  },
  {
    timezone: APPLICATION_TIMEZONE, // America/Denver (MST)
  }
);
```

**Schedule Examples:**

- 9:00 AM MST
- 9:30 AM MST
- 10:00 AM MST
- 10:30 AM MST
- 11:00 AM MST
- And so on...

### 2. **How It Determines Missed Tasks**

The logic is **time-based**, not date-based. Here's exactly how it works:

```typescript
export const markMissedTasks = async () => {
  // Get current time in application timezone (America/Denver)
  const now = dayjs().tz(APPLICATION_TIMEZONE).toDate();

  // Find tasks that are:
  // 1. Still pending or in_progress
  // 2. AND their scheduledEnd time has passed
  const overdueTasks = await Task.find({
    status: { $in: ["pending", "in_progress"] },
    scheduledEnd: { $lt: now }, // scheduledEnd is LESS THAN current time
  });
};
```

## Detailed Examples

### Example 1: Task Scheduled for 10:00 AM - 11:00 AM

**Task Details:**

```javascript
{
  _id: "task123",
  unitNumber: "A101",
  scheduledStart: "2024-01-15T10:00:00.000Z", // 10:00 (24-hour format)
  scheduledEnd: "2024-01-15T11:00:00.000Z",   // 11:00 (24-hour format)
  status: "pending"
}
```

**Timeline:**

- **09:30**: Cron runs → Task NOT missed (scheduledEnd = 11:00 > current time)
- **10:00**: Cron runs → Task NOT missed (scheduledEnd = 11:00 > current time)
- **10:30**: Cron runs → Task NOT missed (scheduledEnd = 11:00 > current time)
- **11:00**: Cron runs → Task NOT missed (scheduledEnd = 11:00 = current time)
- **11:30**: Cron runs → **Task MARKED AS MISSED** (scheduledEnd = 11:00 < current time)

### Example 2: Task Scheduled for 14:00 - 15:00 (2:00 PM - 3:00 PM)

**Task Details:**

```javascript
{
  _id: "task456",
  unitNumber: "B202",
  scheduledStart: "2024-01-15T14:00:00.000Z", // 14:00 (24-hour format)
  scheduledEnd: "2024-01-15T15:00:00.000Z",   // 15:00 (24-hour format)
  status: "in_progress"
}
```

**Timeline:**

- **14:30**: Cron runs → Task NOT missed (scheduledEnd = 15:00 > current time)
- **15:00**: Cron runs → Task NOT missed (scheduledEnd = 15:00 = current time)
- **15:30**: Cron runs → **Task MARKED AS MISSED** (scheduledEnd = 15:00 < current time)

## Key Points

### 1. **Precise Time Checking**

- It checks the **exact time** (hours and minutes), not just the date
- Uses `scheduledEnd: { $lt: now }` which means "scheduled end time is less than current time"

### 2. **Timezone Aware**

- All time comparisons use `America/Denver` timezone
- Current time: `dayjs().tz(APPLICATION_TIMEZONE).toDate()`
- Task times are stored in UTC but compared in MST

### 3. **Status Requirements**

Only tasks with these statuses are checked:

- `"pending"` - Task hasn't been started yet
- `"in_progress"` - Task was started but not completed

### 4. **What Happens When Marked Missed**

```typescript
// Mark task as missed
task.status = "missed";
await task.save();

// Update associated pickup request
if (task.requestId) {
  await PickupRequest.updateOne(
    { _id: task.requestId._id },
    { $set: { status: "missed" } }
  );
}

// Create activity log
await createTaskMissedLog({
  taskId: task._id.toString(),
  employeeId: task.employeeId?.toString(),
  unitNumber: task.unitNumber,
  requestType: task.requestId?.type || "routine",
});

// Send notification to user
await sendNotification(
  task.requestId.userId.toString(),
  "user",
  "pickup_missed.svg",
  "Missed Pickup",
  `Your pickup at ${task.unitNumber} was missed on ${dayjs(task.scheduledEnd).format("DD MMM YYYY")} at ${dayjs(task.scheduledEnd).format("HH:mm")}.`
);
```

## Real-World Scenarios

### Scenario 1: Employee Never Started Task

- **Task**: Scheduled 10:00 - 11:00, status = "pending"
- **11:30**: Cron runs → Task marked as missed
- **Result**: User gets notification about missed pickup

### Scenario 2: Employee Started But Didn't Finish

- **Task**: Scheduled 14:00 - 15:00, status = "in_progress"
- **15:30**: Cron runs → Task marked as missed
- **Result**: User gets notification about missed pickup

### Scenario 3: Employee Completed On Time

- **Task**: Scheduled 09:00 - 10:00, status = "completed"
- **10:30**: Cron runs → Task NOT checked (status is "completed")
- **Result**: No action taken

## Database Query Breakdown

```javascript
// This query finds overdue tasks
const overdueTasks = await Task.find({
  status: { $in: ["pending", "in_progress"] }, // Only check these statuses
  scheduledEnd: { $lt: now }, // scheduledEnd < current time
}).populate("requestId");
```

**Translation**: "Find all tasks that are either pending or in_progress AND their scheduled end time has already passed"

## Monitoring and Logs

When the cron job runs, you'll see logs like:

```
Running missed tasks check at Mon Jan 15 2024 11:30:00 GMT-0700 (MST)
Found 2 overdue tasks
Marked task 507f1f77bcf86cd799439011 as missed for unit A101
Marked task 507f1f77bcf86cd799439012 as missed for unit B202
Marked 2 tasks as missed
```

## Time Format Clarification

**Important**: The system uses **24-hour format** for all time storage and comparisons:

- **Morning**: 09:00, 10:00, 11:00 (not 9:00 AM, 10:00 AM, 11:00 AM)
- **Afternoon**: 14:00, 15:00, 16:00 (not 2:00 PM, 3:00 PM, 4:00 PM)
- **Evening**: 18:00, 19:00, 20:00 (not 6:00 PM, 7:00 PM, 8:00 PM)

This means when you see times like `10:00` or `14:00` in the database, they represent:

- `10:00` = 10:00 AM
- `14:00` = 2:00 PM
- `18:00` = 6:00 PM

## Summary

The cron job is **time-precise** and **automatic**:

- ✅ Runs every 30 minutes
- ✅ Checks exact scheduled end times (not just dates)
- ✅ Uses application timezone (America/Denver)
- ✅ Only checks pending/in_progress tasks
- ✅ Marks tasks as missed when scheduledEnd < current time
- ✅ Creates activity logs and sends notifications
- ✅ Updates both task and pickup request status
