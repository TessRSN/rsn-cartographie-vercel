import { Address } from "@/app/lib/schema";

export function Adresse({ address }: { address?: Address | null }) {
  return (
    <div>
      {address?.address_line1 && (
        <p className="text-sm">{address.address_line1}</p>
      )}
      {address?.address_line2 && (
        <p className="text-sm">{address.address_line2}</p>
      )}
      <p className="text-sm">
        {address?.locality && <span>{address.locality}</span>}
        {address?.locality && address.postal_code && <span>, </span>}
        {address?.postal_code && <span>{address.postal_code}</span>}
      </p>
      <p className="text-sm">
        {address?.administrative_area && (
          <span>{address.administrative_area}</span>
        )}
        {address?.administrative_area && address.country_code && (
          <span>, </span>
        )}
        {address?.country_code && <span>{address.country_code}</span>}
      </p>
    </div>
  );
}
