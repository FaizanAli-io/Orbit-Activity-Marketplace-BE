export class SignupDto {
  name: string;
  email: string;
  password: string;
  type: 'user' | 'vendor';
}

export class LoginDto {
  email: string;
  password: string;
}
