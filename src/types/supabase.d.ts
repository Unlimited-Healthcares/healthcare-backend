declare module '@supabase/supabase-js' {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    [key: string]: unknown;
  }

  export interface StorageOptions {
    contentType?: string;
    upsert?: boolean;
    [key: string]: unknown;
  }

  export interface StorageResponse<T = unknown> {
    data: T;
    error: Error | null;
  }

  export interface PublicUrlResponse {
    publicUrl: string;
  }

  export interface StorageBucketApi {
    upload(path: string, file: Buffer | File, options?: StorageOptions): Promise<StorageResponse>;
    getPublicUrl(path: string): { data: PublicUrlResponse };
    remove(paths: string[]): Promise<StorageResponse>;
  }

  export interface StorageApi {
    from(bucket: string): StorageBucketApi;
  }

  export interface SupabaseClient {
    storage: StorageApi;
    [key: string]: unknown;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient;
} 