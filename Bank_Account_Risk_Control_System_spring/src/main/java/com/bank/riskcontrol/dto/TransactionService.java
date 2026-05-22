package com.bank.riskcontrol.dto;

import com.bank.riskcontrol.entity.BankAccount;
import com.bank.riskcontrol.entity.TransactionRecord;
import com.bank.riskcontrol.enums.AccountStatus;
import com.bank.riskcontrol.enums.TransactionStatus;
import com.bank.riskcontrol.exception.BusinessException;
import com.bank.riskcontrol.repository.BankAccountRepository;
import com.bank.riskcontrol.repository.TransactionRepository;
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

    @Transactional
    public TransactionResponse transfer(TransferRequest request) throws BusinessException {
        //收款和付款账户不能相同
        if(request.getFromAccountNo().equals(request.getToAccountNo())){
            throw new BusinessException(404, "收付款账户不能相同");
        }

        //查询付款账户
        BankAccount fromAccount = bankAccountRepository
                .findByAccountNo(request.getToAccountNo())
                .orElseThrow(()->new BusinessException(404,"付款账户不存在"));

        //查询收款账户
        BankAccount toAccount = bankAccountRepository.
                findByAccountNo(request.getToAccountNo())
                .orElseThrow(()->new BusinessException(404,"收款账户不存在"));

        //风控检查
        String riskReason = checkRisk(fromAccount, request.getAmount());
        if(riskReason!=null){
            //风控拦截，记录流水不扣款
            TransactionRecord blocked = saveTransaction(
                    request, TransactionStatus.RISK_BLOCKED, riskReason
            );
            return toResponse(blocked);
        }
        //余额校验
        if(fromAccount.getBalance().compareTo(request.getAmount())<0){
            TransactionRecord failed = saveTransaction(
                    request, TransactionStatus.FAILED, "余额不足");
            return toResponse(failed);
        }
        //扣减付款账户余额
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        bankAccountRepository.save(fromAccount);

        //增加收款账户余额
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));
        bankAccountRepository.save(toAccount);

        //记录成功流水
        TransactionRecord success = saveTransaction(
                request, TransactionStatus.SUCCESS, null);
        return toResponse(success);
    }

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
    //风控规则
    private String checkRisk(BankAccount fromAccount, BigDecimal amount){
        //账户被冻结
        if(fromAccount.getStatus() == AccountStatus.FROZEN){
            return "账户已冻结";
        }
        //单笔超过50000元
        if(amount.compareTo(new BigDecimal("50000")) > 0){
            return "单笔转账超过限额（50000元）";
        }
        //十分钟超过五次
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);
        long recentCount = transactionRepository.countRecentTransactions(
                fromAccount.getAccountNo(),
                tenMinutesAgo
        );
        if(recentCount >= 5){
            return "10分钟内交易超过5次，次数超过限制";
        }
        return null;//通过风控
    }
    private String generateTransactionNo(){
        return "TXN" + System.currentTimeMillis();
    }
    private TransactionRecord saveTransaction(
            TransferRequest request,
            TransactionStatus status,
            String riskReason
    ){
        TransactionRecord record = TransactionRecord.builder()
                .transactionNo(generateTransactionNo())
                .fromAccountNo(request.getFromAccountNo())
                .toAccountNo(request.getToAccountNo())
                .amount(request.getAmount())
                .status(status)
                .riskReason(riskReason)
                .build();
        return transactionRepository.save(record);
    }
    private TransactionResponse toResponse(TransactionRecord record){
        return TransactionResponse.builder()
                .id(record.getId())
                .transationNo(record.getTransactionNo())
                .fromAccountNo(record.getFromAccountNo())
                .toAccountNo(record.getToAccountNo())
                .amount(record.getAmount())
                .status(record.getStatus())
                .riskReason(record.getRiskReason())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
