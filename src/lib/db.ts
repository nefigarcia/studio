
import mysql from 'mysql2/promise';
import { Patient, User, PatientNote, Appointment, Vital, Medication, Procedure, Clinic, Plan } from '@/types/ehr';
import bcrypt from 'bcryptjs';
import { use } from 'react';

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
            const plain = userData.password;
const hash = await bcrypt.hash(plain, 10);
const match = await bcrypt.compare(plain, hash);
console.log('Should be true:', match);
            const userId = uuidv4();
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            console.log('Hash before insert:', hashedPassword);
            const newUser: Omit<User, 'password'> & { password: string } = {
                id: userId,
                username: userData.username,
                password: hashedPassword,
                plan: userData.plan,
                clinicName: userData.clinicName,
            };

            const [result] = await connection.execute(
                'INSERT INTO users (id,username, password, plan, clinic_name) VALUES (?,?, ?, ?, ?)',
                [newUser.id,newUser.username, newUser.password, newUser.plan, newUser.clinicName]
            );
            const insertResult = result as mysql.ResultSetHeader;
            const insertedId = String(insertResult.insertId);

            return { id: insertedId, ...userData };
        } finally {
            connection.release();
        }
    },
    // --- Patient operations ---
    getAllPatients: async (): Promise<Patient[]> => {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute('SELECT * FROM patients');
            const patients = rows as Patient[];
            // In a real app, you'd fetch related data (vitals, notes, etc.) here
            // For now, returning patients with empty arrays for simplicity
            return patients.map(p => ({ ...p, vitals: [], medications: [], appointments: [], procedures: [], notes: [] }));
        } finally {
            connection.release();
        }
    },
    getPatient: async (id: string): Promise<Patient | null> => {
        const connection = await getConnection();
        try {
            const [patientRows] = await connection.execute('SELECT * FROM patients WHERE id = ?', [id]);
            const patients = patientRows as Patient[];
            if (patients.length === 0) return null;

            const patient = patients[0];
            // Fetch related data
            const [vitals] = await connection.execute('SELECT * FROM vitals WHERE patient_id = ?', [id]);
            const [medications] = await connection.execute('SELECT * FROM medications WHERE patient_id = ?', [id]);
            const [appointments] = await connection.execute('SELECT * FROM appointments WHERE patient_id = ?', [id]);
            const [procedures] = await connection.execute('SELECT * FROM procedures WHERE patient_id = ?', [id]);
            const [notes] = await connection.execute('SELECT * FROM patient_notes WHERE patient_id = ?', [id]);
            
            return {
                ...patient,
                vitals: vitals as Vital[],
                medications: medications as Medication[],
                appointments: appointments as Appointment[],
                procedures: procedures as Procedure[],
                notes: notes as PatientNote[]
            };

        } finally {
            connection.release();
        }
    },
    addPatient: async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
        const connection = await getConnection();
        try {
            const { name, demographics } = patientData;
            const [result] = await connection.execute(
                'INSERT INTO patients (name, dob, gender, address, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
                [name, demographics.dob, demographics.gender, demographics.address, demographics.phone, demographics.email]
            );
            const insertResult = result as mysql.ResultSetHeader;
            const newId = String(insertResult.insertId);
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
            const [result] = await connection.execute(
                'INSERT INTO clinics (name, address, phone) VALUES (?, ?, ?)',
                [name, address, phone]
            );
            const insertResult = result as mysql.ResultSetHeader;
            const newId = String(insertResult.insertId);
            return { ...clinicData, id: newId };
        } finally {
            connection.release();
        }
    }
};
