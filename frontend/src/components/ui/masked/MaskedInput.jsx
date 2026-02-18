import React from 'react';
import { Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * MaskedInput - Componente base para inputs com máscara
 * Integra IMask com React Hook Form
 */
export function MaskedInput({
  name,
  control,
  label,
  error,
  mask,
  unmask = 'typed', // 'typed' | true | false
  placeholder,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={name}>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <IMaskInput
            {...field}
            {...props}
            id={name}
            mask={mask}
            unmask={unmask}
            placeholder={placeholder}
            disabled={disabled}
            onAccept={(value, maskRef) => {
              // Salva o valor sem máscara no form
              field.onChange(maskRef.unmaskedValue);
            }}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors',
              'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
              error ? 'border-red-500' : '',
              className
            )}
          />
        )}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}
