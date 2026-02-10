// vitest.config.ts
import { defineConfig as defineConfig2, mergeConfig } from "file:///C:/Users/Dell/Desktop/60sec.shop/node_modules/.bun/vitest@1.6.1+dbad6dffc5866af1/node_modules/vitest/dist/config.js";

// ../../vitest.config.ts
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "file:///C:/Users/Dell/Desktop/60sec.shop/node_modules/.bun/vitest@4.0.18+7f377d3ef7c9dd91/node_modules/vitest/dist/config.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Dell/Desktop/60sec.shop/vitest.config.ts";
var __dirname = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vitest_config_default = defineConfig({
  resolve: {
    alias: {
      "@apex/config": resolve(__dirname, "packages/config/src/index.ts"),
      "@apex/db": resolve(__dirname, "packages/db/src/index.ts"),
      "@apex/audit": resolve(__dirname, "packages/audit/src/index.ts"),
      "@apex/middleware": resolve(
        __dirname,
        "packages/middleware/src/index.ts"
      ),
      "@apex/auth": resolve(__dirname, "packages/auth/src/index.ts"),
      "@apex/events": resolve(__dirname, "packages/events/src/index.ts"),
      "@apex/provisioning": resolve(
        __dirname,
        "packages/provisioning/src/index.ts"
      ),
      "@apex/test-utils": resolve(
        __dirname,
        "packages/test-utils/src/index.ts"
      ),
      "@apex/ui": resolve(__dirname, "packages/ui/src/index.ts"),
      "@apex/template-config": resolve(
        __dirname,
        "packages/template-config/src/index.ts"
      ),
      "@apex/template-validator": resolve(
        __dirname,
        "packages/template-validator/src/index.ts"
      ),
      "@apex/template-security": resolve(
        __dirname,
        "packages/template-security/src/index.ts"
      ),
      "@templates": resolve(__dirname, "templates")
    }
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: [resolve(__dirname, "vitest.setup.ts")],
    coverage: {
      provider: "v8",
      all: true,
      // Reporters: text shows summary at end, others for artifact generation
      reporter: [
        "text",
        "text-summary",
        "json",
        "html",
        "json-summary",
        "lcov"
      ],
      include: ["**/packages/*/src/**/*.ts", "**/apps/*/src/**/*.ts"],
      exclude: [
        "**/*.spec.ts",
        "**/*.test.ts",
        "**/dto/**",
        "**/types.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/packages/db/src/migrate.ts",
        "**/apps/api/src/main.ts"
      ],
      // Coverage Thresholds (80% Milestone Target)
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      },
      // Report uncovered files
      reportOnFailure: true,
      // Show coverage summary at the end
      watermarks: {
        statements: [50, 90],
        functions: [50, 90],
        branches: [50, 90],
        lines: [50, 90]
      }
    },
    onConsoleLog: (log, type) => {
      if (type === "stderr") {
        console.error(log);
      }
    }
  }
});

// vitest.config.ts
var vitest_config_default2 = mergeConfig(
  vitest_config_default,
  defineConfig2({
    test: {
      name: "config"
    }
  })
);
export {
  vitest_config_default2 as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyIsICIuLi8uLi92aXRlc3QuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRGVsbFxcXFxEZXNrdG9wXFxcXDYwc2VjLnNob3BcXFxccGFja2FnZXNcXFxcY29uZmlnXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEZWxsXFxcXERlc2t0b3BcXFxcNjBzZWMuc2hvcFxcXFxwYWNrYWdlc1xcXFxjb25maWdcXFxcdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvRGVsbC9EZXNrdG9wLzYwc2VjLnNob3AvcGFja2FnZXMvY29uZmlnL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIG1lcmdlQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5pbXBvcnQgcm9vdENvbmZpZyBmcm9tICcuLi8uLi92aXRlc3QuY29uZmlnJztcblxuZXhwb3J0IGRlZmF1bHQgbWVyZ2VDb25maWcoXG4gIHJvb3RDb25maWcsXG4gIGRlZmluZUNvbmZpZyh7XG4gICAgdGVzdDoge1xuICAgICAgbmFtZTogJ2NvbmZpZycsXG4gICAgfSxcbiAgfSlcbik7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXERlbGxcXFxcRGVza3RvcFxcXFw2MHNlYy5zaG9wXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxEZWxsXFxcXERlc2t0b3BcXFxcNjBzZWMuc2hvcFxcXFx2aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9EZWxsL0Rlc2t0b3AvNjBzZWMuc2hvcC92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGlybmFtZSwgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XG5cbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuLyoqXG4gKiBSb290IFZpdGVzdCBDb25maWd1cmF0aW9uXG4gKiBFbmZvcmNlcyBDb25zdGl0dXRpb24gUnVsZSA0LjE6IFRlc3QgQ292ZXJhZ2UgTWFuZGF0ZVxuICogVGhyZXNob2xkcyBzZXQgdG8gOTAlIGFzIHJlcXVpcmVkXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0BhcGV4L2NvbmZpZyc6IHJlc29sdmUoX19kaXJuYW1lLCAncGFja2FnZXMvY29uZmlnL3NyYy9pbmRleC50cycpLFxuICAgICAgJ0BhcGV4L2RiJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdwYWNrYWdlcy9kYi9zcmMvaW5kZXgudHMnKSxcbiAgICAgICdAYXBleC9hdWRpdCc6IHJlc29sdmUoX19kaXJuYW1lLCAncGFja2FnZXMvYXVkaXQvc3JjL2luZGV4LnRzJyksXG4gICAgICAnQGFwZXgvbWlkZGxld2FyZSc6IHJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgJ3BhY2thZ2VzL21pZGRsZXdhcmUvc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAYXBleC9hdXRoJzogcmVzb2x2ZShfX2Rpcm5hbWUsICdwYWNrYWdlcy9hdXRoL3NyYy9pbmRleC50cycpLFxuICAgICAgJ0BhcGV4L2V2ZW50cyc6IHJlc29sdmUoX19kaXJuYW1lLCAncGFja2FnZXMvZXZlbnRzL3NyYy9pbmRleC50cycpLFxuICAgICAgJ0BhcGV4L3Byb3Zpc2lvbmluZyc6IHJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgJ3BhY2thZ2VzL3Byb3Zpc2lvbmluZy9zcmMvaW5kZXgudHMnXG4gICAgICApLFxuICAgICAgJ0BhcGV4L3Rlc3QtdXRpbHMnOiByZXNvbHZlKFxuICAgICAgICBfX2Rpcm5hbWUsXG4gICAgICAgICdwYWNrYWdlcy90ZXN0LXV0aWxzL3NyYy9pbmRleC50cydcbiAgICAgICksXG4gICAgICAnQGFwZXgvdWknOiByZXNvbHZlKF9fZGlybmFtZSwgJ3BhY2thZ2VzL3VpL3NyYy9pbmRleC50cycpLFxuICAgICAgJ0BhcGV4L3RlbXBsYXRlLWNvbmZpZyc6IHJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgJ3BhY2thZ2VzL3RlbXBsYXRlLWNvbmZpZy9zcmMvaW5kZXgudHMnXG4gICAgICApLFxuICAgICAgJ0BhcGV4L3RlbXBsYXRlLXZhbGlkYXRvcic6IHJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgJ3BhY2thZ2VzL3RlbXBsYXRlLXZhbGlkYXRvci9zcmMvaW5kZXgudHMnXG4gICAgICApLFxuICAgICAgJ0BhcGV4L3RlbXBsYXRlLXNlY3VyaXR5JzogcmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLFxuICAgICAgICAncGFja2FnZXMvdGVtcGxhdGUtc2VjdXJpdHkvc3JjL2luZGV4LnRzJ1xuICAgICAgKSxcbiAgICAgICdAdGVtcGxhdGVzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICd0ZW1wbGF0ZXMnKSxcbiAgICB9LFxuICB9LFxuICB0ZXN0OiB7XG4gICAgZ2xvYmFsczogdHJ1ZSxcbiAgICBlbnZpcm9ubWVudDogJ25vZGUnLFxuICAgIHNldHVwRmlsZXM6IFtyZXNvbHZlKF9fZGlybmFtZSwgJ3ZpdGVzdC5zZXR1cC50cycpXSxcbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICBhbGw6IHRydWUsXG4gICAgICAvLyBSZXBvcnRlcnM6IHRleHQgc2hvd3Mgc3VtbWFyeSBhdCBlbmQsIG90aGVycyBmb3IgYXJ0aWZhY3QgZ2VuZXJhdGlvblxuICAgICAgcmVwb3J0ZXI6IFtcbiAgICAgICAgJ3RleHQnLFxuICAgICAgICAndGV4dC1zdW1tYXJ5JyxcbiAgICAgICAgJ2pzb24nLFxuICAgICAgICAnaHRtbCcsXG4gICAgICAgICdqc29uLXN1bW1hcnknLFxuICAgICAgICAnbGNvdicsXG4gICAgICBdLFxuICAgICAgaW5jbHVkZTogWycqKi9wYWNrYWdlcy8qL3NyYy8qKi8qLnRzJywgJyoqL2FwcHMvKi9zcmMvKiovKi50cyddLFxuICAgICAgZXhjbHVkZTogW1xuICAgICAgICAnKiovKi5zcGVjLnRzJyxcbiAgICAgICAgJyoqLyoudGVzdC50cycsXG4gICAgICAgICcqKi9kdG8vKionLFxuICAgICAgICAnKiovdHlwZXMudHMnLFxuICAgICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcbiAgICAgICAgJyoqL2Rpc3QvKionLFxuICAgICAgICAnKiovcGFja2FnZXMvZGIvc3JjL21pZ3JhdGUudHMnLFxuICAgICAgICAnKiovYXBwcy9hcGkvc3JjL21haW4udHMnLFxuICAgICAgXSxcbiAgICAgIC8vIENvdmVyYWdlIFRocmVzaG9sZHMgKDgwJSBNaWxlc3RvbmUgVGFyZ2V0KVxuICAgICAgdGhyZXNob2xkczoge1xuICAgICAgICBicmFuY2hlczogODAsXG4gICAgICAgIGZ1bmN0aW9uczogODAsXG4gICAgICAgIGxpbmVzOiA4MCxcbiAgICAgICAgc3RhdGVtZW50czogODAsXG4gICAgICB9LFxuICAgICAgLy8gUmVwb3J0IHVuY292ZXJlZCBmaWxlc1xuICAgICAgcmVwb3J0T25GYWlsdXJlOiB0cnVlLFxuICAgICAgLy8gU2hvdyBjb3ZlcmFnZSBzdW1tYXJ5IGF0IHRoZSBlbmRcbiAgICAgIHdhdGVybWFya3M6IHtcbiAgICAgICAgc3RhdGVtZW50czogWzUwLCA5MF0sXG4gICAgICAgIGZ1bmN0aW9uczogWzUwLCA5MF0sXG4gICAgICAgIGJyYW5jaGVzOiBbNTAsIDkwXSxcbiAgICAgICAgbGluZXM6IFs1MCwgOTBdLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG9uQ29uc29sZUxvZzogKGxvZywgdHlwZSkgPT4ge1xuICAgICAgaWYgKHR5cGUgPT09ICdzdGRlcnInKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobG9nKTtcbiAgICAgIH1cbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9WLFNBQVMsZ0JBQUFBLGVBQWMsbUJBQW1COzs7QUNBOUYsU0FBUyxTQUFTLGVBQWU7QUFDalUsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxvQkFBb0I7QUFGc0osSUFBTSwyQ0FBMkM7QUFJcE8sSUFBTSxZQUFZLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBT3hELElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLGdCQUFnQixRQUFRLFdBQVcsOEJBQThCO0FBQUEsTUFDakUsWUFBWSxRQUFRLFdBQVcsMEJBQTBCO0FBQUEsTUFDekQsZUFBZSxRQUFRLFdBQVcsNkJBQTZCO0FBQUEsTUFDL0Qsb0JBQW9CO0FBQUEsUUFDbEI7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsY0FBYyxRQUFRLFdBQVcsNEJBQTRCO0FBQUEsTUFDN0QsZ0JBQWdCLFFBQVEsV0FBVyw4QkFBOEI7QUFBQSxNQUNqRSxzQkFBc0I7QUFBQSxRQUNwQjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxvQkFBb0I7QUFBQSxRQUNsQjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxZQUFZLFFBQVEsV0FBVywwQkFBMEI7QUFBQSxNQUN6RCx5QkFBeUI7QUFBQSxRQUN2QjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSw0QkFBNEI7QUFBQSxRQUMxQjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSwyQkFBMkI7QUFBQSxRQUN6QjtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxjQUFjLFFBQVEsV0FBVyxXQUFXO0FBQUEsSUFDOUM7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNO0FBQUEsSUFDSixTQUFTO0FBQUEsSUFDVCxhQUFhO0FBQUEsSUFDYixZQUFZLENBQUMsUUFBUSxXQUFXLGlCQUFpQixDQUFDO0FBQUEsSUFDbEQsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsS0FBSztBQUFBO0FBQUEsTUFFTCxVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsU0FBUyxDQUFDLDZCQUE2Qix1QkFBdUI7QUFBQSxNQUM5RCxTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLFlBQVk7QUFBQSxRQUNWLFVBQVU7QUFBQSxRQUNWLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLFlBQVk7QUFBQSxNQUNkO0FBQUE7QUFBQSxNQUVBLGlCQUFpQjtBQUFBO0FBQUEsTUFFakIsWUFBWTtBQUFBLFFBQ1YsWUFBWSxDQUFDLElBQUksRUFBRTtBQUFBLFFBQ25CLFdBQVcsQ0FBQyxJQUFJLEVBQUU7QUFBQSxRQUNsQixVQUFVLENBQUMsSUFBSSxFQUFFO0FBQUEsUUFDakIsT0FBTyxDQUFDLElBQUksRUFBRTtBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYyxDQUFDLEtBQUssU0FBUztBQUMzQixVQUFJLFNBQVMsVUFBVTtBQUNyQixnQkFBUSxNQUFNLEdBQUc7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzs7O0FEOUZELElBQU9DLHlCQUFRO0FBQUEsRUFDYjtBQUFBLEVBQ0FDLGNBQWE7QUFBQSxJQUNYLE1BQU07QUFBQSxNQUNKLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRixDQUFDO0FBQ0g7IiwKICAibmFtZXMiOiBbImRlZmluZUNvbmZpZyIsICJ2aXRlc3RfY29uZmlnX2RlZmF1bHQiLCAiZGVmaW5lQ29uZmlnIl0KfQo=
