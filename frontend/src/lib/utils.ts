import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('ar-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateTime(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  return (...args: Parameters<T>) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(null, args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

export function validateEmiratesId(emiratesId: string): boolean {
  // UAE Emirates ID validation logic
  const cleanId = emiratesId.replace(/[-\s]/g, '')
  
  if (cleanId.length !== 15) return false
  if (!/^\d+$/.test(cleanId)) return false
  
  // Check if it starts with 784 (UAE country code)
  if (!cleanId.startsWith('784')) return false
  
  // Luhn algorithm for checksum validation
  let sum = 0
  let isEven = false
  
  for (let i = cleanId.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanId[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit = digit.toString().split('').reduce((a, b) => parseInt(a.toString(), 10) + parseInt(b.toString(), 10), 0)
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

export function validatePhoneNumber(phone: string, countryCode: string = '+971'): boolean {
  // UAE phone number validation
  const cleanPhone = phone.replace(/[-\s()]/g, '')
  
  if (countryCode === '+971') {
    // UAE mobile numbers: +971 5x xxx xxxx or +971 56 xxx xxxx
    const uaePattern = /^(\+971|971|0)?[56789]\d{8}$/
    return uaePattern.test(cleanPhone)
  }
  
  return cleanPhone.length >= 10 && cleanPhone.length <= 15
}

export function validateUAEPhone(phone: string): boolean {
  // Specific UAE phone validation function
  const cleanPhone = phone.replace(/[-\s()]/g, '')
  
  // UAE mobile numbers patterns:
  // +971 5x xxx xxxx (most common mobile)
  // +971 56 xxx xxxx
  // +971 58 xxx xxxx  
  // +971 59 xxx xxxx
  // Also allow landlines: +971 2 xxx xxxx, +971 3 xxx xxxx, +971 4 xxx xxxx, +971 6 xxx xxxx, +971 7 xxx xxxx
  const uaePattern = /^(\+971|971|0)?[23456789]\d{7,8}$/
  return uaePattern.test(cleanPhone)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}

export function isRTL(text: string): boolean {
  const rtlPattern = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/
  return rtlPattern.test(text)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      const ratio = Math.min(maxWidth / width, maxWidth / height)
      
      canvas.width = width * ratio
      canvas.height = height * ratio
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to compress image'))
        }
      }, 'image/jpeg', quality)
    }
    
    img.src = URL.createObjectURL(file)
  })
} 