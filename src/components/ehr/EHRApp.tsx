
"use client";
import { useState } from 'react';
import { usePatientData } from '@/hooks/use-patient-data';
import { PatientDetail } from './PatientDetail';
import { Header } from '../notasmed/Header';
import { AddPatientDialog } from './AddPatientDialog';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Patient, Appointment, Vital, Medication, Procedure, Clinic } from '@/types/ehr';
import { Button } from '../ui/button';
import { Plus, Home } from 'lucide-react';
import { PlanGate } from '../notasmed/PlanGate';
import { PatientCombobox } from './PatientCombobox';
import { Skeleton } from '../ui/skeleton';
import { AddClinicDialog } from './AddClinicDialog';
import { useToast } from '@/hooks/use-toast';

export function EHRApp() {
    const { patients, addPatient, updatePatient, addNoteToPatient, updatePatientAppointments, updatePatientVitals, updatePatientMedications, updatePatientProcedures, loading } = usePatientData();
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [fontSize] = useLocalStorage('notasmed-fontSize', 16);
    const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
    const [isAddClinicDialogOpen, setIsAddClinicDialogOpen] = useState(false);
    const { toast } = useToast();
    
    const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

    // Set initial patient selection once data loads
    useState(() => {
        if (!loading && patients.length > 0 && !selectedPatientId) {
            setSelectedPatientId(patients[0].id);
        }
    });

    const handleAddPatient = async (patient: Omit<Patient, 'id' | 'vitals' | 'medications' | 'appointments' | 'procedures' | 'notes'>) => {
        const newPatientData: Omit<Patient, 'id'> = {
            ...patient,
            vitals: [],
            medications: [],
            appointments: [],
            procedures: [],
            notes: []
        };
        const newPatient = await addPatient(newPatientData);
        setSelectedPatientId(newPatient.id);
        setIsAddPatientDialogOpen(false);
    };

    const handleAddClinic = async (clinicData: Omit<Clinic, 'id'>) => {
        try {
            const response = await fetch('/api/clinics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clinicData),
            });

            if (!response.ok) {
                const { message } = await response.json();
                throw new Error(message || 'Failed to add clinic');
            }

            const newClinic = await response.json();

            toast({
                title: 'Clínica Agregada',
                description: `La clínica "${newClinic.name}" ha sido creada exitosamente.`,
            });
            setIsAddClinicDialogOpen(false);
        } catch (error) {
            const e = error as Error;
            toast({
                variant: 'destructive',
                title: 'Error al Agregar Clínica',
                description: e.message,
            });
        }
    };

    const handleUpdateAppointments = (patientId: string, appointments: Appointment[]) => {
        updatePatientAppointments(patientId, appointments);
    };
    
    const handleUpdateVitals = (patientId: string, vitals: Vital[]) => {
        updatePatientVitals(patientId, vitals);
    };

    const handleUpdateMedications = (patientId: string, medications: Medication[]) => {
        updatePatientMedications(patientId, medications);
    }

    const handleUpdateProcedures = (patientId: string, procedures: Procedure[]) => {
        updatePatientProcedures(patientId, procedures);
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
            <Header />
            <main
                className="flex-1 container mx-auto p-4 sm:p-6 md:p-8"
                style={{ fontSize: `${fontSize}px` }}
            >
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-2">Seleccionar Paciente</h2>
                             <div className="w-full md:w-[300px]">
                                {loading ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <PatientCombobox
                                        patients={patients}
                                        selectedPatientId={selectedPatientId}
                                        onSelectPatient={setSelectedPatientId}
                                    />
                                )}
                             </div>
                        </div>
                         <div className="flex gap-2">
                             <PlanGate allowedPlans={['Admin']}>
                                 <AddClinicDialog
                                    open={isAddClinicDialogOpen}
                                    onOpenChange={setIsAddClinicDialogOpen}
                                    onSave={handleAddClinic}
                                >
                                    <Button size="sm" variant="outline">
                                        <Home className="h-4 w-4 mr-2" />
                                        Agregar Clínica
                                    </Button>
                                </AddClinicDialog>
                            </PlanGate>
                            <AddPatientDialog
                                open={isAddPatientDialogOpen}
                                onOpenChange={setIsAddPatientDialogOpen}
                                onSave={handleAddPatient}
                            >
                                <Button size="sm" variant="outline" className="w-full md:w-auto">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Paciente
                                </Button>
                            </AddPatientDialog>
                        </div>
                    </div>
                    
                    <div>
                        {loading ? (
                             <Skeleton className="h-[600px] w-full" />
                        ) : selectedPatient ? (
                            <PatientDetail
                                key={selectedPatient.id} // Add key to force re-render on patient change
                                patient={selectedPatient}
                                onUpdatePatient={updatePatient}
                                onAddNote={addNoteToPatient}
                                onUpdateAppointments={handleUpdateAppointments}
                                onUpdateVitals={handleUpdateVitals}
                                onUpdateMedications={handleUpdateMedications}
                                onUpdateProcedures={handleUpdateProcedures}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                                Seleccione un paciente para ver sus detalles o agregue un nuevo paciente.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
