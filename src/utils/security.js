/**
 * Utilitários de segurança para o frontend
 * Proteção contra XSS, validação de inputs, sanitização
 */

/**
 * Escapa HTML para prevenir XSS
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Sanitiza strings removendo caracteres potencialmente perigosos
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/**
 * Valida email
 */
export const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Valida senha forte
 */
export const isStrongPassword = (password) => {
  if (typeof password !== 'string') return false;
  
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) && // Pelo menos uma maiúscula
    /[a-z]/.test(password) && // Pelo menos uma minúscula
    /[0-9]/.test(password)    // Pelo menos um número
  );
};

/**
 * Valida nome (mínimo 2 caracteres, máximo 100)
 */
export const isValidName = (name) => {
  if (typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

/**
 * Remove scripts maliciosos de objetos
 */
export const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove propriedades potencialmente perigosas
    if (key.startsWith('__') || key.startsWith('$')) {
      continue;
    }
    
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
};

/**
 * Protege contra clickjacking verificando se está em iframe
 */
export const preventClickjacking = () => {
  if (window.self !== window.top) {
    // Está em iframe, redireciona para top
    window.top.location = window.self.location;
  }
};

/**
 * Valida CPF (formato brasileiro)
 */
export const isValidCPF = (cpf) => {
  if (typeof cpf !== 'string') return false;
  
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  
  return true;
};

/**
 * Valida CNPJ (formato brasileiro)
 */
export const isValidCNPJ = (cnpj) => {
  if (typeof cnpj !== 'string') return false;
  
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação dos dígitos verificadores
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Mascara CPF
 */
export const maskCPF = (cpf) => {
  if (!cpf) return '';
  return cpf
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Mascara CNPJ
 */
export const maskCNPJ = (cnpj) => {
  if (!cnpj) return '';
  return cnpj
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/**
 * Mascara telefone
 */
export const maskPhone = (phone) => {
  if (!phone) return '';
  phone = phone.replace(/\D/g, '');
  
  if (phone.length <= 10) {
    return phone
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    return phone
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
};

/**
 * Valida URL
 */
export const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Limita tamanho de string
 */
export const limitString = (str, maxLength) => {
  if (typeof str !== 'string') return str;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

/**
 * Debounce para prevenir spam de requisições
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle para limitar taxa de execução
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeObject,
  isValidEmail,
  isStrongPassword,
  isValidName,
  isValidCPF,
  isValidCNPJ,
  isValidUrl,
  maskCPF,
  maskCNPJ,
  maskPhone,
  limitString,
  debounce,
  throttle,
  preventClickjacking
};
