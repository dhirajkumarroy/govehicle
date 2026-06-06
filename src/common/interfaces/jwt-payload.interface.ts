export interface JwtPayload {
  userId: string;
  email: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
}
