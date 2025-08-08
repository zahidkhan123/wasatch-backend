import mongoose from "mongoose";

const isMongoErrorWithKeyValue = (
  error: unknown
): error is mongoose.mongo.MongoError & {
  keyValue: Record<string, unknown>;
} => {
  return (
    typeof error === "object" &&
    error !== null &&
    "keyValue" in error &&
    typeof (error as any).keyValue === "object"
  );
};
export { isMongoErrorWithKeyValue };
