import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appData } from '@/statics/app-data';
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

  const handleForgotPassword = () => {
    toast.info('Fonctionnalité à venir', {
      description: 'La réinitialisation de mot de passe sera bientôt disponible.',
    });
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-gradient-hero relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-radial from-sidebar-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and branding */}
        <div className="text-center space-y-4 fade-in">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl">
              <img
                src={appData.app.logoUrl}
                alt={appData.app.name}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{appData.app.name}</h1>
            <p className="mt-2 text-white/70 text-lg">
              Gestion des licences et compétitions cyclistes
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 space-y-6 fade-in ${
            isShaking ? 'animate-shake' : ''
          }`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white">Connexion</h2>
            <p className="text-white/60 text-sm mt-1">Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3 text-sm text-white">
                {error}
              </div>
            )}

            {/* Email field */}
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
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 h-11"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-red-300">{errors.email.message}</p>}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/90">
                  Mot de passe
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline"
                >
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
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 h-11 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
            </div>

            {/* Remember me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={checked => setValue('rememberMe', checked === true)}
                disabled={isLoading}
                className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-primary"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm text-white/70 cursor-pointer select-none"
              >
                Se souvenir de moi
              </Label>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
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
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm fade-in" style={{ animationDelay: '0.2s' }}>
          &copy; {new Date().getFullYear()} {appData.app.name} &bull; v{appData.app.version}
        </p>
      </div>

      {/* Custom shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}</style>
    </div>
  );
}
