import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, ArrowLeft } from 'lucide-react';
import { AppLink } from '@/components/atoms/AppLink';
import { ROUTES } from '@/lib/constants/routes';

interface ComingSoonProps {
  title: string;
  description?: string;
}

const ComingSoon = ({ title, description }: ComingSoonProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="glass-strong w-full max-w-2xl border-border/60 shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Rocket size={28} />
          </div>
          <CardTitle className="font-display text-2xl">{title}</CardTitle>
          <p className="mt-2 text-muted-foreground">
            {description || 'We are crafting this experience. Check back soon for updates!'}
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Button asChild variant="outline">
            <AppLink href={ROUTES.dashboard} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Dashboard
            </AppLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
