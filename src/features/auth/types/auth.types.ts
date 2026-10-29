export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthSuccessResponse {
  token: string;
  user: AuthUser;
}

export interface AuthErrorResponse {
  message: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}
