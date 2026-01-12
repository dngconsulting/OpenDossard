import {zodResolver} from '@hookform/resolvers/zod';
import {Controller, useForm} from 'react-hook-form';
import {useNavigate} from 'react-router-dom';
import {z} from 'zod';

import {Button} from '@/components/ui/button.tsx';
import {Card, CardContent, CardDescription, CardTitle,CardHeader} from '@/components/ui/card.tsx';
import {Field, FieldError, FieldGroup, FieldLabel, FieldSet, StringField} from '@/components/ui/field.tsx';
import {Form} from '@/components/ui/form.tsx';
import {Input} from '@/components/ui/input.tsx';
import {appData} from '@/statics/app-data.ts';
import useUserStore from '@/store/UserStore.ts';


const formSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const loginForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {}
    });
    const { login } = useUserStore()

    function onSubmit(data: z.infer<typeof formSchema>) {
        login(data.email, data.password)
        navigate('/');
    }
    return (
        <div className="h-dvh flex flex-col gap-8 justify-center items-center p-4">
            <div className="flex items-center justify-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <img src={appData.app.logoUrl} alt="logo" className="w-3/4" />
                </div>
                OpenDossard
            </div>
            <div className="flex flex-col gap-6 max-w-[400px] w-full">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Bienvenue !</CardTitle>
                        <CardDescription>
                            Connectez-vous à votre compte
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...loginForm}>
                            <form onSubmit={loginForm.handleSubmit(onSubmit)}>
                                <FieldGroup>
                                    <FieldSet>
                                        <StringField
                                            form={loginForm}
                                            label="Email"
                                            field="email"
                                            type="email"
                                        />
                                        <Controller
                                            control={loginForm.control}
                                            name="password"
                                            render={({field, fieldState}) => (
                                                <Field data-invalid={fieldState.invalid}>
                                                    <FieldLabel htmlFor="lastName-input">
                                                        Password
                                                        <a
                                                            href="/account/forgot-password"
                                                            className="ml-auto text-sm underline-offset-4 hover:underline"
                                                        >
                                                            Forgot your password?
                                                        </a>
                                                    </FieldLabel>
                                                    <Input
                                                        {...field}
                                                        id="lastName-input"
                                                        aria-invalid={fieldState.invalid}
                                                        autoComplete="off"
                                                        type="password"
                                                    />
                                                    {fieldState.invalid && (
                                                        <FieldError errors={[fieldState.error]}/>
                                                    )}
                                                </Field>
                                            )}
                                        />
                                    </FieldSet>
                                    <Field>
                                        <Button type="submit">Login</Button>

                                    </Field>
                                </FieldGroup>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
