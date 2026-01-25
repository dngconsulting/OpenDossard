import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button.tsx';
import { FieldGroup, FieldSet, StringField } from '@/components/ui/field.tsx';
import { Form } from '@/components/ui/form.tsx';
import type { UserType } from '@/types/users.ts';

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  phone: z.string().optional(),
});

type UserFormProps = {
  user?: Partial<UserType>;
};

export const UserForm = ({ user }: UserFormProps) => {
  const userForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  return (
    <Form {...userForm}>
      <form className="grid grid-cols-1 gap-4">
        <FieldGroup>
          <FieldSet>
            <StringField field="lastName" form={userForm} label="Nom" />
            <StringField field="firstName" form={userForm} label="Prénom" />
            <StringField field="email" form={userForm} label="Email" />
            <StringField field="phone" form={userForm} label="Téléphone" />
          </FieldSet>
          <FieldSet>
            <Button type="submit">Enregistrer</Button>
          </FieldSet>
        </FieldGroup>
      </form>
    </Form>
  );
};
