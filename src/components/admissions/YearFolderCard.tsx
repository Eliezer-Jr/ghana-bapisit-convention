import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, Users, CheckCircle, Clock, XCircle } from "lucide-react";

interface YearFolderCardProps {
  year: string;
  totalApps: number;
  submitted: number;
  approved: number;
  rejected: number;
  inReview: number;
  onClick: () => void;
}

export function YearFolderCard({
  year,
  totalApps,
  submitted,
  approved,
  rejected,
  inReview,
  onClick
}: YearFolderCardProps) {
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Folder Icon */}
          <div className="relative">
            <Folder className="h-24 w-24 text-primary/80 group-hover:text-primary transition-colors" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center mt-3">
              <Users className="h-8 w-8 text-primary-foreground/80" />
            </div>
          </div>

          {/* Year Label */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground">{year}</h3>
            <p className="text-sm text-muted-foreground mt-1">Academic Year</p>
          </div>

          {/* Stats */}
          <div className="w-full space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Applications</span>
              <Badge variant="outline" className="font-semibold">{totalApps}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-semibold text-blue-600">{submitted}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-muted-foreground">Approved:</span>
                <span className="font-semibold text-green-600">{approved}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-muted-foreground">In Review:</span>
                <span className="font-semibold text-orange-600">{inReview}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground">Rejected:</span>
                <span className="font-semibold text-red-600">{rejected}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
