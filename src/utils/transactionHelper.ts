import mongoose from "mongoose";

function isMongoError(error: unknown): error is mongoose.mongo.MongoError {
  return (
    typeof error === "object" &&
    error !== null &&
    "hasErrorLabel" in error &&
    typeof (error as mongoose.mongo.MongoError).hasErrorLabel === "function"
  );
}

export const runInTransaction = async <T>(
  callback: (session: mongoose.ClientSession) => Promise<T>,
  retries: number = 3
): Promise<T> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let attempts = 0;

  while (attempts < retries) {
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      if (
        isMongoError(error) &&
        error.hasErrorLabel("TransientTransactionError")
      ) {
        attempts += 1;
        console.log(`Retrying transaction, attempt #${attempts}`);
        await session.abortTransaction();
        if (attempts >= retries) {
          throw new Error(`Transaction failed after ${retries} attempts`);
        }
      } else {
        await session.abortTransaction();
        throw error;
      }
    } finally {
      session.endSession();
    }
  }

  throw new Error("Transaction failed after all retry attempts.");
};
