"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
})

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })

    if (error) {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      })
    } else if (data.user) {
      // Create profile entry
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
      })

      if (profileError) {
        toast({
          title: "Erro ao criar perfil",
          description: profileError.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Registro realizado com sucesso!",
          description: "Verifique seu email para confirmar sua conta.",
        })
        router.push("/conta/login") // Redirect to login after registration
      }
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
          Crie sua conta
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Registrar
            </Button>
          </form>
        </Form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/conta/login" className="font-semibold leading-6 text-primary hover:text-primary/80">
            Faça login aqui
          </Link>
        </p>
      </div>
    </div>
  )
}
