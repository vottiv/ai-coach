export interface BodyMeasurement {
  id: number;
  measured_at: string;
  weight: number | null;
  bicep: number | null;
  shoulders: number | null;
  chest: number | null;
  waist: number | null;
  glutes: number | null;
  hips: number | null;
  calves: number | null;
  notes: string | null;
}

export interface MeasurementIn {
  measured_at: string;
  weight?: number | null;
  bicep?: number | null;
  shoulders?: number | null;
  chest?: number | null;
  waist?: number | null;
  glutes?: number | null;
  hips?: number | null;
  calves?: number | null;
  notes?: string | null;
}
