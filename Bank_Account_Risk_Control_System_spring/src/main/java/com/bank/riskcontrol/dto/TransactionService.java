package com.bank.riskcontrol.dto;

import com.bank.riskcontrol.entity.BankAccount;
import com.bank.riskcontrol.entity.TransactionRecord;
import com.bank.riskcontrol.enums.AccountStatus;
import com.bank.riskcontrol.enums.TransactionStatus;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.repository.BankAccountRepository;
import com.bank.riskcontrol.repository.TransactionRepository;
import com.bank.riskcontrol.service.AuditLogService;
import com.bank.riskcontrol.service.RiskControlService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository transactionRepository;
    private final RiskControlService riskControlService;  // ← 新增
    private final AuditLogService auditLogService;         // ← 新增

    @Transactional
    public TransactionResponse transfer(TransferRequest request) throws BusinessException {

        if (request.getFromAccountNo().equals(request.getToAccountNo())) {
            throw new BusinessException(400, "付款账户和收款账户不能相同");
        }

        BankAccount fromAccount = bankAccountRepository
                .findByAccountNo(request.getFromAccountNo())
                .orElseThrow(() -> new BusinessException(404, "付款账户不存在"));

        BankAccount toAccount = bankAccountRepository
                .findByAccountNo(request.getToAccountNo())
                .orElseThrow(() -> new BusinessException(404, "收款账户不存在"));

        // 先生成交易号，风控命中记录需要用到
        String transactionNo = generateTransactionNo();

        // 风控检查
        String riskReason = riskControlService.check(
                fromAccount, request.getAmount(), transactionNo);

        if (riskReason != null) {
            TransactionRecord blocked = saveTransaction(
                    transactionNo, request, TransactionStatus.RISK_BLOCKED, riskReason);
            auditLogService.log("TRANSFER", "TRANSACTION",
                    transactionNo, "转账被风控拦截：" + riskReason);
            return toResponse(blocked);
        }

        // 余额不足
        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            TransactionRecord failed = saveTransaction(
                    transactionNo, request, TransactionStatus.FAILED, "余额不足");
            auditLogService.log("TRANSFER", "TRANSACTION",
                    transactionNo, "转账失败：余额不足");
            return toResponse(failed);
        }

        // 扣款 + 入账
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        bankAccountRepository.save(fromAccount);

        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));
        bankAccountRepository.save(toAccount);

        // 记录成功流水
        TransactionRecord success = saveTransaction(
                transactionNo, request, TransactionStatus.SUCCESS, null);
        auditLogService.log("TRANSFER", "TRANSACTION",
                transactionNo, "转账成功：" + request.getFromAccountNo()
                        + " → " + request.getToAccountNo()
                        + "，金额：" + request.getAmount());
        return toResponse(success);
    }

    // saveTransaction 改为接收 transactionNo 参数
    private TransactionRecord saveTransaction(
            String transactionNo,
            TransferRequest request,
            TransactionStatus status,
            String riskReason) {

        TransactionRecord record = TransactionRecord.builder()
                .transactionNo(transactionNo)
                .fromAccountNo(request.getFromAccountNo())
                .toAccountNo(request.getToAccountNo())
                .amount(request.getAmount())
                .status(status)
                .riskReason(riskReason)
                .build();

        return transactionRepository.save(record);
    }

    private String generateTransactionNo() {
        return "TXN" + System.currentTimeMillis();
    }

    // getTransactions 和 getRiskBlockedTransactions 保持不变
    public List<TransactionResponse> getTransactions(String accountNo) {
        return transactionRepository
                .findByFromAccountNoOrToAccountNoOrderByCreatedAtDesc(accountNo, accountNo)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TransactionResponse> getRiskBlockedTransactions() {
        return transactionRepository
                .findByStatusOrderByCreatedAtDesc(TransactionStatus.RISK_BLOCKED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TransactionResponse toResponse(TransactionRecord record) {
        return TransactionResponse.builder()
                .id(record.getId())
                .transactionNo(record.getTransactionNo())
                .fromAccountNo(record.getFromAccountNo())
                .toAccountNo(record.getToAccountNo())
                .amount(record.getAmount())
                .status(record.getStatus())
                .riskReason(record.getRiskReason())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
