/**
 * Utilitários de formatação e limpeza de máscaras
 */

// Limpeza (remover máscara)
export const unmask = (value) => value?.replace(/\D/g, '') || '';

// Formatação (aplicar máscara)
export const formatCPF = (value) => {
  const clean = unmask(value);
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return value;
};

export const formatCNPJ = (value) => {
  const clean = unmask(value);
  if (clean.length <= 14) {
    return clean
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  return value;
};

export const formatPhone = (value) => {
  const clean = unmask(value);
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  return value;
};

export const formatCEP = (value) => {
  const clean = unmask(value);
  if (clean.length <= 8) {
    return clean.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
  }
  return value;
};

export const formatDate = (value) => {
  // YYYY-MM-DD → DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return value;
};

export const formatDateTime = (value) => {
  // YYYY-MM-DDTHH:mm → DD/MM/YYYY HH:mm
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    const [date, time] = value.split('T');
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year} ${time.substring(0, 5)}`;
  }
  return value;
};

// Parsing (display → DB)
export const parseDateBR = (value) => {
  // DD/MM/YYYY → YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }
  return value;
};

export const parseDateTimeBR = (value) => {
  // DD/MM/YYYY HH:mm → YYYY-MM-DDTHH:mm
  if (/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/.test(value)) {
    const [date, time] = value.split(' ');
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}T${time}`;
  }
  return value;
};
