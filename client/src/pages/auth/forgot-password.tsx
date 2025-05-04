import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
import { ArrowLeft, Languages, Mail, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { LanguageContext } from '@/providers/LanguageProvider';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = React.useContext(LanguageContext);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Server error');
      }
      
      setEmailSent(true);
      toast({
        title: t('auth.passwordResetEmailSent'),
        description: t('auth.passwordResetInstructions'),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('auth.passwordResetEmailFailed'),
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
            {t('auth.forgotPassword')}
          </CardTitle>
          <CardDescription>
            {emailSent 
              ? t('auth.passwordResetEmailSentDescription') 
              : t('auth.forgotPasswordDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm">
                {t('auth.passwordResetCheckEmail')}
              </p>
              <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
                {t('auth.resendEmail')}
              </Button>
            </div>
          ) : (
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('general.loading') : t('auth.resetPassword')}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-center text-sm">
          <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToLogin')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}