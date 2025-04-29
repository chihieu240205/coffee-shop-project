// services/auth.ts
import api from "./api";

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
}

export interface EmployeeUser {
  ssn: string;
  name: string;
  email: string;
  salary: number;
}

export interface EmployeeSignupResponse {
  access_token: string;
  token_type: "bearer";
  user: EmployeeUser;
}

// this payload now only contains the three fields your backend /signup actually wants
export type EmployeeSignupPayload = {
  name: string;
  email: string;
  password: string;
};

/**
 * Public employee signup → POST /signup
 */
export async function signupEmployee(
  payload: EmployeeSignupPayload
): Promise<EmployeeSignupResponse> {
  const { data } = await api.post<EmployeeSignupResponse>(
    "/signup",
    payload
  );
  return data;
}

/**
 * Employee login → POST /token
 */
export async function loginEmployee(
  email: string,
  password: string
): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const { data } = await api.post<TokenResponse>(
    "/token",
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data;
}
