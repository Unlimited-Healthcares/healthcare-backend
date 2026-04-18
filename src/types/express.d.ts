// Add this file to provide type definitions for Express.Multer.File

import { User } from '../users/entities/user.entity';
import { JwtUser } from './request.types';

// Multer file interface
interface MulterFile {
  /** Name of the form field associated with this file. */
  fieldname: string;
  /** Name of the file on the uploader's computer. */
  originalname: string;
  /** Value of the `Content-Type` header for this file. */
  mimetype: string;
  /** Size of the file in bytes. */
  size: number;
  /** `DiskStorage` only: Name of this file within the `destination` directory. */
  filename?: string;
  /** `DiskStorage` only: Absolute path to this file. */
  path?: string;
  /** `MemoryStorage` only: A Buffer containing the entire file. */
  buffer?: Buffer;
  /** A Buffer containing the entire file. */
  buffer: Buffer;
  /** Destination path where the file is stored. */
  destination?: string;
  /** Encoding of the file. */
  encoding?: string;
}

declare global {
  namespace Express {
    namespace Multer {
      // Extend the base Multer.File interface with our custom properties
      interface File extends MulterFile {
        /** Custom metadata for healthcare files */
        metadata?: Record<string, string | number | boolean>;
      }
    }

    interface Request {
      user?: User | JwtUser;
      /** Request ID for tracking */
      requestId?: string;
      /** Client IP address */
      clientIp?: string;
    }
  }
}

export { MulterFile }; 