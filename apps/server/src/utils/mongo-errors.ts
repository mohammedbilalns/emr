import mongoose from "mongoose";

/**
 * Checks whether an error is a MongoDB unique constraint violation (code 11000),
 * optionally matching against a specific field key.
 */
export function isDuplicateKey(error: unknown, field?: string): boolean {
	return (
		error instanceof mongoose.mongo.MongoServerError &&
		error.code === 11000 &&
		(field === undefined || field in (error.keyValue ?? {}))
	);
}

/**
 * Checks whether an error indicates a transient MongoDB transaction write conflict.
 */
export function isWriteConflict(error: unknown): boolean {
	if (error instanceof mongoose.mongo.MongoServerError) {
		if (error.code === 112 || error.codeName === "WriteConflict") return true;
		if (
			typeof error.hasErrorLabel === "function" &&
			error.hasErrorLabel("TransientTransactionError")
		) {
			return true;
		}
	}
	return false;
}
