export interface Verify2FARequest {
  code: string;
}

export interface Verify2FAResponse {
  success: boolean;
  message?: string;
}

export const twoFactorService = {
  async verifyCode(data: Verify2FARequest): Promise<Verify2FAResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (data.code === '123456') {
          resolve({ success: true, message: 'Código verificado correctamente' });
        } else {
          resolve({ success: false, message: 'Código inválido o expirado' });
        }
      }, 1000);
    });
  },

  async resendCode(): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1000);
    });
  },
};