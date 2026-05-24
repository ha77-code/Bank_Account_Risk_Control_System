import WalletCard from "@/components/ui/wallet-card-2";

export default function DemoOne() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full items-center justify-center px-4">
      <WalletCard
        totalBalance={534435.53}
        activeAccounts={12}
        frozenAccounts={2}
        riskBlockedCount={7}
        lastUpdated="演示数据"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg width=\\'4\\' height=\\'4\\' viewBox=\\'0 0 6 6\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Ccircle cx=\\'6\\' cy=\\'6\\' r=\\'1\\' fill=\\'%23aaa\\' fill-opacity=\\'0.25\\' /%3E%3C/svg%3E')",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}

