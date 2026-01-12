import { cva, type VariantProps } from "class-variance-authority"
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import {type HTMLInputAutoCompleteAttribute, type HTMLInputTypeAttribute, useMemo, useState} from 'react';
import {Controller, type ControllerFieldState, type ControllerRenderProps, type FieldValues, type Path, type UseFormReturn} from 'react-hook-form';

import { Button } from '@/components/ui/button.tsx';
import {Checkbox} from '@/components/ui/checkbox.tsx';
import {Input} from '@/components/ui/input';
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      )}
      {...props}
    />
  )
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
        responsive: [
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        ],
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",
        className
      )}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        className
      )}
      {...props}
    />
  )
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }

    if (!errors?.length) {
      return null
    }

    if (errors?.length === 1) {
      return errors[0]?.message
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {errors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])

  if (!content) {
    return null
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  )
}

const ControlledStringField = ({
                                   field,
                                   fieldState,
                                   label,
                                   type,
                                   autoComplete = 'off'
                               }: {
    field: ControllerRenderProps<any>,
    fieldState: ControllerFieldState,
    label: string,
    type: HTMLInputTypeAttribute
    autoComplete?: HTMLInputAutoCompleteAttribute
}) => (
    <Field data-invalid={fieldState.invalid}>
        <FieldLabel htmlFor="lastName-input">
            {label}
        </FieldLabel>
        <Input
            {...field}
            id="lastName-input"
            aria-invalid={fieldState.invalid}
            autoComplete={autoComplete}
            type={type}
        />
        {fieldState.invalid && (
            <FieldError errors={[fieldState.error]}/>
        )}
    </Field>
);

type StringFieldProps<T extends FieldValues> = {
    form: UseFormReturn<T>
    label: string,
    field: Path<T>,
    type?: HTMLInputTypeAttribute,
    autoComplete?: HTMLInputAutoCompleteAttribute
}

export function StringField<T extends FieldValues>({form, label, field, type = "text", autoComplete = 'off'}: StringFieldProps<T>) {
    return (
        <Controller
            control={form.control}
            name={field}
            render={({field, fieldState}) => (
                <ControlledStringField
                    field={field}
                    fieldState={fieldState}
                    label={label}
                    type={type}
                    autoComplete={autoComplete}
                />
            )}
        />

    );
}

const ControlledSelectField = ({
                              field,
                              fieldState,
                              label,
                              options
}: {
  field: ControllerRenderProps<any>,
  fieldState: ControllerFieldState,
  label: string,
  options: { value: string | number, label?: string }[]
}) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldContent>
        <FieldLabel htmlFor="lastName-input">
          {label}
        </FieldLabel>
        {fieldState.invalid && (
            <FieldError errors={[fieldState.error]} />
        )}
      </FieldContent>
      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger
            aria-invalid={fieldState.invalid}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
              <SelectItem
                  key={`input-${label}-option-${option.value}`}
                  value={option.value.toString()}
              >
                {option.label ?? option.value}
              </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
)


type SelectFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>
  label: string,
  field: Path<T>,
  options: { value: string | number, label?: string }[]
}

export function SelectField<T extends FieldValues>({
                                form,
                                label,
                                field,
                                options
                            }: SelectFieldProps<T>) {
    return (

        <Controller
            control={form.control}
            name={field}
            render={({field, fieldState}) => (
                <ControlledSelectField
                    field={field}
                    fieldState={fieldState}
                    label={label}
                    options={options}
                />
            )}
        />
    );
}

const ControlledCheckboxField = ({
                                   field,
                                   fieldState,
                                   label,
                               }: {
    field: ControllerRenderProps<any>,
    fieldState: ControllerFieldState,
    label: string,
}) => (
    <Field data-invalid={fieldState.invalid} orientation="horizontal">
        <FieldLabel>
            <Checkbox
                {...field}
                checked={field.value}
                aria-invalid={fieldState.invalid}
            />
            {label}
        </FieldLabel>
        {fieldState.invalid && (
            <FieldError errors={[fieldState.error]}/>
        )}
    </Field>
);

type CheckboxFieldProps<T extends FieldValues> = {
    form: UseFormReturn<T>
    label: string,
    field: Path<T>,
}

export function CheckboxField<T extends FieldValues>({form, label, field}: CheckboxFieldProps<T>) {
    return (
        <Controller
            control={form.control}
            name={field}
            render={({field, fieldState}) => (
                <ControlledCheckboxField
                    field={field}
                    fieldState={fieldState}
                    label={label}
                />
            )}
        />
    );
}

type ComboboxOption = {
  value: string;
  label: string;
};

type ComboboxFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  label: string;
  field: Path<T>;
  options: ComboboxOption[];
  onCreateNew?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
};

function ControlledComboboxField({
  field,
  fieldState,
  label,
  options,
  onCreateNew,
  placeholder = 'Rechercher...',
  isLoading,
  disabled,
}: {
  field: ControllerRenderProps<any>;
  fieldState: ControllerFieldState;
  label: string;
  options: ComboboxOption[];
  onCreateNew?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerSearch = search.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lowerSearch));
  }, [options, search]);

  const selectedOption = options.find(opt => opt.value === field.value);
  const showCreateOption = search && !filteredOptions.some(opt => opt.label.toLowerCase() === search.toLowerCase());

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
      </FieldContent>
      <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            {selectedOption?.label ?? placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] overflow-hidden p-0" align="start">
          <div className="p-2">
            <Input
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div
            className="max-h-60 overflow-y-auto overscroll-contain"
            onWheel={e => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Chargement...</div>
            ) : filteredOptions.length === 0 && !showCreateOption ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Aucun résultat</div>
            ) : (
              <div className="p-1">
                {filteredOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      field.value === option.value && 'bg-accent'
                    )}
                    onClick={() => {
                      field.onChange(option.value);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        field.value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </button>
                ))}
                {showCreateOption && onCreateNew && (
                  <button
                    type="button"
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary"
                    onClick={() => {
                      onCreateNew(search);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer "{search}"
                  </button>
                )}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  );
}

export function ComboboxField<T extends FieldValues>({
  form,
  label,
  field,
  options,
  onCreateNew,
  placeholder,
  isLoading,
  disabled,
}: ComboboxFieldProps<T>) {
  return (
    <Controller
      control={form.control}
      name={field}
      render={({ field, fieldState }) => (
        <ControlledComboboxField
          field={field}
          fieldState={fieldState}
          label={label}
          options={options}
          onCreateNew={onCreateNew}
          placeholder={placeholder}
          isLoading={isLoading}
          disabled={disabled}
        />
      )}
    />
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
