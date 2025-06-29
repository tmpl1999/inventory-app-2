import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 text-center">
      <h1 className="text-6xl md:text-8xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl md:text-3xl font-semibold">Page Not Found</h2>
      <p className="mt-4 text-muted-foreground max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button 
        className="mt-8" 
        onClick={() => navigate('/')}
        size="lg"
      >
        Back to Dashboard
      </Button>
    </div>
  );
}