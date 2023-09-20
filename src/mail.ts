import nodemailer from "nodemailer";
export class BunsterMail {
  static async sendMail(params: {
    email: string | string[];
    subject: string;
    htmlContent: string;
  }) {
    const transporter = nodemailer.createTransport({
      host: Bun.env.SMTP_HOST,
      port: Number(Bun.env.SMTP_PORT),
      secure: Bun.env.SMTP_SECURE === "true",
      auth: {
        user: Bun.env.SMTP_USERNAME,
        pass: Bun.env.SMTP_PASSWORD,
      },
    });

    return await transporter.sendMail({
      from: process.env.SMTP_DISPLAY_NAME,
      to: params.email,
      subject: params.subject,
      html: params.htmlContent,
    });
  }
}
