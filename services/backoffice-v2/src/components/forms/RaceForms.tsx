import {zodResolver} from '@hookform/resolvers/zod';
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

import {Editor} from '@/components/blocks/editor-00/editor.tsx';
import {CheckboxField, FieldDescription, FieldGroup, FieldLegend, FieldSet, StringField} from '@/components/ui/field.tsx';
import {Form} from '@/components/ui/form.tsx';

import {MapPickerField} from './MapPickerField.tsx';

import type {SerializedEditorState} from 'lexical';


const formSchema = z.object({
    name: z.string(),
    date: z.date(),
    type: z.string(),
    zipCode: z.string(),
    club: z.string(),
    federation: z.string(),
    categories: z.array(z.string()).min(1),
    trail_distance: z.number().min(0),
    trail_profile: z.string(),
    contact_name: z.string(),
    contact_email: z.email(),
    contact_phone: z.string(),
    facebook_link: z.url().optional(),
    website_link: z.url().optional(),
    speaker: z.string().optional(),
    commissaires: z.string().optional(),
    podiumGPS: z.string().optional().refine((val) => {
        if (!val) {
            return true;
        }
        const [lat, lng] = val.split(',').map(Number);
        return !isNaN(lat) && !isNaN(lng) &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;
    }, "Coordonnées GPS invalides")
});

export const RaceGeneralForm = () => {
    const [editorState, setEditorState] =
        useState<SerializedEditorState>()
    const raceForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {}
    });

    return (
        <Form {...raceForm}>
            <form className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend>Informations générales</FieldLegend>
                        <FieldDescription>
                            Informations de base sur l'épreuve
                        </FieldDescription>
                    </FieldSet>
                    <FieldSet>
                        <StringField form={raceForm} label="Nom de l'épreuve" field="name"/>
                        <StringField form={raceForm} label="Date" field="date"/>
                        <StringField form={raceForm} label="Federation" field="federation"/>
                        <StringField form={raceForm} label="Code postal" field="zipCode"/>
                        <StringField form={raceForm} label="Club organisateur" field="club"/>
                    </FieldSet>
                </FieldGroup>
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend>Informations contact</FieldLegend>
                        <FieldDescription>
                            Contact de l'épreuve pour les participants
                        </FieldDescription>
                    </FieldSet>
                    <FieldSet>
                        <StringField form={raceForm} label="Nom du contact" field="contact_name"/>
                        <StringField form={raceForm} label="Téléphone du contact" field="contact_phone"/>
                        <StringField form={raceForm} label="Email du contact" field="contact_email" type="email" autoComplete="email"/>
                    </FieldSet>
                </FieldGroup>
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend>Informations circuit</FieldLegend>
                        <FieldDescription>
                            Détails sur le circuit de l'épreuve
                        </FieldDescription>
                    </FieldSet>
                    <FieldSet>
                        <StringField form={raceForm} label="Type de course" field="type"/>
                        <StringField form={raceForm} label="Longueur circuit" field="trail_distance"/>
                        <StringField form={raceForm} label="Profile circuit" field="trail_profile"/>
                    </FieldSet>
                </FieldGroup>
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend>Informations complémentailres</FieldLegend>
                        <FieldDescription>
                            Détails sur le circuit de l'épreuve
                        </FieldDescription>
                    </FieldSet>
                    <FieldSet>
                        <StringField form={raceForm} label="Lien facebook" field="facebook_link"/>
                        <StringField form={raceForm} label="Lien site web" field="website_link"/>
                        <StringField form={raceForm} label="Speaker" field="speaker"/>
                        <StringField form={raceForm} label="Commissaires" field="commissaires"/>
                        <CheckboxField form={raceForm} label="Ouvert toutes fédés" field="contact_name"/>
                        <CheckboxField form={raceForm} label="Ouvert non licenciés" field="contact_name"/>
                        <CheckboxField form={raceForm} label="Chronométré" field="contact_name"/>
                    </FieldSet>
                </FieldGroup>
                <FieldGroup className="col-span-2">
                    <FieldSet>
                        <FieldLegend>Description</FieldLegend>
                    </FieldSet>
                    <FieldSet>
                        <Editor
                            editorSerializedState={editorState}
                            onSerializedChange={(value) => setEditorState(value)}
                        />
                    </FieldSet>
                </FieldGroup>
                <FieldGroup className="col-span-2">
                    <FieldSet>
                        <FieldLegend>Emplacement Podium</FieldLegend>
                        <FieldDescription>
                            Cliquez sur la carte pour définir l'emplacement de la cérémonie des podiums
                        </FieldDescription>
                    </FieldSet>
                    <FieldSet>
                        <MapPickerField
                            form={raceForm}
                            label="Position GPS du podium"
                            field="podiumGPS"
                        />
                    </FieldSet>
                </FieldGroup>
            </form>
        </Form>
    );
}
