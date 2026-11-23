import Link from 'next/link';
import type { CollectionsQuery } from '@/generated/graphql';

export function CollectionCard({
  collection,
}: {
  collection: CollectionsQuery['collections']['items'][number];
}) {
  return (
    <Link
      href={'/collections/' + collection.slug}
      className="group block relative rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ease-in-out flex-shrink-0"
    >
      {/* Image */}
      <div className="relative w-full bg-gray-100 dark:bg-navy-800">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={collection.name}
          src={
            collection.featuredAsset?.preview
              ? collection.featuredAsset.preview + '?w=500&h=500&format=webp'
              : '/placeholder.svg?height=500&width=500'
          }
          style={{ aspectRatio: '4/5' }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-end p-3 sm:p-4">
          <div className="w-full">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white tracking-wide drop-shadow-md line-clamp-2">
              {collection.name}
            </h3>
            <span className="inline-flex items-center text-xs sm:text-sm text-amber-300 font-medium mt-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              Browse Collection
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
