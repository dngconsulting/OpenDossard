import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import {
  authInputClassName,
  authLinkClassName,
  authPasswordToggleClassName,
  authSubmitButtonClassName,
} from '@/components/layout/auth-card.styles';
import { AuthCardLayout } from '@/components/layout/AuthCardLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useUserStore from '@/store/UserStore';

const loginSchema = z.object({
  email: z.email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { login, isLoading, error, clearError } = useUserStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    try {
      await login(data.email, data.password, data.rememberMe);
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo, { replace: true });
    } catch {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const goToForgotPassword = () => {
    // Pré-remplit l'email déjà saisi sur la page « mot de passe oublié ».
    navigate('/forgot-password', { state: { email: getValues('email').trim() } });
  };

  return (
    <AuthCardLayout
      title="Connexion"
      subtitle="Accédez à votre espace de gestion"
      cardClassName={isShaking ? 'animate-shake' : ''}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Message d'erreur */}
        {error && (
          <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3 text-sm text-white">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white/90">
            Adresse email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@example.com"
            autoComplete="email"
            disabled={isLoading}
            className={authInputClassName}
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-300">{errors.email.message}</p>}
        </div>

        {/* Mot de passe */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/90">
              Mot de passe
            </Label>
            <button type="button" onClick={goToForgotPassword} className={authLinkClassName}>
              Mot de passe oublié ?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              disabled={isLoading}
              className={`${authInputClassName} pr-10`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={authPasswordToggleClassName}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
        </div>

        {/* Se souvenir de moi */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={checked => setValue('rememberMe', checked === true)}
            disabled={isLoading}
            className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
          />
          <Label htmlFor="rememberMe" className="text-sm text-white/70 cursor-pointer select-none">
            Se souvenir de moi
          </Label>
        </div>

        {/* Bouton de soumission */}
        <Button type="submit" disabled={isLoading} className={authSubmitButtonClassName}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>
    </AuthCardLayout>
  );
}
