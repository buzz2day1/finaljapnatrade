import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle2,
  XCircle, Users, DollarSign, Activity, BarChart3, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ActiveBet {
  id: string;
  user_id: string;
  coin_symbol: string;
  timeframe: number;
  candle_key: string;
  direction: string;
  amount: number;
  entry_price: number;
  exit_price: number | null;
  return_rate: number;
  status: string;
  result_direction: string | null;
  pnl: number | null;
  created_at: string;
  settled_at: string | null;
}

interface CandleAggregate {
  id: string;
  candle_key: string;
  coin_symbol: string;
  timeframe: number;
  total_up_bets: number;
  total_down_bets: number;
  bet_count: number;
  is_settled: boolean;
  result_direction: string | null;
  settled_at: string | null;
  created_at: string;
}

interface BetStats {
  totalActiveBets: number;
  totalPendingVolume: number;
  totalSettledBets: number;
  totalPayouts: number;
  totalPlatformProfit: number;
  winRate: number;
}

type TabType = "active" | "history" | "aggregates";

const AdminBetsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const [settledBets, setSettledBets] = useState<ActiveBet[]>([]);
  const [aggregates, setAggregates] = useState<CandleAggregate[]>([]);
  const [stats, setStats] = useState<BetStats>({
    totalActiveBets: 0,
    totalPendingVolume: 0,
    totalSettledBets: 0,
    totalPayouts: 0,
    totalPlatformProfit: 0,
    winRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterCoin, setFilterCoin] = useState<string>("all");

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        navigate("/");
        return;
      }

      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!hasAdminRole) {
        toast.error("Admin access required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await fetchBetsData();
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/");
    }
  };

  const fetchBetsData = async () => {
    setLoading(true);
    try {
      // Fetch active (pending) bets
      const { data: pendingBets, error: pendingError } = await supabase
        .from("active_bets")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;
      setActiveBets(pendingBets || []);

      // Fetch settled bets (won/lost)
      const { data: historyBets, error: historyError } = await supabase
        .from("active_bets")
        .select("*")
        .neq("status", "pending")
        .order("settled_at", { ascending: false })
        .limit(200);

      if (historyError) throw historyError;
      setSettledBets(historyBets || []);

      // Fetch candle aggregates
      const { data: aggData, error: aggError } = await supabase
        .from("candle_bet_aggregates")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (aggError) throw aggError;
      setAggregates(aggData || []);

      // Calculate stats
      const pendingVolume = (pendingBets || []).reduce((sum, b) => sum + b.amount, 0);
      const winBets = (historyBets || []).filter(b => b.status === "won");
      const lossBets = (historyBets || []).filter(b => b.status === "lost");
      const totalPayouts = winBets.reduce((sum, b) => sum + (b.pnl || 0) + b.amount, 0);
      const platformProfit = lossBets.reduce((sum, b) => sum + b.amount, 0) - winBets.reduce((sum, b) => sum + (b.pnl || 0), 0);
      const winRate = historyBets && historyBets.length > 0 
        ? (winBets.length / historyBets.length) * 100 
        : 0;

      setStats({
        totalActiveBets: pendingBets?.length || 0,
        totalPendingVolume: pendingVolume,
        totalSettledBets: historyBets?.length || 0,
        totalPayouts,
        totalPlatformProfit: platformProfit,
        winRate,
      });

    } catch (error) {
      console.error("Error fetching bets:", error);
      toast.error("Failed to load bets data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case "won":
        return <span className="px-2 py-1 bg-profit/20 text-profit rounded-full text-xs flex items-center gap-1"><CheckCircle2 size={12} /> Won</span>;
      case "lost":
        return <span className="px-2 py-1 bg-loss/20 text-loss rounded-full text-xs flex items-center gap-1"><XCircle size={12} /> Lost</span>;
      default:
        return <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">{status}</span>;
    }
  };

  const getDirectionBadge = (direction: string) => {
    if (direction === "up") {
      return <span className="px-2 py-1 bg-profit/20 text-profit rounded-full text-xs flex items-center gap-1"><TrendingUp size={12} /> UP</span>;
    }
    return <span className="px-2 py-1 bg-loss/20 text-loss rounded-full text-xs flex items-center gap-1"><TrendingDown size={12} /> DOWN</span>;
  };

  const uniqueCoins = [...new Set([...activeBets, ...settledBets].map(b => b.coin_symbol))];

  const filteredActiveBets = filterCoin === "all" 
    ? activeBets 
    : activeBets.filter(b => b.coin_symbol === filterCoin);

  const filteredSettledBets = filterCoin === "all"
    ? settledBets
    : settledBets.filter(b => b.coin_symbol === filterCoin);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Checking access...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/apnadradeadmin/auth")}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground flex-1">Bets Dashboard</h1>
          <button
            onClick={fetchBetsData}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw size={20} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-yellow-400" />
                <span className="text-xs text-muted-foreground">Active Bets</span>
              </div>
              <div className="text-xl font-bold text-foreground">{stats.totalActiveBets}</div>
              <div className="text-xs text-muted-foreground">₹{stats.totalPendingVolume.toLocaleString()} volume</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">Settled Bets</span>
              </div>
              <div className="text-xl font-bold text-foreground">{stats.totalSettledBets}</div>
              <div className="text-xs text-muted-foreground">{stats.winRate.toFixed(1)}% win rate</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-profit" />
                <span className="text-xs text-muted-foreground">Platform Profit</span>
              </div>
              <div className={`text-xl font-bold ${stats.totalPlatformProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                ₹{stats.totalPlatformProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total payouts: ₹{stats.totalPayouts.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "active", label: "Active Bets", icon: Activity },
            { id: "history", label: "Settlement History", icon: BarChart3 },
            { id: "aggregates", label: "Candle Aggregates", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <select
            value={filterCoin}
            onChange={(e) => setFilterCoin(e.target.value)}
            className="bg-secondary text-foreground px-3 py-1.5 rounded-lg text-sm border-none outline-none"
          >
            <option value="all">All Coins</option>
            {uniqueCoins.map(coin => (
              <option key={coin} value={coin}>{coin}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Active Bets Tab */}
            {activeTab === "active" && (
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-4 border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity size={18} className="text-yellow-400" />
                    Active Bets ({filteredActiveBets.length})
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Coin</TableHead>
                        <TableHead className="text-muted-foreground">Direction</TableHead>
                        <TableHead className="text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-muted-foreground">Entry</TableHead>
                        <TableHead className="text-muted-foreground">Timeframe</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActiveBets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No active bets
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredActiveBets.map((bet) => (
                          <TableRow key={bet.id} className="border-border">
                            <TableCell className="font-medium text-foreground">{bet.coin_symbol}</TableCell>
                            <TableCell>{getDirectionBadge(bet.direction)}</TableCell>
                            <TableCell className="font-mono text-foreground">₹{bet.amount}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">${bet.entry_price.toFixed(2)}</TableCell>
                            <TableCell className="text-muted-foreground">{bet.timeframe}s</TableCell>
                            <TableCell>{getStatusBadge(bet.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(bet.created_at).toLocaleTimeString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Settlement History Tab */}
            {activeTab === "history" && (
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-4 border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 size={18} className="text-primary" />
                    Settlement History ({filteredSettledBets.length})
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Coin</TableHead>
                        <TableHead className="text-muted-foreground">Bet</TableHead>
                        <TableHead className="text-muted-foreground">Result</TableHead>
                        <TableHead className="text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-muted-foreground">P&L</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Settled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSettledBets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No settlement history
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSettledBets.map((bet) => (
                          <TableRow key={bet.id} className="border-border">
                            <TableCell className="font-medium text-foreground">{bet.coin_symbol}</TableCell>
                            <TableCell>{getDirectionBadge(bet.direction)}</TableCell>
                            <TableCell>
                              {bet.result_direction && getDirectionBadge(bet.result_direction)}
                            </TableCell>
                            <TableCell className="font-mono text-foreground">₹{bet.amount}</TableCell>
                            <TableCell className={`font-mono ${(bet.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {(bet.pnl || 0) >= 0 ? '+' : ''}₹{(bet.pnl || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(bet.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {bet.settled_at ? new Date(bet.settled_at).toLocaleString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {/* Candle Aggregates Tab */}
            {activeTab === "aggregates" && (
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="p-4 border-b border-border">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users size={18} className="text-primary" />
                    Candle Bet Aggregates ({aggregates.length})
                  </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Coin</TableHead>
                        <TableHead className="text-muted-foreground">Timeframe</TableHead>
                        <TableHead className="text-muted-foreground text-profit">UP Total</TableHead>
                        <TableHead className="text-muted-foreground text-loss">DOWN Total</TableHead>
                        <TableHead className="text-muted-foreground">Bets</TableHead>
                        <TableHead className="text-muted-foreground">Result</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No candle aggregates
                          </TableCell>
                        </TableRow>
                      ) : (
                        aggregates.map((agg) => (
                          <TableRow key={agg.id} className="border-border">
                            <TableCell className="font-medium text-foreground">{agg.coin_symbol}</TableCell>
                            <TableCell className="text-muted-foreground">{agg.timeframe}s</TableCell>
                            <TableCell className="font-mono text-profit">₹{agg.total_up_bets}</TableCell>
                            <TableCell className="font-mono text-loss">₹{agg.total_down_bets}</TableCell>
                            <TableCell className="text-foreground">{agg.bet_count}</TableCell>
                            <TableCell>
                              {agg.result_direction ? getDirectionBadge(agg.result_direction) : '-'}
                            </TableCell>
                            <TableCell>
                              {agg.is_settled ? (
                                <span className="px-2 py-1 bg-profit/20 text-profit rounded-full text-xs">Settled</span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Open</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBetsPage;
