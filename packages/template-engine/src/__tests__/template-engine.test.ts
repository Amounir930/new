/**
 * Template Engine Tests
 * Core functionality tests
 */

import { describe, it, expect } from 'bun:test'
import {
    getComponent,
    hasComponent,
    getAllComponentNames,
    validateTemplate,
    homeTemplate,
    productTemplate,
    cartTemplate,
    checkoutTemplate,
} from '../index'

describe('Component Registry', () => {
    it('should find registered components', () => {
        const Button = getComponent('Button')
        expect(Button).toBeDefined()
    })

    it('should return undefined for non-existent components', () => {
        const component = getComponent('NonExistent')
        expect(component).toBeUndefined()
    })

    it('should check component existence', () => {
        expect(hasComponent('Button')).toBe(true)
        expect(hasComponent('Marquee')).toBe(true)
        expect(hasComponent('PaymentInput')).toBe(true)
        expect(hasComponent('NonExistent')).toBe(false)
    })

    it('should return all component names', () => {
        const names = getAllComponentNames()
        expect(names.length).toBeGreaterThan(0)
        expect(names).toContain('Button')
        expect(names).toContain('Marquee')
        expect(names).toContain('PaymentInput')
    })
})

describe('Template Validation', () => {
    it('should validate home template', () => {
        expect(() => validateTemplate(homeTemplate)).not.toThrow()
    })

    it('should validate product template', () => {
        expect(() => validateTemplate(productTemplate)).not.toThrow()
    })

    it('should validate cart template', () => {
        expect(() => validateTemplate(cartTemplate)).not.toThrow()
    })

    it('should validate checkout template', () => {
        expect(() => validateTemplate(checkoutTemplate)).not.toThrow()
    })

    it('should reject invalid template', () => {
        const invalid = { id: 'test' } // Missing required fields
        expect(() => validateTemplate(invalid)).toThrow()
    })
})

describe('Template Structure', () => {
    it('home template should have correct metadata', () => {
        expect(homeTemplate.id).toBe('home-default')
        expect(homeTemplate.metadata.rtlSupport).toBe(true)
        expect(homeTemplate.metadata.category).toBe('home')
    })

    it('product template should have slots', () => {
        expect(productTemplate.slots.length).toBeGreaterThan(0)
    })

    it('cart template should support RTL', () => {
        expect(cartTemplate.metadata.rtlSupport).toBe(true)
        expect(cartTemplate.metadata.locales).toContain('ar')
    })

    it('checkout template should have payment forms', () => {
        const hasPayment = JSON.stringify(checkoutTemplate).includes('PaymentInput')
        expect(hasPayment).toBe(true)
    })
})
