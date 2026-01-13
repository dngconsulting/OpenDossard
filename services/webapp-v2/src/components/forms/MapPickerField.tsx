import {
  Controller,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';

import { Field, FieldLabel, FieldError } from '@/components/ui/field';

import { MapPicker } from './MapPicker.tsx';

const ControlledMapPickerField = ({
  field,
  fieldState,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any>;
  fieldState: ControllerFieldState;
  label: string;
}) => (
  <Field data-invalid={fieldState.invalid}>
    <FieldLabel htmlFor="map-picker-input">{label}</FieldLabel>
    <MapPicker value={field.value} onChange={field.onChange} />
    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
  </Field>
);

type MapPickerFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  label: string;
  field: Path<T>;
};

export function MapPickerField<T extends FieldValues>({
  form,
  label,
  field,
}: MapPickerFieldProps<T>) {
  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field, fieldState }) => (
        <ControlledMapPickerField field={field} fieldState={fieldState} label={label} />
      )}
    />
  );
}
