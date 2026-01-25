import { ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const AVAILABLE_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'ORGANISATEUR', label: 'Organisateur' },
] as const;

type RolesMultiSelectProps = {
  roles: string;
  onChange?: (roles: string) => void;
  disabled?: boolean;
};

export function RolesMultiSelect({ roles, onChange, disabled = false }: RolesMultiSelectProps) {
  const rolesArray = roles ? roles.split(',').filter(Boolean) : [];

  const handleToggleRole = (role: string, checked: boolean) => {
    if (!onChange) return;

    let newRoles: string[];
    if (checked) {
      newRoles = [...rolesArray, role];
    } else {
      newRoles = rolesArray.filter(r => r !== role);
    }
    onChange(newRoles.join(','));
  };

  const displayText = rolesArray.length > 0
    ? rolesArray.map(r => AVAILABLE_ROLES.find(ar => ar.value === r)?.label || r).join(', ')
    : 'Aucun rôle';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 min-w-[140px] justify-between px-3 font-normal"
          disabled={disabled}
        >
          <span className="truncate text-left">{displayText}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="flex flex-col gap-1">
          {AVAILABLE_ROLES.map(role => (
            <label
              key={role.value}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5"
            >
              <Checkbox
                checked={rolesArray.includes(role.value)}
                onCheckedChange={checked => handleToggleRole(role.value, !!checked)}
                disabled={disabled}
              />
              <span className="text-sm">{role.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
