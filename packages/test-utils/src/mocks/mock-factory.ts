import { type Mock, mock } from 'bun:test';
import type { ExecutionContext } from '@nestjs/common';

// 🛡️ Zero-Any: Define minimal interfaces locally to break cyclic dependencies
// (Avoiding imports from @apex/audit, @apex/export, @apex/middleware)
import type { Request, Response } from 'express';

export interface AuditService {
  log(entry: unknown): Promise<void>;
  initializeS4(): Promise<void>;
}

export interface ConfigService {
  get(key: string): string | undefined;
  getWithDefault<T>(key: string, defaultValue: T): T;
  getOrThrow(key: string): string;
}

export interface BunShell {
  spawn(...args: unknown[]): {
    exited: Promise<number>;
    exitCode: number;
    stdout: { text(): Promise<string> };
    stderr: { text(): Promise<string> };
  };
  write(path: string, data: unknown): Promise<void>;
  file(path: string): {
    arrayBuffer(): Promise<ArrayBuffer>;
    stat(): Promise<{ size: number }>;
  };
}

export interface ExportService {
  export(options: unknown): Promise<{ id: string }>;
  createExportJob(options: unknown): Promise<{ id: string }>;
  getJobStatus(jobId: string): Promise<unknown>;
  listTenantExports(tenantId: string): Promise<unknown[]>;
  cancelJob(jobId: string): Promise<void>;
}

export interface ExportWorker {
  process(job: unknown): Promise<void>;
  confirmDownload(jobId: string): Promise<void>;
}

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  features: readonly string[];
  createdAt: Date;
  schemaName: string;
  isActive: boolean;
  isSuspended: boolean;
}

/**
 * Helper to cast a mock to its original type + Bun mock properties
 * Refined to satisfy strict type checking without using unsafe casts
 */
export type Mocked<T> = T & {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? Mock<(...args: A) => R>
    : T[K];
};

export interface MockQueryBuilder<T = unknown[]> extends Promise<T> {
  select: Mock<() => MockQueryBuilder<T>>;
  from: Mock<() => MockQueryBuilder<T>>;
  where: Mock<() => MockQueryBuilder<T>>;
  limit: Mock<(n: number) => MockQueryBuilder<T>>;
  orderBy: Mock<(arg: unknown) => MockQueryBuilder<T>>;
  offset: Mock<(n: number) => MockQueryBuilder<T>>;
  returning: Mock<() => Promise<T>>;
  set: Mock<(data: unknown) => MockQueryBuilder<T>>;
  update: Mock<() => MockQueryBuilder<T>>;
  delete: Mock<() => MockQueryBuilder<T>>;
  insert: Mock<(table: unknown) => MockQueryBuilder<T>>;
  values: Mock<(data: unknown) => MockQueryBuilder<T>>;
  mockClear: () => void;
  mockReset: () => void;
}

/**
 * Interface for Drizzle mock instance
 */
export interface DrizzleMock {
  select: Mock<() => MockQueryBuilder>;
  update: Mock<(_table: unknown) => MockQueryBuilder>;
  delete: Mock<(_table: unknown) => MockQueryBuilder>;
  insert: Mock<(_table: unknown) => MockQueryBuilder>;
  query: Mock<(...args: unknown[]) => Promise<{ rows: unknown[] }>>;
  execute: Mock<(...args: unknown[]) => Promise<{ rows: unknown[] }>>;
}

/**
 * Interface for MinIO mock instance
 */
export interface MinioMock {
  bucketExists: Mock<() => Promise<boolean>>;
  makeBucket: Mock<(_bucket: string, _region: string) => Promise<void>>;
  setBucketVersioning: Mock<
    (_bucket: string, _config: unknown) => Promise<void>
  >;
  setBucketPolicy: Mock<(_bucket: string, _policy: string) => Promise<void>>;
  setBucketTagging: Mock<
    (_bucket: string, _tags: Record<string, string>) => Promise<void>
  >;
  putObject: Mock<
    (_bucket: string, _name: string, _data: unknown) => Promise<object>
  >;
  removeBucket: Mock<(_bucket: string) => Promise<void>>;
  listObjects: Mock<
    (
      _bucket: string,
      _prefix?: string,
      _recursive?: boolean
    ) => {
      toArray: Mock<() => Promise<unknown[]>>;
      [Symbol.asyncIterator]: () => AsyncGenerator<unknown, void, unknown>;
    }
  >;
  removeObjects: Mock<(_bucket: string, _objects: string[]) => Promise<void>>;
  getBucketTagging: Mock<(_bucket: string) => Promise<unknown[]>>;
  presignedPutObject: Mock<
    (_bucket: string, _name: string, _expiry?: number) => Promise<string>
  >;
  presignedGetObject: Mock<
    (_bucket: string, _name: string, _expiry?: number) => Promise<string>
  >;
  removeObject: Mock<
    (
      _bucket: string,
      _name: string,
      _options?: { versionId?: string }
    ) => Promise<void>
  >;
  listObjectVersions: Mock<
    (
      _bucket: string,
      _prefix?: string,
      _recursive?: boolean
    ) => {
      [Symbol.asyncIterator]: () => AsyncGenerator<unknown, void, unknown>;
    }
  >;
  listIncompleteUploads: Mock<
    (
      _bucket: string,
      _prefix?: string,
      _recursive?: boolean
    ) => {
      [Symbol.asyncIterator]: () => AsyncGenerator<
        { key: string },
        void,
        unknown
      >;
    }
  >;
  removeIncompleteUpload: Mock<
    (_bucket: string, _name: string) => Promise<void>
  >;
}

/**
 * 🛡️ Zero-Any Mandate: Precision Mock Factory
 * All mocks must be strictly typed or use the cleanest possible casts.
 * biome-ignore lint/complexity/noStaticOnlyClass: Grouping related mock factories
 */
export class MockFactory {
  /**
   * Creates a mocked BunShell
   */
  static createBunShell(): Mocked<BunShell> {
    const shellMock: Partial<Mocked<BunShell>> = {
      spawn: mock(() => ({
        exited: Promise.resolve(0),
        exitCode: 0,
        stdout: { text: mock().mockResolvedValue('') },
        stderr: { text: mock().mockResolvedValue('') },
      })),
      write: mock(() => Promise.resolve()),
      file: mock((_path: string) => ({
        arrayBuffer: mock().mockResolvedValue(new ArrayBuffer(10)),
        stat: mock().mockResolvedValue({ size: 100 }),
      })),
    };
    return shellMock as Mocked<BunShell>;
  }

  /**
   * Creates a mocked AuditService
   */
  static createAuditService(): Mocked<AuditService> {
    const auditMock: Partial<Mocked<AuditService>> = {
      log: mock().mockResolvedValue(undefined),
      initializeS4: mock().mockResolvedValue(undefined),
    };
    return auditMock as Mocked<AuditService>;
  }

  /**
   * Creates a mocked ExportService
   */
  static createExportService(): Mocked<ExportService> {
    const exportMock: Partial<Mocked<ExportService>> = {
      createExportJob: mock(() => Promise.resolve({ id: 'mock-id' })),
      getJobStatus: mock(() => Promise.resolve({ status: 'completed' })),
      listTenantExports: mock(() => Promise.resolve([])),
      cancelJob: mock(() => Promise.resolve()),
    };
    return exportMock as Mocked<ExportService>;
  }

  /**
   * Creates a mocked ExportWorker
   */
  static createExportWorker(): Mocked<ExportWorker> {
    const workerMock: Partial<Mocked<ExportWorker>> = {
      confirmDownload: mock(() => Promise.resolve()),
    };
    return workerMock as Mocked<ExportWorker>;
  }

  /**
   * Creates a mocked ConfigService
   */
  static createConfigService(): Mocked<ConfigService> {
    const configMock: Partial<Mocked<ConfigService>> = {
      get: mock((key: string) => `mock-${key}`),
      getWithDefault: mock(
        <T>(_key: string, defaultValue: T): T => defaultValue
      ) as Mocked<ConfigService>['getWithDefault'],
      getOrThrow: mock((key: string) => `mock-${key}`),
    };
    return configMock as Mocked<ConfigService>;
  }

  /**
   * Creates a mocked Database Client
   */
  static createDbClient() {
    return {
      query: mock().mockResolvedValue({ rows: [], rowCount: 0 }),
      execute: mock().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: mock(),
    };
  }

  /**
   * Creates a mocked Drizzle-like Query Builder
   */
  static createQueryBuilder<T = unknown[]>(
    returnData: T = (() => {
      const data: unknown = [];
      const isReturnType = (d: unknown): d is T => true;
      return isReturnType(data)
        ? data
        : (() => {
            throw new Error('Unreachable');
          })();
    })()
  ): Mocked<MockQueryBuilder<T>> {
    const builder = {
      select: mock(),
      from: mock(),
      where: mock(),
      limit: mock(),
      orderBy: mock(),
      offset: mock(),
      returning: mock(() => Promise.resolve(returnData)),
      set: mock(),
      update: mock(),
      delete: mock(),
      insert: mock(),
      values: mock(),
    } as Mocked<MockQueryBuilder<T>>;

    const applyChaining = () => {
      builder.select.mockImplementation(() => builder);
      builder.from.mockImplementation(() => builder);
      builder.where.mockImplementation(() => builder);
      builder.orderBy.mockImplementation(() => builder);
      builder.offset.mockImplementation(() => builder);
      builder.set.mockImplementation(() => builder);
      builder.update.mockImplementation(() => builder);
      builder.delete.mockImplementation(() => builder);
      builder.insert.mockImplementation(() => builder);
      builder.values.mockImplementation(() => builder);
      builder.limit.mockImplementation(() => builder);
    };

    applyChaining();

    // Promise implementation for terminal chaining
    const promise = Promise.resolve(returnData);
    Object.assign(builder, {
      // biome-ignore lint/suspicious/noThenProperty: Required for Drizzle-like thenable chaining
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
    });

    builder.mockClear = mock(() => {
      builder.select.mockClear();
      builder.from.mockClear();
      builder.where.mockClear();
      builder.limit.mockClear();
      builder.orderBy.mockClear();
      builder.offset.mockClear();
      builder.returning.mockClear();
      builder.set.mockClear();
      builder.update.mockClear();
      builder.delete.mockClear();
      builder.insert.mockClear();
      builder.values.mockClear();
    });

    builder.mockReset = mock(() => {
      builder.select.mockReset();
      builder.from.mockReset();
      builder.where.mockReset();
      builder.limit.mockReset();
      builder.orderBy.mockReset();
      builder.offset.mockReset();
      builder.returning.mockReset().mockResolvedValue(returnData);
      builder.set.mockReset();
      builder.update.mockReset();
      builder.delete.mockReset();
      builder.insert.mockReset();
      builder.values.mockReset();
      applyChaining();
    });

    return builder;
  }

  /**
   * Creates a mocked Drizzle instance
   */
  static createDrizzleMock(returnData: unknown[] = []): Mocked<DrizzleMock> {
    const drizzleMock: Mocked<DrizzleMock> = {
      select: mock(() => MockFactory.createQueryBuilder(returnData)),
      update: mock((_table: unknown) =>
        MockFactory.createQueryBuilder(returnData)
      ),
      delete: mock((_table: unknown) =>
        MockFactory.createQueryBuilder(returnData)
      ),
      insert: mock((_table: unknown) =>
        MockFactory.createQueryBuilder(returnData)
      ),
      query: mock().mockResolvedValue({ rows: returnData }),
      execute: mock().mockResolvedValue({ rows: returnData }),
    };
    return drizzleMock;
  }

  /**
   * Creates a mocked MinIO client
   */
  static createMinioClient(): Mocked<MinioMock> {
    const minioMock: Mocked<MinioMock> = {
      bucketExists: mock(() => Promise.resolve(false)),
      makeBucket: mock((_bucket: string, _region: string) => Promise.resolve()),
      setBucketVersioning: mock((_bucket: string, _config: unknown) =>
        Promise.resolve()
      ),
      setBucketPolicy: mock((_bucket: string, _policy: string) =>
        Promise.resolve()
      ),
      setBucketTagging: mock((_bucket: string, _tags: Record<string, string>) =>
        Promise.resolve()
      ),
      putObject: mock((_bucket: string, _name: string, _data: unknown) =>
        Promise.resolve({})
      ),
      removeBucket: mock((_bucket: string) => Promise.resolve()),
      listObjects: mock(
        (_bucket: string, _prefix?: string, _recursive?: boolean) => ({
          toArray: mock(() => Promise.resolve([])),
          [Symbol.asyncIterator]: async function* () {
            yield* [];
          },
        })
      ),
      removeObjects: mock((_bucket: string, _objects: string[]) =>
        Promise.resolve()
      ),
      getBucketTagging: mock((_bucket: string) => Promise.resolve([])),
      presignedPutObject: mock(
        (_bucket: string, _name: string, _expiry?: number) =>
          Promise.resolve('http://mock-url')
      ),
      presignedGetObject: mock(
        (_bucket: string, _name: string, _expiry?: number) =>
          Promise.resolve('http://mock-url')
      ),
      removeObject: mock(
        (_bucket: string, _name: string, _options?: { versionId?: string }) =>
          Promise.resolve()
      ),
      listObjectVersions: mock(
        (_bucket: string, _prefix?: string, _recursive?: boolean) => ({
          [Symbol.asyncIterator]: async function* () {
            yield* [];
          },
        })
      ),
      listIncompleteUploads: mock(
        (_bucket: string, _prefix?: string, _recursive?: boolean) => ({
          [Symbol.asyncIterator]: async function* () {
            yield* [];
          },
        })
      ),
      removeIncompleteUpload: mock((_bucket: string, _name: string) =>
        Promise.resolve()
      ),
    };
    return minioMock;
  }

  /**
   * Creates a mocked JWT Service
   */
  static createJwtService() {
    return {
      sign: mock().mockReturnValue('mock-token'),
      verify: mock().mockReturnValue({}),
      decode: mock().mockReturnValue({}),
    };
  }

  /**
   * Creates a mocked ExecutionContext
   */
  static createExecutionContext(
    request: Record<string, unknown> = {}
  ): Mocked<ExecutionContext> {
    const httpHost = {
      getRequest: mock(() => request),
      getResponse: mock(() => ({})),
      getNext: mock(() => ({})),
    };

    const context = {
      switchToHttp: mock(() => httpHost),
      getType: mock(() => 'http'),
      getClass: mock(() => ({})),
      getHandler: mock(() => ({})),
      getArgs: mock(() => []),
      getArgByIndex: mock(() => ({})),
      switchToRpc: mock(() => ({})),
      switchToWs: mock(() => ({})),
    };

    const isExecutionContext = (
      ctx: unknown
    ): ctx is Mocked<ExecutionContext> => true;
    if (isExecutionContext(context)) {
      return context;
    }

    // Fallback for safety (though unreachable)
    throw new Error('Unreachable');
  }

  /**
   * Creates a mocked TenantContext
   */
  static createTenantContext(
    overrides: Partial<TenantContext> = {}
  ): TenantContext {
    return {
      tenantId: 'mock-tenant-id',
      subdomain: 'mock-tenant',
      plan: 'basic',
      features: [],
      createdAt: new Date(),
      schemaName: 'tenant_mock-tenant',
      isActive: true,
      isSuspended: false,
      ...overrides,
    };
  }

  /**
   * Creates a mocked Express Request
   */
  static createRequest(
    overrides: Partial<Request & { tenantContext: TenantContext }> = {}
  ): Mocked<Request & { tenantContext: TenantContext }> {
    const req = {
      headers: {},
      params: {},
      query: {},
      body: {},
      method: 'GET',
      url: '/',
      path: '/',
      ip: '127.0.0.1',
      get: mock((_name: string) => undefined),
      header: mock((_name: string) => undefined),
      accepts: mock(() => undefined),
      ...overrides,
    };
    return req as Mocked<Request & { tenantContext: TenantContext }>;
  }

  /**
   * Creates a mocked Express Response
   */
  static createResponse(): Mocked<Response> {
    const res = {
      status: mock().mockReturnThis(),
      json: mock().mockReturnThis(),
      send: mock().mockReturnThis(),
      setHeader: mock().mockReturnThis(),
      removeHeader: mock().mockReturnThis(),
      cookie: mock().mockReturnThis(),
      clearCookie: mock().mockReturnThis(),
      end: mock().mockReturnThis(),
      once: mock().mockReturnThis(),
      locals: {},
    };
    return res as Mocked<Response>;
  }
}

// Export types for external use
// 🛡️ S1 Cycle Fix: Do not export types from cyclic packages here
