

export type Plan = 'Free' | 'Clinica' | 'Hospital' | 'Medico' | 'Admin';

export interface User {
  id: string;
  username: string;
  password: string; // Keep optional for security, shouldn't be sent to client
  plan: Plan;
  clinicName?: string;
}

export interface Clinic {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export interface PatientNote {
    id: string;
    patient_id: string;
    date: string;
    provider: string;
    transcription: string;
    summary: string;
}

export interface Vital {
    id: string;
    patient_id: string;
    date: string;
    hr: number;
    bp: string;
    temp: number;
    rr: number;
    provider: string;
}

export interface Medication {
    id: string;
    patient_id: string;
    name: string;
    dosage: string;
    frequency: string;
    prescribedDate: string;
    prescribingProvider: string;
}

export interface Appointment {
    id: string;
    patient_id: string;
    date: string;
    time: string;
    reason: string;
    status: 'Programada' | 'Completada' | 'Cancelada';
    visitProvider: string;
    billingProvider: string;
}

export interface Procedure {
    id: string;
    patient_id: string;
    date: string;
    name: string;
    notes: string;
    performingProvider: string;
}

export interface Demographics {
    dob: string;
    gender: 'Masculino' | 'Femenino' | 'Otro';
    address: string;
    phone: string;
    email: string;
}

export interface Patient {
    id: string;
    name: string;
    demographics: Demographics;
    vitals: Vital[];
    medications: Medication[];
    appointments: Appointment[];
    procedures: Procedure[];
    notes: PatientNote[];
}
