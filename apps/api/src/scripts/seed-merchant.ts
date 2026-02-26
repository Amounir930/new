#!/usr/bin/env bun
/**
 * Real Merchant Data Seeder (Phase 22)
 * Usage: bun run src/scripts/seed-merchant.ts
 */

import { publicDb as db, eq, publicPool as pool, sql, tenants } from '@apex/db';
import { categories } from '@apex/db/schema/storefront/categories';

import { banners } from '@apex/db/schema/storefront/home';
import {
  productImages,
  products,
  productVariants,
} from '@apex/db/schema/storefront/products';

const TENANT_SUBDOMAIN = 'adel';
// S2 FIX: Use less predictable schema name prefix
const SCHEMA_NAME = `tenant_store_${TENANT_SUBDOMAIN}_v2`;

async function main() {
  console.log(
    `🚀 Starting Real Seed for: ${TENANT_SUBDOMAIN} (${SCHEMA_NAME})`
  );

  try {
    // 1. Update Global Tenant Registry (Public Schema)
    console.log('📝 Updating Global Tenant Registry...');
    const [tenant] = await db
      .insert(tenants)
      .values({
        subdomain: TENANT_SUBDOMAIN,
        name: 'Adel Store',
        plan: 'pro',
        status: 'active',
        nicheType: 'electronics',
        uiConfig: {
          primaryColor: '#007bff',
          logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&h=200&auto=format&fit=crop',
          currency: 'EGP',
          fonts: {
            heading: 'Inter',
            body: 'Inter',
          },
        },
      })
      .onConflictDoUpdate({
        target: tenants.subdomain,
        set: {
          name: 'Adel Store',
          plan: 'pro',
          uiConfig: {
            primaryColor: '#007bff',
            logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&h=200&auto=format&fit=crop',
            currency: 'EGP',
            fonts: {
              heading: 'Inter',
              body: 'Inter',
            },
          },
        },
      })
      .returning();

    console.log(`✅ Tenant ${tenant.subdomain} updated in public registry.`);

    // 2. Switch Context to Tenant Schema
    console.log(`🛡️ Switching context to ${SCHEMA_NAME}...`);
    await pool.query(`SET search_path TO "${SCHEMA_NAME}"`);

    // 3. Seed Categories
    console.log('📂 Seeding Categories...');
    const categoriesData = [
      {
        slug: 'smartphones',
        name: 'Smartphones',
        description: 'Latest mobile phones',
      },
      {
        slug: 'laptops',
        name: 'Laptops',
        description: 'Powerful computing machines',
      },
      { slug: 'audio', name: 'Audio', description: 'Premium sound equipment' },
      {
        slug: 'watches',
        name: 'Watches',
        description: 'Smart and classic watches',
      },
    ];

    for (const cat of categoriesData) {
      await db.insert(categories).values(cat).onConflictDoNothing();
    }

    const [catSmartphones] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'smartphones'))
      .limit(1);
    const [catLaptops] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'laptops'))
      .limit(1);
    const [catAudio] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'audio'))
      .limit(1);
    const [catWatches] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'watches'))
      .limit(1);

    // 4. Seed Banners
    console.log('🖼️ Seeding Banners...');
    await pool.query('DELETE FROM banners'); // Reset banners for fresh look
    await db.insert(banners).values([
      {
        title: 'Tech Revolution 2026',
        subtitle: 'Experience the future with our latest arrivals.',
        imageUrl:
          'https://images.unsplash.com/photo-1519389950473-b7bc5658ab39?q=80&w=1600&h=600&auto=format&fit=crop',
        linkUrl: '/shop',
        ctaText: 'Shop Now',
        position: 'hero',
        priority: 10,
        backgroundColor: '#000000',
        textColor: '#ffffff',
      },
      {
        title: 'Premium Audio Collection',
        subtitle: 'Lossless sound for the true audiophile.',
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&h=600&auto=format&fit=crop',
        linkUrl: '/shop/audio',
        ctaText: 'Discover Sound',
        position: 'hero',
        priority: 5,
      },
    ]);

    // 5. Seed Products
    console.log('🛒 Seeding Products...');
    const productList = [
      {
        slug: 'iphone-15-pro',
        name: 'iPhone 15 Pro',
        description:
          'Titanium design, A17 Pro chip, Customizable Action button.',
        price: '45000.00',
        compareAtPrice: '48000.00',
        categoryId: catSmartphones.id,
        isFeatured: true,
        quantity: 50,
        brand: 'Apple',
        imageUrl: 'https://storage.60sec.shop/tenant-adel-assets/public/1.jpg',
      },
      {
        slug: 'macbook-air-m3',
        name: 'Macbook Air M3',
        description:
          'Leaning. Mean. M3. The world’s most popular laptop is even better.',
        price: '62000.00',
        categoryId: catLaptops.id,
        isFeatured: true,
        quantity: 20,
        brand: 'Apple',
        imageUrl: 'https://storage.60sec.shop/tenant-adel-assets/public/2.jpg',
      },
      {
        slug: 'sony-wh-1000xm5',
        name: 'Sony WH-1000XM5',
        description:
          'Industry-leading noise cancellation and premium sound quality.',
        price: '18000.00',
        compareAtPrice: '20000.00',
        categoryId: catAudio.id,
        isFeatured: false,
        quantity: 35,
        brand: 'Sony',
        imageUrl: 'https://storage.60sec.shop/tenant-adel-assets/public/3.jpg',
      },
      {
        slug: 'apple-watch-series-9',
        name: 'Apple Watch Series 9',
        description:
          'Smarter. Brighter. Mightier. The most advanced health sensors.',
        price: '22000.00',
        categoryId: catWatches.id,
        isFeatured: true,
        quantity: 100,
        brand: 'Apple',
        imageUrl: 'https://storage.60sec.shop/tenant-adel-assets/public/4.jpg',
      },
      {
        slug: 'ipad-pro-m2',
        name: 'iPad Pro M2',
        description: 'Astonishing performance. Incredibly advanced displays.',
        price: '35000.00',
        categoryId: catLaptops.id,
        isFeatured: false,
        quantity: 15,
        brand: 'Apple',
        imageUrl: 'https://storage.60sec.shop/tenant-adel-assets/public/5.jpg',
      },
    ];

    for (const p of productList) {
      const { imageUrl, ...pData } = p;
      const [insertedProduct] = await db
        .insert(products)
        .values(pData as any)
        .onConflictDoUpdate({
          target: products.slug,
          set: pData as any,
        })
        .returning();

      // Seed Product Image
      if (imageUrl) {
        await db
          .insert(productImages)
          .values({
            productId: insertedProduct.id,
            url: imageUrl,
            isPrimary: true,
            altText: p.name,
          })
          .onConflictDoNothing();
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
