import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CepInput } from '@/components/ui/masked';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'TO', name: 'Tocantins' }
];

/**
 * AddressForm Component
 * Form for address information with ViaCEP integration
 */
export function AddressForm() {
  const { register, control, formState: { errors }, watch, setValue } = useFormContext();
  const stateValue = watch('state');
  const zipCodeValue = watch('zipCode');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState(null);

  /**
   * Busca endereço via ViaCEP quando CEP é preenchido
   * @requires CEP com 8 dígitos numéricos (sem máscara)
   */
  const fetchAddressFromCep = async (cep) => {
    if (!cep) return;

    // CEP já vem limpo do CepInput (unmask=true)
    const cleanCep = cep;
    if (!/^\d{8}$/.test(cleanCep)) {
      console.warn('CEP format invalid after unmask:', cleanCep);
      return;
    }

    setLoadingCep(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        return;
      }

      // Map ViaCEP response to form fields
      setValue('street', data.logradouro || '');
      setValue('district', data.bairro || '');
      setValue('city', data.localidade || '');
      setValue('state', data.uf || '');
    } catch (error) {
      console.error('Error fetching CEP:', error);
      setCepError('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  // Watch zipCode changes and fetch address when complete
  useEffect(() => {
    if (zipCodeValue && zipCodeValue.length === 8) {
      fetchAddressFromCep(zipCodeValue);
    }
  }, [zipCodeValue]);

  return (
    <div className="space-y-4">
      {/* Linha 1: CEP + RUA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-1">
          <CepInput
            name="zipCode"
            control={control}
            error={errors.zipCode}
          />
          {loadingCep && (
            <Loader2 className="absolute right-3 top-8 w-4 h-4 animate-spin text-slate-400" />
          )}
          {cepError && (
            <p className="text-sm text-amber-600 mt-1">{cepError}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="street">Rua *</Label>
          <Input
            id="street"
            placeholder="Rua das Flores"
            {...register('street')}
            className={errors.street ? 'border-red-500' : ''}
          />
          {errors.street && (
            <p className="text-sm text-red-500 mt-1">{errors.street.message}</p>
          )}
        </div>
      </div>

      {/* Linha 2: NÚMERO + COMPLEMENTO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <Label htmlFor="number">Número *</Label>
          <Input
            id="number"
            placeholder="123"
            {...register('number')}
            className={errors.number ? 'border-red-500' : ''}
          />
          {errors.number && (
            <p className="text-sm text-red-500 mt-1">{errors.number.message}</p>
          )}
        </div>

        <div className="md:col-span-3">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            placeholder="Apto 456, Bloco B"
            {...register('complement')}
            className={errors.complement ? 'border-red-500' : ''}
          />
          {errors.complement && (
            <p className="text-sm text-red-500 mt-1">{errors.complement.message}</p>
          )}
        </div>
      </div>

      {/* Linha 3: BAIRRO + CIDADE + ESTADO */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="district">Bairro *</Label>
          <Input
            id="district"
            placeholder="Centro"
            {...register('district')}
            className={errors.district ? 'border-red-500' : ''}
          />
          {errors.district && (
            <p className="text-sm text-red-500 mt-1">{errors.district.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            placeholder="São Paulo"
            {...register('city')}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && (
            <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="state">Estado *</Label>
          <Select value={stateValue || ''} onValueChange={(value) => setValue('state', value)}>
            <SelectTrigger id="state" className={errors.state ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {BRAZILIAN_STATES.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name} ({state.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
