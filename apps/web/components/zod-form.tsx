'use client';

import { z, ZodTypeAny } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';

export type FormField = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'date' | 'password';
  options?: { label: string; value: string }[];
  placeholder?: string;
  setValueAs?: (value: any) => any;
};

export type AiAction = {
  label: string;
  onInvoke: (values: any) => Promise<string> | string;
};

type SchemaFormProps<TSchema extends ZodTypeAny> = {
  schema: TSchema;
  fields: FormField[];
  defaultValues?: Partial<z.infer<TSchema>>;
  onSubmit?: (values: z.infer<TSchema>) => Promise<void> | void;
  submitLabel?: string;
  aiActions?: AiAction[];
};

export function SchemaForm<TSchema extends ZodTypeAny>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitLabel = 'Salvar',
  aiActions = [],
}: SchemaFormProps<TSchema>) {
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues as any);
    }
  }, [defaultValues, reset]);

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  const handleAiAction = async (action: AiAction) => {
    const result = await action.onInvoke(getValues());
    setAiMessage(result);
  };

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">{field.label}</span>
            {renderInput(field, register)}
            {errors[field.name as keyof typeof errors] ? (
              <span className="text-xs text-red-600">
                {(errors[field.name as keyof typeof errors]?.message as string) ?? 'Campo inválido'}
              </span>
            ) : null}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {submitLabel}
        </button>
        {aiActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleAiAction(action)}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            {`IA: ${action.label}`}
          </button>
        ))}
      </div>
      {aiMessage ? <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">{aiMessage}</p> : null}
    </form>
  );
}

function renderInput(field: FormField, register: ReturnType<typeof useForm>['register']) {
  const registerResult = register(field.name as any, {
    valueAsNumber: field.type === 'number',
    setValueAs: field.setValueAs,
  });

  const common = {
    className:
      'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none',
    placeholder: field.placeholder,
    ...registerResult,
  };

  switch (field.type) {
    case 'textarea':
      return <textarea rows={3} {...common} />;
    case 'select':
      return (
        <select {...common}>
          <option value="">Selecione</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case 'number':
      return <input type="number" step="any" {...common} />;
    case 'date':
      return <input type="date" {...common} />;
    case 'password':
      return <input type="password" {...common} />;
    default:
      return <input type="text" {...common} />;
  }
}
