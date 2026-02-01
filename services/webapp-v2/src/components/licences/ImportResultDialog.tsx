import { AlertTriangle, ChevronDown, Plus, RefreshCw, SkipForward } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ImportResult } from '@/api/licences.api';

type Props = {
  result: ImportResult | null;
  onClose: () => void;
};

function Section({
  title,
  icon: Icon,
  count,
  color,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded p-2 text-sm font-medium hover:bg-muted">
        <Icon className={`h-4 w-4 ${color}`} />
        {title} ({count})
        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">
        <div className="max-h-60 overflow-y-auto rounded border p-2 text-xs space-y-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ImportResultDialog({ result, onClose }: Props) {
  if (!result) return null;

  const { summary, details } = result;

  return (
    <Dialog open={!!result} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Résultat de l'import e-licence</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {summary.created > 0 && (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              {summary.created} créée{summary.created > 1 ? 's' : ''}
            </Badge>
          )}
          {summary.updated > 0 && (
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              {summary.updated} mise{summary.updated > 1 ? 's' : ''} à jour
            </Badge>
          )}
          {summary.unchanged > 0 && (
            <Badge variant="secondary">
              {summary.unchanged} inchangée{summary.unchanged > 1 ? 's' : ''}
            </Badge>
          )}
          {summary.skipped > 0 && (
            <Badge variant="destructive">
              {summary.skipped} ignorée{summary.skipped > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <Section title="Avertissements" icon={AlertTriangle} count={details.warnings.length} color="text-amber-500">
            {details.warnings.map((w, i) => (
              <div key={i}>
                <strong>{w.firstName} {w.name}</strong> ({w.licenceNumber}) — {w.message}
              </div>
            ))}
          </Section>

          <Section title="Mises à jour" icon={RefreshCw} count={details.updated.length} color="text-blue-500">
            {details.updated.map((u, i) => (
              <div key={i}>
                <strong>{u.firstName} {u.name}</strong> ({u.licenceNumber}) — {u.changes.join(', ')}
              </div>
            ))}
          </Section>

          <Section title="Créées" icon={Plus} count={details.created.length} color="text-emerald-500">
            {details.created.map((c, i) => (
              <div key={i}>
                <strong>{c.firstName} {c.name}</strong> ({c.licenceNumber}) — {c.club}
              </div>
            ))}
          </Section>

          <Section title="Ignorées" icon={SkipForward} count={details.skipped.length} color="text-red-500">
            {details.skipped.map((s, i) => (
              <div key={i}>
                <strong>{s.rider}</strong> — {s.reason}
              </div>
            ))}
          </Section>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
