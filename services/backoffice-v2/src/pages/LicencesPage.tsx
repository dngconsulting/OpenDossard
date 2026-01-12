import {Table, FileText, Plus, Upload, Info} from 'lucide-react';
import {useState} from 'react';

import {OptionsButton} from '@/components/actions/OptionsButton.tsx';
import {LicencesDataTable} from '@/components/data/LicencesTable.tsx';
import {LicencesForm} from '@/components/forms/LicencesForm.tsx';
import Layout from '@/components/layout/Layout.tsx';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {FieldSeparator} from '@/components/ui/field.tsx';
import type {LicenceType} from '@/types/licences.ts';

export default function LicencesPage() {
    const [licence, setLicence] = useState<LicenceType | undefined>(undefined);
    const [deleteLicence, setDeleteLicence] = useState<LicenceType | undefined>(undefined);
    const EditLicence = () => (
        <Dialog open={!!licence} onOpenChange={(open: boolean) => !open && setLicence(undefined)}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setLicence({} as LicenceType)}><Plus/> Ajouter une licence</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90%] overflow-y-scroll sm:max-w-[calc(100%-2rem)] lg:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Formulaire licence</DialogTitle>
                    <DialogDescription>
                        Ici, vous pouvez créer / modifier une licence OpenDossard
                    </DialogDescription>
                </DialogHeader>
                <FieldSeparator/>
                <LicencesForm updatingLicence={licence}/>
            </DialogContent>
        </Dialog>
    )

    const DeleteLicence = () => (
        <Dialog open={!!deleteLicence} onOpenChange={(open: boolean) => !open && setDeleteLicence(undefined)}>
            <DialogContent className="max-h-[90%] overflow-y-scroll sm:max-w-[calc(100%-2rem)] lg:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Suppression de licence</DialogTitle>
                    <DialogDescription>
                        Voulez-vous supprimer la licence {deleteLicence?.licenceNumber} de manière définitive ?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="destructive">Supprimer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )


    return (
        <Layout title="Licences">
            <div className="flex">
                <Alert variant="default" className="w-full">
                    <Info />
                    <AlertTitle>Notice</AlertTitle>
                    <AlertDescription>
                        Les licences ne disposant pas de numéro peuvent être retrouvées en rechêrchant les licences ayant pour numéro "N/A"
                    </AlertDescription>
                </Alert>
            </div>
            <div className="flex gap-2 w-full justify-end">

                <EditLicence />
                <DeleteLicence />
                <OptionsButton
                    options={[
                        {label: 'Export PDF', icon: <Table/>},
                        {label: 'Export CSV', icon: <FileText/>},
                        {label: 'Import e-licence', icon: <Upload/>},
                    ]}
                />
            </div>
            <LicencesDataTable
                onEdit={(row: LicenceType) => setLicence(row)}
                onDelete={(row: LicenceType) => setDeleteLicence(row)}
            />
        </Layout>
    );
}
