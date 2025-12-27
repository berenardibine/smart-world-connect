import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  GraduationCap, Play, Clock, Star, BookOpen, 
  ChevronRight, Search, Filter, Award, Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Helmet } from "react-helmet";

const categories = ["All", "Marketing", "Business", "Agriculture", "Technology", "Finance"];

const courses = [
  {
    id: 1,
    title: "Digital Marketing Masterclass",
    category: "Marketing",
    instructor: "Smart Market Academy",
    duration: "4h 30m",
    lessons: 24,
    rating: 4.9,
    students: 1250,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
    isFree: true,
    progress: 45,
    level: "Beginner",
  },
  {
    id: 2,
    title: "Modern Farming Techniques",
    category: "Agriculture",
    instructor: "Rwanda Agri Hub",
    duration: "3h 15m",
    lessons: 18,
    rating: 4.8,
    students: 890,
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=400&fit=crop",
    isFree: true,
    progress: 0,
    level: "Beginner",
  },
  {
    id: 3,
    title: "E-Commerce Success Blueprint",
    category: "Business",
    instructor: "Smart Market Pro",
    duration: "6h",
    lessons: 32,
    rating: 4.7,
    students: 2100,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
    isFree: false,
    progress: 0,
    level: "Intermediate",
  },
  {
    id: 4,
    title: "Financial Literacy for Sellers",
    category: "Finance",
    instructor: "Money Smart RW",
    duration: "2h 45m",
    lessons: 15,
    rating: 4.6,
    students: 560,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
    isFree: true,
    progress: 100,
    level: "Beginner",
  },
  {
    id: 5,
    title: "Social Media Marketing",
    category: "Marketing",
    instructor: "Digital Experts",
    duration: "5h 20m",
    lessons: 28,
    rating: 4.8,
    students: 1800,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop",
    isFree: false,
    progress: 20,
    level: "Intermediate",
  },
  {
    id: 6,
    title: "Mobile App Development Basics",
    category: "Technology",
    instructor: "Tech Academy RW",
    duration: "8h",
    lessons: 40,
    rating: 4.5,
    students: 450,
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop",
    isFree: false,
    progress: 0,
    level: "Advanced",
  },
];

export default function Academy() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((course) => {
    const matchesCategory = activeCategory === "All" || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>Smart Academy - Learn & Grow | Smart Market</title>
        <meta name="description" content="Learn digital marketing, business skills, farming techniques, and more with Smart Academy. Free and premium courses to grow your business." />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        <Navbar />

        <main className="pt-[120px] md:pt-20">
          <div className="container mx-auto px-4 lg:px-6 space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-info via-info to-primary p-6 sm:p-8 text-info-foreground">
              <div className="absolute top-0 right-0 w-40 h-40 bg-info-foreground/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-info-foreground/5 rounded-full blur-2xl" />
              
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="p-4 rounded-2xl bg-info-foreground/20 backdrop-blur-sm self-start">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Smart Academy</h1>
                  <p className="text-info-foreground/80 max-w-xl">
                    Learn practical skills to grow your business. From digital marketing to modern farming techniques - we've got you covered.
                  </p>
                </div>
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{courses.length}</p>
                    <p className="text-sm opacity-80">Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">8K+</p>
                    <p className="text-sm opacity-80">Students</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-muted/50 border-0"
                />
              </div>
              <Button variant="outline" className="rounded-xl gap-2 h-11">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/academy/${course.id}`}
                  className="glass-card-hover overflow-hidden group"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    
                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-4 rounded-full bg-primary text-primary-foreground shadow-glow">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {course.isFree ? (
                        <span className="px-2.5 py-1 rounded-lg bg-success text-success-foreground text-xs font-semibold">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                          PREMIUM
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium">
                        {course.level}
                      </span>
                    </div>
                    
                    {/* Progress if started */}
                    {course.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        {course.category}
                      </span>
                      <h3 className="font-semibold text-foreground mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{course.instructor}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          {course.lessons} lessons
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium text-foreground">{course.rating}</span>
                        <span className="text-muted-foreground">({course.students})</span>
                      </div>
                      {course.progress === 100 && (
                        <span className="flex items-center gap-1 text-success text-sm font-medium">
                          <Award className="h-4 w-4" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  );
}
