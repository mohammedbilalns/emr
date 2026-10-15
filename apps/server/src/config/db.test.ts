import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";
import { getDatabaseHealth } from "./db";

describe("getDatabaseHealth", () => {
	it("reports disconnected when mongoose readyState is 0", async () => {
		const originalReadyState = mongoose.connection.readyState;
		Object.defineProperty(mongoose.connection, "readyState", {
			value: 0,
			configurable: true,
		});

		const health = await getDatabaseHealth();
		expect(health.healthy).toBe(false);
		expect(health.status).toBe("disconnected");

		Object.defineProperty(mongoose.connection, "readyState", {
			value: originalReadyState,
			configurable: true,
		});
	});

	it("reports connected and measures latency when readyState is 1", async () => {
		const originalReadyState = mongoose.connection.readyState;
		const originalDb = mongoose.connection.db;

		Object.defineProperty(mongoose.connection, "readyState", {
			value: 1,
			configurable: true,
		});
		Object.defineProperty(mongoose.connection, "db", {
			value: {
				admin: () => ({
					ping: vi.fn().mockResolvedValue({ ok: 1 }),
				}),
			},
			configurable: true,
		});

		const health = await getDatabaseHealth();
		expect(health.healthy).toBe(true);
		expect(health.status).toBe("connected");
		expect(typeof health.latencyMs).toBe("number");

		Object.defineProperty(mongoose.connection, "readyState", {
			value: originalReadyState,
			configurable: true,
		});
		Object.defineProperty(mongoose.connection, "db", {
			value: originalDb,
			configurable: true,
		});
	});
});
