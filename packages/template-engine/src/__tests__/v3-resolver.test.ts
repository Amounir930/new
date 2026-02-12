import { describe, expect, test } from 'bun:test';
import type { ResolverContext } from '../resolver/v3-resolver';
import { v3Resolver } from '../resolver/v3-resolver';
import { validateBlueprint } from '../schema/v3';

describe('LEGO v3 Resolver Engine', () => {
  const mockContext: ResolverContext = {
    data: {
      user: { name: 'Adel' },
      products: [{ id: '1', title: 'Brick 1' }],
      showBanner: true,
      hideFooter: false,
    },
    locale: 'ar',
    isRTL: true,
    builderMode: false,
  };

  const mockBlueprint = validateBlueprint({
    id: 'test-page',
    name: 'Test Page',
    slug: 'test',
    category: 'home',
    root: {
      id: 'root-1',
      type: 'PageContainer',
      props: { title: 'Welcome {{ user.name }}' },
      slots: {
        content: [
          {
            id: 'hero-1',
            type: 'Hero',
            data: { condition: 'showBanner' },
            props: { headline: 'Summer Sale!' },
          },
          {
            id: 'grid-1',
            type: 'ProductGrid',
            props: { items: '{{ products }}' },
          },
        ],
        footer: [
          {
            id: 'footer-1',
            type: 'Footer',
            data: { condition: 'hideFooter' },
            props: { text: 'Copyright 2026' },
          },
        ],
      },
    },
  });

  test('should resolve recursive bricks and data bindings', () => {
    const resolved = v3Resolver.resolveBlueprint(mockBlueprint, mockContext);

    expect(resolved.id).toBe('root-1');
    expect(resolved.props.title).toBe('Welcome Adel');
    expect(resolved.slots?.content).toHaveLength(2);
    expect(resolved.slots?.content[0].type).toBe('Hero');
    expect(resolved.slots?.content[1].props.items).toHaveLength(1);
  });

  test('should handle conditional rendering', () => {
    const resolved = v3Resolver.resolveBlueprint(mockBlueprint, mockContext);

    // showBanner is true -> hero exists
    expect(
      resolved.slots?.content.find((b) => b.type === 'Hero')
    ).toBeDefined();

    // hideFooter is false -> footer should be empty/excluded
    expect(resolved.slots?.footer).toBeUndefined();
  });
});
