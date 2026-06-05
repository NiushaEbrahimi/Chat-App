export interface User {
    readonly id : string;
    email : string;
    username : string;
}
export interface AuthState{
    user : User | null;
    token : string | null;
    isAuthenticated : boolean;
    refreshToken : string | null;
    rateLimitUntil : number | null; 
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password2: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}