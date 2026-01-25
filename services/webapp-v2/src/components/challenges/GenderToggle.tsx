import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { GenderType } from '@/types/challenges';

type Props = {
  value: GenderType;
  onChange: (value: GenderType) => void;
};

export function GenderToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={v => v && onChange(v as GenderType)}
      className="gap-1"
    >
      <ToggleGroupItem value="H" aria-label="Hommes" className="px-4">
        Hommes
      </ToggleGroupItem>
      <ToggleGroupItem value="F" aria-label="Femmes" className="px-4">
        Femmes
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
