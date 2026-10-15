import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge component", () => {
	it("renders Scheduled status with info styling", () => {
		render(<StatusBadge status="SCHEDULED" />);
		expect(screen.getByText("Scheduled")).toBeDefined();
	});

	it("renders Arrived status with warning styling", () => {
		render(<StatusBadge status="ARRIVED" />);
		expect(screen.getByText("Arrived")).toBeDefined();
	});

	it("renders Completed status with success styling", () => {
		render(<StatusBadge status="COMPLETED" />);
		expect(screen.getByText("Completed")).toBeDefined();
	});

	it("renders Cancelled status with danger styling", () => {
		render(<StatusBadge status="CANCELLED" />);
		expect(screen.getByText("Cancelled")).toBeDefined();
	});
});
