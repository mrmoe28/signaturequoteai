import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function Home() { 
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary">ShadCN UI v4 Upgraded ✨</Badge>
          </div>
          <CardTitle className="text-4xl font-bold mb-4">
            Build quotes faster
          </CardTitle>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Use Signature QuoteCrawler to assemble accurate quotes from the latest catalog,
            apply discounts and taxes, and generate polished previews for your customers.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <a href="/quotes/new">
              Create a Quote
            </a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/dashboard">
              Go to Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center">
        <Badge variant="outline">
          🚀 Integrated Workflow: Claude Code + Cursor + Vercel
        </Badge>
      </div>
    </div>
  ); 
}