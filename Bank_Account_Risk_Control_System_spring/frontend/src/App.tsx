import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  ClipboardList,
  FileClock,
  Landmark,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  Unlock,
  UserPlus,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import WalletCard from "@/components/ui/wallet-card-2";
import { cn } from "@/lib/utils";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

type AccountStatus = "ACTIVE" | "FROZEN" | "CLOSED";
type TransactionStatus = "SUCCESS" | "FAILED" | "RISK_BLOCKED";
type ConnectionState = "unknown" | "online" | "offline";

type CustomerResponse = {
  id: number;
  name: string;
  idCardNo: string;
  phone: string;
  createdAt: string;
};

type AccountResponse = {
  id: number;
  accountNo: string;
  customerId: number;
  balance: number | string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

type TransactionResponse = {
  id: number;
  transactionNo: string;
  fromAccountNo: string;
  toAccountNo: string;
  amount: number | string;
  status: TransactionStatus;
  riskReason: string | null;
  createdAt: string;
};

type AuditLog = {
  id: number;
  operationType: string;
  targetType: string;
  targetId: string;
  description: string;
  createdAt: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function amountOf(value: number | string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number | string | undefined) {
  return money.format(amountOf(value));
}

function formatTime(value: string | undefined) {
  if (!value) {
    return "未记录";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return dateTime.format(parsed);
}

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "请求失败";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok) {
    throw new Error(payload?.message ?? `HTTP ${response.status}`);
  }

  if (!payload) {
    throw new Error("后端没有返回 JSON");
  }

  if (payload.code !== 200) {
    throw new Error(payload.message || "业务请求未通过");
  }

  return payload.data as T;
}

function StatusBadge({ status }: { status: AccountStatus | TransactionStatus }) {
  const styles: Record<string, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FROZEN: "border-rose-200 bg-rose-50 text-rose-700",
    CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
    SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FAILED: "border-amber-200 bg-amber-50 text-amber-700",
    RISK_BLOCKED: "border-rose-200 bg-rose-50 text-rose-700",
  };
  const labels: Record<string, string> = {
    ACTIVE: "正常",
    FROZEN: "冻结",
    CLOSED: "关闭",
    SUCCESS: "成功",
    FAILED: "失败",
    RISK_BLOCKED: "风控拦截",
  };

  return (
    <span className={cn("status-pill", styles[status])}>{labels[status]}</span>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export default function App() {
  const [customerForm, setCustomerForm] = useState({
    name: "张明",
    idCardNo: "110101199003071234",
    phone: "13800138000",
  });
  const [accountForm, setAccountForm] = useState({
    customerId: "",
    initialBalance: "10000",
  });
  const [accountNo, setAccountNo] = useState("");
  const [transferForm, setTransferForm] = useState({
    fromAccountNo: "",
    toAccountNo: "",
    amount: "1000",
  });

  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<AccountResponse | null>(null);
  const [lastTransaction, setLastTransaction] =
    useState<TransactionResponse | null>(null);
  const [riskBlocked, setRiskBlocked] = useState<TransactionResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("unknown");
  const [syncedAt, setSyncedAt] = useState<string>("尚未同步");

  const rememberAccount = useCallback((account: AccountResponse) => {
    setAccounts((current) => {
      const exists = current.some((item) => item.accountNo === account.accountNo);
      if (!exists) {
        return [account, ...current];
      }
      return current.map((item) =>
        item.accountNo === account.accountNo ? account : item,
      );
    });
    setSelectedAccount(account);
    setAccountNo(account.accountNo);
  }, []);

  const refreshTimeline = useCallback(async (quiet = false) => {
    setBusy((value) => value ?? "refresh");
    const [blockedResult, logsResult] = await Promise.allSettled([
      request<TransactionResponse[]>("/api/transaction/risk-blocked"),
      request<AuditLog[]>("/api/audit-logs"),
    ]);

    if (blockedResult.status === "fulfilled") {
      setRiskBlocked(blockedResult.value);
    }
    if (logsResult.status === "fulfilled") {
      setAuditLogs(logsResult.value);
    }

    const hasSuccess =
      blockedResult.status === "fulfilled" || logsResult.status === "fulfilled";
    setConnection(hasSuccess ? "online" : "offline");
    setSyncedAt(`同步于 ${new Date().toLocaleTimeString("zh-CN")}`);

    if (!quiet) {
      if (hasSuccess) {
        setNotice({ type: "success", text: "风控记录和审计日志已刷新" });
      } else {
        const reason =
          blockedResult.status === "rejected"
            ? describeError(blockedResult.reason)
            : describeError(logsResult.reason);
        setNotice({ type: "error", text: reason });
      }
    }

    setBusy((value) => (value === "refresh" ? null : value));
  }, []);

  useEffect(() => {
    void refreshTimeline(true);
  }, [refreshTimeline]);

  const dashboard = useMemo(() => {
    const totalBalance = accounts.reduce(
      (sum, account) => sum + amountOf(account.balance),
      0,
    );
    const activeAccounts = accounts.filter(
      (account) => account.status === "ACTIVE",
    ).length;
    const frozenAccounts = accounts.filter(
      (account) => account.status === "FROZEN",
    ).length;

    return {
      totalBalance,
      activeAccounts,
      frozenAccounts,
    };
  }, [accounts]);

  const createCustomer = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("customer");
    try {
      const created = await request<CustomerResponse>("/api/customer", {
        method: "POST",
        body: JSON.stringify(customerForm),
      });
      setCustomer(created);
      setAccountForm((form) => ({ ...form, customerId: String(created.id) }));
      setNotice({ type: "success", text: `客户 ${created.name} 已创建` });
      setConnection("online");
      void refreshTimeline(true);
    } catch (error) {
      setConnection("offline");
      setNotice({ type: "error", text: describeError(error) });
    } finally {
      setBusy(null);
    }
  };

  const createAccount = async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy("account");
    try {
      const created = await request<AccountResponse>("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          customerId: Number(accountForm.customerId),
          initialBalance: accountForm.initialBalance,
        }),
      });
      rememberAccount(created);
      setTransferForm((form) =>
        form.fromAccountNo
          ? form
          : { ...form, fromAccountNo: created.accountNo },
      );
      setNotice({ type: "success", text: `账户 ${created.accountNo} 已开户` });
      setConnection("online");
      void refreshTimeline(true);
    } catch (error) {
      setConnection("offline");
      setNotice({ type: "error", text: describeError(error) });
    } finally {
      setBusy(null);
    }
  };

  const queryAccount = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!accountNo.trim()) {
      setNotice({ type: "error", text: "请输入账户号" });
      return;
    }

    setBusy("query");
    try {
      const account = await request<AccountResponse>(
        `/api/accounts/${encodeURIComponent(accountNo.trim())}`,
      );
      rememberAccount(account);
      setNotice({ type: "success", text: "账户信息已更新" });
      setConnection("online");
    } catch (error) {
      setConnection("offline");
      setNotice({ type: "error", text: describeError(error) });
    } finally {
      setBusy(null);
    }
  };

  const changeAccountStatus = async (action: "freeze" | "unfreeze") => {
    const target = accountNo.trim() || selectedAccount?.accountNo;
    if (!target) {
      setNotice({ type: "error", text: "请先输入或查询账户号" });
      return;
    }

    setBusy(action);
    try {
      const account = await request<AccountResponse>(
        `/api/accounts/${encodeURIComponent(target)}/${action}`,
        { method: "PATCH" },
      );
      rememberAccount(account);
      setNotice({
        type: "success",
        text: action === "freeze" ? "账户已冻结" : "账户已解冻",
      });
      setConnection("online");
      void refreshTimeline(true);
    } catch (error) {
      setConnection("offline");
      setNotice({ type: "error", text: describeError(error) });
    } finally {
      setBusy(null);
    }
  };

  const transfer = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("transfer");
    try {
      const result = await request<TransactionResponse>(
        "/api/transaction/transfer",
        {
          method: "POST",
          body: JSON.stringify(transferForm),
        },
      );
      setLastTransaction(result);
      setNotice({
        type: result.status === "SUCCESS" ? "success" : "info",
        text:
          result.status === "SUCCESS"
            ? "转账成功"
            : result.riskReason ?? "交易未成功",
      });
      setConnection("online");
      await Promise.allSettled([
        transferForm.fromAccountNo
          ? request<AccountResponse>(
              `/api/accounts/${encodeURIComponent(transferForm.fromAccountNo)}`,
            ).then(rememberAccount)
          : Promise.resolve(),
        transferForm.toAccountNo
          ? request<AccountResponse>(
              `/api/accounts/${encodeURIComponent(transferForm.toAccountNo)}`,
            ).then(rememberAccount)
          : Promise.resolve(),
      ]);
      void refreshTimeline(true);
    } catch (error) {
      setConnection("offline");
      setNotice({ type: "error", text: describeError(error) });
    } finally {
      setBusy(null);
    }
  };

  const seedTransferFromAccounts = () => {
    if (accounts.length < 2) {
      setNotice({ type: "info", text: "至少创建或查询两个账户后可自动填充" });
      return;
    }

    setTransferForm((form) => ({
      ...form,
      fromAccountNo: accounts[0].accountNo,
      toAccountNo: accounts[1].accountNo,
    }));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fafc_0%,#eef4f7_100%)] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-700 text-white shadow-panel">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-slate-950 md:text-2xl">
                银行账户风控管理系统
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>Spring Boot API</span>
                <span className="text-slate-300">/</span>
                <span>{API_BASE || "Vite Proxy :8080"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "status-pill",
                connection === "online" &&
                  "border-emerald-200 bg-emerald-50 text-emerald-700",
                connection === "offline" &&
                  "border-rose-200 bg-rose-50 text-rose-700",
                connection === "unknown" &&
                  "border-slate-200 bg-slate-100 text-slate-600",
              )}
            >
              {connection === "online"
                ? "后端已连接"
                : connection === "offline"
                  ? "后端未连接"
                  : "等待同步"}
            </span>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void refreshTimeline(false)}
              disabled={busy === "refresh"}
            >
              {busy === "refresh" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              刷新
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <WalletCard
            totalBalance={dashboard.totalBalance}
            activeAccounts={dashboard.activeAccounts}
            frozenAccounts={dashboard.frozenAccounts}
            riskBlockedCount={riskBlocked.length}
            lastUpdated={syncedAt}
            onCreateAccount={() => {
              document.getElementById("account-panel")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            onFreezeAccount={() => void changeAccountStatus("freeze")}
            onTransfer={() => {
              document.getElementById("transfer-panel")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            onAudit={() => {
              document.getElementById("audit-panel")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            onRefresh={() => void refreshTimeline(false)}
          />

          <Card className="border-slate-200 bg-white p-4 shadow-panel">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-700" />
              <h2 className="panel-title">风控规则</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="rounded-md border border-slate-100 p-3">
                <div className="font-medium text-slate-800">账户冻结</div>
                <div className="mt-1 text-slate-500">冻结账户禁止发起转账</div>
              </div>
              <div className="rounded-md border border-slate-100 p-3">
                <div className="font-medium text-slate-800">大额拦截</div>
                <div className="mt-1 text-slate-500">单笔超过 50,000 元</div>
              </div>
              <div className="rounded-md border border-slate-100 p-3">
                <div className="font-medium text-slate-800">高频拦截</div>
                <div className="mt-1 text-slate-500">
                  10 分钟内超过 5 笔
                </div>
              </div>
            </div>
          </Card>
        </aside>

        <section className="space-y-5">
          {notice && (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm",
                notice.type === "success" &&
                  "border-emerald-200 bg-emerald-50 text-emerald-800",
                notice.type === "error" &&
                  "border-rose-200 bg-rose-50 text-rose-800",
                notice.type === "info" &&
                  "border-cyan-200 bg-cyan-50 text-cyan-800",
              )}
            >
              {notice.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-cyan-700" />
                  <h2 className="panel-title">客户开户</h2>
                </div>
                {customer && (
                  <span className="status-pill border-cyan-200 bg-cyan-50 text-cyan-700">
                    ID {customer.id}
                  </span>
                )}
              </div>
              <form className="space-y-4" onSubmit={createCustomer}>
                <FieldGroup label="姓名">
                  <input
                    className="field"
                    value={customerForm.name}
                    onChange={(event) =>
                      setCustomerForm((form) => ({
                        ...form,
                        name: event.target.value,
                      }))
                    }
                    placeholder="客户姓名"
                  />
                </FieldGroup>
                <FieldGroup label="身份证号">
                  <input
                    className="field"
                    value={customerForm.idCardNo}
                    onChange={(event) =>
                      setCustomerForm((form) => ({
                        ...form,
                        idCardNo: event.target.value,
                      }))
                    }
                    placeholder="18 位身份证号"
                  />
                </FieldGroup>
                <FieldGroup label="手机号">
                  <input
                    className="field"
                    value={customerForm.phone}
                    onChange={(event) =>
                      setCustomerForm((form) => ({
                        ...form,
                        phone: event.target.value,
                      }))
                    }
                    placeholder="手机号"
                  />
                </FieldGroup>
                <Button
                  className="w-full gap-2"
                  type="submit"
                  disabled={busy === "customer"}
                >
                  {busy === "customer" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  创建客户
                </Button>
              </form>
            </Card>

            <Card
              id="account-panel"
              className="border-slate-200 bg-white p-5 shadow-panel"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-cyan-700" />
                  <h2 className="panel-title">账户创建</h2>
                </div>
                <span className="status-pill border-slate-200 bg-slate-100 text-slate-600">
                  {accounts.length} 个账户
                </span>
              </div>
              <form className="space-y-4" onSubmit={createAccount}>
                <FieldGroup label="客户 ID">
                  <input
                    className="field"
                    value={accountForm.customerId}
                    onChange={(event) =>
                      setAccountForm((form) => ({
                        ...form,
                        customerId: event.target.value,
                      }))
                    }
                    placeholder="先创建客户或输入已有 ID"
                    inputMode="numeric"
                  />
                </FieldGroup>
                <FieldGroup label="初始余额">
                  <input
                    className="field"
                    value={accountForm.initialBalance}
                    onChange={(event) =>
                      setAccountForm((form) => ({
                        ...form,
                        initialBalance: event.target.value,
                      }))
                    }
                    placeholder="10000"
                    inputMode="decimal"
                  />
                </FieldGroup>
                <Button
                  className="w-full gap-2"
                  type="submit"
                  disabled={busy === "account"}
                >
                  {busy === "account" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Landmark className="h-4 w-4" />
                  )}
                  创建账户
                </Button>
              </form>
            </Card>

            <Card className="border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-cyan-700" />
                <h2 className="panel-title">账户查询与控制</h2>
              </div>
              <form className="space-y-4" onSubmit={queryAccount}>
                <FieldGroup label="账户号">
                  <input
                    className="field"
                    value={accountNo}
                    onChange={(event) => setAccountNo(event.target.value)}
                    placeholder="ACC..."
                  />
                </FieldGroup>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="submit"
                    variant="outline"
                    className="gap-2"
                    disabled={busy === "query"}
                  >
                    <Search className="h-4 w-4" />
                    查询
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    onClick={() => void changeAccountStatus("freeze")}
                    disabled={busy === "freeze"}
                  >
                    <Lock className="h-4 w-4" />
                    冻结
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    onClick={() => void changeAccountStatus("unfreeze")}
                    disabled={busy === "unfreeze"}
                  >
                    <Unlock className="h-4 w-4" />
                    解冻
                  </Button>
                </div>
              </form>

              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                {selectedAccount ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-700">
                        {selectedAccount.accountNo}
                      </span>
                      <StatusBadge status={selectedAccount.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-slate-500">
                      <div>
                        <div className="field-label">余额</div>
                        <div className="mt-1 font-semibold text-slate-950">
                          {formatMoney(selectedAccount.balance)}
                        </div>
                      </div>
                      <div>
                        <div className="field-label">客户 ID</div>
                        <div className="mt-1 font-semibold text-slate-950">
                          {selectedAccount.customerId}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">暂无账户信息</div>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            <Card
              id="transfer-panel"
              className="border-slate-200 bg-white p-5 shadow-panel"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-cyan-700" />
                  <h2 className="panel-title">转账风控演练</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={seedTransferFromAccounts}
                  >
                    填充账户
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setTransferForm((form) => ({ ...form, amount: "60000" }))
                    }
                  >
                    大额测试
                  </Button>
                </div>
              </div>

              <form
                className="grid gap-4 md:grid-cols-[1fr_1fr_160px_auto]"
                onSubmit={transfer}
              >
                <FieldGroup label="付款账户">
                  <input
                    className="field"
                    value={transferForm.fromAccountNo}
                    onChange={(event) =>
                      setTransferForm((form) => ({
                        ...form,
                        fromAccountNo: event.target.value,
                      }))
                    }
                    placeholder="ACC..."
                  />
                </FieldGroup>
                <FieldGroup label="收款账户">
                  <input
                    className="field"
                    value={transferForm.toAccountNo}
                    onChange={(event) =>
                      setTransferForm((form) => ({
                        ...form,
                        toAccountNo: event.target.value,
                      }))
                    }
                    placeholder="ACC..."
                  />
                </FieldGroup>
                <FieldGroup label="金额">
                  <input
                    className="field"
                    value={transferForm.amount}
                    onChange={(event) =>
                      setTransferForm((form) => ({
                        ...form,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="1000"
                    inputMode="decimal"
                  />
                </FieldGroup>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    className="w-full gap-2 md:w-auto"
                    disabled={busy === "transfer"}
                  >
                    {busy === "transfer" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Banknote className="h-4 w-4" />
                    )}
                    发起转账
                  </Button>
                </div>
              </form>

              {lastTransaction && (
                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {lastTransaction.transactionNo}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {lastTransaction.fromAccountNo} 转至{" "}
                        {lastTransaction.toAccountNo}
                      </div>
                    </div>
                    <StatusBadge status={lastTransaction.status} />
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <div className="field-label">金额</div>
                      <div className="mt-1 font-semibold">
                        {formatMoney(lastTransaction.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="field-label">时间</div>
                      <div className="mt-1 font-semibold">
                        {formatTime(lastTransaction.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="field-label">原因</div>
                      <div className="mt-1 font-semibold">
                        {lastTransaction.riskReason ?? "通过"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-cyan-700" />
                  <h2 className="panel-title">最近账户</h2>
                </div>
                <span className="status-pill border-slate-200 bg-slate-100 text-slate-600">
                  {accounts.length}
                </span>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
                {accounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                    暂无账户
                  </div>
                ) : (
                  accounts.map((account) => (
                    <button
                      key={account.accountNo}
                      type="button"
                      className="w-full rounded-lg border border-slate-100 p-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50/60"
                      onClick={() => rememberAccount(account)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-950">
                            {account.accountNo}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            客户 ID {account.customerId}
                          </div>
                        </div>
                        <StatusBadge status={account.status} />
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        {formatMoney(account.balance)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldX className="h-5 w-5 text-rose-600" />
                  <h2 className="panel-title">风控拦截记录</h2>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => void refreshTimeline(false)}
                >
                  <RefreshCw className="h-4 w-4" />
                  同步
                </Button>
              </div>
              <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
                {riskBlocked.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                    暂无拦截记录
                  </div>
                ) : (
                  riskBlocked.map((item) => (
                    <div
                      key={item.transactionNo}
                      className="rounded-lg border border-rose-100 bg-rose-50/50 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-950">
                          {item.transactionNo}
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {item.fromAccountNo} 转至 {item.toAccountNo}
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                        <span className="font-semibold text-slate-900">
                          {formatMoney(item.amount)}
                        </span>
                        <span className="text-slate-500">
                          {formatTime(item.createdAt)}
                        </span>
                        <span className="text-rose-700">
                          {item.riskReason ?? "风控拦截"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card
              id="audit-panel"
              className="border-slate-200 bg-white p-5 shadow-panel"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileClock className="h-5 w-5 text-cyan-700" />
                  <h2 className="panel-title">审计日志</h2>
                </div>
                <span className="status-pill border-slate-200 bg-slate-100 text-slate-600">
                  {auditLogs.length}
                </span>
              </div>
              <div className="max-h-[360px] space-y-3 overflow-auto pr-1">
                {auditLogs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                    暂无审计日志
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-slate-100 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className="status-pill border-cyan-200 bg-cyan-50 text-cyan-700">
                            {log.operationType}
                          </span>
                          <span className="text-sm font-semibold text-slate-950">
                            {log.targetType}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 break-all text-sm text-slate-600">
                        {log.description}
                      </div>
                      <div className="mt-2 break-all text-xs text-slate-400">
                        {log.targetId}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

