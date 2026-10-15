import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { isDuplicateKey, isWriteConflict } from "./mongo-errors";

describe("mongo-errors utility", () => {
	it("detects duplicate key error code 11000", () => {
		const err = new mongoose.mongo.MongoServerError({
			message: "E11000 duplicate key",
		});
		err.code = 11000;
		err.keyValue = { startTime: "09:00" };

		expect(isDuplicateKey(err)).toBe(true);
		expect(isDuplicateKey(err, "startTime")).toBe(true);
		expect(isDuplicateKey(err, "mobile")).toBe(false);
	});

	it("returns false for non-duplicate-key errors", () => {
		expect(isDuplicateKey(new Error("Generic"))).toBe(false);
	});

	it("detects write conflicts by code, codeName, or error label", () => {
		const err1 = new mongoose.mongo.MongoServerError({ message: "conflict" });
		err1.code = 112;
		expect(isWriteConflict(err1)).toBe(true);

		const err2 = new mongoose.mongo.MongoServerError({ message: "conflict" });
		err2.codeName = "WriteConflict";
		expect(isWriteConflict(err2)).toBe(true);

		const err3 = new mongoose.mongo.MongoServerError({ message: "transient" });
		err3.addErrorLabel("TransientTransactionError");
		expect(isWriteConflict(err3)).toBe(true);

		expect(isWriteConflict(new Error("regular"))).toBe(false);
	});
});
