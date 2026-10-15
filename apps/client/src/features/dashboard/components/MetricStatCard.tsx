import type { ReactNode } from "react";
import { Badge } from "../../../shared/components/ui/Badge";
import { Card, CardContent } from "../../../shared/components/ui/Card";

export interface MetricStatCardProps {
	title: string;
	value: string | number;
	icon: ReactNode;
	description?: string;
	badgeText?: string;
	badgeVariant?: "default" | "success" | "warning" | "info" | "purple";
	iconBg?: string;
}

export function MetricStatCard({
	title,
	value,
	icon,
	description,
	badgeText,
	badgeVariant = "default",
	iconBg = "bg-teal-50 text-teal-700",
}: MetricStatCardProps) {
	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardContent className="p-5 flex items-start justify-between">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
							{title}
						</span>
						{badgeText && (
							<Badge variant={badgeVariant} size="sm">
								{badgeText}
							</Badge>
						)}
					</div>
					<span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
						{value}
					</span>
					{description && (
						<span className="text-xs text-slate-500 mt-1">{description}</span>
					)}
				</div>

				<div
					className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${iconBg}`}
				>
					{icon}
				</div>
			</CardContent>
		</Card>
	);
}
