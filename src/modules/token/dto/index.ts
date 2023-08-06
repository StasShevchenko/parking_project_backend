export class RefreshTokenDto {
  refresh: string;
}

export class CompliteRefreshTokenDto {
  access: string;
}

export class TokenDataDto {
  email: string;

  id: string;

  is_staff: boolean;
}
