import type { PatientDto } from "@emr/shared";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "../../../shared/components/ui/Spinner";
import { useDebounce } from "../../../shared/hooks/use-debounce";
import { searchPatientsApi } from "../api/scheduler.api";

export interface PatientPickerProps {
	selectedPatient: PatientDto | null;
	onSelectPatient: (patient: PatientDto | null) => void;
	error?: string;
}

export function PatientPicker({
	selectedPatient,
	onSelectPatient,
	error,
}: PatientPickerProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [results, setResults] = useState<PatientDto[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const debouncedQuery = useDebounce(searchTerm, 300);

	useEffect(() => {
		let isMounted = true;

		async function performSearch() {
			if (!debouncedQuery.trim()) {
				setResults([]);
				setIsSearching(false);
				return;
			}

			setIsSearching(true);
			try {
				const patients = await searchPatientsApi(debouncedQuery);
				if (isMounted) {
					setResults(patients);
					setIsOpen(true);
				}
			} catch {
				if (isMounted) setResults([]);
			} finally {
				if (isMounted) setIsSearching(false);
			}
		}

		void performSearch();

		return () => {
			isMounted = false;
		};
	}, [debouncedQuery]);

	if (selectedPatient) {
		return (
			<div className="flex flex-col gap-1.5 w-full">
				<span className="text-xs font-semibold text-slate-700 tracking-wide">
					Selected Existing Patient
				</span>
				<div className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/50">
					<div className="flex items-center gap-3">
						<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white font-mono text-xs font-bold">
							{selectedPatient.patientCode.slice(-3)}
						</div>
						<div className="flex flex-col">
							<span className="text-xs font-bold text-slate-900">
								{selectedPatient.name}
							</span>
							<span className="text-[11px] text-slate-500 font-mono">
								ID: {selectedPatient.patientCode} · Mobile:{" "}
								{selectedPatient.mobile}
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={() => onSelectPatient(null)}
						className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
						title="Clear selection"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="relative flex flex-col gap-1.5 w-full">
			<label
				htmlFor="patient-search-input"
				className="text-xs font-semibold text-slate-700 tracking-wide"
			>
				Lookup Patient by Name, Mobile, or ID
			</label>

			<div className="relative">
				<div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
					<Search className="h-4 w-4" />
				</div>
				<input
					id="patient-search-input"
					type="text"
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
						if (!isOpen) setIsOpen(true);
					}}
					onFocus={() => {
						if (results.length > 0) setIsOpen(true);
					}}
					placeholder="Type patient name, phone (987...), or ID (P000...)"
					className={`w-full rounded-lg border bg-white pl-9 pr-9 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${
						error ? "border-rose-400" : "border-slate-300"
					}`}
				/>
				{isSearching && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						<Spinner size="xs" className="text-teal-700" />
					</div>
				)}
			</div>

			{error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

			{/* Search Results Dropdown */}
			{isOpen && debouncedQuery.trim() && (
				<div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
					{results.length === 0 && !isSearching ? (
						<div className="p-4 text-center text-xs text-slate-500">
							No registered patients found matching "{debouncedQuery}". You can
							switch to "New Patient" above to register immediately.
						</div>
					) : (
						<ul className="divide-y divide-slate-100 py-1">
							{results.map((patient) => (
								<li key={patient.id}>
									<button
										type="button"
										onClick={() => {
											onSelectPatient(patient);
											setIsOpen(false);
											setSearchTerm("");
										}}
										className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
									>
										<div className="flex items-center gap-2.5">
											<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
												{patient.patientCode.slice(-3)}
											</div>
											<div className="flex flex-col">
												<span className="text-xs font-semibold text-slate-900">
													{patient.name}
												</span>
												<span className="text-[11px] text-slate-500 font-mono">
													{patient.patientCode} · {patient.mobile}
												</span>
											</div>
										</div>
										<span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
											Select
										</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
