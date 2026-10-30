export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginValidationError {
  email?: string;
  password?: string;
}
