import {Plus} from 'lucide-react';
import { useState } from 'react';

import {UsersTable, type UserTableType} from '@/components/data/UsersTable.tsx';
import {UserForm} from '@/components/forms/UserForm.tsx';
import Layout from '@/components/layout/Layout.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog.tsx';



export default function UsersPage() {
    const [user, setuser] = useState<UserTableType>();
    const [deleteUser, setDeleteUser] = useState<UserTableType>();

    const EditUser = () => (
        <Dialog open={!!user} onOpenChange={(open: boolean) => !open && setuser(undefined)}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setuser({} as UserTableType)}><Plus/>Ajouter un utilisateur</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90%] overflow-y-scroll sm:max-w-[calc(100%-2rem)] md:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Formulaire utilisateur</DialogTitle>
                    <DialogDescription>
                        Ici, vous pouvez créer / modifier un utilisateur OpenDossard
                    </DialogDescription>
                </DialogHeader>
                <UserForm user={user} />
            </DialogContent>
        </Dialog>
    )

    const DeleteUser = () => (
        <Dialog open={!!deleteUser} onOpenChange={(open: boolean) => !open && setDeleteUser(undefined)}>
            <DialogContent className="max-h-[90%] overflow-y-scroll sm:max-w-[calc(100%-2rem)] lg:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Suppression d'utilisateur</DialogTitle>
                    <DialogDescription>
                        Voulez-vous supprimer l'utilisateur {deleteUser?.email} de manière définitive ?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="destructive">Supprimer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    return (
        <Layout title="Utilisateurs">
            <div className="flex gap-2 w-full justify-end">
                <EditUser />
                <DeleteUser />
            </div>
            <UsersTable onEditRow={setuser} onDeleteRow={setDeleteUser} />
        </Layout>
    );
}
