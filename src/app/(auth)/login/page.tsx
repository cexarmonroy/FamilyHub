import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
      <div className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">FamilyHub</h1>
        <p className="text-sm text-slate-600">Accede con la cuenta administradora.</p>
        {params.error ? (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">{params.error}</p>
        ) : null}
        {params.message ? (
          <p className="rounded bg-emerald-50 p-2 text-sm text-emerald-700">
            {params.message}
          </p>
        ) : null}
        <form action={signIn} className="space-y-3">
          <input className="input" name="email" type="email" placeholder="admin@familia.com" required />
          <input className="input" name="password" type="password" placeholder="Contraseña" required />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <button className="button min-h-10 w-full" type="submit">
              Ingresar
            </button>
            <button className="button-secondary min-h-10 w-full" formAction={signUp}>
              Crear admin
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
