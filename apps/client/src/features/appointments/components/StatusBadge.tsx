import type { AppointmentStatus } from "@emr/shared";
import { Badge } from "../../../shared/components/ui/Badge";

export interface StatusBadgeProps {
	status: AppointmentStatus;
	size?: "sm" | "md";
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
	switch (status) {
		case "SCHEDULED":
			return (
				<Badge variant="info" size={size} dot>
					Scheduled
				</Badge>
			);
		case "ARRIVED":
			return (
				<Badge variant="warning" size={size} dot>
					Arrived
				</Badge>
			);
		case "COMPLETED":
			return (
				<Badge variant="success" size={size} dot>
					Completed
				</Badge>
			);
		case "CANCELLED":
			return (
				<Badge variant="danger" size={size} dot>
					Cancelled
				</Badge>
			);
		default:
			return (
				<Badge variant="default" size={size}>
					{status}
				</Badge>
			);
	}
}
