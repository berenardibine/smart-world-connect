import { Link } from "react-router-dom";
import { GraduationCap, Play, Clock, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const courses = [
  {
    id: 1,
    title: "Digital Marketing 101",
    category: "Marketing",
    duration: "2h 30m",
    lessons: 12,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    isFree: true,
  },
  {
    id: 2,
    title: "Modern Farming Techniques",
    category: "Agriculture",
    duration: "3h 15m",
    lessons: 18,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=250&fit=crop",
    isFree: true,
  },
  {
    id: 3,
    title: "E-Commerce Success Guide",
    category: "Business",
    duration: "4h",
    lessons: 24,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop",
    isFree: false,
  },
];

export function SmartAcademy() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="section-header">Smart Academy</h2>
            <p className="section-subheader">Learn & grow your business</p>
          </div>
        </div>
        <Link to="/academy" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Browse Courses <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/academy/${course.id}`}
            className="glass-card-hover overflow-hidden group"
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-glow">
                  <Play className="h-5 w-5 fill-current" />
                </div>
              </div>
              
              {/* Badge */}
              {course.isFree ? (
                <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-success text-success-foreground text-xs font-semibold">
                  FREE
                </span>
              ) : (
                <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                  PREMIUM
                </span>
              )}
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  {course.category}
                </span>
                <h3 className="font-semibold text-foreground mt-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span>{course.rating}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
