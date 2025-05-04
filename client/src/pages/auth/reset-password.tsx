import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Languages, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { LanguageContext } from '@/providers/LanguageProvider';

const formSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const token = location.split('/').pop();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = React.useContext(LanguageContext);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password: values.password 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Server error');
      }
      
      setResetSuccess(true);
      toast({
        title: t('auth.passwordResetSuccess'),
        description: t('auth.passwordResetSuccessMessage'),
      });
      
      // Redirect to login after a delay
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.passwordResetFailed'),
        description: t('auth.invalidToken'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleLanguageChange() {
    if (language === 'en') setLanguage('fr');
    else if (language === 'fr') setLanguage('ar');
    else setLanguage('en');
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-slate-900 p-4">
      <div className="fixed top-4 right-4 flex gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLanguageChange} aria-label="Change language">
          <Languages className="h-5 w-5" />
        </Button>
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {t('auth.resetPassword')}
          </CardTitle>
          <CardDescription>
            {resetSuccess 
              ? t('auth.passwordResetSuccessDescription') 
              : t('auth.resetPasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetSuccess ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm">
                {t('auth.redirectingToLogin')}
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.newPassword')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.confirmNewPassword')}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('general.loading') : t('auth.resetPassword')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-center text-sm">
          {!resetSuccess && (
            <Button variant="link" onClick={() => setLocation('/login')}>
              {t('auth.backToLogin')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}