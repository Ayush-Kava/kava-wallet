import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon = ({ title, description }: ComingSoonProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="max-w-2xl w-full glass-strong border-border/60 shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Rocket size={28} />
          </div>
          <CardTitle className="text-2xl font-display">{title}</CardTitle>
          <p className="text-muted-foreground mt-2">
            {description ||
              'We are crafting this experience. Check back soon for updates!'}
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Button asChild variant="outline">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
