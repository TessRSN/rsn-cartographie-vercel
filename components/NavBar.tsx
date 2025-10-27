import { SearchBar } from "./SearchBar";

export function Navbar() {
  return (
    <nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <img src="/L_RSN_FR_RGB_W-400x145.png" width={120} />
          <div>
            <SearchBar />
          </div>
          <div className="space-x-6">
            {/*<a href="#" className="hover:text-slate-300">
              Accueil
            </a>
            <a href="#" className="hover:text-slate-300">
              A propos
            </a>
            <a href="#" className="hover:text-slate-300">
              Suggestion
            </a>*/}{" "}
            &nbsp;
          </div>
        </div>
      </div>
    </nav>
  );
}
