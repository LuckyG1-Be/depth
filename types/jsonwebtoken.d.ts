// types/jsonwebtoken.d.ts
// Fallback typings if @types/jsonwebtoken is missing.
// Prefer installing: npm i -D @types/jsonwebtoken

declare module "jsonwebtoken" {
    export interface JwtPayload {
      [key: string]: any;
    }
  
    export interface SignOptions {
      expiresIn?: string | number;
      audience?: string | string[];
      issuer?: string;
      subject?: string;
      algorithm?: string;
      keyid?: string;
      jwtid?: string;
      noTimestamp?: boolean;
      header?: any;
      encoding?: string;
      mutatePayload?: boolean;
      allowInsecureKeySizes?: boolean;
      allowInvalidAsymmetricKeyTypes?: boolean;
    }
  
    export interface VerifyOptions {
      audience?: string | string[];
      issuer?: string | string[];
      subject?: string;
      algorithms?: string[];
      clockTolerance?: number;
      ignoreExpiration?: boolean;
      ignoreNotBefore?: boolean;
      jwtid?: string;
      clockTimestamp?: number;
      nonce?: string;
      maxAge?: string | number;
      allowInvalidAsymmetricKeyTypes?: boolean;
    }
  
    export type Secret =
      | string
      | Buffer
      | { key: string | Buffer; passphrase: string }
      | undefined;
  
    export function sign(
      payload: string | object | Buffer,
      secretOrPrivateKey: Secret,
      options?: SignOptions
    ): string;
  
    export function verify(
      token: string,
      secretOrPublicKey: Secret,
      options?: VerifyOptions
    ): string | JwtPayload;
  
    export function decode(
      token: string,
      options?: { json?: boolean; complete?: boolean }
    ): null | string | JwtPayload | { header: any; payload: any; signature: string };
  }
  