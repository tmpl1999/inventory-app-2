import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Package className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <Link href="/" passHref>
          <Button size="lg">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}