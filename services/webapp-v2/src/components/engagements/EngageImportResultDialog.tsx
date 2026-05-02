import { AlertTriangle, ChevronDown, Copy, Plus, AlertCircle } from 'lucide-react';
import { useState } from 'react';

import type { ImportEngagesAnomaly, ImportEngagesResult } from '@/api/races.api';
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

type Props = {
  result: ImportEngagesResult | null;
  onClose: () => void;
};

function Section({
  title,
  icon: Icon,
  count,
  color,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) {return null;}

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded p-2 text-sm font-medium hover:bg-muted">
        <Icon className={`h-4 w-4 ${color}`} />
        {title} ({count})
        <ChevronDown
          className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">
        <div className="rounded border p-2 text-xs space-y-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function renderAnomaly(a: ImportEngagesAnomaly) {
  const head = (
    <strong>
      L.{a.line} {a.rider ? `— ${a.rider}` : ''} {a.licenceNumber ? `(${a.licenceNumber})` : ''}
    </strong>
  );
  if (a.kind === 'missing') {
    return (
      <>
        {head} — Champs manquants : {a.missingFields?.join(', ')}
      </>
    );
  }
  if (a.kind === 'divergent') {
    return (
      <>
        {head} — Divergences :{' '}
        {a.diffs?.map((d, i) => (
          <span key={i}>
            {i > 0 ? ' ; ' : ''}
            {d.field}: CSV="{d.csv ?? '∅'}" / DB="{d.db ?? '∅'}"
          </span>
        ))}
      </>
    );
  }
  return (
    <>
      {head} — {a.message}
    </>
  );
}

export function EngageImportResultDialog({ result, onClose }: Props) {
  if (!result) {return null;}

  const { summary, details } = result;

  return (
    <Dialog open={!!result} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Résultat de l'import des engagés</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 shrink-0">
          {summary.inserted > 0 && (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              {summary.inserted} inséré{summary.inserted > 1 ? 's' : ''}
            </Badge>
          )}
          {summary.duplicates > 0 && (
            <Badge className="bg-blue-600 text-white hover:bg-blue-600">
              {summary.duplicates} doublon{summary.duplicates > 1 ? 's' : ''}
            </Badge>
          )}
          {summary.unknownLicences > 0 && (
            <Badge variant="destructive">
              {summary.unknownLicences} licence{summary.unknownLicences > 1 ? 's' : ''} inconnue
              {summary.unknownLicences > 1 ? 's' : ''}
            </Badge>
          )}
          {summary.anomalies > 0 && (
            <Badge className="bg-amber-500 text-white hover:bg-amber-500">
              {summary.anomalies} anomalie{summary.anomalies > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="secondary">{summary.total} ligne{summary.total > 1 ? 's' : ''} au total</Badge>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto min-h-0 pr-1">
          <Section
            title="Anomalies de données"
            icon={AlertTriangle}
            count={details.anomalies.length}
            color="text-amber-500"
            defaultOpen
          >
            {details.anomalies.map((a, i) => (
              <div key={i}>{renderAnomaly(a)}</div>
            ))}
          </Section>

          <Section
            title="Licences inconnues"
            icon={AlertCircle}
            count={details.unknownLicences.length}
            color="text-red-500"
            defaultOpen
          >
            {details.unknownLicences.map((u, i) => (
              <div key={i}>
                <strong>L.{u.line}</strong> — {u.rider} ({u.licenceNumber})
              </div>
            ))}
          </Section>

          <Section
            title="Coureurs en double"
            icon={Copy}
            count={details.duplicates.length}
            color="text-blue-500"
          >
            {details.duplicates.map((d, i) => (
              <div key={i}>
                <strong>L.{d.line}</strong> — {d.rider} ({d.licenceNumber}) — déjà engagé sur la
                course {d.existingRaceCode || '?'} (CSV: {d.raceCode})
              </div>
            ))}
          </Section>

          <Section
            title="Insérés"
            icon={Plus}
            count={details.inserted.length}
            color="text-emerald-500"
          >
            {details.inserted.map((i2, i) => (
              <div key={i}>
                <strong>L.{i2.line}</strong>
                {i2.riderNumber != null ? ` — Dossard ${i2.riderNumber}` : ''} — {i2.rider} (
                {i2.licenceNumber}) → course {i2.raceCode}
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
