import { existsSync, readFileSync } from 'node:fs';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

type ServiceAccountInput = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

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

    const serviceAccount = this.loadServiceAccountFromPathOrJson();
    if (serviceAccount) {
      return initializeApp({
        credential: cert(serviceAccount),
      });
    }

    const serviceAccountFromLegacy = this.loadServiceAccountFromLegacyEnv();
    if (serviceAccountFromLegacy) {
      return initializeApp({
        credential: cert(serviceAccountFromLegacy),
      });
    }

    throw new UnauthorizedException(
      'Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_* env vars.',
    );
  }

  private loadServiceAccountFromPathOrJson(): FirebaseServiceAccount | null {
    const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH')?.trim();
    if (serviceAccountPath) {
      if (!existsSync(serviceAccountPath)) {
        this.logger.error(`FIREBASE_SERVICE_ACCOUNT_PATH does not exist: ${serviceAccountPath}`);
        throw new UnauthorizedException('Firebase service account file not found.');
      }

      this.logger.log(`Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT_PATH (${serviceAccountPath})`);
      const fileContent = readFileSync(serviceAccountPath, 'utf8');
      return this.parseServiceAccountJson(fileContent, 'FIREBASE_SERVICE_ACCOUNT_PATH');
    }

    const json = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim();
    if (json) {
      this.logger.log('Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT_JSON');
      return this.parseServiceAccountJson(json, 'FIREBASE_SERVICE_ACCOUNT_JSON');
    }

    return null;
  }

  private loadServiceAccountFromLegacyEnv(): FirebaseServiceAccount | null {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID')?.trim();
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL')?.trim();
    const privateKeyRaw = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKeyRaw?.trim()) {
      return null;
    }

    this.logger.log('Initializing Firebase Admin from FIREBASE_* env vars');
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    return { projectId, clientEmail, privateKey };
  }

  private parseServiceAccountJson(
    raw: string,
    source: 'FIREBASE_SERVICE_ACCOUNT_PATH' | 'FIREBASE_SERVICE_ACCOUNT_JSON',
  ): FirebaseServiceAccount {
    let parsed: ServiceAccountInput;
    try {
      parsed = JSON.parse(raw) as ServiceAccountInput;
    } catch (error) {
      this.logger.error(`Invalid JSON in ${source}: ${(error as Error).message}`);
      throw new UnauthorizedException(`Invalid JSON in ${source}.`);
    }

    const projectId = parsed.project_id?.trim();
    const clientEmail = parsed.client_email?.trim();
    const privateKey = parsed.private_key?.replace(/\\n/g, '\n').trim();

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error(`Missing required service account fields in ${source}`);
      throw new UnauthorizedException(`Firebase service account in ${source} is missing required fields.`);
    }

    return { projectId, clientEmail, privateKey };
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
