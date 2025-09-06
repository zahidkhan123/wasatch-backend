# Status Mapping Guide

## Overview

The Wasatch Backend system uses two main models for tracking pickup requests and tasks, each with their own status values. Understanding the relationship between these statuses is crucial for proper system operation.

## Model Status Values

### PickupRequest Model

```typescript
status: "scheduled" | "completed" | "missed" | "delayed";
```

### Task Model

```typescript
status: "pending" |
  "in_progress" |
  "delayed" |
  "missed" |
  "completed" |
  "scheduled";
```

## Status Mapping

| PickupRequest Status | Task Status   | Description                               |
| -------------------- | ------------- | ----------------------------------------- |
| `scheduled`          | `scheduled`   | Request/task is scheduled but not started |
| `completed`          | `completed`   | Request/task has been completed           |
| `missed`             | `missed`      | Request/task was missed                   |
| `delayed`            | `delayed`     | Request/task is delayed                   |
| N/A                  | `pending`     | Task is pending (legacy status)           |
| N/A                  | `in_progress` | Task is currently being worked on         |

## Cron Job Status Checking

The missed tasks cron job now checks for tasks with these statuses:

```typescript
const overdueTasks = await Task.find({
  status: { $in: ["pending", "in_progress", "scheduled"] },
  scheduledEnd: { $lt: now },
});
```

**Statuses Checked:**

- `pending` - Legacy status for tasks not yet started
- `in_progress` - Tasks currently being worked on
- `scheduled` - Tasks that are scheduled but not started

**Statuses NOT Checked:**

- `completed` - Already finished
- `missed` - Already marked as missed
- `delayed` - Intentionally delayed

## Status Transitions

### Normal Flow

1. **Created**: `scheduled` → `scheduled`
2. **Started**: `scheduled` → `in_progress`
3. **Completed**: `in_progress` → `completed`

### Missed Flow

1. **Created**: `scheduled` → `scheduled`
2. **Time Passed**: `scheduled` → `missed` (via cron job)

### Delayed Flow

1. **Created**: `scheduled` → `scheduled`
2. **Delayed**: `scheduled` → `delayed`
3. **Resumed**: `delayed` → `in_progress`

## Common Issues

### Issue 1: Status Mismatch

**Problem**: PickupRequest has `scheduled` but Task has `pending`
**Solution**: Ensure both models use consistent status values

### Issue 2: Cron Job Not Finding Tasks

**Problem**: Cron job only checks `pending` and `in_progress`
**Solution**: Updated to also check `scheduled` status

### Issue 3: Status Not Updating

**Problem**: One model updates but the other doesn't
**Solution**: Update both models when status changes

## Best Practices

### 1. Consistent Status Updates

Always update both PickupRequest and Task statuses together:

```typescript
// When marking task as missed
task.status = "missed";
await task.save();

if (task.requestId) {
  await PickupRequest.updateOne(
    { _id: task.requestId._id },
    { $set: { status: "missed" } }
  );
}
```

### 2. Status Validation

Validate status transitions:

```typescript
const validTransitions = {
  scheduled: ["in_progress", "missed", "delayed"],
  in_progress: ["completed", "missed", "delayed"],
  delayed: ["in_progress", "missed"],
  completed: [], // Terminal state
  missed: [], // Terminal state
};
```

### 3. Status Synchronization

Create helper functions to sync statuses:

```typescript
export const syncTaskAndPickupStatus = async (
  taskId: string,
  newStatus: string
) => {
  const task = await Task.findById(taskId);
  if (!task) return;

  // Update task status
  task.status = newStatus;
  await task.save();

  // Update pickup request status
  if (task.requestId) {
    await PickupRequest.updateOne(
      { _id: task.requestId },
      { $set: { status: newStatus } }
    );
  }
};
```

## Debugging Status Issues

### Check Task Status

```javascript
// Find task by ID
const task = await Task.findById("TASK_ID");
console.log("Task status:", task.status);
console.log("Scheduled end:", task.scheduledEnd);
```

### Check PickupRequest Status

```javascript
// Find pickup request by ID
const pickup = await PickupRequest.findById("PICKUP_ID");
console.log("Pickup status:", pickup.status);
```

### Check Status Consistency

```javascript
// Find tasks with mismatched statuses
const inconsistentTasks = await Task.aggregate([
  {
    $lookup: {
      from: "pickuprequests",
      localField: "requestId",
      foreignField: "_id",
      as: "pickupRequest",
    },
  },
  {
    $match: {
      "pickupRequest.status": { $ne: "$status" },
    },
  },
]);
```

## Migration Notes

If you have existing data with status mismatches:

1. **Update Task Model**: Add `"scheduled"` to enum
2. **Update Cron Job**: Include `"scheduled"` in status check
3. **Sync Existing Data**: Run migration script to sync statuses

```javascript
// Migration script example
const tasks = await Task.find({ status: "pending" });
for (const task of tasks) {
  const pickup = await PickupRequest.findById(task.requestId);
  if (pickup && pickup.status === "scheduled") {
    task.status = "scheduled";
    await task.save();
  }
}
```
