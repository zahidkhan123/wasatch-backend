# Timezone Configuration Guide

## Overview

The Wasatch Backend application now uses a centralized timezone configuration system that allows you to change the application timezone from a single location. The default timezone has been changed from `America/New_York` (Eastern Time) to `America/Denver` (Mountain Time).

## Configuration

### Environment Variable

The application timezone is controlled by the `APP_TZ` environment variable in your `.env` file:

```bash
# Application Timezone (e.g., America/Denver, America/New_York, America/Los_Angeles)
APP_TZ=America/Denver
```

### Supported Timezones

You can use any valid IANA timezone identifier. Common US timezones include:

- `America/Denver` - Mountain Time (MST/MDT)
- `America/New_York` - Eastern Time (EST/EDT)
- `America/Chicago` - Central Time (CST/CDT)
- `America/Los_Angeles` - Pacific Time (PST/PDT)
- `America/Phoenix` - Arizona Time (MST - no daylight saving)

## Implementation Details

### Centralized Configuration

The timezone configuration is managed through `src/config/timezoneConfig.ts`:

```typescript
// Centralized timezone configuration
export const APP_TZ = process.env.APP_TZ || "America/Denver";

// Validate that the timezone is valid
export const validateTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

// Get the current timezone (with fallback validation)
export const getAppTimezone = (): string => {
  if (validateTimezone(APP_TZ)) {
    return APP_TZ;
  }

  console.warn(
    `Invalid timezone "${APP_TZ}" in environment variable APP_TZ. Falling back to "America/Denver".`
  );
  return "America/Denver";
};

// Export the validated timezone
export const APPLICATION_TIMEZONE = getAppTimezone();
```

### Files Updated

The following files have been updated to use the centralized timezone configuration:

1. **Service Files:**

   - `src/services/app/employeeService.ts`
   - `src/services/app/pickupService.ts`
   - `src/services/admin/taskService.ts`
   - `src/services/admin/adminUserService.ts`

2. **Validator Files:**

   - `src/validators/admin/taskRequestValidator.ts`
   - `src/validators/user/userRequestValidator.ts`

3. **Helper Files:**
   - `src/helpers/helperFunctions.ts`

## Usage Examples

### Changing Timezone

To change the application timezone, simply update the `APP_TZ` environment variable:

```bash
# For Eastern Time
APP_TZ=America/New_York

# For Pacific Time
APP_TZ=America/Los_Angeles

# For Central Time
APP_TZ=America/Chicago

# For Arizona Time (no daylight saving)
APP_TZ=America/Phoenix
```

### In Code

When you need to use the application timezone in your code, import it from the configuration:

```typescript
import { APPLICATION_TIMEZONE } from "../../config/timezoneConfig.js";

// Use the timezone
const now = dayjs().tz(APPLICATION_TIMEZONE);
```

### Direct Environment Access

For simple cases where you just need the timezone string:

```typescript
const appTz = process.env.APP_TZ || "America/Denver";
const now = dayjs().tz(appTz);
```

## Benefits

1. **Single Source of Truth**: All timezone references point to one configuration
2. **Easy Deployment**: Change timezone without code changes
3. **Environment-Specific**: Different timezones for different environments
4. **Validation**: Invalid timezones fall back to a safe default
5. **Consistency**: All date/time operations use the same timezone

## Migration Notes

### From America/New_York to America/Denver

The default timezone has been changed from Eastern Time to Mountain Time. This affects:

- **Date filtering**: All date-based queries now use Mountain Time
- **Scheduling**: New pickups and tasks are scheduled in Mountain Time
- **Reporting**: Dashboard statistics are calculated in Mountain Time
- **Notifications**: Time-based notifications use Mountain Time

### Backward Compatibility

- Existing data in the database remains unchanged
- The system gracefully handles the timezone transition
- All new operations use the configured timezone

## Testing

### Verify Timezone Configuration

You can test the timezone configuration by:

1. **Check Environment Variable:**

   ```bash
   echo $APP_TZ
   ```

2. **Test in Application:**

   ```typescript
   import { APPLICATION_TIMEZONE } from "./config/timezoneConfig.js";
   console.log("Application timezone:", APPLICATION_TIMEZONE);
   ```

3. **Validate Timezone:**
   ```typescript
   import { validateTimezone } from "./config/timezoneConfig.js";
   console.log("Is valid:", validateTimezone("America/Denver"));
   ```

## Troubleshooting

### Common Issues

1. **Invalid Timezone**: If you set an invalid timezone, the system will fall back to `America/Denver` and log a warning.

2. **Missing Environment Variable**: If `APP_TZ` is not set, the system defaults to `America/Denver`.

3. **Timezone Not Applied**: Make sure to restart your application after changing the environment variable.

### Debugging

To debug timezone issues:

1. Check the application logs for timezone warnings
2. Verify the environment variable is loaded correctly
3. Test date operations with the configured timezone
4. Use browser developer tools to check timezone in API responses

## Future Enhancements

Potential improvements for the timezone system:

1. **User-Specific Timezones**: Allow users to set their preferred timezone
2. **Automatic Detection**: Detect user timezone from browser/device
3. **Timezone Conversion**: Convert times between different timezones
4. **Daylight Saving Handling**: Better handling of DST transitions
5. **Timezone Validation**: More robust timezone validation and error handling
