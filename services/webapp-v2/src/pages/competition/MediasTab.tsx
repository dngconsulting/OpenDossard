import { Edit2, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LinkItem } from '@/types/competitions';

import type { FormValues } from './types';

export function MediasTab() {
  const form = useFormContext<FormValues>();

  const [mediaForm, setMediaForm] = useState<LinkItem>({ label: '', link: '' });
  const [editingMediaIndex, setEditingMediaIndex] = useState<number | null>(null);

  const {
    fields: photoUrlsFields,
    append: appendPhotoUrl,
    remove: removePhotoUrl,
    update: updatePhotoUrl,
  } = useFieldArray({
    control: form.control,
    name: 'photoUrls',
  });

  const handleAddMedia = () => {
    if (!mediaForm.label || !mediaForm.link) {
      return;
    }

    if (editingMediaIndex !== null) {
      updatePhotoUrl(editingMediaIndex, mediaForm);
      setEditingMediaIndex(null);
    } else {
      appendPhotoUrl(mediaForm);
    }
    setMediaForm({ label: '', link: '' });
  };

  const handleEditMedia = (index: number) => {
    setMediaForm(photoUrlsFields[index] as LinkItem);
    setEditingMediaIndex(index);
  };

  return (
    <Card className="rounded-t-none border-t-0">
      <CardHeader>
        <CardTitle>Photos & Medias</CardTitle>
        <CardDescription>Ajoutez des liens vers les albums photos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1.5">
            <Label>Nom de l'album</Label>
            <Input
              value={mediaForm.label}
              onChange={e => setMediaForm({ ...mediaForm, label: e.target.value })}
              placeholder="ex: Photos toutes catégories"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Lien de l'album</Label>
            <Input
              value={mediaForm.link}
              onChange={e => setMediaForm({ ...mediaForm, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="default" onClick={handleAddMedia}>
              {editingMediaIndex !== null ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingMediaIndex !== null ? 'Enregistrer' : 'Ajouter'}
            </Button>
            {editingMediaIndex !== null && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingMediaIndex(null);
                  setMediaForm({ label: '', link: '' });
                }}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>

        {photoUrlsFields.length > 0 ? (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de l'album</TableHead>
                  <TableHead>Lien</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {photoUrlsFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="whitespace-nowrap">{(field as LinkItem).label}</TableCell>
                    <TableCell>
                      <a
                        href={(field as LinkItem).link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 max-w-[200px] truncate"
                      >
                        {(field as LinkItem).link}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMedia(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePhotoUrl(index)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">Aucun lien encore ajouté</p>
        )}
      </CardContent>
    </Card>
  );
}
