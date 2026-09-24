export interface CreateUserPayload {
  nombreCompleto: string;
  nombreUsuario: string;
  emailUsuario: string;
  rol: string;
}

export interface CreateUserResponse {
  id: string;
  rol: string;
  activo: boolean;
}
