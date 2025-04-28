// services/auth.ts
import api from "./api";

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}

// Customer routes
export interface CustomerRead { id: number; name: string; email: string }

export type CustomerSignupPayload = { name: string; email: string; password: string };

export async function signupCustomer(payload: CustomerSignupPayload): Promise<CustomerRead> {
  const { data } = await api.post<CustomerRead>("/customers/signup", payload);
  return data;
}

export async function loginCustomer(username: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  const { data } = await api.post<TokenResponse>("/customers/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return data;
}

// Employee routes
export type EmployeeSignupPayload = {
  ssn: string;
  name: string;
  email: string;
  salary: number;
  password: string;
};

export interface EmployeeSignupResponse {
  access_token: string;
  token_type: "bearer";
  user: { ssn: string; name: string; email: string; salary: number };
}

export async function signupEmployee(
  payload: EmployeeSignupPayload
): Promise<EmployeeSignupResponse> {
  const { data } = await api.post<EmployeeSignupResponse>("/signup", payload);
  return data;
}

export async function loginEmployee(
  username: string,
  password: string
): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);
  const { data } = await api.post<TokenResponse>("/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  return data;
}

