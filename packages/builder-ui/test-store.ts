import { useBuilderStore } from './src/store/use-builder-store';

console.log('Testing useBuilderStore...');
try {
  const state = useBuilderStore.getState();
  console.log('Store initialized successfully:', state);
  console.log('isSidebarOpen:', state.isSidebarOpen);
} catch (error) {
  console.error('Store initialization failed:', error);
}
