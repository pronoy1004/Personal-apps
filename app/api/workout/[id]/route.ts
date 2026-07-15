import { NextResponse } from "next/server";
import { getLoggerWorkout } from "@/lib/fitness/workout-query";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const workout = await getLoggerWorkout(id);
  if (!workout) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(workout);
}
