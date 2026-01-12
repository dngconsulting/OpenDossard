import { UserRound, LucideMail, Phone } from "lucide-react";

import Layout from '@/components/layout/Layout.tsx';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar.tsx';
import {Card} from '@/components/ui/card.tsx';
import {Typo} from '@/components/ui/typo.tsx';
import useUserStore from '@/store/UserStore.ts';

export default function AccountPage() {
    const {user} = useUserStore();
    return (
        <Layout title="Account">
            <Card className="w-full md:w-fit p-7 self-center">
                <div className="flex flex-col">
                    <Avatar className="h-15 w-15 rounded-lg">
                        <AvatarImage alt={`${user!.firstName} ${user!.lastName}`}/>
                        <AvatarFallback className="rounded-lg">{`${user!.firstName[0]}${user!.lastName[0]}`}</AvatarFallback>
                    </Avatar>
                </div>
                <div>
                    <div className="flex flex-row justify-start gap-5">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-start items-center h-[20px] gap-2">
                                <UserRound size={15}/>
                                <Typo size="small" bold>Prénom</Typo>
                            </div>
                            <div className="flex flex-row justify-start items-center h-[20px] gap-2">
                                <UserRound size={15}/>
                                <Typo size="small" bold>Nom</Typo>
                            </div>
                            <div className="flex flex-row justify-start items-center h-[20px] gap-2">
                                <LucideMail size={15}/>
                                <Typo size="small" bold>Email</Typo>
                            </div>
                            <div className="flex flex-row justify-start items-center h-[20px] gap-2">
                                <Phone size={15}/>
                                <Typo size="small" bold>Téléphone</Typo>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-row justify-start items-center h-[20px]">
                                <Typo size="small">{user!.firstName}</Typo>
                            </div>
                            <div className="flex flex-row justify-start items-center h-[20px]">
                                <Typo size="small">{user!.lastName}</Typo>
                            </div>
                            <div className="flex flex-row justify-start items-center h-[20px]">
                                <Typo size="small">{user!.email}</Typo>
                            </div>
                            <div className="flex flex-row justify-start items-center h-[20px]">
                                <Typo size="small">Non renseigné</Typo>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Layout>
    );
}
