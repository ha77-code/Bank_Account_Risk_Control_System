package com.bank.riskcontrol.service;

import com.bank.riskcontrol.entity.BankAccount;
import com.bank.riskcontrol.entity.RiskRuleHit;
import com.bank.riskcontrol.enums.AccountStatus;
import com.bank.riskcontrol.enums.RiskRuleCode;
import com.bank.riskcontrol.repository.RiskRuleHitRepository;
import com.bank.riskcontrol.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RiskControlService {

    private final TransactionRepository transactionRepository;
    private final RiskRuleHitRepository riskRuleHitRepository;

    // 返回 null 表示通过，返回原因表示拦截
    public String check(BankAccount fromAccount, BigDecimal amount, String transactionNo) {

        // 规则1：账户冻结
        if (fromAccount.getStatus() == AccountStatus.FROZEN) {
            saveHit(transactionNo, RiskRuleCode.ACCOUNT_FROZEN,
                    "账户冻结拦截", "账户已冻结，禁止交易");
            return "账户已冻结";
        }

        // 规则2：单笔超过 50000
        if (amount.compareTo(new BigDecimal("50000")) > 0) {
            saveHit(transactionNo, RiskRuleCode.AMOUNT_EXCEEDED,
                    "大额交易拦截", "单笔金额 " + amount + " 超过限额 50000 元");
            return "单笔转账金额超过限额（50000元）";
        }

        // 规则3：10分钟内超过5次
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        long recentCount = transactionRepository.countRecentTransactions(
                fromAccount.getAccountNo(), tenMinutesAgo);
        if (recentCount >= 5) {
            saveHit(transactionNo, RiskRuleCode.HIGH_FREQUENCY,
                    "高频交易拦截", "10分钟内交易 " + recentCount + " 次，超过限制");
            return "10分钟内交易次数超过限制";
        }

        return null;
    }

    private void saveHit(String transactionNo,
                         RiskRuleCode ruleCode,
                         String ruleName,
                         String reason) {
        riskRuleHitRepository.save(RiskRuleHit.builder()
                .transactionNo(transactionNo)
                .ruleCode(ruleCode)
                .ruleName(ruleName)
                .reason(reason)
                .build());
    }
}
