import {FileSpreadsheet, FileText, MoreHorizontal, Plus, Upload} from 'lucide-react';
import {useState} from 'react';

import {LicencesDataTable} from '@/components/data/LicencesTable.tsx';
import {LicencesForm} from '@/components/forms/LicencesForm.tsx';
import {useLicences} from '@/hooks/useLicences';
import Layout from '@/components/layout/Layout.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {FieldSeparator} from '@/components/ui/field.tsx';
import type {LicenceType} from '@/types/licences.ts';

export default function LicencesPage() {
    const [licence, setLicence] = useState<LicenceType | undefined>(undefined);
    const [deleteLicence, setDeleteLicence] = useState<LicenceType | undefined>(undefined);
    const { data } = useLicences();
    const totalLicences = data?.meta?.total ?? 0;
    const EditLicence = () => (
        <Dialog open={!!licence} onOpenChange={(open: boolean) => !open && setLicence(undefined)}>
            <DialogTrigger asChild>
                <Button variant="success" onClick={() => setLicence({} as LicenceType)}><Plus/> Ajouter une licence</Button>
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


    const toolbarLeft = (
        <span className="text-sm text-muted-foreground">
            Nombre de licences : <strong className="text-foreground">{totalLicences}</strong>
        </span>
    );

    const toolbar = (
        <>
            <EditLicence />
            <DeleteLicence />
            {/* Desktop: boutons visibles */}
            <Button variant="action" className="hidden md:flex"><FileText /> Export PDF</Button>
            <Button variant="action" className="hidden md:flex"><FileSpreadsheet /> Export CSV</Button>
            <Button variant="action" className="hidden md:flex"><Upload /> Import e-licence</Button>
            {/* Mobile: menu déroulant */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                    <Button variant="action" size="icon">
                        <MoreHorizontal />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Upload className="mr-2 h-4 w-4" /> Import e-licence
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );

    return (
        <Layout title="Licences" toolbar={toolbar} toolbarLeft={toolbarLeft}>
            <LicencesDataTable
                onEdit={(row: LicenceType) => setLicence(row)}
                onDelete={(row: LicenceType) => setDeleteLicence(row)}
            />
        </Layout>
    );
}
