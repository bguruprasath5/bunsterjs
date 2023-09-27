import * as jose from "jose";
export class BunsterJwt {
  static async sign(
    payload: any,
    expiresIn: string | number,
    alg: string = "HS512"
  ) {
    const encodedSecret = new TextEncoder().encode(Bun.env.JWT_SECRET);
    return await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(encodedSecret);
  }

  static async verify<T extends object>(token: string): Promise<T> {
    const encodedSecret = new TextEncoder().encode(Bun.env.JWT_SECRET);
    const result = await jose.jwtVerify(token, encodedSecret);
    return result.payload as T;
  }
}
