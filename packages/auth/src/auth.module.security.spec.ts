import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { BaseSecurityTest } from '@apex/test-utils';

describe('AuthModule Security Checks', () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
        // BaseSecurityTest.validateModule checks metadata and AST
        // We can also extend the class if we want instance-based checks
    });

    // Run Standard Security Suite
    BaseSecurityTest.validateModule(AuthModule);
});