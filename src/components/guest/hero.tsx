import type { JSX } from "react";
import type { VenueWithModules } from "@/domain/organization/venue.repository";

export interface GuestHeroProps {
  venue: VenueWithModules;
  placeContext: string | null;
}

export function GuestHero({ venue, placeContext }: GuestHeroProps): JSX.Element {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 px-4 text-center">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20"
        style={{ backgroundColor: venue.brandColor }}
        aria-hidden="true"
      />
      <h1 className="relative z-10 font-display text-[40px] leading-[44px] md:text-[56px] md:leading-[60px] text-guest-text-primary animate-in fade-in slide-in-from-bottom-4 duration-700 ease-guest-entrance">
        {venue.name}
      </h1>
      {placeContext ? (
        <p className="relative z-10 mt-4 text-lg text-guest-text-muted animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-guest-entrance">
          {placeContext}
        </p>
      ) : null}
      {venue.welcomeMessage ? (
        <p className="relative z-10 mt-6 max-w-md mx-auto text-base leading-relaxed text-guest-text-secondary animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-guest-entrance">
          {venue.welcomeMessage}
        </p>
      ) : null}
    </section>
  );
}

export default GuestHero;
