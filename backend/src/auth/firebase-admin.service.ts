import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    if (!token) {
      throw new UnauthorizedException('Missing Firebase token');
    }

    const allowMock = (this.configService.get<string>('AUTH_MOCK_ENABLED') ?? 'true') === 'true';
    if (allowMock && token.startsWith('dev-')) {
      return this.mockToken(token);
    }

    const auth = this.getFirebaseAuth();
    return auth.verifyIdToken(token, true);
  }

  private getFirebaseAuth() {
    if (!this.app) {
      this.app = this.bootstrapFirebase();
    }

    return getAuth(this.app);
  }

  private bootstrapFirebase(): App {
    if (getApps().length > 0) {
      return getApps()[0]!;
    }

    const json = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (json) {
      this.logger.log('Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT_JSON');
      const parsed = JSON.parse(json) as {
        project_id: string;
        client_email: string;
        private_key: string;
      };
      return initializeApp({
        credential: cert({
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key,
        }),
      });
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKeyRaw) {
      throw new UnauthorizedException(
        'Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_* env vars.',
      );
    }

    this.logger.log('Initializing Firebase Admin from FIREBASE_* env vars');
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  private mockToken(token: string): DecodedIdToken {
    const [prefix, emailPart] = token.split(':');
    const role = prefix === 'dev-manager' ? 'manager' : 'customer';
    const email = emailPart && emailPart.includes('@') ? emailPart : `${role}@pethub.local`;

    return {
      aud: 'pethub-dev',
      auth_time: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'https://securetoken.google.com/pethub-dev',
      sub: `${role}-uid`,
      uid: `${role}-uid`,
      email,
      email_verified: true,
      firebase: {
        identities: { email: [email] },
        sign_in_provider: 'custom',
      },
      role,
    } as DecodedIdToken;
  }
}
