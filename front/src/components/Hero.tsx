
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";

function Hero() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <Card className="w-full max-w-xs overflow-hidden p-0">
        <CardContent className="flex flex-col gap-5 p-0">
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src="Patrick.png"
              alt="Patrick Star"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col items-center gap-4 p-6 pt-0">
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              Trade Journal
            </h1>

            <p className="text-muted-foreground text-center text-sm">
              Track your trades.
            </p>

            <Button
              className="w-fit"
              onClick={() => navigate("/journal")}
            >
              Open
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default Hero;
