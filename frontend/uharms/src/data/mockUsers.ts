export type UserRole = 'doctor' | 'patient'

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  doctorId?: string;
}

export const mockUsers: User[] = [
  {
    id: 'd1',
    name: 'Alice',
    email: 'alice@uzima.com',
    password: 'alice@123',
    role: 'doctor',
    doctorId: 'd1',
  },
  {
    id: 'd2',
    name: 'John',
    email: 'john@uzima.com',
    password: 'john@123',
    role: 'doctor',
    doctorId: 'd2',
  },
  {
    id: 'p1',
    name: 'Jane',
    email: 'jane@uzima.com',
    password: 'jane@123',
    role: 'patient'
  },
  {
    id: 'p2',
    name: 'Mike',
    email: 'mike@uzima.com',
    password: 'mike@123',
    role: 'patient'
  }
];