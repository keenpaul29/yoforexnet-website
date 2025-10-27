import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Download,
  Upload,
  Gift,
  CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: "earn" | "spend" | "recharge";
  amount: number;
  description: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
}

interface CoinTransactionHistoryProps {
  transactions?: Transaction[];
}

const defaultTransactions: Transaction[] = [
  {
    id: "1",
    type: "recharge",
    amount: 200,
    description: "Coin recharge via Stripe",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: "completed"
  },
  {
    id: "2",
    type: "earn",
    amount: 45,
    description: "EA downloaded: Gold Scalper Pro v2.1",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: "completed"
  },
  {
    id: "3",
    type: "spend",
    amount: -30,
    description: "Downloaded: EURUSD M5 Strategy EA",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    status: "completed"
  },
  {
    id: "4",
    type: "earn",
    amount: 15,
    description: "Solution accepted: MT4 Symbol Mapping Fix",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    status: "completed"
  },
  {
    id: "5",
    type: "earn",
    amount: 25,
    description: "Set file downloaded: XAUUSD H1 Settings",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: "completed"
  },
  {
    id: "6",
    type: "spend",
    amount: -50,
    description: "Premium article: Advanced Grid Strategy Guide",
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
    status: "completed"
  },
  {
    id: "7",
    type: "earn",
    amount: 10,
    description: "Daily activity bonus",
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    status: "completed"
  }
];

export default function CoinTransactionHistory({ 
  transactions = defaultTransactions 
}: CoinTransactionHistoryProps) {
  const getTransactionIcon = (type: Transaction["type"]) => {
    if (type === "recharge") return CreditCard;
    if (type === "earn") return TrendingUp;
    return TrendingDown;
  };

  const getTransactionColor = (type: Transaction["type"]) => {
    if (type === "recharge") return "text-primary";
    if (type === "earn") return "text-chart-3";
    return "text-chart-4";
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    if (status === "completed") return <Badge variant="outline" className="text-xs">Completed</Badge>;
    if (status === "pending") return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8" data-testid="container-transaction-history">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
        <p className="text-muted-foreground">
          View all your coin earnings, spending, and recharge history
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const Icon = getTransactionIcon(transaction.type);
              const color = getTransactionColor(transaction.type);
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover-elevate"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className={`bg-muted rounded-lg p-2 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium line-clamp-1" data-testid={`text-description-${transaction.id}`}>
                        {transaction.description}
                      </div>
                      <div className={`font-bold flex-shrink-0 ${color}`} data-testid={`text-amount-${transaction.id}`}>
                        {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                        <Coins className="h-4 w-4 inline ml-1" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(transaction.timestamp, { addSuffix: true })}</span>
                      <span>•</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
