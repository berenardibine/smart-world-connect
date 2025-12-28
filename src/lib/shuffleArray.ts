import { useEffect, useState } from "react";
import { shuffleArray } from "@/utils/shuffleArray"; // your Fisher-Yates function

export default function SmartProductList({ products }) {
  const [displayed, setDisplayed] = useState(products);
  const [isFading, setIsFading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial shuffle on mount
    setDisplayed(shuffleArray(products));

    // Auto reshuffle every 10 minutes
    const interval = setInterval(() => {
      setIsLoading(true);
      setIsFading(true);

      setTimeout(() => {
        setDisplayed(shuffleArray(products));
        setIsFading(false);
        setIsLoading(false);
      }, 800); // Fade + shuffle duration
    }, 600000); // 10 minutes = 600,000 ms

    return () => clearInterval(interval);
  }, [products]);

  return (
    <div className="relative">
      {/* Spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500"></div>
        </div>
      )}

      {/* Product Grid */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 transition-opacity duration-700 ${
          isFading ? "opacity-0" : "opacity-100"
        }`}
      >
        {displayed.map((p) => (
          <div
            key={p.id}
            className="group relative rounded-xl bg-white shadow hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="p-3">
              <h3 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h3>
              <p className="text-orange-600 font-bold text-base">
                {p.price ? `$${p.price}` : "Negotiable"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
        }
