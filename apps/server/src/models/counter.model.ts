import mongoose, { type HydratedDocument, Schema } from "mongoose";

interface ICounter {
	_id: string; // e.g. "patient"
	seq: number;
}

const counterSchema = new Schema<ICounter>({
	_id: { type: String, required: true },
	seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model<ICounter>("Counter", counterSchema);
export type CounterDocument = HydratedDocument<ICounter>;
