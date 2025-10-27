// app/not-found.tsx
export default function NotFound() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold">Page non trouvée</h1>
            <p className="mt-2 text-gray-600">
                Désolé, la page que vous cherchez n'existe pas.
            </p>
        </div>
    );
}
