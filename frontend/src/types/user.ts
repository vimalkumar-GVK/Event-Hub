export type Role = 'super_admin' | 'admin' | 'sub_admin' | 'student';

export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  website?: string;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  institution_id?: string;
  institution?: Institution;
  phone_number?: string;
  hide_phone?: boolean;
  profile_photo?: string;
  department?: string;
  designation?: string;
  student_id?: string;
  year_of_study?: string;
  is_verified: boolean;
  verification_note?: string;
  is_active: boolean;
  theme: string;
  last_login?: string;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  institution_id: string;
  phone_number: string;
  student_id: string;
  department: string;
  year_of_study: string;
  profile_photo?: string;
}
