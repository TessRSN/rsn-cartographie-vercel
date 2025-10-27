"use client";
import { Suspense } from "react";
import { SearchBar } from "./SearchBar";

const PREFIX = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";

export function Navbar() {
  return (
    <nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <img src={`${PREFIX}/L_RSN_FR_RGB_W-400x145.png`} width={120} />

          <div>
            <Suspense>
              <SearchBar />
            </Suspense>
          </div>

          <div className="space-x-6 text-sm text-gray-400 select-none">
            v{process.env.NEXT_PUBLIC_APP_VERSION}
          </div>
        </div>
      </div>
    </nav>
  );
}
