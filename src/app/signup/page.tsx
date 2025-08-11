
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Check, Building, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plan } from '@/types/ehr';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [hospitalName, setHospitalName] = useState('');

  const { signup, login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
        toast({
            variant: "destructive",
            title: "Plan no seleccionado",
            description: "Por favor, elija un plan para continuar.",
        });
        return;
    }
    setIsLoading(true);

    try {
      const clinicNameToSubmit = selectedPlan === 'Hospital' ? hospitalName : clinicName;
      await signup(username, password, selectedPlan, clinicNameToSubmit);
      // Automatically log the user in after successful signup
      await login(username, password);
      toast({
        title: "¡Cuenta Creada!",
        description: `Bienvenido a NotasMed. Tu cuenta ha sido creada exitosamente.`,
      });
      router.push('/dashboard');
    } catch (error) {
        const e = error as Error;
      toast({
        variant: "destructive",
        title: "Error de Registro",
        description: e.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const plans: { name: Plan, price: string, description: string, features: string[] }[] = [
    { name: 'Free', price: '$0/mes', description: 'Funcionalidad básica para empezar.', features: ['Transcripción IA', 'Gestión de Pacientes (limitado)'] },
    { name: 'Clinica', price: '$49/mes', description: 'Funciones avanzadas para clínicas.', features: ['Todo en Free', 'Resumen IA', 'Soporte prioritario'] },
    { name: 'Hospital', price: '$74/mes', description: 'Control total para hospitales.', features: ['Todo en Clinica', 'Gestión de usuarios', 'Auditoría avanzada'] },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <Stethoscope className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">NotasMed</h1>
            </div>
          <CardTitle>Crea tu Cuenta</CardTitle>
          <CardDescription>Elige un plan y comienza a optimizar tu práctica médica.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label>Paso 1: Selecciona tu Plan</Label>
               <RadioGroup
                    value={selectedPlan ?? undefined}
                    onValueChange={(value: Plan) => setSelectedPlan(value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {plans.map(plan => (
                        <Label key={plan.name} htmlFor={plan.name} className={cn("flex flex-col rounded-lg border-2 p-4 cursor-pointer transition-all", selectedPlan === plan.name ? 'border-primary ring-2 ring-primary' : 'border-muted')}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{plan.name}</h3>
                                <RadioGroupItem value={plan.name} id={plan.name} className="h-4 w-4" />
                            </div>
                            <p className="text-2xl font-bold my-2">{plan.price}</p>
                            <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                            <ul className="space-y-2 text-sm">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </Label>
                    ))}
                </RadioGroup>
            </div>
            
            {selectedPlan && (
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Paso 2: Completa tu Registro</h3>
                     <div className="space-y-2">
                        <Label htmlFor="username">Usuario</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="p.ej. drasmith"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Tu contraseña segura"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="pr-10"
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    {(selectedPlan === 'Free' || selectedPlan === 'Clinica') && (
                        <div className="space-y-2">
                            <Label htmlFor="clinicName">
                                Nombre de la Clínica
                            </Label>
                            <div className="relative">
                               <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input
                                    id="clinicName"
                                    type="text"
                                    placeholder='p.ej. Clínica del Sol'
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    )}
                     {selectedPlan === 'Hospital' && (
                       <>
                        <div className="space-y-2">
                            <Label htmlFor="hospitalName">
                                Nombre del Hospital
                            </Label>
                            <div className="relative">
                               <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input
                                    id="hospitalName"
                                    type="text"
                                    placeholder='p.ej. Hospital Central'
                                    value={hospitalName}
                                    onChange={(e) => setHospitalName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="clinicName">
                                Nombre de la Clínica
                            </Label>
                            <div className="relative">
                               <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input
                                    id="clinicName"
                                    type="text"
                                    placeholder='p.ej. Clínica del Sol'
                                    value={clinicName}
                                    onChange={(e) => setClinicName(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                       </>
                    )}
                </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading || !selectedPlan}>
              {isLoading ? 'Creando Cuenta...' : 'Registrarse'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="underline">
                    Inicia Sesión
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
