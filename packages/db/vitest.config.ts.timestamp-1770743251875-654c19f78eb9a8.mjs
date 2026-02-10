// vitest.config.ts
import {
  defineConfig as defineConfig2,
  mergeConfig,
} from 'file:///C:/Users/Dell/Desktop/60sec.shop/node_modules/.bun/vitest@1.6.1+dbad6dffc5866af1/node_modules/vitest/dist/config.js';

// ../../vitest.config.ts
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'file:///C:/Users/Dell/Desktop/60sec.shop/node_modules/.bun/vitest@4.0.18+7f377d3ef7c9dd91/node_modules/vitest/dist/config.js';
var __vite_injected_original_import_meta_url =
  'file:///C:/Users/Dell/Desktop/60sec.shop/vitest.config.ts';
var __dirname = dirname(
  fileURLToPath(__vite_injected_original_import_meta_url)
);
var vitest_config_default = defineConfig({
  resolve: {
    alias: {
      '@apex/config': resolve(__dirname, 'packages/config/src/index.ts'),
      '@apex/db': resolve(__dirname, 'packages/db/src/index.ts'),
      '@apex/audit': resolve(__dirname, 'packages/audit/src/index.ts'),
      '@apex/middleware': resolve(
        __dirname,
        'packages/middleware/src/index.ts'
      ),
      '@apex/auth': resolve(__dirname, 'packages/auth/src/index.ts'),
      '@apex/events': resolve(__dirname, 'packages/events/src/index.ts'),
      '@apex/provisioning': resolve(
        __dirname,
        'packages/provisioning/src/index.ts'
      ),
      '@apex/test-utils': resolve(
        __dirname,
        'packages/test-utils/src/index.ts'
      ),
      '@apex/ui': resolve(__dirname, 'packages/ui/src/index.ts'),
      '@apex/template-config': resolve(
        __dirname,
        'packages/template-config/src/index.ts'
      ),
      '@apex/template-validator': resolve(
        __dirname,
        'packages/template-validator/src/index.ts'
      ),
      '@apex/template-security': resolve(
        __dirname,
        'packages/template-security/src/index.ts'
      ),
      '@templates': resolve(__dirname, 'templates'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, 'vitest.setup.ts')],
    coverage: {
      provider: 'v8',
      all: true,
      // Reporters: text shows summary at end, others for artifact generation
      reporter: [
        'text',
        'text-summary',
        'json',
        'html',
        'json-summary',
        'lcov',
      ],
      include: ['**/packages/*/src/**/*.ts', '**/apps/*/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/dto/**',
        '**/types.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/packages/db/src/migrate.ts',
        '**/apps/api/src/main.ts',
      ],
      // Coverage Thresholds (80% Milestone Target)
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      // Report uncovered files
      reportOnFailure: true,
      // Show coverage summary at the end
      watermarks: {
        statements: [50, 90],
        functions: [50, 90],
        branches: [50, 90],
        lines: [50, 90],
      },
    },
    onConsoleLog: (log, type) => {
      if (type === 'stderr') {
        console.error(log);
      }
    },
  },
});

// vitest.config.ts
var vitest_config_default2 = mergeConfig(
  vitest_config_default,
  defineConfig2({
    test: {
      name: 'db',
    },
  })
);
export { vitest_config_default2 as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyIsICIuLi8uLi92aXRlc3QuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGVsbFxcXFxEZXNrdG9wXFxcXDYwc2VjLnNob3BcXFxccGFja2FnZXNcXFxcZGJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERlbGxcXFxcRGVza3RvcFxcXFw2MHNlYy5zaG9wXFxcXHBhY2thZ2VzXFxcXGRiXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RlbGwvRGVza3RvcC82MHNlYy5zaG9wL3BhY2thZ2VzL2RiL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIG1lcmdlQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5pbXBvcnQgcm9vdENvbmZpZyBmcm9tICcuLi8uLi92aXRlc3QuY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgbWVyZ2VDb25maWcoXG4gIHJvb3RDb25maWcsXG4gIGRlZmluZUNvbmZpZyh7XG4gICAgdGVzdDoge1xuICAgICAgbmFtZTogJ2RiJyxcbiAgICB9LFxuICB9KVxuKTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGVsbFxcXFxEZXNrdG9wXFxcXDYwc2VjLnNob3BcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERlbGxcXFxcRGVza3RvcFxcXFw2MHNlYy5zaG9wXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0RlbGwvRGVza3RvcC82MHNlYy5zaG9wL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcblxuY29uc3QgX19kaXJuYW1lID0gZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuXG4vKipcbiAqIFJvb3QgVml0ZXN0IENvbmZpZ3VyYXRpb25cbiAqIEVuZm9yY2VzIENvbnN0aXR1dGlvbiBSdWxlIDQuMTogVGVzdCBDb3ZlcmFnZSBNYW5kYXRlXG4gKiBUaHJlc2hvbGRzIHNldCB0byA5MCUgYXMgcmVxdWlyZWRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQGFwZXgvY29uZmlnJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdwYWNrYWdlcy9jb25maWcvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQGFwZXgvZGInOiByZXNvbHZlKF9fZGlybmFtZSwgJ3BhY2thZ2VzL2RiL3NyYy9pbmRleC50cycpLFxuICAgICAgJ0BhcGV4L2F1ZGl0JzogcmVzb2x2ZShfX2Rpcm5hbWUsICdwYWNrYWdlcy9hdWRpdC9zcmMvaW5kZXgudHMnKSxcbiAgICAgICdAYXBleC9taWRkbGV3YXJlJzogcmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAncGFja2FnZXMvbWlkZGxld2FyZS9zcmMvaW5kZXgudHMnXG4gICAgICApLFxuICAgICAgJ0BhcGV4L2F1dGgnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3BhY2thZ2VzL2F1dGgvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQGFwZXgvZXZlbnRzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdwYWNrYWdlcy9ldmVudHMvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQGFwZXgvcHJvdmlzaW9uaW5nJzogcmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAncGFja2FnZXMvcHJvdmlzaW9uaW5nL3NyYy9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQGFwZXgvdGVzdC11dGlscyc6IHJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgJ3BhY2thZ2VzL3Rlc3QtdXRpbHMvc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAYXBleC91aSc6IHJlc29sdmUoX19kaXJuYW1lLCAncGFja2FnZXMvdWkvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQGFwZXgvdGVtcGxhdGUtY29uZmlnJzogcmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAncGFja2FnZXMvdGVtcGxhdGUtY29uZmlnL3NyYy9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQGFwZXgvdGVtcGxhdGUtdmFsaWRhdG9yJzogcmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAncGFja2FnZXMvdGVtcGxhdGUtdmFsaWRhdG9yL3NyYy9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQGFwZXgvdGVtcGxhdGUtc2VjdXJpdHknOiByZXNvbHZlKFxuICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICdwYWNrYWdlcy90ZW1wbGF0ZS1zZWN1cml0eS9zcmMvaW5kZXgudHMnXG4gICAgICApLFxuICAgICAgJ0B0ZW1wbGF0ZXMnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3RlbXBsYXRlcycpLFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGVudmlyb25tZW50OiAnbm9kZScsXG4gICAgc2V0dXBGaWxlczogW3Jlc29sdmUoX19kaXJuYW1lLCAndml0ZXN0LnNldHVwLnRzJyldLFxuICAgIGNvdmVyYWdlOiB7XG4gICAgICBwcm92aWRlcjogJ3Y4JyxcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICAgIC8vIFJlcG9ydGVyczogdGV4dCBzaG93cyBzdW1tYXJ5IGF0IGVuZCwgb3RoZXJzIGZvciBhcnRpZmFjdCBnZW5lcmF0aW9uXG4gICAgICByZXBvcnRlcjogW1xuICAgICAgICAndGV4dCcsXG4gICAgICAgICd0ZXh0LXN1bW1hcnknLFxuICAgICAgICAnanNvbicsXG4gICAgICAgICdodG1sJyxcbiAgICAgICAgJ2pzb24tc3VtbWFyeScsXG4gICAgICAgICdsY292JyxcbiAgICAgIF0sXG4gICAgICBpbmNsdWRlOiBbJyoqL3BhY2thZ2VzLyovc3JjLyoqLyoudHMnLCAnKiovYXBwcy8qL3NyYy8qKi8qLnRzJ10sXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICcqKi8qLnNwZWMudHMnLFxuICAgICAgICAnKiovKi50ZXN0LnRzJyxcbiAgICAgICAgJyoqL2R0by8qKicsXG4gICAgICAgICcqKi90eXBlcy50cycsXG4gICAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLFxuICAgICAgICAnKiovZGlzdC8qKicsXG4gICAgICAgICcqKi9wYWNrYWdlcy9kYi9zcmMvbWlncmF0ZS50cycsXG4gICAgICAgICcqKi9hcHBzL2FwaS9zcmMvbWFpbi50cycsXG4gICAgICBdLFxuICAgICAgLy8gQ292ZXJhZ2UgVGhyZXNob2xkcyAoODAlIE1pbGVzdG9uZSBUYXJnZXQpXG4gICAgICB0aHJlc2hvbGRzOiB7XG4gICAgICAgIGJyYW5jaGVzOiA4MCxcbiAgICAgICAgZnVuY3Rpb25zOiA4MCxcbiAgICAgICAgbGluZXM6IDgwLFxuICAgICAgICBzdGF0ZW1lbnRzOiA4MCxcbiAgICAgIH0sXG4gICAgICAvLyBSZXBvcnQgdW5jb3ZlcmVkIGZpbGVzXG4gICAgICByZXBvcnRPbkZhaWx1cmU6IHRydWUsXG4gICAgICAvLyBTaG93IGNvdmVyYWdlIHN1bW1hcnkgYXQgdGhlIGVuZFxuICAgICAgd2F0ZXJtYXJrczoge1xuICAgICAgICBzdGF0ZW1lbnRzOiBbNTAsIDkwXSxcbiAgICAgICAgZnVuY3Rpb25zOiBbNTAsIDkwXSxcbiAgICAgICAgYnJhbmNoZXM6IFs1MCwgOTBdLFxuICAgICAgICBsaW5lczogWzUwLCA5MF0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgb25Db25zb2xlTG9nOiAobG9nLCB0eXBlKSA9PiB7XG4gICAgICBpZiAodHlwZSA9PT0gJ3N0ZGVycicpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihsb2cpO1xuICAgICAgfVxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1UsU0FBUyxnQkFBQUEsZUFBYyxtQkFBbUI7OztBQ0FsRixTQUFTLFNBQVMsZUFBZTtBQUNqVSxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLG9CQUFvQjtBQUZzSixJQUFNLDJDQUEyQztBQUlwTyxJQUFNLFlBQVksUUFBUSxjQUFjLHdDQUFlLENBQUM7QUFPeEQsSUFBTyx3QkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsZ0JBQWdCLFFBQVEsV0FBVyw4QkFBOEI7QUFBQSxNQUNqRSxZQUFZLFFBQVEsV0FBVywwQkFBMEI7QUFBQSxNQUN6RCxlQUFlLFFBQVEsV0FBVyw2QkFBNkI7QUFBQSxNQUMvRCxvQkFBb0I7QUFBQSxRQUNsQjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxjQUFjLFFBQVEsV0FBVyw0QkFBNEI7QUFBQSxNQUM3RCxnQkFBZ0IsUUFBUSxXQUFXLDhCQUE4QjtBQUFBLE1BQ2pFLHNCQUFzQjtBQUFBLFFBQ3BCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLG9CQUFvQjtBQUFBLFFBQ2xCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVksUUFBUSxXQUFXLDBCQUEwQjtBQUFBLE1BQ3pELHlCQUF5QjtBQUFBLFFBQ3ZCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLDRCQUE0QjtBQUFBLFFBQzFCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLDJCQUEyQjtBQUFBLFFBQ3pCO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGNBQWMsUUFBUSxXQUFXLFdBQVc7QUFBQSxJQUM5QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxRQUFRLFdBQVcsaUJBQWlCLENBQUM7QUFBQSxJQUNsRCxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixLQUFLO0FBQUE7QUFBQSxNQUVMLFVBQVU7QUFBQSxRQUNSO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTLENBQUMsNkJBQTZCLHVCQUF1QjtBQUFBLE1BQzlELFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsWUFBWTtBQUFBLFFBQ1YsVUFBVTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsWUFBWTtBQUFBLE1BQ2Q7QUFBQTtBQUFBLE1BRUEsaUJBQWlCO0FBQUE7QUFBQSxNQUVqQixZQUFZO0FBQUEsUUFDVixZQUFZLENBQUMsSUFBSSxFQUFFO0FBQUEsUUFDbkIsV0FBVyxDQUFDLElBQUksRUFBRTtBQUFBLFFBQ2xCLFVBQVUsQ0FBQyxJQUFJLEVBQUU7QUFBQSxRQUNqQixPQUFPLENBQUMsSUFBSSxFQUFFO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjLENBQUMsS0FBSyxTQUFTO0FBQzNCLFVBQUksU0FBUyxVQUFVO0FBQ3JCLGdCQUFRLE1BQU0sR0FBRztBQUFBLE1BQ25CO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOzs7QUQ5RkQsSUFBT0MseUJBQVE7QUFBQSxFQUNiO0FBQUEsRUFDQUMsY0FBYTtBQUFBLElBQ1gsTUFBTTtBQUFBLE1BQ0osTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGLENBQUM7QUFDSDsiLAogICJuYW1lcyI6IFsiZGVmaW5lQ29uZmlnIiwgInZpdGVzdF9jb25maWdfZGVmYXVsdCIsICJkZWZpbmVDb25maWciXQp9Cg==
