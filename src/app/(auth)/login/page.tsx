import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-fh-surface px-4 py-10 sm:px-6 sm:py-12">
      <div className="card w-full max-w-md space-y-5 shadow-ambient">
        <div>
          <h1 className="bg-gradient-to-r from-fh-primary to-fh-primary-dim bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            FamilyHub
          </h1>
          <p className="mt-2 text-sm text-fh-on-surface-variant">Accede con la cuenta administradora.</p>
        </div>
        {params.error ? (
          <p className="rounded-stitch border border-fh-error/30 bg-fh-surface-container-low p-3 text-sm text-fh-error">
            {params.error}
          </p>
        ) : null}
        {params.message ? (
          <p className="rounded-stitch border border-fh-primary-container/40 bg-fh-primary-container/25 p-3 text-sm text-fh-on-primary-container">
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
