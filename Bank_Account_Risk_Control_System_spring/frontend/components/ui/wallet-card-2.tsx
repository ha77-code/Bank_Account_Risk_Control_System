import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Clock,
  Eye,
  Landmark,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type WalletCardProps = {
  totalBalance?: number;
  activeAccounts?: number;
  frozenAccounts?: number;
  riskBlockedCount?: number;
  lastUpdated?: string;
  onCreateAccount?: () => void;
  onFreezeAccount?: () => void;
  onTransfer?: () => void;
  onAudit?: () => void;
  onRefresh?: () => void;
};

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2,
});

export default function WalletCard({
  totalBalance = 0,
  activeAccounts = 0,
  frozenAccounts = 0,
  riskBlockedCount = 0,
  lastUpdated = "尚未同步",
  onCreateAccount,
  onFreezeAccount,
  onTransfer,
  onAudit,
  onRefresh,
}: WalletCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-slate-200 bg-white p-5 shadow-panel">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100">
                    <Wallet className="h-4 w-4 text-emerald-700" />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    正常账户
                  </span>
                </div>
                <span className="text-lg font-semibold text-slate-950">
                  {activeAccounts}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100">
                    <ShieldAlert className="h-4 w-4 text-rose-700" />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    冻结账户
                  </span>
                </div>
                <span className="text-lg font-semibold text-slate-950">
                  {frozenAccounts}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-slate-100 bg-white px-4 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                  <Landmark className="h-3.5 w-3.5 text-slate-500" />
                </span>
                <span className="text-sm font-medium text-slate-600">
                  受控账户总余额
                </span>
                <Eye className="h-4 w-4 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="刷新概览"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="break-words text-3xl font-bold text-slate-950 sm:text-4xl">
                {currencyFormatter.format(totalBalance)}
              </div>
              <div className="flex items-center gap-2 text-amber-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  风控拦截 {riskBlockedCount} 笔
                </span>
              </div>
              <div className="text-xs text-slate-400">{lastUpdated}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button
              className="h-11 gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onCreateAccount}
            >
              <ArrowDown className="h-4 w-4" />
              开户
            </Button>
            <Button
              variant="secondary"
              className="h-11 gap-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              onClick={onFreezeAccount}
            >
              <ArrowUp className="h-4 w-4" />
              冻结
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-11 w-full border border-slate-200 bg-slate-100 hover:bg-slate-200"
              onClick={onTransfer}
              aria-label="转账"
            >
              <ArrowLeftRight className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-11 w-full border border-slate-200 bg-slate-100 hover:bg-slate-200"
              onClick={onAudit}
              aria-label="审计日志"
            >
              <Clock className="h-4 w-4 text-slate-700" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50">
                <Wallet className="h-5 w-5 text-cyan-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-950">
                  单笔大额拦截
                </h3>
                <p className="truncate text-sm text-slate-500">
                  超过 50,000 元自动阻断
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-violet-200 bg-violet-50">
                <TrendingUp className="h-5 w-5 text-violet-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-950">
                  10 分钟高频拦截
                </h3>
                <p className="truncate text-sm text-slate-500">
                  同账户超过 5 笔交易触发
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

