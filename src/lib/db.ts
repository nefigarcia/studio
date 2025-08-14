
import mysql from 'mysql2/promise';
import { Patient, User, PatientNote, Appointment, Vital, Medication, Procedure, Clinic, Plan, Demographics } from '@/types/ehr';
import bcrypt from 'bcryptjs';
//import { v4 as uuidv4 } from 'uuid';

const dbConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);
const { v4: uuidv4 } = await import('uuid');
// Utility to get a connection
const getConnection = () => pool.getConnection();


// This function will format the date to YYYY-MM-DD
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
}


// This object will now contain methods that interact with the MySQL database
export const db = {
    // --- User operations ---
    getAllUsers: async (): Promise<Omit<User, 'password'>[]> => {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute('SELECT id, username, plan, clinicName FROM users');
            return rows as Omit<User, 'password'>[];
        } finally {
            connection.release();
        }
    },
    findUser: async (username: string): Promise<User | null> => {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
            const users = rows as User[];
            return users.length > 0 ? users[0] : null;
        } finally {
            connection.release();
        }
    },
    createUser: async (userData: Omit<User, 'id'>): Promise<Omit<User, 'password'>> => {
        const connection = await getConnection();
        try {
            const existingUser = await db.findUser(userData.username);
            if (existingUser) {
                throw new Error('Username already exists');
            }
            const hashedPassword = await bcrypt.hash(userData.password!, 10);
            const newUserId = uuidv4();
            const newUser: User = {
                id: newUserId,
                username: userData.username,
                password: hashedPassword,
                plan: userData.plan,
                clinicName: userData.clinicName,
            };

            await connection.execute(
                'INSERT INTO users (id, username, password, plan, clinic_name) VALUES (?, ?, ?, ?, ?)',
                [newUser.id, newUser.username, newUser.password, newUser.plan, newUser.clinicName]
            );

            const { password, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } finally {
            connection.release();
        }
    },
    // --- Patient operations ---
    getAllPatients: async (): Promise<Patient[]> => {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM patients');
            const patients = (rows as any[]).map(p => {
                const { dob, ...rest } = p;
                return {
                    ...rest,
                    demographics: {
                        dob: formatDate(new Date(dob)),
                        gender: p.gender,
                        address: p.address,
                        phone: p.phone,
                        email: p.email,
                    },
                    vitals: [], 
                    medications: [], 
                    appointments: [], 
                    procedures: [], 
                    notes: []
                }
            })
            return patients;
        } finally {
            connection.release();
        }
    },
    getPatient: async (id: string): Promise<Patient | null> => {
        const connection = await getConnection();
        try {
            const [patientRows] = await connection.execute('SELECT * FROM patients WHERE id = ?', [id]);
            const patients = patientRows as any[];
            if (patients.length === 0) return null;

            const patientData = patients[0];

            const { dob, gender, address, phone, email, ...patientInfo } = patientData;
            
            const demographics: Demographics = {
                dob: formatDate(new Date(dob)),
                gender,
                address,
                phone,
                email
            };

            const patient: Patient = {
                ...patientInfo,
                demographics,
                vitals: [],
                medications: [],
                appointments: [],
                procedures: [],
                notes: []
            };

            // Fetch related data
            const [vitals] = await connection.execute('SELECT * FROM vitals WHERE patient_id = ?', [id]);
            const [medications] = await connection.execute('SELECT * FROM medications WHERE patient_id = ?', [id]);
            const [appointments] = await connection.execute('SELECT * FROM appointments WHERE patient_id = ?', [id]);
            const [procedures] = await connection.execute('SELECT * FROM procedures WHERE patient_id = ?', [id]);
            const [notes] = await connection.execute('SELECT * FROM patient_notes WHERE patient_id = ?', [id]);
            
            patient.vitals = vitals as Vital[];
            patient.medications = medications as Medication[];
            patient.appointments = appointments as Appointment[];
            patient.procedures = procedures as Procedure[];
            patient.notes = notes as PatientNote[];

            return patient;

        } finally {
            connection.release();
        }
    },
    addPatient: async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
        const connection = await getConnection();
        const patientId = uuidv4();
        try {
            const { name, demographics } = patientData;
            const newId = uuidv4();
            await connection.execute(
                'INSERT INTO patients (id, name, dob, gender, address, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [newId, name, demographics.dob, demographics.gender, demographics.address, demographics.phone, demographics.email]
            );
            return { ...patientData, id: newId };
        } finally {
            connection.release();
        }
    },
    // ... other methods will be implemented directly in API routes
    // --- Clinic operations ---
    getAllClinics: async (): Promise<Clinic[]> => {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM clinics');
            return rows as Clinic[];
        } finally {
            connection.release();
        }
    },
    findClinicByName: async (name: string): Promise<Clinic | null> => {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM clinics WHERE name = ?', [name]);
            const clinics = rows as Clinic[];
            return clinics.length > 0 ? clinics[0] : null;
        } finally {
            connection.release();
        }
    },
    createClinic: async (clinicData: Omit<Clinic, 'id'>): Promise<Clinic> => {
        const connection = await getConnection();
        try {
            const { name, address, phone } = clinicData;
             if (await db.findClinicByName(name)) {
                throw new Error('Clinic with that name already exists');
            }
            const newId = uuidv4();
            await connection.execute(
                'INSERT INTO clinics (id, name, address, phone) VALUES (?, ?, ?, ?)',
                [newId, name, address, phone]
            );
            return { ...clinicData, id: newId };
        } finally {
            connection.release();
        }
    }
};
