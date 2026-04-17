import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-6 sm:px-6 sm:py-0">
      <div className="card w-full space-y-4">
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="button w-full sm:flex-1" type="submit">
              Ingresar
            </button>
            <button className="button-secondary w-full sm:flex-1" formAction={signUp}>
              Crear admin
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
