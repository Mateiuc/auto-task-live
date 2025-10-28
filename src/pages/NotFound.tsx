import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-[350px]">
        <div className="space-y-1">
          <h1 className="text-5xl font-bold text-primary">404</h1>
          <p className="text-lg text-foreground font-medium">Page not found</p>
          <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist</p>
        </div>
        <a 
          href="/" 
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
