import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ShoppingBag, Wrench, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", location.pathname);
          }, [location.pathname]);

            return (
                <div className="flex min-h-screen flex-col items-center justify-center text-center bg-gradient-to-b from-orange-50 via-white to-amber-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-700 px-6">
                      
                            {/* Floating Background Glow */}
                                  <div className="absolute inset-0 -z-10 overflow-hidden">
                                          <div className="absolute w-80 h-80 bg-gradient-to-r from-orange-400 to-yellow-500 opacity-30 blur-3xl top-20 left-10 animate-pulse" />
                                                  <div className="absolute w-72 h-72 bg-gradient-to-r from-amber-400 to-orange-600 opacity-25 blur-3xl bottom-20 right-10 animate-pulse" />
                                                        </div>

                                                              {/* Animated Icons */}
                                                                    <div className="flex items-center justify-center space-x-4 mb-8">
                                                                            <Wrench className="w-10 h-10 text-orange-500 dark:text-amber-400 animate-spin-slow" />
                                                                                    <ShoppingBag className="w-12 h-12 text-orange-600 dark:text-amber-500 animate-bounce" />
                                                                                            <Sparkles className="w-10 h-10 text-yellow-500 dark:text-amber-300 animate-pulse" />
                                                                                                  </div>

                                                                                                        {/* Headline */}
                                                                                                              <h1 className="text-[80px] sm:text-[100px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 drop-shadow-lg">
                                                                                                                      SMART MARKET
                                                                                                                            </h1>

                                                                                                                                  <h2 className="text-2xl sm:text-3xl font-semibold mt-2 text-gray-700 dark:text-gray-200">
                                                                                                                                          Page under construction 🚧
                                                                                                                                                </h2>

                                                                                                                                                      {/* Subtext */}
                                                                                                                                                            <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-lg leading-relaxed">
                                                                                                                                                                    The page you’re looking for is under construction .  
                                                                                                                                                                            Our <span className="text-orange-500 font-semibold">Smart Market</span> team is working hard to make sure everything runs perfectly again.
                                                                                                                                                                                  </p>

                                                                                                                                                                                        <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-2">
                                                                                                                                                                                                “Building a smarter marketplace — one page at a time 💛”
                                                                                                                                                                                                      </p>

                                                                                                                                                                                                            {/* CTA */}
                                                                                                                                                                                                                  <a
                                                                                                                                                                                                                          href="/"
                                                                                                                                                                                                                                  className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-md transition-all duration-300"
                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                Return to Home
                                                                                                                                                                                                                                                      </a>

                                                                                                                                                                                                                                                            {/* Footer */}
                                                                                                                                                                                                                                                                  <footer className="mt-14 text-sm text-gray-500 dark:text-gray-400">
                                                                                                                                                                                                                                                                          © {new Date().getFullYear()} Smart Market · Shop Smart. Live Smart.
                                                                                                                                                                                                                                                                                </footer>
                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                      };

                                                                                                                                                                                                                                                                                      export default NotFound;