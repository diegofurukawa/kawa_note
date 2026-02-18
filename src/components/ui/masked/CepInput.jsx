import { MaskedInput } from './MaskedInput';

/**
 * @param {Object} props
 * @param {string} [props.label='CEP']
 * @param {string} [props.placeholder='00000-000']
 * @param {string} props.name - Nome do campo no formulário
 * @param {any} props.control - Controle do React Hook Form
 * @param {any} [props.error] - Erro de validação
 */
export function CepInput({ label = 'CEP', placeholder = '00000-000', error, ...props }) {
  return (
    <MaskedInput
      {...props}
      label={label}
      placeholder={placeholder}
      mask="00000-000"
      unmask="typed"
      error={error}
    />
  );
}
