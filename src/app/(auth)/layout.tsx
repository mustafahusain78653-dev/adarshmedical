export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-sm backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}



