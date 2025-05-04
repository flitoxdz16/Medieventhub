import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Languages, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { LanguageContext } from '@/providers/LanguageProvider';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = React.useContext(LanguageContext);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        setLocation('/dashboard');
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.loginSuccessMessage'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('auth.loginFailed'),
          description: t('auth.invalidCredentials'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.loginFailed'),
        description: t('errors.serverError'),
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
            {t('app.name')}
          </CardTitle>
          <CardDescription>
            {t('app.tagline')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.email')}</FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        {t('auth.rememberMe')}
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('general.loading') : t('auth.login')}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="text-primary hover:underline">
              {t('auth.forgotPassword')}?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-center text-sm">
          <div>
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-primary hover:underline">
              {t('auth.register')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}