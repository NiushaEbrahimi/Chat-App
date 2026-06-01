export type User = {
    readonly id : string;
    email : string;
    username : string;
}
export type AuthState = {
    user : User | null;
    token : string | null;
    isAuthenticated : boolean;
}