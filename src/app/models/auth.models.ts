export interface loginDTO{
  identifier:string,
  password:string
}

export type Role =
  | 'ROLE_ADMIN'
  | 'ROLE_STAFF'
  | 'ROLE_EMPLOYEE';

export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  identifier: string;
  roles: Role[];
  mustChangePassword: boolean;
}

export interface AuthSession {
  identifier: string;
  roles: Role[];
  mustChangePassword: boolean;
}