import React from 'react';
import { MaskedInput } from './MaskedInput';

export function CepInput({ label = 'CEP', placeholder = '00000-000', ...props }) {
  return (
    <MaskedInput
      {...props}
      label={label}
      placeholder={placeholder}
      mask="00000-000"
      unmask={true}
    />
  );
}
