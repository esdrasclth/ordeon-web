'use client'

import React from 'react'

// Formatea el valor al escribir: +50432499610 → +504 3249-9610
export function formatHNPhone(raw: string): string {
    // Quitar todo excepto dígitos y el + inicial
    let digits = raw.replace(/[^\d]/g, '')

    // Si el usuario ya escribió el prefijo 504 sin el +
    if (digits.startsWith('504')) digits = digits.slice(3)

    // Limitar a 8 dígitos locales
    digits = digits.slice(0, 8)

    if (digits.length === 0) return ''
    if (digits.length <= 4) return `+504 ${digits}`
    return `+504 ${digits.slice(0, 4)}-${digits.slice(4)}`
}

export function isValidHNPhone(value: string | undefined | null): boolean {
    if (!value) return true // campo opcional
    return /^\+504 \d{4}-\d{4}$/.test(value)
}

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string
    onChange: (value: string) => void
    error?: string
    label?: string
    labelStyle?: React.CSSProperties
    inputStyle?: React.CSSProperties
    className?: string
}

export function PhoneInput({
    value,
    onChange,
    error,
    label,
    labelStyle,
    inputStyle,
    className,
    ...rest
}: PhoneInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatHNPhone(e.target.value)
        onChange(formatted)
    }

    return (
        <div>
            {label && (
                <label style={labelStyle}>{label}</label>
            )}
            <input
                {...rest}
                type="tel"
                value={value}
                onChange={handleChange}
                placeholder="+504 9999-9999"
                maxLength={14}
                className={className}
                style={inputStyle}
            />
            {error && (
                <p style={{ fontSize: 12, color: '#d94f4f', marginTop: 4 }}>{error}</p>
            )}
        </div>
    )
}
